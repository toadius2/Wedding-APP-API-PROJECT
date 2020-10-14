import * as express from "express"
import { isAuthorized } from "../middleware/authorization"
import { hasWedding } from "../middleware/userHasWedding"
import { APIRequest, BasicRouter, APIResponse } from "../basicrouter"
import { WeddingTaskTemplate } from "../../model";

export class WeddingRouter extends BasicRouter {

    constructor() {
        super();
        this.getInternalRouter().post('/wedding', isAuthorized, WeddingRouter.newWedding);
        this.getInternalRouter().put('/wedding', isAuthorized, hasWedding, WeddingRouter.updateWedding);
    }

    private static newWedding(req: APIRequest, res: APIResponse, next: express.NextFunction) {
        let params = req.body;
        req.currentUser!.createWedding(params).then(wedding => {
            WeddingTaskTemplate.all().then(templates => {
                templates.forEach(template => {
                    let obj = {
                        'name': template.name,
                        'completed': false
                    }
                    wedding.createWeddingTask(obj);
                });
            });
            res.status(201).jsonContent(wedding);
        }).catch(next);
    }

    private static updateWedding(req: APIRequest, res: APIResponse, next: express.NextFunction) {
        req.currentWedding!.update({
            wedding_date: req.body.wedding_date,
        }).then((result) => {
            res.jsonContent({ 'message': 'Wedding successfully updated' }); // ToDo: return updated weddding
        }).catch(next);
    }
}
