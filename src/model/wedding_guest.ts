import * as base from "./base"
import * as Sequelize from "sequelize"
import uuid = require("uuid");
import { WeddingInstance } from "./wedding";

export interface WeddingGuestAttributes extends base.BaseModelAttributes {
    first_name: string
    last_name: string
    has_plus_one: boolean

    attending_group: string[]

    age_group?: string;
    group?: string;
    email?: string;
    phone?: string;
    status?: 'accepted' | 'declined' | 'maybe' | 'pending';

    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;

    rsvp_token: string;
}

export interface WeddingGuestInstance extends Sequelize.Instance<WeddingGuestAttributes>, WeddingGuestAttributes {
    wedding_id: string
    related?: WeddingGuestInstance

    setRelated: Sequelize.HasOneSetAssociationMixin<WeddingGuestInstance, string>
    getWedding: Sequelize.BelongsToGetAssociationMixin<WeddingInstance>
    sendInvitationEmail(): Promise<void>
}

export let WeddingGuest: Sequelize.Model<WeddingGuestInstance, WeddingGuestAttributes>;

export function define(sequelize: Sequelize.Sequelize): void {
    let definition: Sequelize.DefineModelAttributes<WeddingGuestAttributes> = {
        first_name: {
            type: Sequelize.STRING(),
            allowNull: false
        },
        last_name: {
            type: Sequelize.STRING(),
            allowNull: false
        },
        has_plus_one: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        attending_group: {
            type: Sequelize.JSON,
            allowNull: false
        },
        age_group: {
            type: Sequelize.STRING(),
            allowNull: true
        },
        group: {
            type: Sequelize.STRING(),
            allowNull: true
        },
        email: {
            type: Sequelize.STRING(),
            allowNull: true
        },
        address: {
            type: Sequelize.STRING(),
            allowNull: true
        },
        city: {
            type: Sequelize.STRING(),
            allowNull: true
        },
        state: {
            type: Sequelize.STRING(),
            allowNull: true
        },
        zip_code: {
            type: Sequelize.STRING(),
            allowNull: true
        },
        status: {
            type: Sequelize.ENUM(['accepted', 'declined', 'maybe', 'pending']),
            allowNull: false,
            defaultValue: 'pending'
        },
        rsvp_token: {
            type: Sequelize.STRING(),
            allowNull: false,
            defaultValue: uuid.v4
        }
    };
    WeddingGuest = <Sequelize.Model<WeddingGuestInstance, WeddingGuestAttributes>>
        sequelize.define('WeddingGuest', Object.assign({}, base.defaultColums(), definition) as any, {
            paranoid: true,
            underscored: true
        });
    (<any>WeddingGuest).prototype.toJSON = function () {
        let values = Object.assign({}, this.get());
        delete values.rsvp_token
        return values;
    };
}

