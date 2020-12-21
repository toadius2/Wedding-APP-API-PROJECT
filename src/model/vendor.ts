import * as base from './base'
import * as Sequelize from 'sequelize'

interface VendorBusinessAttributes {

}

interface VendorBusinessHours {
    Monday: string; //10:00-21:00,
    Tuesday: string;
    Friday: string;
    Wednesday: string;
    Thursday: string;
    Sunday: string;
    Saturday: string;
}

export interface VendorAttributes extends Omit<base.BaseModelAttributes, 'id'> {
    business_id: string;

    name: string;
    website?: string;

    address: string;
    city: string;
    state: string;
    postal_code: string;
    latitude: number;
    longitude: number;

    stars: number
    review_count: number

    business_attributes?: VendorBusinessAttributes
    categories: string[]
    hours?: Partial<VendorBusinessHours>
}

export interface VendorInstance extends Sequelize.Instance<VendorAttributes>, VendorAttributes {
}

export let Vendor: Sequelize.Model<VendorInstance, VendorAttributes>;

export function define(sequelize: Sequelize.Sequelize): void {
    let definition: Sequelize.DefineModelAttributes<VendorAttributes> = {
        business_id: {
            type: Sequelize.CHAR(22),
            allowNull: false,
            unique: true,
            primaryKey: true
        },
        name: {
            type: Sequelize.STRING(),
            allowNull: false,
        },
        website: {
            type: Sequelize.STRING(),
            allowNull: true
        },
        address: {
            type: Sequelize.STRING(),
            allowNull: false
        },
        city: {
            type: Sequelize.STRING(),
            allowNull: false
        },
        state: {
            type: Sequelize.STRING(),
            allowNull: false
        },
        postal_code: {
            type: Sequelize.STRING(),
            allowNull: false
        },
        latitude: {
            type: Sequelize.DECIMAL(14, 8),
            allowNull: false
        },
        longitude: {
            type: Sequelize.DECIMAL(14, 8),
            allowNull: false
        },
        stars: {
            type: Sequelize.DECIMAL(4, 2),
            allowNull: false,
            defaultValue: 0
        },
        review_count: {
            type: Sequelize.INTEGER(),
            allowNull: false,
            defaultValue: 0
        },
        business_attributes: {
            type: Sequelize.JSON,
            allowNull: true
        },
        categories: {
            type: Sequelize.JSON,
            allowNull: false,
            defaultValue: '[]'
        },
        hours: {
            type: Sequelize.JSON,
            allowNull: true
        }
    };
    Vendor = <Sequelize.Model<VendorInstance, VendorAttributes>>
        sequelize.define('Vendor', definition, {
            paranoid: true,
            underscored: true
        });
    (<any>Vendor).prototype.toJSON = function () {
        let values = Object.assign({}, this.get());
        return values;
    };
}

