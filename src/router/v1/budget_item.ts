import * as express from "express"
import { isAuthorized } from "../middleware/authorization"
import { APIRequest, BasicRouter, APIResponse } from "../basicrouter"
import { ResourceNotFoundError } from "../../error";
import { NoWeddingFoundError } from "../../error";
import { BudgetItem, BudgetItemAttributes } from "../../model";
import { Wedding } from "../../model";

export class BudgetItemRouter extends BasicRouter {

    constructor() {
        super();
        this.getInternalRouter().get('/budget-item', isAuthorized, BudgetItemRouter.getItems);
        this.getInternalRouter().post('/budget-item', isAuthorized, BudgetItemRouter.newBudgetItem);
        this.getInternalRouter().put('/budget-item/:budget_item_id', isAuthorized, BudgetItemRouter.updateBudgetItem);  // ToDo: Here you can use BasicRouter.populateModel(BudgetItem, 'budget_item_id'). Your req type turns then from APIRequest to ModelRouteRequest<BudgetItemInstance> and you can access the model via req.currentModel. Error is thrown automatic when not existing
        this.getInternalRouter().delete('/budget-item/:budget_item_id', isAuthorized, BudgetItemRouter.deleteItem);
    }

    private static getItems(req: APIRequest, res: APIResponse, next: express.NextFunction) {
        Wedding.findOne({
            where: {
                user_id: req.currentUser!.id
            }
        }).then(wedding => {
            if (wedding == null) {
                return next(new NoWeddingFoundError('Wedding not found'));
            } else {
                BudgetItem.findAll({
                    where: {
                        wedding_id: wedding!.id
                    }
                }).then(result => {
                    let json = result.toJSON();
                    res.status(200).json(json); //  ToDo: use .jsonContent, no .toJSON needed then
                }).catch(next);
            }
        }).catch(next);
    }

    private static newBudgetItem(req: APIRequest, res: APIResponse, next: express.NextFunction) {
        let params: BudgetItemAttributes = req.body;
        Wedding.findOne({   // ToDo: This should be a middleware, not redundant code every time. Hint: This middleware could also populate req.currentWedding for example, so you can access the wedding via req.currentWedding. like req.currentUser
            where: {
                user_id: req.currentUser!.id
            }
        }).then(wedding => {
            if (wedding == null) {
                return next(new NoWeddingFoundError('No Wedding Found'));
            } else {
                params = Object.assign({}, params, {
                    wedding_id: wedding!.id
                }); // ToDo: You can (and should) use wedding.createBudgetItem (need to decalre types for that like in user.ts line 28 and following)
                BudgetItem.create(params).then(result => {
                    let json = result.toJSON();
                    res.status(201).json(json); //  ToDo: use .jsonContent, no .toJSON needed then
                }).catch(next)
            }
        }).catch(next);
    }

    private static updateBudgetItem(req: APIRequest, res: APIResponse, next: express.NextFunction) {
        const budgetItemId = req.params.budget_item_id;
        let params: BudgetItemAttributes = req.body;
        //  ToDo: You need to check if the budget item actually belongs to the current wedding
        Wedding.findOne({
            where: {
                user_id: req.currentUser!.id
            }
        }).then(wedding => {
            if (wedding == null) {
                return next(new NoWeddingFoundError('No Wedding Found'));
            } else {
                params = Object.assign({}, params, {
                    updated_at: new Date() //  ToDo: sequelize does that automatic
                });
                BudgetItem.update(params, { //  ToDo: use req.currentModel.update
                    where: {
                        id: budgetItemId,
                        wedding_id: wedding!.id!
                    },
                    limit: 1
                }).then((result) => {
                    if (!result) {
                        return next(new ResourceNotFoundError(undefined, 'BudgetItem'));
                    } else {
                        res.status(200).json({ 'message': 'Budget item successfully updated' }); //  ToDo: use .jsonContent
                    }
                }).catch(next);
            }
        }).catch(next);
    }

    /**
     * This function deletes a budget item
     * @param {APIRequest} req
     * @param {e.Response} res
     * @param {e.NextFunction} next
     */
    private static deleteItem(req: APIRequest, res: APIResponse, next: express.NextFunction) {
        Wedding.findOne({
            where: {
                user_id: req.currentUser!.id
            }
        }).then(wedding => {
            if (wedding == null) {
                return next(new NoWeddingFoundError('Device'));
            } else {
                //  ToDo: You need to check if the budget item actually belongs to the current wedding
                BudgetItem.destroy({ //  ToDo: use req.currentModel.destroy
                    where: {
                        id: req.params.budget_item_id,
                        wedding_id: wedding!.id!
                    },
                    force: true
                }).then((result) => {
                    if (result === 0) {
                        return next(new ResourceNotFoundError(undefined, 'BudgetItem'));
                    } else {
                        res.status(200).json({ 'message': 'Budget item successfully deleted' }); //  ToDo: use .jsonContent
                    }
                }).catch(next);
            }
        }).catch(next);


    }
}
