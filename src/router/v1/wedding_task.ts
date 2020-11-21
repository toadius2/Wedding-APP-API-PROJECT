import * as express from "express"
import { isAuthorized } from "../middleware/authorization"
import { hasWedding } from "../middleware/userHasWedding";
import { APIRequest, BasicRouter, APIResponse } from "../basicrouter"
import { WeddingTask, WeddingTaskAttributes, WeddingTaskInstance } from "../../model";
import { ModelRouteRequest } from "../basicrouter";
import { NotAccessibleError } from "../../error";
import { isString, isBoolean, isDate, isArrayOfType } from "../middleware/validationrules";
import { WeddingTaskTag } from "../../model/wedding_task_tag";

export class WeddingTaskRouter extends BasicRouter {

    constructor() {
        super();
        this.getInternalRouter().get('/wedding-task', isAuthorized, hasWedding, WeddingTaskRouter.getWeddingTask);
        this.getInternalRouter().get('/wedding-task-tags', isAuthorized, WeddingTaskRouter.getWeddingTaskTags);
        this.getInternalRouter().post('/wedding-task', isAuthorized, hasWedding, BasicRouter.requireKeysOfTypes({
            name: isString,
            'detail?': isString,
            date: isDate,
            'completed?': isBoolean,
            'tags?': isArrayOfType('string')
        }), WeddingTaskRouter.newWeddingTask);
        this.getInternalRouter().put('/wedding-task/:wedding_task_id', isAuthorized, hasWedding, BasicRouter.requireKeysOfTypes({
            name: isString,
            'detail?': isString,
            date: isDate,
            'completed?': isBoolean,
            'tags?': isArrayOfType('string')
        }), BasicRouter.populateModel(WeddingTask, 'wedding_task_id'), WeddingTaskRouter.updateWeddingTask);
        this.getInternalRouter().delete('/wedding-task/:wedding_task_id', isAuthorized, hasWedding, BasicRouter.populateModel(WeddingTask, 'wedding_task_id'), WeddingTaskRouter.deleteWeddingTask);
    }

    private static getWeddingTaskTags(req: APIRequest, res: APIResponse, next: express.NextFunction) {
        WeddingTaskTag.findAll().then(result => {
            res.jsonContent(result);
        }).catch(next);
    }

    private static getWeddingTask(req: APIRequest, res: APIResponse, next: express.NextFunction) {
        req.currentWedding!.getWeddingTask().then(result => {
            res.jsonContent(result);
        }).catch(next);
    }

    private static newWeddingTask(req: APIRequest<WeddingTaskAttributes & { tags?: string[] }>, res: APIResponse, next: express.NextFunction) {
        req.currentWedding!.createWeddingTask(req.body).then(async result => {
            if (req.body.tags) {
                await result.setTags(req.body.tags)
                result = await result.reload()
            }
            res.status(201).jsonContent(result);
        }).catch(next);
    }

    private static updateWeddingTask(req: ModelRouteRequest<WeddingTaskInstance>, res: APIResponse, next: express.NextFunction) {
        let params: WeddingTaskAttributes = req.body;
        if (req.currentModel.wedding_id === req.currentWedding!.id) {
            req.currentModel.update(params).then(async result => {
                if (req.body.tags) {
                    await result.setTags(req.body.tags)
                    result = await result.reload()
                }
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
