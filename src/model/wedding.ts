<<<<<<< HEAD
import * as base from "./base"
import * as Sequelize from "sequelize"
import { BudgetItemAttributes, BudgetItemInstance } from "./budget_item";
import { WeddingTaskAttributes, WeddingTaskInstance } from "./wedding_task";
import { WeddingTimelineAttributes, WeddingTimelineInstance } from "./wedding_timeline";
import { EventAttributes, EventInstance } from "./event";
import { InvoiceAttributes, InvoiceInstance } from "./invoice";
import { WeddingGuestAttributes, WeddingGuestInstance } from "./wedding_guest";


export interface WeddingAttributes extends base.BaseModelAttributes {
    wedding_date: Date
    name: string
    payment_status?: 'not-paid' | 'paid' | 'pending'
}

export interface WeddingInstance extends Sequelize.Instance<WeddingAttributes>, WeddingAttributes {
    getBudgetItems: Sequelize.HasManyGetAssociationsMixin<BudgetItemInstance>
    createBudgetItem: Sequelize.HasManyCreateAssociationMixin<BudgetItemAttributes, BudgetItemInstance>

    createWeddingGuestGroup: Sequelize.HasManyCreateAssociationMixin<EventAttributes, EventInstance>,
    getWeddingGuestGroups: Sequelize.HasManyGetAssociationsMixin<EventInstance>
    removeWeddingGuestGroup: Sequelize.HasManyRemoveAssociationMixin<EventInstance, string>

    createEvent: Sequelize.HasManyCreateAssociationMixin<EventAttributes, EventInstance>,
    getEvents: Sequelize.HasManyGetAssociationsMixin<EventInstance>
    removeEvent: Sequelize.HasManyRemoveAssociationMixin<EventInstance, string>

    createInvoice: Sequelize.HasManyCreateAssociationMixin<InvoiceAttributes, InvoiceInstance>,
    getInvoices: Sequelize.HasManyGetAssociationsMixin<InvoiceInstance>
    removeInvoice: Sequelize.HasManyRemoveAssociationMixin<InvoiceInstance, string>

    getWeddingTask: Sequelize.HasManyGetAssociationsMixin<WeddingTaskInstance>
    createWeddingTask: Sequelize.HasManyCreateAssociationMixin<WeddingTaskAttributes, WeddingTaskInstance>

    getWeddingGuests: Sequelize.HasManyGetAssociationsMixin<WeddingGuestInstance>
    createWeddingGuest: Sequelize.HasManyCreateAssociationMixin<WeddingGuestAttributes, WeddingGuestInstance>

    getWeddingTimeline: Sequelize.HasManyGetAssociationsMixin<WeddingTimelineInstance>
    createWeddingTimeline: Sequelize.HasManyCreateAssociationMixin<WeddingTimelineAttributes, WeddingTimelineInstance>
}

export let Wedding: Sequelize.Model<WeddingInstance, WeddingAttributes>;

export function define(sequelize: Sequelize.Sequelize): void {
    let definition: Sequelize.DefineAttributes = {
        wedding_date: {
            type: Sequelize.DATE(),
            allowNull: false
        },
        name: {
            type: Sequelize.STRING(),
            allowNull: false
        },
        payment_status: {
            type: Sequelize.ENUM(['not-paid', 'paid', 'pending']),
            allowNull: false,
            defaultValue: 'not-paid'
        },
    };
    Wedding = <Sequelize.Model<WeddingInstance, WeddingAttributes>>
        sequelize.define('Wedding', Object.assign({}, base.defaultColums(), definition) as any, {
            paranoid: true,
            underscored: true,

        });
    (<any>Wedding).prototype.toJSON = function () {
        let values = Object.assign({}, this.get());
        return values;
    };
}

=======
import * as base from "./base"
import * as Sequelize from "sequelize"
import { BudgetItemAttributes, BudgetItemInstance } from "./budget_item";
import { WeddingTaskAttributes, WeddingTaskInstance } from "./wedding_task";
import { WeddingTimelineAttributes, WeddingTimelineInstance } from "./wedding_timeline";
import { EventAttributes, EventInstance } from "./event";
import { InvoiceAttributes, InvoiceInstance } from "./invoice";
import { WeddingGuestAttributes, WeddingGuestInstance } from "./wedding_guest";


export interface WeddingAttributes extends base.BaseModelAttributes {
    wedding_date: Date
    name: string
    payment_status?: 'not-paid' | 'paid' | 'pending'
}

export interface WeddingInstance extends Sequelize.Instance<WeddingAttributes>, WeddingAttributes {
    getBudgetItems: Sequelize.HasManyGetAssociationsMixin<BudgetItemInstance>
    createBudgetItem: Sequelize.HasManyCreateAssociationMixin<BudgetItemAttributes, BudgetItemInstance>

    createWeddingGuestGroup: Sequelize.HasManyCreateAssociationMixin<EventAttributes, EventInstance>,
    getWeddingGuestGroups: Sequelize.HasManyGetAssociationsMixin<EventInstance>
    removeWeddingGuestGroup: Sequelize.HasManyRemoveAssociationMixin<EventInstance, string>

    createEvent: Sequelize.HasManyCreateAssociationMixin<EventAttributes, EventInstance>,
    getEvents: Sequelize.HasManyGetAssociationsMixin<EventInstance>
    removeEvent: Sequelize.HasManyRemoveAssociationMixin<EventInstance, string>

    createInvoice: Sequelize.HasManyCreateAssociationMixin<InvoiceAttributes, InvoiceInstance>,
    getInvoices: Sequelize.HasManyGetAssociationsMixin<InvoiceInstance>
    removeInvoice: Sequelize.HasManyRemoveAssociationMixin<InvoiceInstance, string>

    getWeddingTask: Sequelize.HasManyGetAssociationsMixin<WeddingTaskInstance>
    createWeddingTask: Sequelize.HasManyCreateAssociationMixin<WeddingTaskAttributes, WeddingTaskInstance>

    getWeddingGuests: Sequelize.HasManyGetAssociationsMixin<WeddingGuestInstance>
    createWeddingGuest: Sequelize.HasManyCreateAssociationMixin<WeddingGuestAttributes, WeddingGuestInstance>

    getWeddingTimeline: Sequelize.HasManyGetAssociationsMixin<WeddingTimelineInstance>
    createWeddingTimeline: Sequelize.HasManyCreateAssociationMixin<WeddingTimelineAttributes, WeddingTimelineInstance>
}

export let Wedding: Sequelize.Model<WeddingInstance, WeddingAttributes>;

export function define(sequelize: Sequelize.Sequelize): void {
    let definition: Sequelize.DefineAttributes = {
        wedding_date: {
            type: Sequelize.DATE(),
            allowNull: false
        },
        name: {
            type: Sequelize.STRING(),
            allowNull: false
        },
        payment_status: {
            type: Sequelize.ENUM(['not-paid', 'paid', 'pending']),
            allowNull: false,
            defaultValue: 'not-paid'
        },
    };
    Wedding = <Sequelize.Model<WeddingInstance, WeddingAttributes>>
        sequelize.define('Wedding', Object.assign({}, base.defaultColums(), definition) as any, {
            paranoid: true,
            underscored: true,

        });
    (<any>Wedding).prototype.toJSON = function () {
        let values = Object.assign({}, this.get());
        return values;
    };
}

>>>>>>> c2067604d8d706b34f7e84642e35a212911907c3
