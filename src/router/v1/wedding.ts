import * as express from "express"
import { isAuthorized } from "../middleware/authorization"
import { hasWedding } from "../middleware/userHasWedding"
import { APIRequest, BasicRouter, APIResponse } from "../basicrouter"
import { ResourceNotFoundError } from "../../error";
import { Wedding } from "../../model";

export class WeddingRouter extends BasicRouter {

    constructor() {
        super();
        this.getInternalRouter().post('/wedding', isAuthorized, WeddingRouter.newWedding);
        this.getInternalRouter().put('/wedding', isAuthorized, hasWedding, WeddingRouter.updateWedding);
    }

    private static newWedding(req: APIRequest, res: APIResponse, next: express.NextFunction) {
        let params = req.body;
        params = Object.assign(params, {
            user_id: req.currentUser!.id // ToDo: No need, remove
        });
        req.currentUser!.createWedding(params).then(result => {
            res.status(201).jsonContent(result);
        }).catch(next);
    }

    private static updateWedding(req: APIRequest, res: APIResponse, next: express.NextFunction) {
        // ToDo: req.currentWedding.update..
        Wedding.update({
            wedding_date: req.body.wedding_date,
        }, {
            where: {
                id: req.currentWedding!.id!
            },
            limit: 1
        }).then((result) => {
            if (!result) {
                return next(new ResourceNotFoundError(undefined, 'Wedding')); // ToDo: no need cause of hasWeddding middleware
            } else {
                res.jsonContent({ 'message': 'Wedding successfully updated' }); // ToDo: return updated weddding
            }
        }).catch(next);
    }
}
