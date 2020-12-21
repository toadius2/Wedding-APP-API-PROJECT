import * as base from "./base"
import * as Sequelize from "sequelize"

export interface WeddingTaskTemplateAttributes extends base.BaseModelAttributes {
    name: string
}

export interface WeddingTaskTemplateInstance extends Sequelize.Instance<WeddingTaskTemplateAttributes>, WeddingTaskTemplateAttributes {

}

export let WeddingTaskTemplate: Sequelize.Model<WeddingTaskTemplateInstance, WeddingTaskTemplateAttributes>;

export function define(sequelize: Sequelize.Sequelize): void {
    let definition: Sequelize.DefineAttributes = {
        name: {
            type: Sequelize.STRING(),
            allowNull: false
        },
    };
    WeddingTaskTemplate = <Sequelize.Model<WeddingTaskTemplateInstance, WeddingTaskTemplateAttributes>>
        sequelize.define('WeddingTaskTemplates', Object.assign({}, base.defaultColums(), definition) as any, {
            paranoid: true,
            underscored: true
        });
    (<any>WeddingTaskTemplate).prototype.toJSON = function () {
        let values = Object.assign({}, this.get());
        return values;
    };
}

