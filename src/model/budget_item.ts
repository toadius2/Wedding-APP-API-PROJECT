<<<<<<< HEAD
import * as base from "./base"
import * as Sequelize from "sequelize"

export interface BudgetItemAttributes extends base.BaseModelAttributes {
    amount: number;
    name: string;
    color?: string;
}

export interface BudgetItemInstance extends Sequelize.Instance<BudgetItemAttributes>, BudgetItemAttributes {
    wedding_id: String
}

export let BudgetItem: Sequelize.Model<BudgetItemInstance, BudgetItemAttributes>;

export function define(sequelize: Sequelize.Sequelize): void {
    let definition: Sequelize.DefineAttributes = {
        amount: {
            type: Sequelize.NUMERIC(),
            allowNull: false
        },
        name: {
            type: Sequelize.STRING(),
            allowNull: false,
        },
        color: {
            type: Sequelize.STRING(),
            allowNull: true
        }
    };
    BudgetItem = <Sequelize.Model<BudgetItemInstance, BudgetItemAttributes>>
        sequelize.define('BudgetItem', Object.assign({}, base.defaultColums(), definition) as any, {
            paranoid: true,
            underscored: true,

        });
    (<any>BudgetItem).prototype.toJSON = function () {
        let values = Object.assign({}, this.get());
        return values;
    };
}

=======
import * as base from "./base"
import * as Sequelize from "sequelize"

export interface BudgetItemAttributes extends base.BaseModelAttributes {
    amount: number;
    name: string;
    color?: string;
}

export interface BudgetItemInstance extends Sequelize.Instance<BudgetItemAttributes>, BudgetItemAttributes {
    wedding_id: String
}

export let BudgetItem: Sequelize.Model<BudgetItemInstance, BudgetItemAttributes>;

export function define(sequelize: Sequelize.Sequelize): void {
    let definition: Sequelize.DefineAttributes = {
        amount: {
            type: Sequelize.NUMERIC(),
            allowNull: false
        },
        name: {
            type: Sequelize.STRING(),
            allowNull: false,
        },
        color: {
            type: Sequelize.STRING(),
            allowNull: true
        }
    };
    BudgetItem = <Sequelize.Model<BudgetItemInstance, BudgetItemAttributes>>
        sequelize.define('BudgetItem', Object.assign({}, base.defaultColums(), definition) as any, {
            paranoid: true,
            underscored: true,

        });
    (<any>BudgetItem).prototype.toJSON = function () {
        let values = Object.assign({}, this.get());
        return values;
    };
}

>>>>>>> c2067604d8d706b34f7e84642e35a212911907c3
