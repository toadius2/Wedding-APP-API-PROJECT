import * as base from "./base"
import * as Sequelize from "sequelize"

export interface ParticipantsAttributes extends base.BaseModelAttributes {
    email: string;
    status: string;
}

export interface ParticipantsInstance extends Sequelize.Instance<ParticipantsAttributes>, ParticipantsAttributes {

}

export let Participants: Sequelize.Model<ParticipantsInstance, ParticipantsAttributes>;

export function define(sequelize: Sequelize.Sequelize): void {
    let definition: Sequelize.DefineAttributes = {
        email: {
            type: Sequelize.STRING(),
            allowNull: false
        },
        status: {
            type: Sequelize.ENUM(['accepted','declined','maybe','pending']),
            allowNull: false,
        }
    };
    Participants = <Sequelize.Model<ParticipantsInstance, ParticipantsAttributes>>
        sequelize.define('Participants', Object.assign({}, base.defaultColums(), definition) as any, {
            paranoid: true,
            underscored: true
        });
    (<any>Participants).prototype.toJSON = function () {
        let values = Object.assign({}, this.get());
        return values;
    };
}

