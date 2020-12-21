<<<<<<< HEAD
import * as express from "express"
import { isAuthorized } from "../middleware/authorization"
import { APIRequest, BasicRouter, APIResponse } from "../basicrouter"
import { ResourceNotFoundError } from "../../error";
import { Device, DeviceAttributes, DeviceInstance, User, UserInstance } from "../../model";

export class DevicesRouter extends BasicRouter {

    constructor() {
        super();
        this.getInternalRouter().delete('/devices/:device_uuid', isAuthorized, DevicesRouter.deleteDevice);
    }

    public static findOrCreateDevice(device: DeviceAttributes, user: UserInstance, req: APIRequest): Promise<[boolean, DeviceInstance]> {
        return Promise.resolve(Device.findOrBuild({
            where: {
                device_uuid: device.device_uuid
            },
            paranoid: false
        }).spread(async (model: DeviceInstance, created: boolean) => {
            let updateBody = DevicesRouter.castUpdateDeviceBody(device);
            for (let key of Object.keys(updateBody)) {
                model.set(key, updateBody[key]);
            }
            model.set('user_id', user.id);
            if (model.deleted_at)
                await model.restore({})
            return model.save().then((device: DeviceInstance) => {
                if (req.db_cache)
                    req.invalidateCache(req.token);
                if (updateBody.device_token)
                    device.updateEndpoint().catch(err => {
                    });
                return device.reload({
                    include: [{ model: User, as: 'User' }]
                }).then((device => {
                    return [created, device] as [boolean, DeviceInstance]
                }))
            })
        }))
    }

    public static castUpdateDeviceBody(body: any): any {
        const updateableProperties = [
            'app_version',
            'build_version',
            'device_token',
            'token_provider',
            'device_uuid',
            'device_data_os',
            'device_data_os_version',
            'device_data_device_type',
            'device_data_device_name',
            'device_data_device_category',
            'device_data_carrier',
            'device_data_battery',
            'debug',
            'badge',
            'language'
        ];
        let returnObject = {};
        for (let key of updateableProperties) {
            if (body[key])
                returnObject[key] = body[key];
        }
        return returnObject;
    }

    /**
     * This function deletes a device and unregisters it from SNS
     * @param {APIRequest} req
     * @param {e.Response} res
     * @param {e.NextFunction} next
     */
    private static deleteDevice(req: APIRequest, res: APIResponse, next: express.NextFunction) {
        Device.destroy({
            where: {
                user_id: req.currentUser!.id!,
                device_uuid: req.params.device_uuid
            },
            force: true
        }).then((result) => {
            if (result === 0) {
                return next(new ResourceNotFoundError(undefined, 'Device'));
            } else {
                res.status(200).jsonContent({ 'message': 'Device successfully deleted' });
            }
        }).catch(next);
    }
}
=======
import * as express from "express"
import { isAuthorized } from "../middleware/authorization"
import { APIRequest, BasicRouter, APIResponse } from "../basicrouter"
import { ResourceNotFoundError } from "../../error";
import { Device, DeviceAttributes, DeviceInstance, User, UserInstance } from "../../model";

export class DevicesRouter extends BasicRouter {

    constructor() {
        super();
        this.getInternalRouter().delete('/devices/:device_uuid', isAuthorized, DevicesRouter.deleteDevice);
    }

    public static findOrCreateDevice(device: DeviceAttributes, user: UserInstance, req: APIRequest): Promise<[boolean, DeviceInstance]> {
        return Promise.resolve(Device.findOrBuild({
            where: {
                device_uuid: device.device_uuid
            },
            paranoid: false
        }).spread(async (model: DeviceInstance, created: boolean) => {
            let updateBody = DevicesRouter.castUpdateDeviceBody(device);
            for (let key of Object.keys(updateBody)) {
                model.set(key, updateBody[key]);
            }
            model.set('user_id', user.id);
            if (model.deleted_at)
                await model.restore({})
            return model.save().then((device: DeviceInstance) => {
                if (req.db_cache)
                    req.invalidateCache(req.token);
                if (updateBody.device_token)
                    device.updateEndpoint().catch(err => {
                    });
                return device.reload({
                    include: [{ model: User, as: 'User' }]
                }).then((device => {
                    return [created, device] as [boolean, DeviceInstance]
                }))
            })
        }))
    }

    public static castUpdateDeviceBody(body: any): any {
        const updateableProperties = [
            'app_version',
            'build_version',
            'device_token',
            'token_provider',
            'device_uuid',
            'device_data_os',
            'device_data_os_version',
            'device_data_device_type',
            'device_data_device_name',
            'device_data_device_category',
            'device_data_carrier',
            'device_data_battery',
            'debug',
            'badge',
            'language'
        ];
        let returnObject = {};
        for (let key of updateableProperties) {
            if (body[key])
                returnObject[key] = body[key];
        }
        return returnObject;
    }

    /**
     * This function deletes a device and unregisters it from SNS
     * @param {APIRequest} req
     * @param {e.Response} res
     * @param {e.NextFunction} next
     */
    private static deleteDevice(req: APIRequest, res: APIResponse, next: express.NextFunction) {
        Device.destroy({
            where: {
                user_id: req.currentUser!.id!,
                device_uuid: req.params.device_uuid
            },
            force: true
        }).then((result) => {
            if (result === 0) {
                return next(new ResourceNotFoundError(undefined, 'Device'));
            } else {
                res.status(200).jsonContent({ 'message': 'Device successfully deleted' });
            }
        }).catch(next);
    }
}
>>>>>>> c2067604d8d706b34f7e84642e35a212911907c3
