import * as Device from "./device"
import * as AuthenticationInfo from "./authentication_info"
import * as Wedding from "./wedding"
import * as Participants from "./participants"
import * as Events from "./events"
import * as BudgetItem from "./budget_item"
import * as User from "./user"
import * as Sequelize from "sequelize"
import { UserInstance } from "./user";
import * as WeddingTask from "./wedding_task"

export default function setup(s: Sequelize.Sequelize): void {

    // User / Device Data

    User.define(s);
    AuthenticationInfo.define(s);
    Device.define(s);
    Wedding.define(s);
    WeddingTask.define(s);
    BudgetItem.define(s);
    Events.define(s);
    Participants.define(s);

    User.User.hasMany(AuthenticationInfo.AuthenticationInfo, { onDelete: 'CASCADE', as: 'authentication_infos' });
    AuthenticationInfo.AuthenticationInfo.belongsTo(User.User, { as: 'user' });

    User.User.hasOne(Wedding.Wedding, { as: 'User' });
    Wedding.Wedding.belongsTo(User.User);

    Wedding.Wedding.hasMany(BudgetItem.BudgetItem, { as: 'BudgetItems' });
    Wedding.Wedding.hasMany(WeddingTask.WeddingTask, { as: 'WeddingTask' });

    User.User.hasMany(Device.Device, { onDelete: 'CASCADE', as: 'devices' });
    Device.Device.belongsTo(User.User);

    Events.Events.hasMany(Participants.Participants, { as: 'Participants' });
    Participants.Participants.belongsTo(Events.Events, { as: 'participants' });

    Object.keys(s.models).forEach((modelkey) => {
        let model = s.models[modelkey];
        (<any>model).prototype.cachedToJSON = (<any>model).prototype.toJSON;
        (<any>model).prototype.toJSON = function (options: { currentUser?: UserInstance } = {}) {
            if (this._modelOptions.name.singular === 'User' && Boolean(options.currentUser)) {
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
