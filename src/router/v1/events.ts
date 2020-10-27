import * as express from "express"
import { isAuthorized } from "../middleware/authorization"
import { hasWedding } from "../middleware/userHasWedding";
import { APIRequest, BasicRouter, APIResponse } from "../basicrouter"
import { Events, EventsInstance } from "../../model";
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

    private static newEvent(req: APIRequest<EventsInstance>, res: APIResponse, next: express.NextFunction) {
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

    private static updateEvent(req: ModelRouteRequest<EventsInstance>, res: APIResponse, next: express.NextFunction) {
        if (req.currentModel.wedding_id === req.currentWedding!.id) {
            req.currentModel.update(req.body).then(event => {
                // let allPromises: Array<Promise<any>> = [];
                console.log(req.currentModel.participants.length);
                const deletions = req.currentModel.participants.map(participant => {
                    console.log("Database Email: " + participant.email);
                    const toDelete = req.body.participants.find(element => element.email === participant.email);
                    console.log("Body Email: " + toDelete.email);
                    if (!toDelete) {
                        console.log('deleted');
                        return participant.destroy()
                    }
                    else {
                        console.log('not deleted');
                        return Promise.resolve();
                    }
                });
                // const additions = req.body.participants.map(participant => {
                //     return Participants.findOne({
                //         where: {
                //             email: participant.email
                //         }
                //     }).then(element => {
                //         if (element === undefined) {
                //             return event.createParticipant({ email: participant.email, status: 'pending' });
                //         } else {
                //             return Promise.resolve(participant);
                //         }
                //     })
                // });
                // allPromises = { ...deletions }
                // console.log(allPromises);
                // ToDo: wont work, you're pushing a array as element. you need to either convert your deletions to arguemnts (...deletions), or use concat
                return Promise.all(deletions).then(result => {
                    return event;
                })
                // return event;
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
