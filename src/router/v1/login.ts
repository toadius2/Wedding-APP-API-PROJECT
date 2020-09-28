import * as express from "express"
import { isAuthorized } from "../middleware/authorization"
import applyCORS from '../middleware/cors'
import { APIRequest, BasicRouter, APIResponse } from "../basicrouter"
import { AuthenticationInfoInstance, DeviceAttributes } from "../../model";
import * as passwordHash from "password-hash"
import { InvalidLoginError, ResourceNotFoundError, InvalidParametersError } from "../../error";
import * as EmailValidator from 'email-validator';
import * as uuid from "uuid"
import * as async from "async"
import { UniqueConstraintError } from "sequelize";
import { DeviceInstance, AuthenticationInfo, User, Device } from "../../model";
import { isString, minLength, isStringAndNotEmpty, isBoolean } from "../middleware/validationrules";
import { maxLength } from "../../router/middleware/validationrules";
import EmailServer from '../../modules/emailserver'
import * as nconf from 'nconf'
import { DevicesRouter } from "./devices";

export class LoginRouter extends BasicRouter {

    constructor() {
        super();
        this.getInternalRouter().post('/login', BasicRouter.requireKeysOfTypes({
            email: (value: any): true | string => {
                return EmailValidator.validate(value) || 'Invalid email address'
            },
            password: isString, device: {
                device_uuid: isString,
                app_version: isString,
                build_version: isString,
                debug: isBoolean,
                "language": isString,
            }
        }), LoginRouter.login);

        this.getInternalRouter().post('/forgotpassword', BasicRouter.requireKeysOfTypes({
            email: (value: any): true | string => {
                return EmailValidator.validate(value) || 'Invalid email address'
            }
        }), LoginRouter.forgotPassword);
        this.getInternalRouter().options('/resetpassword', applyCORS, (req, res) => {
            res.status(200).end();
        })

        this.getInternalRouter().post('/resetpassword', applyCORS, BasicRouter.requireKeysOfTypes({
            code: isString,
            password: [isString, minLength(6), maxLength(100)]
        }), LoginRouter.resetPassword);
        this.getInternalRouter().post('/changepassword', isAuthorized, BasicRouter.requireKeysOfTypes({
            old_password: isString,
            password: [isString, minLength(6), maxLength(100)]
        }), LoginRouter.changePassword);

        this.getInternalRouter().post('/resend-verification', isAuthorized, (req: APIRequest, res: APIResponse, next) => {
            req.currentUser!.sendVerificationEmail()
            res.jsonContent({ status: 'success' })
        })

        this.getInternalRouter().post('/verify', isAuthorized, BasicRouter.requireKeysOfTypes({
            code: isStringAndNotEmpty
        }), LoginRouter.verify)
    }

    static verify(req: APIRequest<{ code: string }>, res: APIResponse, next: express.NextFunction) {
        AuthenticationInfo.findOne({
            where: {
                user_id: req.currentUser!.id,
                verification_code: req.body.code
            },
            rejectOnEmpty: true
        }).then((info) => {
            req.sequelize.transaction((t) => {
                return info!.updateAttributes({
                    verfication_code: null
                }, { transaction: t }).then((info) => {
                    return req.currentUser!.updateAttributes({
                        verified: true
                    }, { transaction: t })
                })
            }).then((user) => {
                let json = (user as any).toJSON({ currentUser: req.currentUser });
                res.jsonContent(json);
            })
            return null
        }).catch((error) => {
            return next(new InvalidParametersError([], { 'code': 'The provided code was invalid' }));
        })
    }

    static doLogin(data: { email: string, password: string }) {
        return Promise.resolve(AuthenticationInfo.findOne({
            where: {
                external_id: data.email,
                provider: "email"
            },
            include: [{
                model: User,
                as: "user"
            }]
        }).then((auth_info: AuthenticationInfoInstance) => {
            if (auth_info) {
                if (passwordHash.verify(data.password, auth_info.password!)) {
                    return auth_info.user
                }
                throw (new InvalidLoginError());
            }
            throw (new ResourceNotFoundError(undefined, 'AuthenticationInfo'));
        }))
    }

