<<<<<<< HEAD
import * as base from "./base"
import * as Sequelize from "sequelize"

export interface EventParticipantAttributes extends base.BaseModelAttributes {
    email: string;
    status: string;
}

export interface EventParticipantInstance extends Sequelize.Instance<EventParticipantAttributes>, EventParticipantAttributes {

}

export let EventParticipant: Sequelize.Model<EventParticipantInstance, EventParticipantAttributes>;

export function define(sequelize: Sequelize.Sequelize): void {
    let definition: Sequelize.DefineAttributes = {
        email: {
            type: Sequelize.STRING(),
            allowNull: false
        },
        status: {
            type: Sequelize.ENUM(['accepted', 'declined', 'maybe', 'pending']),
            allowNull: false,
            defaultValue: 'pending'
        }
    };
    EventParticipant = <Sequelize.Model<EventParticipantInstance, EventParticipantAttributes>>
        sequelize.define('EventParticipant', Object.assign({}, base.defaultColums(), definition) as any, {
            paranoid: true,
            underscored: true
        });
    (<any>EventParticipant).prototype.toJSON = function () {
        let values = Object.assign({}, this.get());
        return values;
    };
}

=======
import * as base from "./base"
import * as Sequelize from "sequelize"

export interface EventParticipantAttributes extends base.BaseModelAttributes {
    email: string;
    status: string;
}

export interface EventParticipantInstance extends Sequelize.Instance<EventParticipantAttributes>, EventParticipantAttributes {

}

export let EventParticipant: Sequelize.Model<EventParticipantInstance, EventParticipantAttributes>;

export function define(sequelize: Sequelize.Sequelize): void {
    let definition: Sequelize.DefineAttributes = {
        email: {
            type: Sequelize.STRING(),
            allowNull: false
        },
        status: {
            type: Sequelize.ENUM(['accepted', 'declined', 'maybe', 'pending']),
            allowNull: false,
            defaultValue: 'pending'
        }
    };
    EventParticipant = <Sequelize.Model<EventParticipantInstance, EventParticipantAttributes>>
        sequelize.define('EventParticipant', Object.assign({}, base.defaultColums(), definition) as any, {
            paranoid: true,
            underscored: true
        });
    (<any>EventParticipant).prototype.toJSON = function () {
        let values = Object.assign({}, this.get());
        return values;
    };
}

>>>>>>> c2067604d8d706b34f7e84642e35a212911907c3
