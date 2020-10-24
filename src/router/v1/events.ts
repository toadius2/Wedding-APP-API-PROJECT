import * as express from "express"
import { isAuthorized } from "../middleware/authorization"
import { hasWedding } from "../middleware/userHasWedding";
import { APIRequest, BasicRouter, APIResponse } from "../basicrouter"
import { Events, EventsInstance, EventsBody, Participants } from "../../model";
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

    private static newEvent(req: APIRequest<EventsBody>, res: APIResponse, next: express.NextFunction) {
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

    private static updateEvent(req: ModelRouteRequest<EventsInstance, EventsBody>, res: APIResponse, next: express.NextFunction) {
        if (req.currentModel.wedding_id === req.currentWedding!.id) {
            req.currentModel.update(req.body).then(event => {
                let allPromises: Array<Promise<any>> = [];
                const deletions = Promise.all(req.currentModel.participants.map(participant => {
                    const toDelete = req.body.participants.find(element => element.email === participant.email);
                    if (toDelete)
                        return Participants.destroy({
                            where: {
                                id: participant.id!
                            }
                        });
                    else
                        return 0; // ToDo: So you're either returning a Promise, or 0. That wont work. you're array would look like this:
                    //  [Promise, Promise, 0, 0, Promise] -> must be all promises. So just return Promise.resolve(0)
                }));
                // const additions = Promise.all(req.body.participants.map(participant => {
                //     Participants.findOne({
                //         where: {
                //             email: participant.email
                //         }
                //     }).then(element => {
                //         if (element === null) {
                //             return event.createParticipant({ email: participant.email, status: 'pending' });
                //         }
                //     })
                // }));
                allPromises.push(deletions);    // ToDo: wont work, you're pushing a array as element. you need to either convert your deletions to arguemnts (...deletions), or use concat
                // allPromises.push(additions);
                return Promise.all(allPromises).then(result => {
                    return event;
                })
            }).then(event => {
                event.reload().then(reload => {
                    res.jsonContent(reload);
                });
            }).catch(e => console.log(e));
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
