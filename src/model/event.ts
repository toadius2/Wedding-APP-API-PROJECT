import * as base from "./base"
import * as Sequelize from "sequelize"
import { EventParticipantAttributes, EventParticipantInstance } from "./participant";
import * as moment from 'moment'

export interface EventAttributes extends base.BaseModelAttributes {
    title: string;
    location?: string;
    notes?: string;
    date: Date;
    duration: number;
    color?: string;
}

export interface EventInstance extends Sequelize.Instance<EventAttributes>, EventAttributes {
    readonly end_date: Date
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
        end_date: {
            type: Sequelize.VIRTUAL,
            get: function (this: EventInstance) {
                return moment(this.date).add(this.duration, 'minutes')
            }
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

