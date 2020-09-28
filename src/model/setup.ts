import * as Device from "./device"
import * as AuthenticationInfo from "./authentication_info"
import * as User from "./user"
import * as Sequelize from "sequelize"
import { UserInstance } from "./user";

export default function setup(s: Sequelize.Sequelize): void {

    // User / Device Data

    User.define(s);
    AuthenticationInfo.define(s);
    Device.define(s);

    User.User.hasMany(AuthenticationInfo.AuthenticationInfo, { onDelete: 'CASCADE', as: 'authentication_infos' });
    AuthenticationInfo.AuthenticationInfo.belongsTo(User.User, { as: 'user' });

    User.User.hasMany(Device.Device, { onDelete: 'CASCADE', as: 'devices' });
    Device.Device.belongsTo(User.User);

    Object.keys(s.models).forEach((modelkey) => {
        let model = s.models[modelkey];
        (<any>model).prototype.cachedToJSON = (<any>model).prototype.toJSON;
        (<any>model).prototype.toJSON = function (options: { currentUser?: UserInstance} = {}) {
            if(this._modelOptions.name.singular === 'User' && Boolean(options.currentUser)) {
                return this.cachedToJSON(options);
            }
            let returning = this.cachedToJSON(options);
            Object.keys(this.dataValues).forEach(key => {
                if (this.dataValues[key] && this.dataValues[key].Model
                    && this.dataValues[key].toJSON) {
                    returning[key] = this.dataValues[key].toJSON(options);
                }
            });
            return returning;
        };
    })

}
