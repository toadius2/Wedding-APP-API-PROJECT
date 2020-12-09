import * as express from "express"
import { isAuthorized } from "../middleware/authorization"
import { hasWedding } from "../middleware/userHasWedding";
import { APIRequest, BasicRouter, APIResponse } from "../basicrouter"
import { ModelRouteRequest } from "../basicrouter";
import { NotAccessibleError, ResourceNotFoundError } from "../../error";
import { isString, isBoolean, isArrayOfType, isEnum } from "../middleware/validationrules";
import { Transaction } from "sequelize";
import { WeddingGuest, WeddingGuestAttributes, WeddingGuestInstance } from "../../model/wedding_guest";
import * as EmailValidator from "email-validator"

const GuestMiddleware = BasicRouter.requireKeysOfTypes({
    first_name: isString,
    last_name: isString,
    'has_plus_one?': isBoolean,
    attending_group: isArrayOfType('string'),
    'age_group?': isEnum(['Adult', 'Teen', 'Child']),
    'group?': isString,
    'email?': (value: any): true | string => {
        if (EmailValidator.validate(value)) {
            return true
        }
        return 'Invalid email provided'
    },
    'phone?': isString,
    'status?': isEnum(['accepted', 'declined', 'maybe', 'pending']),
    'address?': isString,
    'city?': isString,
    'state?': isString,
    'zip_code?': isString
})

export class WeddingGuestRouter extends BasicRouter {

    constructor() {
        super();
        this.getInternalRouter().get('/wedding-guest', isAuthorized, hasWedding, WeddingGuestRouter.getWeddingGuests);
        this.getInternalRouter().post('/wedding-guest', isAuthorized, hasWedding, GuestMiddleware, WeddingGuestRouter.newWeddingGuest);
        this.getInternalRouter().put('/wedding-guest/:wedding_guest_id', isAuthorized, hasWedding, GuestMiddleware, BasicRouter.populateModel(WeddingGuest, 'wedding_guest_id'), WeddingGuestRouter.updateWeddingGuest);
        this.getInternalRouter().put('/wedding-guest/:wedding_guest_id/relation/:other_wedding_guest', isAuthorized, hasWedding, BasicRouter.populateModel(WeddingGuest, 'wedding_guest_id'), WeddingGuestRouter.relateWeddingGuest);
        this.getInternalRouter().delete('/wedding-guest/:wedding_guest_id/relation', isAuthorized, hasWedding, BasicRouter.populateModel(WeddingGuest, 'wedding_guest_id'), WeddingGuestRouter.deleteRelation);
        this.getInternalRouter().delete('/wedding-guest/:wedding_guest_id', isAuthorized, hasWedding,
            BasicRouter.populateModel(WeddingGuest, 'wedding_guest_id'), WeddingGuestRouter.deleteWeddingGuest);
    }

    private static getWeddingGuests(req: APIRequest, res: APIResponse, next: express.NextFunction) {
        req.currentWedding!.getWeddingGuests().then(result => {
            res.jsonContent(result);
        }).catch(next);
    }

    private static newWeddingGuest(req: APIRequest<WeddingGuestAttributes>, res: APIResponse, next: express.NextFunction) {
        return req.currentWedding!.createWeddingGuest(req.body).then(result => {
            res.status(201).jsonContent(result);
        }).catch(next);
    }

    private static async relateWeddingGuest(req: ModelRouteRequest<WeddingGuestInstance, WeddingGuestAttributes>, res: APIResponse, next: express.NextFunction) {
        if (req.currentModel.wedding_id === req.currentWedding!.id) {
            if (req.currentModel.id == req.params.other_wedding_guest) {
                return next(new NotAccessibleError('You cant relate to yourself'))
            }
            const toRelate = await WeddingGuest.findById(req.params.other_wedding_guest)
            if (!toRelate) {
                return next(new ResourceNotFoundError(undefined, 'Wedding Guest'))
            }
            Promise.all([req.currentModel.setRelated(toRelate), toRelate.setRelated(req.currentModel)]).then(async () => {
                const result = await req.currentModel.reload()
                res.jsonContent(result)
            }).catch(next)
        } else {
            next(new NotAccessibleError());
        }
    }

    private static async deleteRelation(req: ModelRouteRequest<WeddingGuestInstance, WeddingGuestAttributes>, res: APIResponse, next: express.NextFunction) {
        if (req.currentModel.wedding_id === req.currentWedding!.id) {
            if (!req.currentModel.related) {
                res.jsonContent(req.currentModel)
            } else {
                Promise.all([req.currentModel.setRelated(), req.currentModel.related.setRelated()]).then(async () => {
                    const result = await req.currentModel.reload()
                    res.jsonContent(result)
                }).catch(next)
            }

        } else {
            next(new NotAccessibleError());
        }
    }

    private static updateWeddingGuest(req: ModelRouteRequest<WeddingGuestInstance, WeddingGuestAttributes>, res: APIResponse, next: express.NextFunction) {
        if (req.currentModel.wedding_id === req.currentWedding!.id) {
            return req.currentModel.update(req.body).then((result) => {
                res.jsonContent(result);
            }).catch(next);
        } else {
            next(new NotAccessibleError());
        }
    }

    private static deleteWeddingGuest(req: ModelRouteRequest<WeddingGuestInstance>, res: APIResponse, next: express.NextFunction) {
        if (req.currentWedding!.id === req.currentWedding!.id) {
            req.currentModel.destroy().then(() => {
                res.jsonContent({ 'message': 'Wedding Guest successfully deleted' });
            }).catch(next);
        } else {
            next(new NotAccessibleError());
        }
    }
}
