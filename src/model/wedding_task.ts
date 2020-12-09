import * as base from "./base"
import * as Sequelize from "sequelize"
import { WeddingTaskTagInstance } from "./wedding_task_tag";

export interface WeddingTaskAttributes extends base.BaseModelAttributes {
    name: string
    detail?: string
    date: Date
    completed: boolean
}

export interface WeddingTaskInstance extends Sequelize.Instance<WeddingTaskAttributes>, WeddingTaskAttributes {
    wedding_id: string
    tags: WeddingTaskTagInstance[]

    setTags: Sequelize.BelongsToManySetAssociationsMixin<WeddingTaskTagInstance, string, {}>
}

export let WeddingTask: Sequelize.Model<WeddingTaskInstance, WeddingTaskAttributes>;

export function define(sequelize: Sequelize.Sequelize): void {
    let definition: Sequelize.DefineAttributes = {
        name: {
            type: Sequelize.STRING(),
            allowNull: false
        },
        detail: {
            type: Sequelize.TEXT(),
            allowNull: true
        },
        date: {
            type: Sequelize.DATE(),
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

        });
    (<any>WeddingTask).prototype.toJSON = function () {
        let values = Object.assign({}, this.get());
        return values;
    };
}

