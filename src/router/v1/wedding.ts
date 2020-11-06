import * as express from "express"
import { isAuthorized } from "../middleware/authorization"
import { hasWedding } from "../middleware/userHasWedding"
import { APIRequest, BasicRouter, APIResponse } from "../basicrouter"
import { WeddingAttributes, WeddingTaskTemplate } from "../../model";
import { isDate, isString } from "../middleware/validationrules";

export class WeddingRouter extends BasicRouter {

    constructor() {
        super();
        this.getInternalRouter().post('/wedding', isAuthorized, BasicRouter.requireKeysOfTypes({
            wedding_date: isDate,
            payment_status: isString
        }), WeddingRouter.newWedding);
        this.getInternalRouter().put('/wedding', isAuthorized, hasWedding, BasicRouter.requireKeysOfTypes({
            wedding_date: isDate,
            payment_status: isString
        }), WeddingRouter.updateWedding);

        this.getInternalRouter().get('/wedding', isAuthorized, hasWedding, WeddingRouter.getWedding);
    }

    private static getWedding(req: APIRequest, res: APIResponse, next: express.NextFunction) {
        res.jsonContent(req.currentWedding)
    }

    private static newWedding(req: APIRequest<WeddingAttributes>, res: APIResponse, next: express.NextFunction) {
        req.currentUser!.createWedding({ wedding_date: req.body.wedding_date }).then(wedding => {
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
            return null;
        }).catch(next);
    }

    private static updateWedding(req: APIRequest, res: APIResponse, next: express.NextFunction) {
        req.currentWedding!.update({
            wedding_date: req.body.wedding_date,
        }).then(wedding => {
            res.jsonContent(wedding);
        }).catch(next);
    }
}
