import * as express from "express"
import { Op, WhereOptions } from "sequelize";
import { Vendor, VendorAttributes } from "../../model/vendor";
import { VendorPhoto } from "../../model/vendor_photo";
import { gecode } from "../../modules/geocode";
import { APIRequest, BasicRouter, APIResponse } from "../basicrouter"

const SEARCH_DISTAANCE_IN_M = 100 * 1000

export class VendorRouter extends BasicRouter {

    constructor() {
        super();
        this.getInternalRouter().get('/vendors', VendorRouter.getVendors);
    }

    private static async getVendors(req: APIRequest, res: APIResponse, next: express.NextFunction) {
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 20
        const skip = req.query.skip ? parseInt(req.query.skip as string) : 0

        const where: WhereOptions<VendorAttributes> = {
            [Op.and]: []
        }

        if (req.query.address) {
            const location = await gecode(req.query.address as string)
            if (!location) {
                return res.jsonContent([], undefined, { total: 0 })
            } else {
                const latitude = req.sequelize.col('latitude')
                const longitude = req.sequelize.col('longitude')
                const searchPoint = req.sequelize.fn('POINT', longitude, latitude)
                const searchLocation = req.sequelize.literal(`ST_GeomFromText('POINT(${location.lng} ${location.lat})')`);
                const distance = req.sequelize.fn('ST_Distance_Sphere', searchPoint, searchLocation);
                const locationnWhere = req.sequelize.where(distance, ' <= ', SEARCH_DISTAANCE_IN_M)
                where[Op.and].push(locationnWhere)
            }
        }

        if (req.query.name) {
            where.name = {
                [Op.like]: '%' + req.query.name + '%'
            }
        }

        if (req.query.type) {
            const typeSearch = req.sequelize.where(req.sequelize.fn('JSON_SEARCH', req.sequelize.col('categories'), 'one', req.query.type), ' is ', req.sequelize.literal('not null'))
            where[Op.and].push(typeSearch)
        }

        Vendor.findAndCountAll({
            where,
            limit: limit,
            offset: skip,
            subQuery: false,
            include: [{ model: VendorPhoto, required: true }],
        }).then((vendors) => {
            res.jsonContent(vendors.rows, undefined, {
                total: vendors.count
            })
        }).catch(next)
    }


}