    /**
     * This function checks a users login data and returns the user
     * @param {APIRequest<LoginData>} req
     * @param {e.Response} res
     * @param {e.NextFunction} next
     */
    static login(req: APIRequest<LoginData>, res: APIResponse, next: express.NextFunction) {
        LoginRouter.doLogin(req.body).then(user => {
            req.currentUser = user
            Device.findOrBuild({
                where: {
                    device_uuid: req.body.device.device_uuid
                },
                paranoid: false
            }).spread(async (model: DeviceInstance, created: boolean) => {
                let updateBody = DevicesRouter.castUpdateDeviceBody(req.body.device);
                for (let key of Object.keys(updateBody)) {
                    model.set(key, updateBody[key]);
                }
                model.set('user_id', req.currentUser!.id);
                if (model.deleted_at)
                    await model.restore({})
                model.save().then((device: DeviceInstance) => {
                    if (req.db_cache)
                        req.db_cache.invalidateModel('Device', req.token);
                    if (updateBody.device_token)
                        device.updateEndpoint().catch(err => {
                        });
                    return device.reload({
                        include: [{ model: User, as: 'User' }]
                    }).then((device => {
                        res.status(created ? 201 : 200)
                        res.jsonContent((device as any).toJSON({ with_session: true }));
                    }))
                }).catch(next);
                if (updateBody.badge !== undefined && updateBody.badge == 0) {
                    req.currentUser!.getDevices().then(devices => {
                        devices.forEach(d => {
                            d.badge = 0;
                            d.save();
                        })
                    });
                }
                return null;
            }).catch(next);
            return null
        }).catch(next);
    }

    /**
     * This function sends a password reset email to the provided email address if a user with that address was found
     * @param {APIRequest<{email: string}>} req
     * @param {e.Response} res
     * @param {e.NextFunction} next
     */
    static forgotPassword(req: APIRequest<{ email: string }>, res: APIResponse, next: express.NextFunction) {
        AuthenticationInfo.findOne({
            where: {
                external_id: req.body.email,
                provider: "email"
            },
            include: [{ model: User, as: "user" }]
        }).then((auth_info: AuthenticationInfoInstance) => {
            if (auth_info) {
                const generateToken = (auth_info: AuthenticationInfoInstance): Promise<AuthenticationInfoInstance> => {
                    return new Promise<AuthenticationInfoInstance>((resolve, reject) => {
                        auth_info.reset_token = uuid.v4();
                        auth_info.save().then((auth_info) => {
                            resolve(auth_info);
                        }).catch((err) => {
                            if (err instanceof UniqueConstraintError) {
                                generateToken(auth_info).then(resolve).catch(reject);
                            } else {
                                reject(err);
                            }
                        })
                    })
                };
                generateToken(auth_info).then((token) => {
                    let server = new EmailServer();
                    let text = "Hi " + auth_info.user!.full_name + "!" + '\r\n' + '\r\n';
                    text += "You or someone else requested a password reset for your account. If this was not you or your intention, just relax and ignore this email."
                    text += '\r\n' + '\r\n';
                    text += "If you wish to reset your password, all you need to do is follow this link to reset your password:" + '\r\n' + '\r\n';
                    text += nconf.get("FORGOT_PW_URL");
                    text += "?token=" + encodeURIComponent(token.reset_token!);
                    if (process.env["NODE_ENV"] == "development") {
                        text += "#develop";
                    }
                    server.send(auth_info.user!.email, "Reset your Password", text);
                    res.jsonContent({ 'message': 'Reset token was sent to ' + req.body.email });
                }).catch(next);
            } else {
                return next(new ResourceNotFoundError(undefined, 'AuthenticationInfo'));
            }
        }).catch(next);
    }

