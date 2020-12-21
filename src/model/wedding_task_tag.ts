<<<<<<< HEAD
import * as base from "./base"
import * as Sequelize from "sequelize"

export interface WeddingTaskTagAttributes extends base.BaseModelAttributes {
    name: string
}

export interface WeddingTaskTagInstance extends Sequelize.Instance<WeddingTaskTagAttributes>, WeddingTaskTagAttributes {
}

export let WeddingTaskTag: Sequelize.Model<WeddingTaskTagInstance, WeddingTaskTagAttributes>;

export function define(sequelize: Sequelize.Sequelize): void {
    let definition: Sequelize.DefineAttributes = {
        name: {
            type: Sequelize.STRING(),
            allowNull: false
        }
    };
    WeddingTaskTag = <Sequelize.Model<WeddingTaskTagInstance, WeddingTaskTagAttributes>>
        sequelize.define('WeddingTaskTag', Object.assign({}, base.defaultColums(), definition) as any, {
            paranoid: true,
            underscored: true,

        });
    (<any>WeddingTaskTag).prototype.toJSON = function () {
        let values = Object.assign({}, this.get());
        return values;
    };
}

=======
import * as base from "./base"
import * as Sequelize from "sequelize"

export interface WeddingTaskTagAttributes extends base.BaseModelAttributes {
    name: string
}

export interface WeddingTaskTagInstance extends Sequelize.Instance<WeddingTaskTagAttributes>, WeddingTaskTagAttributes {
}

export let WeddingTaskTag: Sequelize.Model<WeddingTaskTagInstance, WeddingTaskTagAttributes>;

export function define(sequelize: Sequelize.Sequelize): void {
    let definition: Sequelize.DefineAttributes = {
        name: {
            type: Sequelize.STRING(),
            allowNull: false
        }
    };
    WeddingTaskTag = <Sequelize.Model<WeddingTaskTagInstance, WeddingTaskTagAttributes>>
        sequelize.define('WeddingTaskTag', Object.assign({}, base.defaultColums(), definition) as any, {
            paranoid: true,
            underscored: true,

        });
    (<any>WeddingTaskTag).prototype.toJSON = function () {
        let values = Object.assign({}, this.get());
        return values;
    };
}

>>>>>>> c2067604d8d706b34f7e84642e35a212911907c3
