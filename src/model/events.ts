import * as base from "./base"
import * as Sequelize from "sequelize"
import { ParticipantsAttributes, ParticipantsInstance } from "./participants";


export interface EventsAttributes extends base.BaseModelAttributes {
    name: string;
    date: Date;
    duration: Number;
    color?:string;
}

export interface EventsBody extends EventsAttributes {
    participants: Array<ParticipantsAttributes>
}

export interface EventsInstance extends Sequelize.Instance<EventsBody>, EventsBody {
    wedding_id: string;

    createParticipants: Sequelize.HasManyCreateAssociationMixin<ParticipantsAttributes, ParticipantsInstance>,
    removeParticipants: Sequelize.HasManyRemoveAssociationMixin<ParticipantsAttributes, string>
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