    /**
     * Resets the users password if the provided code (which is received by email) matches one in the database
     * @param {APIRequest<{code: string; password: string}>} req
     * @param {e.Response} res
     * @param {e.NextFunction} next
     */
    static resetPassword(req: APIRequest<{ code: string, password: string }>, res: APIResponse, next: express.NextFunction) {
        AuthenticationInfo.findOne({
            where: {
                reset_token: req.body.code,
                provider: "email"
            },
            include: [{ model: User, as: "user" }]
        }).then((auth_info: AuthenticationInfoInstance) => {
            if (auth_info) {

                req.sequelize.transaction(function (t) {

                    // chain all your queries here. make sure you return them.
                    auth_info.password = passwordHash.generate(req.body.password, {
                        'algorithm': 'sha256'
                    });
                    auth_info.reset_token = null;

                    return auth_info.save({ transaction: t }).then((auth_info) => {
                        return Device.findAll({
                            where: {
                                user_id: auth_info.user!.id
                            },
                            transaction: t
                        }).then((devices: DeviceInstance[]) => {
                            return new Promise((resolve, reject) => {
                                async.each(devices, (device, callback) => {
                                    device.session_token = uuid.v4();
                                    device.save({ transaction: t }).then(() => {
                                        callback();
                                    }).catch(callback);
                                }, (err) => {
                                    if (err) {
                                        throw err;
                                    }
                                    resolve(auth_info.user);
                                });
                            })

                        })
                    })

                }).then(function (result) {
                    res.jsonContent(result);
                }).catch(function (err) {
                    next(err);
                });

            } else {
                return next(new ResourceNotFoundError(undefined, 'AuthenticationInfo'));
            }
        }).catch(next);
    }

    /**
     * Changes the password of the currently logged in user if the old_password parameter matches the current one
     * @param {APIRequest<{old_password: string; password: string}>} req
     * @param {e.Response} res
     * @param {e.NextFunction} next
     */
    static changePassword(req: APIRequest<{ old_password: string, password: string }>, res: APIResponse, next: express.NextFunction) {
        AuthenticationInfo.findAll({
            where: {
                user_id: req.currentUser!.id!,
                provider: "email"
            },
            include: [
                { model: User, as: 'user' }
            ]
        }).then((auth_infos: AuthenticationInfoInstance[]) => {

            let auth_info: AuthenticationInfoInstance | undefined;
            for (let info of auth_infos) {
                if (passwordHash.verify(req.body.old_password, info.password!)) {
                    auth_info = info;
                    break;
                }
            }

            if (auth_info === undefined) {
                return next(new ResourceNotFoundError(undefined, 'AuthenticationInfo'));
            } else {
                req.sequelize.transaction(function (t) {

                    // chain all your queries here. make sure you return them.
                    auth_info!.password = passwordHash.generate(req.body.password, {
                        'algorithm': 'sha256'
                    });

                    return auth_info!.save({ transaction: t }).then((auth_info) => {
                        return req.sequelize.model("Device").findAll({
                            where: {
                                $not: {
                                    id: req.currentDevice!.id,
                                },
                                user_id: auth_info.user.id
                            },
                            transaction: t
                        }).then((devices: DeviceInstance[]) => {
                            return new Promise((resolve, reject) => {
                                async.each(devices, (device, callback) => {
                                    device.session_token = uuid.v4();
                                    device.save({ transaction: t }).then(() => {
                                        callback();
                                    }).catch(callback);
                                }, (err) => {
                                    if (err) {
                                        throw err;
                                    }
                                    resolve();
                                });
                            })

                        })
                    })

                }).then(function (result) {
                    res.jsonContent({ 'message': 'Password successfully changed' });
                }).catch(function (err) {
                    next(err);
                });
            }
        }).catch(next);
    }
}

export interface LoginData {
    email: string;
    password: string;
    device: DeviceAttributes
}
