import * as express from "express"
import { APIRequest, APIResponse } from "../basicrouter"
import { MissingAuthorizationError, SessionNotFoundError, RouteNotFoundError } from "../../error"
import { DeviceInstance, UserInstance, User, Device, DeviceAttributes } from "../../model";
/**
 * This function checks if the provided auth token exists and sets the current device and the current user
 * @param {APIRequest} req
 * @param {e.Response} res
 * @param {e.NextFunction} next
 */
export function isAuthorized(req: APIRequest, res: APIResponse, next: express.NextFunction) {
    if (req.token) {
        if (req.db_cache) {
            req.db_cache.getModel<DeviceAttributes>('Device', req.token).then(attributes => {
                let device = Device.build(attributes, {
                    include: [
                        { model: User }
                    ]
                });
                device.isNewRecord = false;
                (device.User as UserInstance).isNewRecord = false;
                req.currentDevice = device;
                req.currentUser = device.User;
                next();
            }).catch(err => {
                Device.findOne({
                    where: { session_token: req.token },
                    include: [
                        {
                            model: User
                        }
                    ]
                }).then((device: DeviceInstance) => {
                    if (device) {
                        req.currentDevice = device;
                        req.currentUser = device.User;
                        next();
                        if (req.db_cache) {
                            req.db_cache.cacheModel(device, 'Device', req.token);
                        }
                    } else {
                        next(new SessionNotFoundError())
                    }
                    return null;
                }).catch(next);
            })
        } else {
            Device.findOne({
                where: { session_token: req.token },
                include: [
                    {
                        model: User
                    }
                ]
            }).then((device: DeviceInstance) => {
                if (device) {
                    req.currentDevice = device;
                    req.currentUser = device.User;
                    next();
                } else {
                    next(new SessionNotFoundError())
                }
                return null;
            }).catch(next);
        }
    } else {
        next(new MissingAuthorizationError());
    }
}

/**
 * This function checks if the provided auth token exists and sets the current device and the current user
 * @param {APIRequest} req
 * @param {e.Response} res
 * @param {e.NextFunction} next
 */
export function isAuthorizedOptional(req: APIRequest, res: APIResponse, next: express.NextFunction) {
    if (req.token) {
        Device.findOne({
            where: { session_token: req.token },
            include: [{
                model: User
            }]
        }).then((device: DeviceInstance) => {
            if (device) {
                req.currentDevice = device;
                req.currentUser = device.User;
                next();
            } else {
                next(new SessionNotFoundError())
            }
        }).catch(next);
    } else {
        next();
    }
}

export function isAdmin(req: APIRequest, res: APIResponse, next: express.NextFunction) {
    if (!req.currentUser) {
        return next(new RouteNotFoundError());
    }
    // ToDo: replace
    if (req.currentUser!.email != 'admin@yourdomain.com') {
        return next(new RouteNotFoundError());
    }
    next();
}

/**
 * This function checks if the provided refresh token exists and sets the current user
 * @param {APIRequest} req
 * @param {e.Response} res
 * @param {e.NextFunction} next
 */
export function isRefreshTokenAuthorized(req: APIRequest, res: APIResponse, next: express.NextFunction) {
    if (req.token) {
        req.sequelize.model('User').findOne({
            where: { refresh_token: req.token }
        }).then((user: UserInstance) => {
            if (user) {
                req.currentUser = user;
                next();
            } else {
                next(new SessionNotFoundError())
            }
            return null;
        }).catch(next);
    } else {
        next(new MissingAuthorizationError());
    }
}
