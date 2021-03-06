<<<<<<< HEAD
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
import { Op, UniqueConstraintError } from "sequelize";
import { DeviceInstance, AuthenticationInfo, User, Device } from "../../model";
import { isString, minLength, isStringAndNotEmpty, isBoolean } from "../middleware/validationrules";
import { maxLength } from "../../router/middleware/validationrules";
import EmailServer from '../../modules/emailserver'
import { DevicesRouter } from "./devices";
import { generatePasswordReset } from "../../messages/email";

export class LoginRouter extends BasicRouter {

    constructor() {
        super();
        this.getInternalRouter().post('/login', BasicRouter.requireKeysOfTypes({
            email: (value: any): true | string => {
                return EmailValidator.validate(value) || 'Invalid email address'
            },
            password: isString,
            device: {
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
            req.currentUser!.sendVerificationEmail(false)
            res.jsonContent({ status: 'success' })
            return null
        })

        this.getInternalRouter().post('/verify', isAuthorized, BasicRouter.requireKeysOfTypes({
            code: isStringAndNotEmpty
        }), LoginRouter.verify)

        this.getInternalRouter().post('/logout', isAuthorized, LoginRouter.logout)
    }

    static logout(req: APIRequest<LoginData>, res: APIResponse, next: express.NextFunction) {
        req.invalidateCache()
        res.setAuthCookie(undefined!, true)
        res.jsonContent({})
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
            throw (new ResourceNotFoundError(undefined, 'Email'));
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
            return DevicesRouter.findOrCreateDevice(req.body.device, user, req).then(([created, device]) => {
                if (device.device_data_os == 'web') {
                    res.setAuthCookie(device.session_token!)
                }
                res.status(created ? 201 : 200)
                res.jsonContent((device as any).toJSON({ with_session: true }));
            }).catch(next);
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
        }).then(async (auth_info: AuthenticationInfoInstance) => {
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
            if (auth_info) {
                generateToken(auth_info).then((token) => {
                    let server = new EmailServer();
                    let content = generatePasswordReset(auth_info.user, token.reset_token!)
                    return server.sendTemplate(auth_info.user.email, content.title, content.subTitle, content.body).then(() => {
                        res.jsonContent({ 'message': 'Reset token was sent to ' + req.body.email });
                    })
                }).catch(next);
            } else {
                const user = (await User.findOne({ where: { email: req.body.email, }, include: [{ model: AuthenticationInfo, as: 'authentication_infos' }], rejectOnEmpty: true }))!
                if (user && user.authentication_infos && !user.authentication_infos.find(a => a.provider == 'email')) {
                    return user!.createAuthentication_info({
                        provider: "email",
                        external_id: user.email
                    }).then((info) => {
                        return generateToken(info).then((token) => {
                            let server = new EmailServer();
                            let content = generatePasswordReset(user, token.reset_token!)
                            return server.sendTemplate(user.email, content.title, content.subTitle, content.body).then(() => {
                                res.jsonContent({ 'message': 'Reset token was sent to ' + req.body.email });
                            })
                        })
                    }).catch(next);
                }
                return next(new ResourceNotFoundError('A user with this email_address could not be found', 'User'));
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
                return next(new ResourceNotFoundError(undefined, 'Reset Token'));
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
                return next(new InvalidLoginError())
            } else {
                return req.sequelize.transaction(function (t) {

                    // chain all your queries here. make sure you return them.
                    auth_info!.password = passwordHash.generate(req.body.password, {
                        'algorithm': 'sha256'
                    });

                    return auth_info!.save({ transaction: t }).then((auth_info) => {
                        return Device.findAll({
                            where: {
                                [Op.not]: {
                                    id: req.currentDevice!.id,
                                },
                                user_id: auth_info.user.id
                            },
                            transaction: t
                        }).then((devices: DeviceInstance[]) => {
                            return new Promise((resolve) => {
                                async.each(devices, (device, callback) => {
                                    device.session_token = uuid.v4();
                                    device.save({ transaction: t }).then(() => {
                                        callback();
                                    }).catch(callback);
                                }, (err) => {
                                    if (err) {
                                    }
                                    resolve();
                                });
                            })

                        })
                    })

                }).then(function () {
                    res.jsonContent({ 'message': 'Password successfully changed' });
                })
            }
        }).catch(next);
    }
}

