<<<<<<< HEAD
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
            paranoid: false,
            underscored: true,
            indexes: [{ name: 'name_uq', fields: ['name', 'wedding_id'], unique: true }]
        });
    (<any>WeddingGuestGroup).prototype.toJSON = function () {
        let values = Object.assign({}, this.get());
        return values;
    };
}

=======
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
            paranoid: false,
            underscored: true,
            indexes: [{ name: 'name_uq', fields: ['name', 'wedding_id'], unique: true }]
        });
    (<any>WeddingGuestGroup).prototype.toJSON = function () {
        let values = Object.assign({}, this.get());
        return values;
    };
}

>>>>>>> c2067604d8d706b34f7e84642e35a212911907c3
