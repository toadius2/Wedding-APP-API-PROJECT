import * as base from "./base"
import * as Sequelize from "sequelize"

export interface WeddingGuestGroupAttributes extends base.BaseModelAttributes {
    name: string
}

export interface WeddingGuestGroupInstance extends Sequelize.Instance<WeddingGuestGroupAttributes>, WeddingGuestGroupAttributes {
    wedding_id: string
}

export let WeddingGuestGroup: Sequelize.Model<WeddingGuestGroupInstance, WeddingGuestGroupAttributes>;

export function define(sequelize: Sequelize.Sequelize): void {
    let definition: Sequelize.DefineAttributes = {
        name: {
            type: Sequelize.STRING(),
            allowNull: false
        }
    };
    WeddingGuestGroup = <Sequelize.Model<WeddingGuestGroupInstance, WeddingGuestGroupAttributes>>
        sequelize.define('WeddingGuestGroup', Object.assign({}, base.defaultColums(), definition) as any, {
            paranoid: true,
            underscored: true,

        });
    (<any>WeddingGuestGroup).prototype.toJSON = function () {
        let values = Object.assign({}, this.get());
        return values;
    };
}

