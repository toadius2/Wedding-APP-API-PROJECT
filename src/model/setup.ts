<<<<<<< HEAD
import * as fs from 'fs'
import { join } from 'path'

import * as Device from "./device"
import * as AuthenticationInfo from "./authentication_info"
import * as Wedding from "./wedding"
import * as Participants from "./participant"
import * as Event from "./event"
import * as BudgetItem from "./budget_item"
import * as User from "./user"
import * as Sequelize from "sequelize"
import { UserInstance } from "./user";
import * as WeddingTask from "./wedding_task"
import * as WeddingTaskTemplate from "./wedding_task_template"
import * as WeddingTimeline from "./wedding_timeline"
import * as WeddingTaskTag from "./wedding_task_tag"
import * as Vendor from "./vendor"
import * as VendorPhoto from './vendor_photo'
import * as Invoice from './invoice'
import * as WeddingGuest from './wedding_guest'
import * as WeddingGuestGroup from './wedding_guest_group'

export default function setup(s: Sequelize.Sequelize): void {

    // User / Device Data

    User.define(s);
    AuthenticationInfo.define(s);
    Device.define(s);
    Wedding.define(s);
    WeddingTask.define(s);
    BudgetItem.define(s);
    Event.define(s);
    Participants.define(s);
    WeddingTaskTemplate.define(s);
    WeddingTimeline.define(s);
    WeddingTaskTag.define(s);
    WeddingGuest.define(s);
    WeddingGuestGroup.define(s);

    Invoice.define(s);

    Vendor.define(s);
    VendorPhoto.define(s);


    Vendor.Vendor.hasMany(VendorPhoto.VendorPhoto, { foreignKey: 'business_id' })

    User.User.hasMany(AuthenticationInfo.AuthenticationInfo, { onDelete: 'CASCADE', as: 'authentication_infos' });
    AuthenticationInfo.AuthenticationInfo.belongsTo(User.User, { as: 'user' });

    User.User.hasOne(Wedding.Wedding);
    Wedding.Wedding.belongsTo(User.User);

    Wedding.Wedding.hasMany(Invoice.Invoice);
    Wedding.Wedding.hasMany(BudgetItem.BudgetItem, { as: 'BudgetItems' });
    Wedding.Wedding.hasMany(WeddingTask.WeddingTask, { as: 'WeddingTask' });
    Wedding.Wedding.hasMany(Event.Event, { as: 'Events' });
    Wedding.Wedding.hasMany(WeddingTimeline.WeddingTimeline, { as: 'WeddingTimeline' });
    Wedding.Wedding.hasMany(WeddingGuest.WeddingGuest);
    Wedding.Wedding.hasMany(WeddingGuestGroup.WeddingGuestGroup);

    WeddingGuest.WeddingGuest.belongsTo(Wedding.Wedding);
    WeddingGuest.WeddingGuest.belongsToMany(WeddingGuest.WeddingGuest, { as: 'related', through: 'WeddingGuestRelatedAssociation' });
    WeddingGuest.WeddingGuest.belongsTo(WeddingGuestGroup.WeddingGuestGroup, { as: 'group' });

    WeddingGuestGroup.WeddingGuestGroup.belongsTo(Wedding.Wedding)

    WeddingTask.WeddingTask.belongsToMany(WeddingTaskTag.WeddingTaskTag, { through: 'WeddingTaskTagAssociation', as: { singular: 'tag', plural: 'tags' } })

    User.User.hasMany(Device.Device, { onDelete: 'CASCADE', as: 'devices' });
    Device.Device.belongsTo(User.User);

    Event.Event.hasMany(Participants.EventParticipant, { onDelete: 'CASCADE', as: 'participants' });
    Participants.EventParticipant.belongsTo(Event.Event);

    Vendor.Vendor.addScope('defaultScope', {
        include: [{
            model: VendorPhoto.VendorPhoto,
        }]
    }, { override: true });

    Event.Event.addScope('defaultScope', {
        include: [{
            model: Participants.EventParticipant,
            as: 'participants'
        }]
    }, { override: true });

    WeddingTask.WeddingTask.addScope('defaultScope', {
        include: [{
            model: WeddingTaskTag.WeddingTaskTag,
            as: 'tags'
        }]
    }, { override: true });

    WeddingGuest.WeddingGuest.addScope('defaultScope', {
        include: [{
            model: WeddingGuest.WeddingGuest.unscoped(),
            as: 'related'
        }, {
            model: WeddingGuestGroup.WeddingGuestGroup,
            as: 'group'
        }]
    }, { override: true });

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

    fs.readdirSync(join(__dirname, 'methods')).filter(m => m.endsWith('.js')).forEach((model) => {
        try {
            const Model = s.model(Object.keys(s.models).find(m => {
                return m.toLowerCase() == model.replace('.js', '').replace(/_/gi, '').toLowerCase()
            })!)
            if (Model) {
                Object.assign((Model as any).prototype, require(join(__dirname, 'methods', model)))
            }
        } catch (error) {
            console.error(error)
        }

    })

}
=======
import * as fs from 'fs'
import { join } from 'path'

