import * as express from "express"
import { isAuthorized } from "../middleware/authorization"
import { APIRequest, BasicRouter, APIResponse } from "../basicrouter"
import { ResourceNotFoundError, NoWeddingFoundError } from "../../error";
import { Wedding, WeddingAttributes } from "../../model";

export class WeddingRouter extends BasicRouter {

    constructor() {
        super();
        this.getInternalRouter().post('/wedding', isAuthorized, WeddingRouter.newWedding);
        this.getInternalRouter().put('/wedding/:wedding_id', isAuthorized, WeddingRouter.updateWedding);
    }

    private static newWedding(req: APIRequest, res: APIResponse, next: express.NextFunction) {
        let params: WeddingAttributes = req.body;
        Wedding.findOne({
            where: {
                user_id: req.currentUser!.id
            }
        }).then(wedding => {
            if (wedding == null) {
                  return next(new NoWeddingFoundError());
            } else {
                params = Object.assign({}, params, {
                    wedding_id: wedding!.id
                });
                Wedding.create(params).then(result => {
                    let json = result.toJSON();
                    res.status(201).json(json);
                }).catch(next)
            }
        }).catch(error => {
            console.log(error)
        });
    }

    private static updateWedding(req: APIRequest, res: APIResponse, next: express.NextFunction) {
        const weddingId: number = Number(req.params.wedding_id);
        const weddingDate = req.body.wedding_date;

        Wedding.findOne({
            where: {
                user_id: req.currentUser!.id,
                id: weddingId,
            }
        }).then(wedding => {
            if (wedding == null) {
                  return next(new NoWeddingFoundError());
            } else {
                Wedding.update({
                    wedding_date: weddingDate,
                    updated_at: new Date()
                }, {
                    where: {
                        wedding_id: wedding!.id!
                    },
                    limit: 1
                }).then((result) => {
                    if (!result) {
                        return next(new ResourceNotFoundError(undefined, 'Wedding'));
                    } else {
                        res.status(200).json({ 'message': 'Wedding successfully updated' });
                    }
                }).catch(next);
            }
        }).catch(next);
    }
}
