import * as express from "express"
import { isAuthorized } from "../middleware/authorization"
import * as passwordHash from 'password-hash'
import { APIRequest, BasicRouter, APIResponse } from "../basicrouter"
import { AuthenticationInfoInstance, User, AuthenticationInfo, UserAttributes, DeviceAttributes } from "../../model"
import { validateFacebookToken } from "../middleware/facebook"
import * as EmailValidator from "email-validator"
import { isBoolean, isString, maxLength, minLength, parallelValidate } from "../middleware/validationrules"
import * as multer from "multer"
import { S3 } from "aws-sdk"
import * as async from "async"
import * as nconf from "nconf"
import { ResourceNotFoundError, InvalidParametersError } from '../../error'
import { resize } from "../../modules/imageconversion";
import * as uuid from 'uuid'
import InternalServerError from "../../error/internalservererror";
import { DevicesRouter } from "./devices"
const bucket_url = nconf.get("BUCKET_URL");

export class UsersRouter extends BasicRouter {

    constructor() {
        super();
        this.getInternalRouter().get('/users', UsersRouter.getUserByEmail);
        this.getInternalRouter().get('/users/me', isAuthorized, UsersRouter.getUser);
        this.getInternalRouter().post('/users/me/picture', isAuthorized, multer({ dest: '.uploads/' }).single('image'), UsersRouter.processProfilePicture)
        this.getInternalRouter().delete('/users/me/picture', isAuthorized, UsersRouter.removeProfilePicture)

        this.getInternalRouter().post('/users/facebook', BasicRouter.requireKeysOfTypes({
            'registration_data': (value: any): true | string => {
                if (isString(value['facebook_token'])) {
                    return true;
                }
                return 'Invalid facebook registration data'
            },
            device: {
                device_uuid: isString,
                app_version: isString,
                build_version: isString,
                debug: isBoolean,
                "language": isString,
            }
        }), UsersRouter.newFacebookUser);

        this.getInternalRouter().post('/users', BasicRouter.requireKeysOfTypes({
            'registration_data': (value: any): true | string => {
                if (EmailValidator.validate(value['email']) && parallelValidate([isString, minLength(6), maxLength(100)], value['password'])) {
                    return true
                }
                return 'Invalid email registration data'
            }, 'registration_fullname': isString,
            device: {
                device_uuid: isString,
                app_version: isString,
                build_version: isString,
                debug: isBoolean,
                "language": isString,
            }
        }), UsersRouter.newUser);
    }

    /**
     * Returns the current user
     * @param {APIRequest} req
     * @param {e.Response} res
     * @param {e.NextFunction} next
     */
    private static getUser(req: APIRequest, res: APIResponse) {
        res.jsonContent(req.currentUser);
    }

    /**
     * Returns the users handle if the users email address is known
     * @param {APIRequest} req
     * @param {e.Response} res
     * @param {e.NextFunction} next
     */
    private static getUserByEmail(req: APIRequest, res: APIResponse, next: express.NextFunction) {
        User.findOne({
            where: {
                email: req.query.email as string
            },
            include: [
                { model: AuthenticationInfo, as: 'authentication_infos', required: true }
            ],
            rejectOnEmpty: true
        }).then((user) => {
            if (user) {
                if (user.authentication_infos && user.authentication_infos.length > 0) {
                    if (!user.authentication_infos.find(p => p.provider == 'email')) {
                        res.jsonContent({
                            provider: user.authentication_infos[0].provider
                        })
                    } else {
                        res.jsonContent({
                            username: user.full_name
                        })
                    }
                } else {
                    next(new InternalServerError(new ResourceNotFoundError(undefined, 'User'), 'User found without auth infos'))
                }
            } else {
                next(new ResourceNotFoundError(undefined, 'User'))
            }
        }).catch(next);
    }

