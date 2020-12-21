import * as express from "express"
import { isAuthorized } from "../middleware/authorization"
import * as passwordHash from 'password-hash'
import { APIRequest, BasicRouter, APIResponse, APINextFunction } from "../basicrouter"
import { AuthenticationInfoInstance, User, AuthenticationInfo, UserAttributes, DeviceAttributes } from "../../model"
import { validateFacebookToken } from "../middleware/facebook"
import * as EmailValidator from "email-validator"
import { isBoolean, isString, maxLength, minLength, parallelValidate } from "../middleware/validationrules"
import * as multer from "multer"
import { S3 } from "aws-sdk"
import * as async from "async"
import * as nconf from "nconf"
import { ResourceNotFoundError, InvalidParametersError, ResourceAlreadyExists } from '../../error'
import { resize } from "../../modules/imageconversion";
import * as uuid from 'uuid'
import InternalServerError from "../../error/internalservererror";
import { DevicesRouter } from "./devices"
import { validateGoogleToken } from "../middleware/google"
import * as Sequelize from 'sequelize'
const bucket_url = nconf.get("BUCKET_URL");

export class UsersRouter extends BasicRouter {

    constructor() {
        super();
        this.getInternalRouter().get('/users', UsersRouter.getUserByEmail);
        this.getInternalRouter().get('/users/me', isAuthorized, UsersRouter.getUser);
        this.getInternalRouter().put('/users/me', isAuthorized, BasicRouter.requireKeysOfTypes({
            'email?': (value: any): true | string => {
                if (EmailValidator.validate(value)) {
                    return true
                }
                return 'Invalid email provided'
            },
            'full_name?': isString,
            'username?': isString,
            'phone?': isString
        }), UsersRouter.updateUser);

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

        this.getInternalRouter().post('/users/google', BasicRouter.requireKeysOfTypes({
            'registration_data': (value: any): true | string => {
                if (isString(value['google_token'])) {
                    return true;
                }
                return 'Invalid google registration data'
            },
            device: {
                device_uuid: isString,
                app_version: isString,
                build_version: isString,
                debug: isBoolean,
                "language": isString,
            }
        }), UsersRouter.newGoogleUser);

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

    private static async updateUser(req: APIRequest<UserAttributes>, res: APIResponse, next: APINextFunction) {
        const didUpdateEmail = req.body.email && req.body.email.toLowerCase() != req.currentUser!.email.toLowerCase()
        if (didUpdateEmail) {
            const auth_infos_c = await AuthenticationInfo.count({ where: { provider: 'email', external_id: req.body.email } })
            const users_s = await User.count({ where: { email: req.body.email } })
            if (auth_infos_c > 0 || users_s > 0) {
                return next(new ResourceAlreadyExists('Email already taken'))
            }
        }
        if (didUpdateEmail) {
            req.body.verified = false
        }
        req.sequelize.transaction((transaction) => {
            return req.currentUser!.update(req.body, { transaction }).then(async user => {
                if (didUpdateEmail) {
                    await AuthenticationInfo.update({
                        external_id: user.email
                    }, { where: { user_id: user.id!, provider: 'email' }, transaction }).then(() => {
                        user.sendVerificationEmail(false)
                        return user
                    })
                }
                return user
            })
        }).then((user) => {
            res.jsonContent(user)
        }).catch(next);
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

    private static async checkUserWithEmail(email: string, defaultError: Error, next: APINextFunction) {
        try {
            if (email && email != '') {
                const user = (await User.findOne({ where: { email: email }, include: [{ model: AuthenticationInfo, as: 'authentication_infos' }], rejectOnEmpty: true }))!
                if (user && user.authentication_infos && user.authentication_infos.length > 0) {
                    let info = user.authentication_infos[0].provider.substr(0, 1).toUpperCase() + user.authentication_infos[0].provider.substr(1)
                    next(new ResourceNotFoundError(`You created your account using ${info}. Please use ${info} to Log in again`, 'AuthenticationInfo'));
                    return null
                }
            }
        } catch (error) {

        }
        next(defaultError)
        return null
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
                    user.sendVerificationEmail(true);
                    res.status(201)
                    res.jsonContent((device as any).toJSON({ with_session: true }));
                })
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

    private static newGoogleUser(req: APIRequest<GoogleRegistrationBodyParameters>, res: APIResponse, next: express.NextFunction) {
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
                })
            }).catch((err) => {
                return UsersRouter.checkUserWithEmail(data.email, err, next)
            })
        };

        const token = req.body.registration_data.google_token;
        validateGoogleToken(token).then((data) => {

            AuthenticationInfo.findOne({
                where: {
                    external_id: data.id,
                    provider: "google"
                },
                include: [<any>'user']
            }).then((auth_info: AuthenticationInfoInstance) => {
                if (auth_info) {
                    return DevicesRouter.findOrCreateDevice(req.body.device, auth_info.user, req).then(([created, device]) => {
                        if (device.device_data_os == 'web') {
                            res.setAuthCookie(device.session_token!)
                        }
                        res.status(created ? 201 : 200)
                        res.jsonContent((device as any).toJSON({ with_session: true }));
                    }).catch(next);
                } else {
                    if (!data.email) {
                        return next(new InvalidParametersError(['email'], {}, 'Missing email for social login'));
                    }
                    return AuthenticationInfo.findOne({
                        where: {
                            external_id: data.email,
                            provider: "email"
                        },
                        include: [<any>'user'], rejectOnEmpty: true
                    }).then((auth_info: AuthenticationInfoInstance) => {
                        auth_info = auth_info!;
                        return auth_info.user.createAuthentication_info({
                            provider: "google",
                            external_id: data.id
                        }).then(() => {
                            return DevicesRouter.findOrCreateDevice(req.body.device, auth_info.user, req).then(([created, device]) => {
                                if (device.device_data_os == 'web') {
                                    res.setAuthCookie(device.session_token!)
                                }
                                res.status(created ? 201 : 200)
                                res.jsonContent((device as any).toJSON({ with_session: true }));
                            }).catch(next);
                        })
                    }).catch(err => {
                        if (err instanceof Sequelize.EmptyResultError) {
                            createUser({
                                email: data.email!,
                                full_name: data.name,
                                verified: true,
                                authentication_infos: [<any>{
                                    provider: "google",
                                    external_id: data.id
                                }]
                            })
                        } else {
                            next(err)
                        }
                    })
                }
            }).catch(next);

        }).catch(next);
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
                })
            }).catch((err) => {
                return UsersRouter.checkUserWithEmail(data.email, err, next)
            })
        };

        const fbToken = req.body.registration_data.facebook_token;
        validateFacebookToken(fbToken).then((data) => {

            AuthenticationInfo.findOne({
                where: {
                    external_id: data.id,
                    provider: "facebook"
                },
                include: [<any>'user']
            }).then((auth_info: AuthenticationInfoInstance) => {
                if (auth_info) {
                    return DevicesRouter.findOrCreateDevice(req.body.device, auth_info.user, req).then(([created, device]) => {
                        if (device.device_data_os == 'web') {
                            res.setAuthCookie(device.session_token!)
                        }
                        res.status(created ? 201 : 200)
                        res.jsonContent((device as any).toJSON({ with_session: true }));
                    }).catch(next);
                } else {
                    createUser({
                        email: data.email!,
                        full_name: data.name,
                        verified: true,
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
                        profile_image_url: bucket_url + '/' + s3Key,
                        profile_image_thumbnail_url: bucket_url + '/' + s3ThumbKey,
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

type GoogleRegistration = {
    google_token: string;
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

interface GoogleRegistrationBodyParameters {
    registration_data: GoogleRegistration;
    registration_fullname?: string;
    device: DeviceAttributes
}

/**
 * Defines the payload for updating a users profile picture
 */

interface UpdatePictureBodyParameters {
    image: any;
}
