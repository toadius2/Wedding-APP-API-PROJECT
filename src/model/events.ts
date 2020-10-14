import * as base from "./base"
import * as Sequelize from "sequelize"

export interface EventsAttributes extends base.BaseModelAttributes {
    name: string;
    date: Date;
    // time: Time;
    duration: Number;
    color?:string;
    participants: string;
}

export interface EventsInstance extends Sequelize.Instance<EventsAttributes>, EventsAttributes {
    wedding_id: string;
}

export let Events: Sequelize.Model<EventsInstance, EventsAttributes>;

export function define(sequelize: Sequelize.Sequelize): void {
    let definition: Sequelize.DefineAttributes = {
        name: {
            type: Sequelize.STRING(),
            allowNull: false,
        },
        date: {
            type: Sequelize.DATE(),
            allowNull: false
        },
        duration: {
            type: Sequelize.INTEGER(),
            allowNull: false
        },
        color: {
            type: Sequelize.STRING(),
            allowNull: true
        },
        participants: {
            type: Sequelize.STRING(),
            get: function() {
                return JSON.parse(this.getDataValue('participants'))
            },
            set: function(value) {
                return this.setDataValue('participants', JSON.stringify(value))
            },
            allowNull: false
        }
    };
    Events = <Sequelize.Model<EventsInstance, EventsAttributes>>
        sequelize.define('Events', Object.assign({}, base.defaultColums(), definition) as any, {
            paranoid: true,
            underscored: true
        });
    (<any>Events).prototype.toJSON = function () {
        let values = Object.assign({}, this.get());
        return values;
    };
}

