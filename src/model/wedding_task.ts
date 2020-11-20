import * as base from "./base"
import * as Sequelize from "sequelize"

export interface WeddingTaskAttributes extends base.BaseModelAttributes {
    name: string
    completed: boolean
}

export interface WeddingTaskInstance extends Sequelize.Instance<WeddingTaskAttributes>, WeddingTaskAttributes {
    wedding_id: String
}

export let WeddingTask: Sequelize.Model<WeddingTaskInstance, WeddingTaskAttributes>;

export function define(sequelize: Sequelize.Sequelize): void {
    let definition: Sequelize.DefineAttributes = {
        name: {
            type: Sequelize.STRING(),
            allowNull: false
        },
        completed: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false
        }
    };
    WeddingTask = <Sequelize.Model<WeddingTaskInstance, WeddingTaskAttributes>>
        sequelize.define('WeddingTask', Object.assign({}, base.defaultColums(), definition) as any, {
            paranoid: true,
            underscored: true,
            charset: 'utf8',
            collate: 'utf8_unicode_ci'
        });
    (<any>WeddingTask).prototype.toJSON = function () {
        let values = Object.assign({}, this.get());
        return values;
    };
}

