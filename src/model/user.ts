import * as base from "./base"
import * as Sequelize from "sequelize"
import * as Device from "./device"
import * as AuthenticationInfo from "./authentication_info"
import * as WeddingInfo from "./wedding"
import * as uuid from 'uuid'
import EmailServer from "../modules/emailserver";
import * as logger from '../logger'

export interface UserAttributes extends base.BaseModelAttributes {
    email: string
    full_name: string

    profile_image_url?: string;
    profile_image_thumbnail_url?: string;

    authentication_infos?: [AuthenticationInfo.AuthenticationInfoInstance];
    wedding?: [WeddingInfo.WeddingInstance];

    verified?: boolean;
}

export interface SendPushFunction {
    (message: string, incrementBadge: boolean, meta?: any): Promise<void>
}

export interface UserInstance extends Sequelize.Instance<UserAttributes>, UserAttributes {
    addAuthentication_info: Sequelize.HasManyAddAssociationMixin<AuthenticationInfo.AuthenticationInfoInstance, string>
    getAuthentication_infos: Sequelize.HasManyGetAssociationsMixin<AuthenticationInfo.AuthenticationInfoInstance>
    removeAuthentication_info: Sequelize.HasManyRemoveAssociationMixin<AuthenticationInfo.AuthenticationInfoInstance, string>
    createAuthentication_info: Sequelize.HasManyCreateAssociationMixin<AuthenticationInfo.AuthenticationInfoAttributes, AuthenticationInfo.AuthenticationInfoInstance>

    getDevices: Sequelize.HasManyGetAssociationsMixin<Device.DeviceInstance>
    sendPush: SendPushFunction

    createWedding: Sequelize.HasManyCreateAssociationMixin<WeddingInfo.WeddingAttributes, WeddingInfo.WeddingInstance>

    sendVerificationEmail: () => void
}

export let User: Sequelize.Model<UserInstance, UserAttributes>;

export function define(sequelize: Sequelize.Sequelize): void {
    let definition: Sequelize.DefineAttributes = {
        email: {
            type: Sequelize.STRING(255),
            allowNull: false,
            validate: {
                isEmail: true
            }
        },
        full_name: {
            type: Sequelize.STRING(),
            allowNull: false
        },
        profile_image_url: {
            type: Sequelize.STRING(255),
            allowNull: true
        },
        profile_image_thumbnail_url: {
            type: Sequelize.STRING(255),
            allowNull: true
        },
        verified: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
    }
    User = <Sequelize.Model<UserInstance, UserAttributes>>
        sequelize.define('User', Object.assign({}, base.defaultColums(), definition) as any, {
            paranoid: false,
            indexes: [
                { fields: ['email'], method: 'HASH', unique: true },
            ],
        });
    (User as any).prototype.sendVerificationEmail = async function (this: UserInstance) {
        this.authentication_infos![0].verification_code = uuid.v4().slice(0, 4)
        await this.authentication_infos![0].save()
        new EmailServer().send(this.email, 'Email verification', 'Your verification code: ' + this.authentication_infos![0].verification_code).catch(err => {
            logger.error('Error sending verifcation email', err, 'User-sendVerifcationEmail')
        })
    }
}
