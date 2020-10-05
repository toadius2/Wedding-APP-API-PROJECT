import * as base from "./base"
import * as Sequelize from "sequelize"
import * as User from "./user"
import * as uuid from 'uuid'
import NotAccessibleError from "../error/notaccessibleerror";
import { PushServer } from "../modules/pushserver";
import * as nconf from "nconf";

export interface DeviceAttributes extends base.BaseModelAttributes {
    app_version: string;
    build_version: string;
    device_token?: string;
    token_provider?: string;
    device_uuid: string;
    device_data_os?: string;
    device_data_os_version?: string;
    device_data_device_type?: string;
    device_data_device_name?: string;
    device_data_device_category?: string;
    device_data_carrier?: string;
    device_data_battery?: string;
    debug: boolean;
    language: string;
    valid: boolean;
    session_token: string | undefined;
    User?: User.UserInstance | any;
    sns_endpoint?: string | undefined;
    user_id?: string;
    badge?: number;
}

export interface DeviceInstance extends Sequelize.Instance<DeviceAttributes>, DeviceAttributes {
    sendPush: (content: string, inc: boolean, meta?: any) => Promise<void>;
    updateEndpoint: () => Promise<any>;
}

export let Device: Sequelize.Model<DeviceInstance, DeviceAttributes>;

export function define(sequelize: Sequelize.Sequelize): void {
    let definition: Sequelize.DefineAttributes = {
        app_version: {
            type: Sequelize.STRING(),
            allowNull: false
        },
        build_version: {
            type: Sequelize.STRING(),
            allowNull: false
        },
        device_token: {
            type: Sequelize.STRING(),
            allowNull: true
        },
        token_provider: {
            type: Sequelize.ENUM(["apple", "google"]),
            allowNull: true
        },
        device_uuid: {
            type: Sequelize.STRING(),
            allowNull: false
        },
        session_token: {
            type: Sequelize.UUID,
            defaultValue: uuid.v4,
            allowNull: false
        },
        device_data_os: {
            type: Sequelize.STRING(),
            allowNull: true
        },
        device_data_os_version: {
            type: Sequelize.STRING(),
            allowNull: true
        },
        device_data_device_type: {
            type: Sequelize.STRING(),
            allowNull: true
        },
        device_data_device_name: {
            type: Sequelize.STRING(),
            allowNull: true
        },
        device_data_device_category: {
            type: Sequelize.STRING(),
            allowNull: true
        },
        device_data_carrier: {
            type: Sequelize.STRING(),
            allowNull: true
        },
        device_data_battery: {
            type: Sequelize.FLOAT(),
            allowNull: true
        },
        debug: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        language: {
            type: Sequelize.STRING(),
            allowNull: false
        },
        valid: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
        sns_endpoint: {
            type: Sequelize.STRING(),
            allowNull: true
        },
        badge: {
            type: Sequelize.INTEGER(),
            defaultValue: 0
        }
    };
    Device = <Sequelize.Model<DeviceInstance, DeviceAttributes>>
        sequelize.define('Device', Object.assign({}, base.defaultColums(), definition) as any, {
            paranoid: true,
            underscored: true,
            indexes: [
                { fields: ['device_uuid'], method: 'HASH', unique: true }
            ]
        });
    (<any>Device).prototype.sendPush = function (this: DeviceInstance, content: string, incrementBadge: boolean, meta?: any): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (incrementBadge) {
                this.badge! += 1;
                this.save();
            }
            if (this.sns_endpoint) {
                const pushServer = new PushServer();
                meta = meta || {};
                meta.badge = this.badge;
                pushServer.sendPushToEndpoint(this.sns_endpoint, content, meta).then(resolve).catch(reject);
            } else {
                reject(new NotAccessibleError('This device is not registered to SNS'));
            }
        });
    };
    (<any>Device).prototype.updateEndpoint = function (): Promise<any> {
        if (!this.device_token)
            return Promise.resolve();
        return new Promise<any>((resolve, reject) => {
            const pushServer = new PushServer();
            if (this.sns_endpoint) {
                pushServer.updateDeviceToken(this.sns_endpoint, this.device_token).then(resolve).catch(reject);
            } else {
                const ARN = this.debug ? nconf.get('PUSH_ARN_DEV') : nconf.get('PUSH_ARN');
                pushServer.registerNewDevice(ARN, this.device_token).then((registration) => {
                    this.updateAttributes({
                        sns_endpoint: registration.EndpointArn
                    }).then(resolve).catch(reject);
                }).catch(reject);
            }
        });
    };
    (Device as any).prototype.toJSON = function (o = {}) {
        var returning = {};
        Object.keys(this.dataValues).forEach(key => {
            if (this.dataValues[key] && typeof this.dataValues[key] == 'object'
                && this.dataValues[key].toJSON) {
                returning[key] = this.dataValues[key].toJSON(o);
            } else {
                returning[key] = this.dataValues[key];
            }
        })
        if (!(o as any).with_session) {
            delete (returning as any).session_token;
        }
        delete (returning as any).sns_endpoint;
        return returning;
    };

}
