<<<<<<< HEAD
import * as base from "./base"
import * as Sequelize from "sequelize"

export interface InvoiceAttributes extends base.BaseModelAttributes {
    category: string;
    amount?: string;
    paid: boolean;
    invoice_url: string
}

export interface InvoiceInstance extends Sequelize.Instance<InvoiceAttributes>, InvoiceAttributes {
    wedding_id: string;
}

export let Invoice: Sequelize.Model<InvoiceInstance, InvoiceAttributes>;

export function define(sequelize: Sequelize.Sequelize): void {
    let definition: Sequelize.DefineAttributes = {
        category: {
            type: Sequelize.STRING(),
            allowNull: false
        },
        invoice_url: {
            type: Sequelize.STRING(),
            allowNull: false
        },
        paid: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        amount: {
            type: Sequelize.DECIMAL(12, 2),
            allowNull: true
        }
    };
    Invoice = <Sequelize.Model<InvoiceInstance, InvoiceAttributes>>
        sequelize.define('Invoice', Object.assign({}, base.defaultColums(), definition) as any, {
            paranoid: true,
            underscored: true
        });
    (<any>Invoice).prototype.toJSON = function () {
        let values = Object.assign({}, this.get());
        return values;
    };
}

=======
import * as base from "./base"
import * as Sequelize from "sequelize"

export interface InvoiceAttributes extends base.BaseModelAttributes {
    category: string;
    amount?: string;
    paid: boolean;
    invoice_url: string
}

export interface InvoiceInstance extends Sequelize.Instance<InvoiceAttributes>, InvoiceAttributes {
    wedding_id: string;
}

export let Invoice: Sequelize.Model<InvoiceInstance, InvoiceAttributes>;

export function define(sequelize: Sequelize.Sequelize): void {
    let definition: Sequelize.DefineAttributes = {
        category: {
            type: Sequelize.STRING(),
            allowNull: false
        },
        invoice_url: {
            type: Sequelize.STRING(),
            allowNull: false
        },
        paid: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        amount: {
            type: Sequelize.DECIMAL(12, 2),
            allowNull: true
        }
    };
    Invoice = <Sequelize.Model<InvoiceInstance, InvoiceAttributes>>
        sequelize.define('Invoice', Object.assign({}, base.defaultColums(), definition) as any, {
            paranoid: true,
            underscored: true
        });
    (<any>Invoice).prototype.toJSON = function () {
        let values = Object.assign({}, this.get());
        return values;
    };
}

>>>>>>> c2067604d8d706b34f7e84642e35a212911907c3
