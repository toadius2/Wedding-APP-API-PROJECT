import * as express from "express"
import { isAuthorized } from "../middleware/authorization"
import { hasWedding } from "../middleware/userHasWedding";
import { APIRequest, BasicRouter, APIResponse } from "../basicrouter"
import { ModelRouteRequest } from "../basicrouter";
import { NotAccessibleError, ResourceNotFoundError } from "../../error";
import { isString, isBoolean, isArrayOfType, isEnum } from "../middleware/validationrules";
import { WeddingGuest, WeddingGuestAttributes, WeddingGuestInstance } from "../../model/wedding_guest";
import * as EmailValidator from "email-validator"
import { WeddingGuestGroup, WeddingGuestGroupInstance } from "../../model/wedding_guest_group";

const GuestMiddleware = BasicRouter.requireKeysOfTypes({
    first_name: isString,
    last_name: isString,
    'has_plus_one?': isBoolean,
    attending_group: isArrayOfType('string'),
    'age_group?': isEnum(['Adult', 'Teen', 'Child']),
    group: isString,
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

const GuestGroupMiddleware = BasicRouter.requireKeysOfTypes({
    name: isString
})

export class WeddingGuestRouter extends BasicRouter {

    constructor() {
        super();
        this.getInternalRouter().get('/wedding-guest', isAuthorized, hasWedding, WeddingGuestRouter.getWeddingGuests);
        this.getInternalRouter().get('/wedding-guest-emails', isAuthorized, hasWedding, WeddingGuestRouter.getWeddingGuestEmails);
        this.getInternalRouter().post('/wedding-guest', isAuthorized, hasWedding, GuestMiddleware, WeddingGuestRouter.newWeddingGuest);
        this.getInternalRouter().put('/wedding-guest/:wedding_guest_id', isAuthorized, hasWedding, GuestMiddleware,
            BasicRouter.populateModel(WeddingGuest, 'wedding_guest_id'), WeddingGuestRouter.updateWeddingGuest);
        this.getInternalRouter().put('/wedding-guest/:wedding_guest_id/relation/:other_wedding_guest', isAuthorized, hasWedding,
            BasicRouter.populateModel(WeddingGuest, 'wedding_guest_id'), WeddingGuestRouter.relateWeddingGuest);
        this.getInternalRouter().put('/wedding-guest/:wedding_guest_id/request-rsvp', isAuthorized, hasWedding,
            BasicRouter.populateModel(WeddingGuest, 'wedding_guest_id'), WeddingGuestRouter.requestRSVP);
        this.getInternalRouter().delete('/wedding-guest/:wedding_guest_id/relation/:other_wedding_guest', isAuthorized, hasWedding,
            BasicRouter.populateModel(WeddingGuest, 'wedding_guest_id'), WeddingGuestRouter.deleteRelation);
        this.getInternalRouter().delete('/wedding-guest/:wedding_guest_id', isAuthorized, hasWedding,
            BasicRouter.populateModel(WeddingGuest, 'wedding_guest_id'), WeddingGuestRouter.deleteWeddingGuest);

        this.getInternalRouter().post('/wedding-guest-group', isAuthorized, hasWedding, GuestGroupMiddleware,
            WeddingGuestRouter.createWeddingGuestGroup);

        this.getInternalRouter().put('/wedding-guest-group/:id', isAuthorized, hasWedding, GuestGroupMiddleware,
            WeddingGuestRouter.editWeddingGuestGroup);

        this.getInternalRouter().get('/wedding-guest-group', isAuthorized, hasWedding,
            WeddingGuestRouter.getWeddingGuestGroups);

        this.getInternalRouter().delete('/wedding-guest-group/:id', isAuthorized, hasWedding, BasicRouter.populateModel(WeddingGuestGroup, 'id'),
            WeddingGuestRouter.removeWedddingGuestGroup);

        this.getInternalRouter().get('/rsvp/:token', WeddingGuestRouter.getRSVP);
        this.getInternalRouter().put('/rsvp/:token', WeddingGuestRouter.updateRSVP);
    }

    private static getWeddingGuestGroups(req: APIRequest, res: APIResponse, next: express.NextFunction) {
        req.currentWedding!.getWeddingGuestGroups().then((groups) => {
            res.jsonContent(groups);
        }).catch(next)
    }

    private static async removeWedddingGuestGroup(req: ModelRouteRequest<WeddingGuestGroupInstance>, res: APIResponse, next: express.NextFunction) {
        if (req.currentModel.wedding_id === req.currentWedding!.id) {
            const count = await WeddingGuest.count({ where: { group_id: req.currentModel.id! } })
            if (count > 0) {
                return next(new NotAccessibleError('Please move all guests in this group to a different group'))
            }
            req.currentModel.destroy().then(() => {
                res.jsonContent({ 'message': 'Wedding Guest Group successfully deleted' });
            }).catch(next)
        } else {
            next(new NotAccessibleError());
        }
    }

    private static createWeddingGuestGroup(req: APIRequest, res: APIResponse, next: express.NextFunction) {
        req.currentWedding!.createWeddingGuestGroup(req.body).then((group) => {
            res.jsonContent(group);
        }).catch(next)
    }

    private static editWeddingGuestGroup(req: ModelRouteRequest<WeddingGuestGroupInstance>, res: APIResponse, next: express.NextFunction) {
        req.currentModel!.update(req.body).then((group) => {
            res.jsonContent(group);
        }).catch(next)
    }

    private static getRSVP(req: APIRequest, res: APIResponse, next: express.NextFunction) {
        WeddingGuest.findOne({
            where: { rsvp_token: req.params.token },
            rejectOnEmpty: true
        }).then((guest) => {
            res.jsonContent(guest);
        }).catch(next)
    }

    private static updateRSVP(req: APIRequest, res: APIResponse, next: express.NextFunction) {
        WeddingGuest.findOne({
            where: { rsvp_token: req.params.token },
            rejectOnEmpty: true
        }).then((guest) => {
            return guest!.update(req.body).then((result) => {
                res.jsonContent(result);
            })
        }).catch(next)
    }

    private static getWeddingGuestEmails(req: APIRequest, res: APIResponse, next: express.NextFunction) {
        req.currentWedding!.getWeddingGuests({
            scope: 'email',
        }).then(result => {
            res.jsonContent(result.map(a => a.email));
        }).catch(next);
    }

    private static getWeddingGuests(req: APIRequest, res: APIResponse, next: express.NextFunction) {
        req.currentWedding!.getWeddingGuests().then(result => {
            res.jsonContent(result);
        }).catch(next);
    }

    private static async newWeddingGuest(req: APIRequest<WeddingGuestAttributes & { group: string }>, res: APIResponse, next: express.NextFunction) {
        const group = await WeddingGuestGroup.findById(req.body.group, { rejectOnEmpty: true });
        if (group?.wedding_id != req.currentWedding?.id) {
            return next(new NotAccessibleError());
        }
        req.sequelize.transaction((transaction) => {
            return req.currentWedding!.createWeddingGuest(req.body, { transaction }).then(guest => {
                return guest.setGroup(group!, { transaction }).then(() => {
                    return guest.reload({ transaction })
                })
            })
        }).then(result => {
            result.sendInvitationEmail()
            res.status(201).jsonContent(result);
            return null;
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
            Promise.all([req.currentModel.addRelated(toRelate), toRelate.addRelated(req.currentModel)]).then(async () => {
                const result = await req.currentModel.reload()
                res.jsonContent(result)
            }).catch(next)
        } else {
            next(new NotAccessibleError());
        }
    }

    private static async requestRSVP(req: ModelRouteRequest<WeddingGuestInstance, WeddingGuestAttributes>, res: APIResponse, next: express.NextFunction) {
        if (req.currentModel.wedding_id === req.currentWedding!.id) {
            if (!req.currentModel.email) {
                return next(new NotAccessibleError('Email is not provided'))
            }
            req.currentModel.sendInvitationEmail().then(() => {
                res.jsonContent({})
            }).catch(next)
        } else {
            next(new NotAccessibleError());
        }
    }

    private static async deleteRelation(req: ModelRouteRequest<WeddingGuestInstance, WeddingGuestAttributes>, res: APIResponse, next: express.NextFunction) {
        if (req.currentModel.wedding_id === req.currentWedding!.id) {
            if (req.currentModel.related?.length == 0) {
                res.jsonContent(req.currentModel)
            } else {
                const toRelate = await WeddingGuest.findById(req.params.other_wedding_guest)
                if (!toRelate) {
                    return next(new ResourceNotFoundError(undefined, 'Wedding Guest'))
                }
                Promise.all([req.currentModel.removeRelated(toRelate), toRelate.removeRelated(req.currentModel)]).then(async () => {
                    const result = await req.currentModel.reload()
                    res.jsonContent(result)
                }).catch(next)
            }

        } else {
            next(new NotAccessibleError());
        }
    }

    private static updateWeddingGuest(req: ModelRouteRequest<WeddingGuestInstance, WeddingGuestAttributes & { group: string }>, res: APIResponse, next: express.NextFunction) {
        if (req.currentModel.wedding_id === req.currentWedding!.id) {
            const sendEmail = req.body.email != req.currentModel.email
            req.sequelize.transaction((transaction) => {
                const { group, ...update } = req.body
                return req.currentModel.update(update, { transaction }).then((guest) => {
                    if (group && group != req.currentModel.group.id) {
                        return guest.setGroup(group, { transaction }).then(() => {
                            return guest.reload({ transaction })
                        })
                    }
                    return guest
                })
            }).then((result) => {
                if (sendEmail) {
                    result.sendInvitationEmail()
                }
                res.jsonContent(result);
                return null
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
