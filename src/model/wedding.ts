import * as base from "./base"
import * as Sequelize from "sequelize"
import { BudgetItemAttributes, BudgetItemInstance } from "./budget_item";
import { WeddingTaskAttributes, WeddingTaskInstance } from "./wedding_task";

export interface WeddingAttributes extends base.BaseModelAttributes {
    wedding_date: Date,
    payment_status?: String,
}

export interface WeddingInstance extends Sequelize.Instance<WeddingAttributes>, WeddingAttributes {
    getBudgetItem: Sequelize.HasManyGetAssociationsMixin<BudgetItemInstance>
    createBudgetItem: Sequelize.HasManyCreateAssociationMixin<BudgetItemAttributes, BudgetItemInstance>,

    createWeddingTask: Sequelize.HasManyCreateAssociationMixin<WeddingTaskAttributes, WeddingTaskInstance>
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
            allowNull: false
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

