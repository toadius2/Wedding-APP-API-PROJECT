import * as base from "./base"
import * as Sequelize from "sequelize"
import { BudgetItemAttributes, BudgetItemInstance } from "./budget_item";
import { WeddingTaskAttributes, WeddingTaskInstance } from "./wedding_task";
import { WeddingTimelineAttributes, WeddingTimelineInstance } from "./wedding_timeline";
import { EventAttributes, EventInstance } from "./event";


export interface WeddingAttributes extends base.BaseModelAttributes {
    wedding_date: Date
    name: string
    payment_status?: 'not-paid' | 'paid' | 'pending'
}

export interface WeddingInstance extends Sequelize.Instance<WeddingAttributes>, WeddingAttributes {
    getBudgetItems: Sequelize.HasManyGetAssociationsMixin<BudgetItemInstance>
    createBudgetItem: Sequelize.HasManyCreateAssociationMixin<BudgetItemAttributes, BudgetItemInstance>,

    createEvent: Sequelize.HasManyCreateAssociationMixin<EventAttributes, EventInstance>,
    getEvents: Sequelize.HasManyGetAssociationsMixin<EventInstance>
    removeEvent: Sequelize.HasManyRemoveAssociationMixin<EventInstance, string>

    getWeddingTask: Sequelize.HasManyGetAssociationsMixin<WeddingTaskInstance>
    createWeddingTask: Sequelize.HasManyCreateAssociationMixin<WeddingTaskAttributes, WeddingTaskInstance>

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
            charset: 'utf8',
            collate: 'utf8_unicode_ci'
        });
    (<any>Wedding).prototype.toJSON = function () {
        let values = Object.assign({}, this.get());
        return values;
    };
}