import * as Device from "./device"
import * as AuthenticationInfo from "./authentication_info"
import * as Wedding from "./wedding"
import * as Participants from "./participant"
import * as Event from "./event"
import * as BudgetItem from "./budget_item"
import * as User from "./user"
import * as Sequelize from "sequelize"
import { UserInstance } from "./user";
import * as WeddingTask from "./wedding_task"
import * as WeddingTaskTemplate from "./wedding_task_template"
import * as WeddingTimeline from "./wedding_timeline"
import * as WeddingTaskTag from "./wedding_task_tag"
import * as Vendor from "./vendor"
import * as VendorPhoto from './vendor_photo'
import * as Invoice from './invoice'
import * as WeddingGuest from './wedding_guest'
import * as WeddingGuestGroup from './wedding_guest_group'

export default function setup(s: Sequelize.Sequelize): void {

    // User / Device Data

    User.define(s);
    AuthenticationInfo.define(s);
    Device.define(s);
    Wedding.define(s);
    WeddingTask.define(s);
    BudgetItem.define(s);
    Event.define(s);
    Participants.define(s);
    WeddingTaskTemplate.define(s);
    WeddingTimeline.define(s);
    WeddingTaskTag.define(s);
    WeddingGuest.define(s);
    WeddingGuestGroup.define(s);

    Invoice.define(s);

    Vendor.define(s);
    VendorPhoto.define(s);


    Vendor.Vendor.hasMany(VendorPhoto.VendorPhoto, { foreignKey: 'business_id' })

    User.User.hasMany(AuthenticationInfo.AuthenticationInfo, { onDelete: 'CASCADE', as: 'authentication_infos' });
    AuthenticationInfo.AuthenticationInfo.belongsTo(User.User, { as: 'user' });

    User.User.hasOne(Wedding.Wedding);
    Wedding.Wedding.belongsTo(User.User);

    Wedding.Wedding.hasMany(Invoice.Invoice);
    Wedding.Wedding.hasMany(BudgetItem.BudgetItem, { as: 'BudgetItems' });
    Wedding.Wedding.hasMany(WeddingTask.WeddingTask, { as: 'WeddingTask' });
    Wedding.Wedding.hasMany(Event.Event, { as: 'Events' });
    Wedding.Wedding.hasMany(WeddingTimeline.WeddingTimeline, { as: 'WeddingTimeline' });
    Wedding.Wedding.hasMany(WeddingGuest.WeddingGuest);
    Wedding.Wedding.hasMany(WeddingGuestGroup.WeddingGuestGroup);

    WeddingGuest.WeddingGuest.belongsTo(Wedding.Wedding);
    WeddingGuest.WeddingGuest.belongsToMany(WeddingGuest.WeddingGuest, { as: 'related', through: 'WeddingGuestRelatedAssociation' });
    WeddingGuest.WeddingGuest.belongsTo(WeddingGuestGroup.WeddingGuestGroup, { as: 'group' });

    WeddingGuestGroup.WeddingGuestGroup.belongsTo(Wedding.Wedding)

    WeddingTask.WeddingTask.belongsToMany(WeddingTaskTag.WeddingTaskTag, { through: 'WeddingTaskTagAssociation', as: { singular: 'tag', plural: 'tags' } })

    User.User.hasMany(Device.Device, { onDelete: 'CASCADE', as: 'devices' });
    Device.Device.belongsTo(User.User);

    Event.Event.hasMany(Participants.EventParticipant, { onDelete: 'CASCADE', as: 'participants' });
    Participants.EventParticipant.belongsTo(Event.Event);

    Vendor.Vendor.addScope('defaultScope', {
        include: [{
            model: VendorPhoto.VendorPhoto,
        }]
    }, { override: true });

    Event.Event.addScope('defaultScope', {
        include: [{
            model: Participants.EventParticipant,
            as: 'participants'
        }]
    }, { override: true });

    WeddingTask.WeddingTask.addScope('defaultScope', {
        include: [{
            model: WeddingTaskTag.WeddingTaskTag,
            as: 'tags'
        }]
    }, { override: true });

    WeddingGuest.WeddingGuest.addScope('defaultScope', {
        include: [{
            model: WeddingGuest.WeddingGuest.unscoped(),
            as: 'related'
        }, {
            model: WeddingGuestGroup.WeddingGuestGroup,
            as: 'group'
        }]
    }, { override: true });

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

    fs.readdirSync(join(__dirname, 'methods')).filter(m => m.endsWith('.js')).forEach((model) => {
        try {
            const Model = s.model(Object.keys(s.models).find(m => {
                return m.toLowerCase() == model.replace('.js', '').replace(/_/gi, '').toLowerCase()
            })!)
            if (Model) {
                Object.assign((Model as any).prototype, require(join(__dirname, 'methods', model)))
            }
        } catch (error) {
            console.error(error)
        }

    })

}
>>>>>>> c2067604d8d706b34f7e84642e35a212911907c3
