import * as express from "express"
import { isAuthorized } from "../middleware/authorization"
import { hasWedding } from "../middleware/userHasWedding";
import { APIRequest, BasicRouter, APIResponse } from "../basicrouter"
import { WeddingTimeline, WeddingTimelineAttributes, WeddingTimelineInstance } from "../../model";

import { ModelRouteRequest } from "../basicrouter";
import { NotAccessibleError } from "../../error";
import { isString, isDate } from "../middleware/validationrules";

export class WeddingTimelineRouter extends BasicRouter {

    constructor() {
        super();
        this.getInternalRouter().get('/wedding-timeline', isAuthorized, hasWedding, WeddingTimelineRouter.getWeddingTimeline);
        this.getInternalRouter().post('/wedding-timeline', isAuthorized, hasWedding, BasicRouter.requireKeysOfTypes({
            title: isString,
            time: isDate
        }), WeddingTimelineRouter.newWeddingTimeline);
        this.getInternalRouter().put('/wedding-timeline/:wedding_timeline_id', isAuthorized, hasWedding, BasicRouter.requireKeysOfTypes({
            title: isString,
            time: isDate
        }), BasicRouter.populateModel(WeddingTimeline, 'wedding_timeline_id'), WeddingTimelineRouter.updateWeddingTimeline);
        this.getInternalRouter().delete('/wedding-timeline/:wedding_timeline_id', isAuthorized, hasWedding, BasicRouter.populateModel(WeddingTimeline, 'wedding_timeline_id'), WeddingTimelineRouter.deleteWeddingTimeline);
    }

    private static getWeddingTimeline(req: APIRequest, res: APIResponse, next: express.NextFunction) {
        req.currentWedding!.getWeddingTimeline().then(result => {
            res.jsonContent(result);
        }).catch(next);
    }

    private static newWeddingTimeline(req: APIRequest<WeddingTimelineAttributes>, res: APIResponse, next: express.NextFunction) {
        req.currentWedding!.createWeddingTimeline(req.body).then(result => {
            res.status(201).json(result);
        }).catch(next);
    }

    private static updateWeddingTimeline(req: ModelRouteRequest<WeddingTimelineInstance>, res: APIResponse, next: express.NextFunction) {
        let params: WeddingTimelineAttributes = req.body;
        if (req.currentModel.wedding_id === req.currentWedding!.id) {
            req.currentModel.update(params).then(result => {
                res.jsonContent(result);
            }).catch(next);
        } else {
            next(new NotAccessibleError());
        }
    }

    private static deleteWeddingTimeline(req: ModelRouteRequest<WeddingTimelineInstance>, res: APIResponse, next: express.NextFunction) {
        if (req.currentWedding!.id === req.currentWedding!.id) {
            req.currentModel.destroy().then(result => {
                res.jsonContent({ 'message': 'Wedding Task successfully deleted' });
            }).catch(next);
        } else {
            next(new NotAccessibleError());
        }
    }
}