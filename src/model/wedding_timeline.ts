import * as base from "./base"
import * as Sequelize from "sequelize"

export interface WeddingTimelineAttributes extends base.BaseModelAttributes {
    name: string;
    date: Date;
    description?: string
}

export interface WeddingTimelineInstance extends Sequelize.Instance<WeddingTimelineAttributes>, WeddingTimelineAttributes {
    wedding_id: String
}

export let WeddingTimeline: Sequelize.Model<WeddingTimelineInstance, WeddingTimelineAttributes>;

export function define(sequelize: Sequelize.Sequelize): void {
    let definition: Sequelize.DefineAttributes = {
        name: {
            type: Sequelize.STRING(),
            allowNull: false,
        },
        description: {
            type: Sequelize.STRING(),
            allowNull: true,
        },
        date: {
            type: Sequelize.DATE(),
            allowNull: false
        }
    };
    WeddingTimeline = <Sequelize.Model<WeddingTimelineInstance, WeddingTimelineAttributes>>
        sequelize.define('WeddingTimeline', Object.assign({}, base.defaultColums(), definition) as any, {
            paranoid: true,
            underscored: true,

        });
    (<any>WeddingTimeline).prototype.toJSON = function () {
        let values = Object.assign({}, this.get());
        return values;
    };
}
