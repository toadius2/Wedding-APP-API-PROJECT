import * as base from "./base"
import * as Sequelize from "sequelize"
import * as User from "./user"

export interface AuthenticationInfoAttributes extends base.BaseModelAttributes {
    provider: string;
    external_id: string;
    reset_token?: string | null;
    password?: string;
    verification_code?: string;
}

export interface AuthenticationInfoInstance extends Sequelize.Instance<AuthenticationInfoAttributes>, AuthenticationInfoAttributes {
    user: User.UserInstance;
    user_id: string;
    getUser: Sequelize.HasOneGetAssociationMixin<User.UserInstance>
    setUser: Sequelize.HasOneSetAssociationMixin<User.UserInstance, string>
}

export let AuthenticationInfo: Sequelize.Model<AuthenticationInfoInstance, AuthenticationInfoAttributes>;

export function define(sequelize: Sequelize.Sequelize): void {
    let definition: Sequelize.DefineAttributes = {
        provider: {
            type: Sequelize.ENUM(["email", "facebook", "twitter", "google"]),
            allowNull: false,
            defaultValue: "email"
        },
        external_id: {
            type: Sequelize.STRING(),
            allowNull: false
        },
        reset_token: {
            type: Sequelize.STRING(),
            allowNull: true
        },
        password: {
            type: Sequelize.STRING(),
            allowNull: true
        },
        verification_code: {
            type: Sequelize.STRING(),
            allowNull: true
        }
    };
    AuthenticationInfo = <Sequelize.Model<AuthenticationInfoInstance, AuthenticationInfoAttributes>>
        sequelize.define('AuthenticationInfo', Object.assign({}, base.defaultColums(), definition) as any, {
            paranoid: true,
            underscored: true,
            indexes: [
                { fields: ['provider', 'external_id'], method: 'HASH', unique: true },
                { fields: ['reset_token'], unique: true }
            ]
        });
    (<any>AuthenticationInfo).prototype.toJSON = function () {
        let values = Object.assign({}, this.get());
        delete values.password;
        return values;
    };
}
