import * as express from "express"
import { isAuthorized } from "../middleware/authorization"
import { hasWedding } from "../middleware/userHasWedding";
import { APIRequest, BasicRouter, APIResponse } from "../basicrouter"
import { WeddingTask, WeddingTaskAttributes, WeddingTaskInstance } from "../../model";
import { ModelRouteRequest } from "../basicrouter";
import { NotAccessibleError } from "../../error";

export class WeddingTaskRouter extends BasicRouter {

    constructor() {
        super();
        this.getInternalRouter().get('/wedding-task', isAuthorized, hasWedding, WeddingTaskRouter.getWeddingTask);
        this.getInternalRouter().post('/wedding-task', isAuthorized, hasWedding, WeddingTaskRouter.newWeddingTask);
        this.getInternalRouter().put('/wedding-task/:wedding_task_id', isAuthorized, hasWedding, BasicRouter.populateModel(WeddingTask, 'wedding_task_id'), WeddingTaskRouter.updateWeddingTask);
        this.getInternalRouter().delete('/wedding-task', isAuthorized, hasWedding, BasicRouter.populateModel(WeddingTask, 'wedding_task_id'), WeddingTaskRouter.deleteWeddingTask);
    }

    private static getWeddingTask(req: APIRequest, res: APIResponse, next: express.NextFunction) {
        req.currentWedding!.getWeddingTask().then(result => {
            res.jsonContent(result);
        }).catch(next);
    }

    private static newWeddingTask(req: APIRequest<WeddingTaskAttributes>, res: APIResponse, next: express.NextFunction) {
        req.currentWedding!.createWeddingTask(req.body).then(result => {
            res.status(201).json(result);
        }).catch(next);
    }

    private static updateWeddingTask(req: ModelRouteRequest<WeddingTaskInstance>, res: APIResponse, next: express.NextFunction) {
        let params: WeddingTaskAttributes = req.body;
        if (req.currentModel.wedding_id === req.currentWedding!.id) {
            req.currentModel.update(params).then(result => {
                res.jsonContent(result);
            }).catch(next);
        } else {
            next(new NotAccessibleError());
        }
    }

    private static deleteWeddingTask(req: ModelRouteRequest<WeddingTaskInstance>, res: APIResponse, next: express.NextFunction) {
        if (req.currentWedding!.id === req.currentWedding!.id) {
            req.currentModel.destroy().then(result => {
                res.jsonContent({ 'message': 'Wedding Task successfully deleted' });
            }).catch(next);
        } else {
            next(new NotAccessibleError());
        }
    }
}