export interface LoginData {
    email: string;
    password: string;
    device: DeviceAttributes
}
=======
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
import { Op, UniqueConstraintError } from "sequelize";
import { DeviceInstance, AuthenticationInfo, User, Device } from "../../model";
import { isString, minLength, isStringAndNotEmpty, isBoolean } from "../middleware/validationrules";
import { maxLength } from "../../router/middleware/validationrules";
import EmailServer from '../../modules/emailserver'
import { DevicesRouter } from "./devices";
import { generatePasswordReset } from "../../messages/email";

export class LoginRouter extends BasicRouter {

    constructor() {
        super();
        this.getInternalRouter().post('/login', BasicRouter.requireKeysOfTypes({
            email: (value: any): true | string => {
                return EmailValidator.validate(value) || 'Invalid email address'
            },
            password: isString,
            device: {
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
            req.currentUser!.sendVerificationEmail(false)
            res.jsonContent({ status: 'success' })
            return null
        })

        this.getInternalRouter().post('/verify', isAuthorized, BasicRouter.requireKeysOfTypes({
            code: isStringAndNotEmpty
        }), LoginRouter.verify)

        this.getInternalRouter().post('/logout', isAuthorized, LoginRouter.logout)
    }

    static logout(req: APIRequest<LoginData>, res: APIResponse, next: express.NextFunction) {
        req.invalidateCache()
        res.setAuthCookie(undefined!, true)
        res.jsonContent({})
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
            throw (new ResourceNotFoundError(undefined, 'Email'));
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
            return DevicesRouter.findOrCreateDevice(req.body.device, user, req).then(([created, device]) => {
                if (device.device_data_os == 'web') {
                    res.setAuthCookie(device.session_token!)
                }
                res.status(created ? 201 : 200)
                res.jsonContent((device as any).toJSON({ with_session: true }));
            }).catch(next);
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
        }).then(async (auth_info: AuthenticationInfoInstance) => {
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
            if (auth_info) {
                generateToken(auth_info).then((token) => {
                    let server = new EmailServer();
                    let content = generatePasswordReset(auth_info.user, token.reset_token!)
                    return server.sendTemplate(auth_info.user.email, content.title, content.subTitle, content.body).then(() => {
                        res.jsonContent({ 'message': 'Reset token was sent to ' + req.body.email });
                    })
                }).catch(next);
            } else {
                const user = (await User.findOne({ where: { email: req.body.email, }, include: [{ model: AuthenticationInfo, as: 'authentication_infos' }], rejectOnEmpty: true }))!
                if (user && user.authentication_infos && !user.authentication_infos.find(a => a.provider == 'email')) {
                    return user!.createAuthentication_info({
                        provider: "email",
                        external_id: user.email
                    }).then((info) => {
                        return generateToken(info).then((token) => {
                            let server = new EmailServer();
                            let content = generatePasswordReset(user, token.reset_token!)
                            return server.sendTemplate(user.email, content.title, content.subTitle, content.body).then(() => {
                                res.jsonContent({ 'message': 'Reset token was sent to ' + req.body.email });
                            })
                        })
                    }).catch(next);
                }
                return next(new ResourceNotFoundError('A user with this email_address could not be found', 'User'));
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
                return next(new ResourceNotFoundError(undefined, 'Reset Token'));
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
                return next(new InvalidLoginError())
            } else {
                return req.sequelize.transaction(function (t) {

                    // chain all your queries here. make sure you return them.
                    auth_info!.password = passwordHash.generate(req.body.password, {
                        'algorithm': 'sha256'
                    });

                    return auth_info!.save({ transaction: t }).then((auth_info) => {
                        return Device.findAll({
                            where: {
                                [Op.not]: {
                                    id: req.currentDevice!.id,
                                },
                                user_id: auth_info.user.id
                            },
                            transaction: t
                        }).then((devices: DeviceInstance[]) => {
                            return new Promise((resolve) => {
                                async.each(devices, (device, callback) => {
                                    device.session_token = uuid.v4();
                                    device.save({ transaction: t }).then(() => {
                                        callback();
                                    }).catch(callback);
                                }, (err) => {
                                    if (err) {
                                    }
                                    resolve();
                                });
                            })

                        })
                    })

                }).then(function () {
                    res.jsonContent({ 'message': 'Password successfully changed' });
                })
            }
        }).catch(next);
    }
}

export interface LoginData {
    email: string;
    password: string;
    device: DeviceAttributes
}
>>>>>>> c2067604d8d706b34f7e84642e35a212911907c3
