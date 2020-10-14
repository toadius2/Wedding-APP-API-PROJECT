import * as express from "express"
import { isAuthorized } from "../middleware/authorization"
import { hasWedding } from "../middleware/userHasWedding";
import { APIRequest, BasicRouter, APIResponse } from "../basicrouter"
import { Events, EventsAttributes, EventsInstance } from "../../model";
import { ModelRouteRequest } from "../basicrouter";
import { NotAccessibleError } from "../../error";

export class EventsRouter extends BasicRouter {

    constructor() {
        super();
        this.getInternalRouter().get('/events', isAuthorized, hasWedding, EventsRouter.getEvents);
        this.getInternalRouter().get('/events/:event_id', isAuthorized, hasWedding, BasicRouter.populateModel(Events, 'event_id'), EventsRouter.getEvent);
        this.getInternalRouter().post('/events', isAuthorized, hasWedding, EventsRouter.newEvent);
        this.getInternalRouter().put('/events/:event_id', isAuthorized, hasWedding, BasicRouter.populateModel(Events, 'event_id'), EventsRouter.updateEvent);
        this.getInternalRouter().delete('/events/:event_id', isAuthorized, hasWedding, BasicRouter.populateModel(Events, 'event_id'), EventsRouter.deleteEvent);
    }

    private static getEvents(req: APIRequest, res: APIResponse, next: express.NextFunction) {
        req.currentWedding!.getEvents().then(result => {
            res.jsonContent(result);
        }).catch(next);
    }

    private static getEvent(req:  ModelRouteRequest<EventsInstance>, res: APIResponse, next: express.NextFunction) {
       res.jsonContent(req.currentModel);
    }

    private static newEvent(req: APIRequest, res: APIResponse, next: express.NextFunction) {
        const params: EventsAttributes = req.body;
        req.currentWedding!.createEvent(params).then(result => {
            res.jsonContent(result);
        }).catch(next);
    }

    private static updateEvent(req: ModelRouteRequest<EventsInstance>, res: APIResponse, next: express.NextFunction) {
        let params: EventsAttributes = req.body;
        if (req.currentModel.wedding_id === req.currentWedding!.id) {
            req.currentModel.update(params).then(result => {
                res.jsonContent(result); 
            }).catch(next);
        } else {
            next(new NotAccessibleError())
        }
    }

    private static deleteEvent(req: ModelRouteRequest<EventsInstance>, res: APIResponse, next: express.NextFunction) {
        if (req.currentModel.wedding_id === req.currentWedding!.id) {
            req.currentModel.destroy().then(result => {
                res.jsonContent({ 'message': 'Event successfully deleted' });
            }).catch(next);
        } else {
            next(new NotAccessibleError())
        }
    }
}
