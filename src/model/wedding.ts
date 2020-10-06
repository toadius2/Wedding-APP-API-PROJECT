import * as base from "./base"
import * as Sequelize from "sequelize"

export interface WeddingAttributes extends base.BaseModelAttributes {
    wedding_date?: Date,
    payment_status?: String,
}

export interface WeddingInstance extends Sequelize.Instance<WeddingAttributes>, WeddingAttributes {
    getWedding: () => Promise<any> // Todo: ?
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
            allowNull: true
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