    /**
     * Registers a new user using email or (registers / logs in) a facebook user
     * @param {APIRequest<RegistrationBodyParameters>} req
     * @param {e.Response} res
     * @param {e.NextFunction} next
     */
    private static newUser(req: APIRequest<RegistrationBodyParameters>, res: APIResponse, next: express.NextFunction) {
        const createUser = (data: UserAttributes) => {
            User.create(data, {
                include: [<any>'authentication_infos']
            }).then((user) => {
                return DevicesRouter.findOrCreateDevice(req.body.device, user, req).then(([_created, device]) => {
                    if (device.device_data_os == 'web') {
                        res.setAuthCookie(device.session_token!)
                    }
                    res.status(201)
                    res.jsonContent((device as any).toJSON({ with_session: true }));
                }).catch(next);
            }).catch(next);
        };

        const email = req.body.registration_data.email;
        const password = req.body.registration_data.password;

        createUser({
            email: email,
            full_name: req.body.registration_fullname,
            authentication_infos: [<any>{
                provider: "email",
                external_id: email,
                password: passwordHash.generate(password, {
                    'algorithm': 'sha256'
                })
            }]
        })
    }
    private static newFacebookUser(req: APIRequest<FacebookRegistrationBodyParameters>, res: APIResponse, next: express.NextFunction) {
        const createUser = (data: UserAttributes) => {
            User.create(data, {
                include: [<any>'authentication_infos']
            }).then((user) => {
                return DevicesRouter.findOrCreateDevice(req.body.device, user, req).then(([_created, device]) => {
                    if (device.device_data_os == 'web') {
                        res.setAuthCookie(device.session_token!)
                    }
                    res.status(201)
                    res.jsonContent((device as any).toJSON({ with_session: true }));
                }).catch(next);
            }).catch(next);
        };

        const fbToken = req.body.registration_data.facebook_token;
        validateFacebookToken(fbToken).then((data) => {

            req.sequelize.model("AuthenticationInfo").findOne({
                where: {
                    external_id: data.id,
                    provider: "facebook"
                },
                include: [<any>'user']
            }).then((auth_info: AuthenticationInfoInstance) => {
                if (auth_info) {
                    let json = auth_info.user!.toJSON();
                    res.status(200).jsonContent(json);
                } else {
                    if (!req.body.registration_fullname) {
                        return next(new InvalidParametersError(['registration_fullname'], {}));
                    }
                    createUser({
                        email: data.email!,
                        full_name: data.name || req.body.registration_fullname,
                        authentication_infos: [<any>{
                            provider: "facebook",
                            external_id: data.id
                        }]
                    })
                }
            }).catch(next);

        }).catch(next);
    }


    private static removeProfilePicture(req: APIRequest, res: APIResponse, next: express.NextFunction) {
        req.currentUser!.updateAttributes({
            profile_image_url: null,
            profile_image_thumbnail_url: null
        }).then((user) => {
            if (req.db_cache)
                req.db_cache.invalidateModel('Device', req.token);
            res.jsonContent(user);
        }).catch(next);
    }

    private static processProfilePicture(req: APIRequest<UpdatePictureBodyParameters>, res: APIResponse, next: express.NextFunction) {
        if (req.file) {
            const s3Key = (nconf.get('BUCKET_ENV') || 'development') + '/users/' + req.currentUser!.id + '/profilepictures/' + uuid.v4() + '.jpg';
            const s3ThumbKey = (nconf.get('BUCKET_ENV') || 'development') + '/users/' + req.currentUser!.id + '/profilepictures/' + uuid.v4() + '_thumbnail' + '.jpg';
            async.waterfall([
                function parseImage(next) {
                    resize(req.file.path, { width: 512, height: 512 }, 75).then((buffer) => {
                        next(null, buffer);
                    }).catch(next);
                },
                function upload(data, next) {
                    new S3({
                        region: nconf.get('BUCKET_REGION')
                    }).putObject({
                        Bucket: nconf.get('BUCKET_NAME'),
                        Key: s3Key,
                        Body: data,
                        ACL: 'public-read',
                        ContentType: 'image/jpeg'
                    }, function (err, response) {
                        next(err, response);
                    });
                },
                function parseImage(response, next) {
                    resize(req.file.path, { width: 128, height: 128 }, 100).then((buffer) => {
                        next(null, buffer);
                    }).catch(next);
                },
                function upload(data, next) {
                    new S3({
                        region: nconf.get('BUCKET_REGION')
                    }).putObject({
                        Bucket: nconf.get('BUCKET_NAME'),
                        Key: s3ThumbKey,
                        Body: data,
                        ACL: 'public-read',
                        ContentType: 'image/jpeg'
                    }, function (err, response) {
                        next(err, response);
                    });
                }
            ],
                function (err) {
                    if (err) {
                        return next(err);
                    }
                    if (req.db_cache)
                        req.db_cache.invalidateModel('Device', req.token);
                    req.currentUser!.updateAttributes({
                        profile_image_url: bucket_url + s3Key,
                        profile_image_thumbnail_url: bucket_url + s3ThumbKey,
                        profile_image_promotion_url: null
                    }).then((user) => {
                        res.jsonContent(user);
                    }).catch(next);
                });


        }

        else {
            return next(new InvalidParametersError(["image"], {}));
        }
    }
}

/**
 * Defines the payload for facebook registration
 */
type FacebookRegistration = {
    facebook_token: string;
}

/**
 * Defines the payload for email registration
 */
type EmailRegistration = {
    email: string,
    password: string
}

/**
 * Defines the payload for registration
 */
interface RegistrationBodyParameters {
    registration_data: EmailRegistration;
    registration_fullname: string;
    device: DeviceAttributes
}

/**
 * Defines the payload for registration
 */
interface FacebookRegistrationBodyParameters {
    registration_data: FacebookRegistration;
    registration_fullname?: string;
    device: DeviceAttributes
}



/**
 * Defines the payload for updating a users profile picture
 */

interface UpdatePictureBodyParameters {
    image: any;
}
