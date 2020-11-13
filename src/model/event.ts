import * as base from "./base"
import * as Sequelize from "sequelize"
import { EventParticipantAttributes, EventParticipantInstance } from "./participant";


export interface EventAttributes extends base.BaseModelAttributes {
    title: string;
    location?: string;
    notes?: string;
    date: Date;
    duration: Number;
    color?: string;
}

export interface EventInstance extends Sequelize.Instance<EventAttributes>, EventAttributes {
    wedding_id: string;
    participants: Array<EventParticipantInstance>

    createParticipant: Sequelize.HasManyCreateAssociationMixin<EventParticipantAttributes, EventParticipantInstance>,
    removeParticipant: Sequelize.HasManyRemoveAssociationMixin<EventParticipantInstance, string>
}

export let Event: Sequelize.Model<EventInstance, EventAttributes>;

export function define(sequelize: Sequelize.Sequelize): void {
    let definition: Sequelize.DefineAttributes = {
        title: {
            type: Sequelize.STRING(),
            allowNull: false,
        },
        notes: {
            type: Sequelize.TEXT(),
            allowNull: true,
        },
        location: {
            type: Sequelize.STRING(),
            allowNull: true,
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
    };
    Event = <Sequelize.Model<EventInstance, EventAttributes>>
        sequelize.define('Event', Object.assign({}, base.defaultColums(), definition) as any, {
            paranoid: true,
            underscored: true
        });
    (<any>Event).prototype.toJSON = function () {
        let values = Object.assign({}, this.get());
        return values;
    };
}

