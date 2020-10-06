import * as base from "./base"
import * as Sequelize from "sequelize"

export interface BudgetItemAttributes extends base.BaseModelAttributes {
    amount?: string;    // Todo: required, remove optional
    name?: string;       // Todo: required, remove optional
    color?: string;
}

export interface BudgetItemInstance extends Sequelize.Instance<BudgetItemAttributes>, BudgetItemAttributes {
    getWedding: () => Promise<any> // Todo: Use correct types
    // Sequelize.HasOneSetAssociationMixin<User.UserInstance, string>
}

export let BudgetItem: Sequelize.Model<BudgetItemInstance, BudgetItemAttributes>;

export function define(sequelize: Sequelize.Sequelize): void {
    let definition: Sequelize.DefineAttributes = {
        amount: {
            type: Sequelize.STRING(),
            allowNull: false
        },
        name: {
            type: Sequelize.STRING(),
            allowNull: true  // Todo: wrong
        },
        color: {
            type: Sequelize.STRING(),
            allowNull: true
        }
    };
    BudgetItem = <Sequelize.Model<BudgetItemInstance, BudgetItemAttributes>>
        sequelize.define('BudgetItem', Object.assign({}, base.defaultColums(), definition) as any, {
            paranoid: true,
            underscored: true
        });
    (<any>BudgetItem).prototype.toJSON = function () {
        let values = Object.assign({}, this.get());
        return values;
    };
}

