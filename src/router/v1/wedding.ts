<<<<<<< HEAD
import * as express from "express"
import { isAuthorized } from "../middleware/authorization"
import { hasWedding } from "../middleware/userHasWedding"
import { APIRequest, BasicRouter, APIResponse } from "../basicrouter"
import { WeddingAttributes } from "../../model";
import { isDate, isString } from "../middleware/validationrules";

export class WeddingRouter extends BasicRouter {

    constructor() {
        super();
        this.getInternalRouter().post('/wedding', isAuthorized, BasicRouter.requireKeysOfTypes({
            wedding_date: isDate,
            name: isString
        }), WeddingRouter.newWedding);
        this.getInternalRouter().put('/wedding', isAuthorized, hasWedding, BasicRouter.requireKeysOfTypes({
            wedding_date: isDate,
            name: isString
        }), WeddingRouter.updateWedding);

        this.getInternalRouter().get('/wedding', isAuthorized, hasWedding, WeddingRouter.getWedding);
    }

    private static getWedding(req: APIRequest, res: APIResponse, next: express.NextFunction) {
        res.jsonContent(req.currentWedding)
    }

    private static async newWedding(req: APIRequest<WeddingAttributes>, res: APIResponse, next: express.NextFunction) {
        const existing = await req.currentUser!.getWedding()
        if (existing) {
            const wedding = await existing.update({ wedding_date: req.body.wedding_date, name: req.body.name })
            res.jsonContent(wedding);
            return
        }
        req.currentUser!.createWedding({ wedding_date: req.body.wedding_date, name: req.body.name }).then(wedding => {
            res.status(201).jsonContent(wedding);
            return null;
        }).catch(next);
    }

    private static updateWedding(req: APIRequest<WeddingAttributes>, res: APIResponse, next: express.NextFunction) {
        req.currentWedding!.update({
            wedding_date: req.body.wedding_date,
            name: req.body.name
        }).then(wedding => {
            res.jsonContent(wedding);
        }).catch(next);
    }
}
=======
import * as express from "express"
import { isAuthorized } from "../middleware/authorization"
import { hasWedding } from "../middleware/userHasWedding"
import { APIRequest, BasicRouter, APIResponse } from "../basicrouter"
import { WeddingAttributes } from "../../model";
import { isDate, isString } from "../middleware/validationrules";

export class WeddingRouter extends BasicRouter {

    constructor() {
        super();
        this.getInternalRouter().post('/wedding', isAuthorized, BasicRouter.requireKeysOfTypes({
            wedding_date: isDate,
            name: isString
        }), WeddingRouter.newWedding);
        this.getInternalRouter().put('/wedding', isAuthorized, hasWedding, BasicRouter.requireKeysOfTypes({
            wedding_date: isDate,
            name: isString
        }), WeddingRouter.updateWedding);

        this.getInternalRouter().get('/wedding', isAuthorized, hasWedding, WeddingRouter.getWedding);
    }

    private static getWedding(req: APIRequest, res: APIResponse, next: express.NextFunction) {
        res.jsonContent(req.currentWedding)
    }

    private static async newWedding(req: APIRequest<WeddingAttributes>, res: APIResponse, next: express.NextFunction) {
        const existing = await req.currentUser!.getWedding()
        if (existing) {
            const wedding = await existing.update({ wedding_date: req.body.wedding_date, name: req.body.name })
            res.jsonContent(wedding);
            return
        }
        req.currentUser!.createWedding({ wedding_date: req.body.wedding_date, name: req.body.name }).then(wedding => {
            res.status(201).jsonContent(wedding);
            return null;
        }).catch(next);
    }

    private static updateWedding(req: APIRequest<WeddingAttributes>, res: APIResponse, next: express.NextFunction) {
        req.currentWedding!.update({
            wedding_date: req.body.wedding_date,
            name: req.body.name
        }).then(wedding => {
            res.jsonContent(wedding);
        }).catch(next);
    }
}
>>>>>>> c2067604d8d706b34f7e84642e35a212911907c3
