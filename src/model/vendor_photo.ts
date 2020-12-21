import * as base from './base'
import * as Sequelize from 'sequelize'
import { get } from 'nconf';


export interface VendorPhotoAttributes extends Omit<base.BaseModelAttributes, 'id'> {
    photo_id: string
    photo_url: string
}

export interface VendorPhotoInstance extends Sequelize.Instance<VendorPhotoAttributes>, VendorPhotoAttributes {

}

export let VendorPhoto: Sequelize.Model<VendorPhotoInstance, VendorPhotoAttributes>;

export function define(sequelize: Sequelize.Sequelize): void {
    let definition: Sequelize.DefineModelAttributes<VendorPhotoAttributes> = {
        photo_id: {
            type: Sequelize.CHAR(22),
            allowNull: false,
            primaryKey: true
        },
        photo_url: {
            type: Sequelize.VIRTUAL,
            get: function (this: VendorPhotoInstance) {
                return get('CDN') + '/yelp/' + this.photo_id + '.jpg'
            }
        }
    };
    VendorPhoto = <Sequelize.Model<VendorPhotoInstance, VendorPhotoAttributes>>
        sequelize.define('VendorPhoto', definition, {
            paranoid: true,
            underscored: true
        });
    (<any>VendorPhoto).prototype.toJSON = function () {
        let values = Object.assign({}, this.get());
        return values;
    };
}

