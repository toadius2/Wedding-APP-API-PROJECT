import * as base from "./base"
import * as Sequelize from "sequelize"
import { BudgetItemAttributes, BudgetItemInstance } from "./budget_item";
import { WeddingTaskAttributes, WeddingTaskInstance } from "./wedding_task";
import { EventsAttributes, EventsInstance } from "./events";
import { WeddingTimelineAttributes, WeddingTimelineInstance } from "./wedding_timeline";


export interface WeddingAttributes extends base.BaseModelAttributes {
    wedding_date: Date,
    payment_status?: 'not-paid' | 'paid' | 'pending'
}

export interface WeddingInstance extends Sequelize.Instance<WeddingAttributes>, WeddingAttributes {
    getBudgetItem: Sequelize.HasManyGetAssociationsMixin<BudgetItemInstance>
    createBudgetItem: Sequelize.HasManyCreateAssociationMixin<BudgetItemAttributes, BudgetItemInstance>,

    createEvent: Sequelize.HasManyCreateAssociationMixin<EventsAttributes, EventsInstance>,
    getEvents: Sequelize.HasManyGetAssociationsMixin<EventsInstance>
    removeEvent: Sequelize.HasManyRemoveAssociationMixin<EventsInstance, string>

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
            allowNull: true
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
            underscored: true
        });
    (<any>Wedding).prototype.toJSON = function () {
        let values = Object.assign({}, this.get());
        return values;
    };
}

