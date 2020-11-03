import * as express from "express"
import { isAuthorized } from "../middleware/authorization"
import { hasWedding } from "../middleware/userHasWedding";
import { APIRequest, BasicRouter, APIResponse } from "../basicrouter"
import { Events, EventsAttributes, EventsInstance } from "../../model";
import { ModelRouteRequest } from "../basicrouter";
import { NotAccessibleError } from "../../error";
import { isDate, isString, isNumber, isArray, parallelValidateBlock } from "../middleware/validationrules";
import * as EmailValidator from 'email-validator';
import { Transaction } from "sequelize";

const EventMiddleware = BasicRouter.requireKeysOfTypes({
    name: isString,
    date: isDate,
    duration: isNumber,
    'color?': isString,
    participants: parallelValidateBlock([isArray, (vaule: Array<{ email: string }>) => {
        return vaule.every(item => {
            return EmailValidator.validate(item.email)
        }) || 'Invalid Participants'
    }])
})

interface EventRequest extends EventsAttributes {
    participants: Array<{ email: string }>
}

export class EventsRouter extends BasicRouter {

    constructor() {
        super();
        this.getInternalRouter().get('/events', isAuthorized, hasWedding, EventsRouter.getEvents);
        this.getInternalRouter().get('/events/:event_id', isAuthorized, hasWedding, BasicRouter.populateModel(Events, 'event_id'), EventsRouter.getEvent);
        this.getInternalRouter().post('/events', isAuthorized, hasWedding, EventMiddleware, EventsRouter.newEvent);
        this.getInternalRouter().put('/events/:event_id', isAuthorized, hasWedding, EventMiddleware, BasicRouter.populateModel(Events, 'event_id'), EventsRouter.updateEvent);
        this.getInternalRouter().delete('/events/:event_id', isAuthorized, hasWedding, BasicRouter.populateModel(Events, 'event_id'), EventsRouter.deleteEvent);
    }

    private static getEvents(req: APIRequest, res: APIResponse, next: express.NextFunction) {
        req.currentWedding!.getEvents().then(result => {
            res.jsonContent(result);
        }).catch(next);
    }

    private static getEvent(req: ModelRouteRequest<EventsInstance>, res: APIResponse, next: express.NextFunction) {
        res.jsonContent(req.currentModel);
    }

    private static newEvent(req: APIRequest<EventRequest>, res: APIResponse, next: express.NextFunction) {
        req.sequelize.transaction((t: Transaction) => {
            return req.currentWedding!.createEvent(req.body).then((event) => {
                return Promise.all(req.body.participants.map(participant => {
                    return event.createParticipant({ email: participant.email, status: 'pending' });
                })).then(() => {
                    return event
                })
            });
        }).then(event => {
            event.reload().then(reload => {
                res.jsonContent(reload);
            });
        }).catch(next);

    }

    private static updateEvent(req: ModelRouteRequest<EventsInstance, EventRequest>, res: APIResponse, next: express.NextFunction) {
        if (req.currentModel.wedding_id === req.currentWedding!.id) {
            req.currentModel.update(req.body).then(event => {
                const deletions = req.currentModel.participants.map(participant => {
                    const stillExisting = req.body.participants.find(({ email }) => email.toLowerCase() === participant.email.toLowerCase()) != undefined
                    if (!stillExisting) {
                        return participant.destroy()
                    }
                    return Promise.resolve();
                });
                const additions = req.body.participants.map(participant => {
                    const isNew = req.currentModel.participants.find(({ email }) => email.toLowerCase() === participant.email.toLowerCase()) == undefined
                    if (isNew) {
                        return event.createParticipant({ email: participant.email, status: 'pending' }).then(() => {
                            return;// turn the promise into a void promise to not confuse TS
                        })
                    }
                    return Promise.resolve();
                });

                return Promise.all([...deletions, ...additions]).then(() => {
                    return event;
                })
            }).then(event => {
                event.reload().then(reload => {
                    res.jsonContent(reload);
                });
            }).catch(next)
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
