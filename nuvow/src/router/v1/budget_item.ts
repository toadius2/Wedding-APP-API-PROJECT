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
        this.getInternalRouter().put('/budget-item/:budget_item_id', isAuthorized, BudgetItemRouter.updateBudgetItem);
        this.getInternalRouter().delete('/budget-item/:budget_item_id', isAuthorized, BudgetItemRouter.deleteItem);
    }

    private static getItems(req: APIRequest, res: APIResponse, next: express.NextFunction) {
        Wedding.findOne({
            where: {
                user_id: req.currentUser!.id
            }
        }).then(wedding => {
            if (wedding == null) {
                  return next(new NoWeddingFoundError('Device'));
            } else {
                BudgetItem.findAll({
                    where: {
                        wedding_id: wedding!.id
                    }
                }).then(result => {
                    let json = result.toJSON();
                    res.status(200).json(json);
                }).catch(next);
            }
        }).catch(next);
    }

    private static newBudgetItem(req: APIRequest, res: APIResponse, next: express.NextFunction) {
        let params: BudgetItemAttributes = req.body;
        Wedding.findOne({
            where: {
                user_id: req.currentUser!.id
            }
        }).then(wedding => {
            if (wedding == null) {
                  return next(new NoWeddingFoundError('Device'));
                
            } else {
                params = Object.assign({}, params, {
                    wedding_id: wedding!.id
                });
                BudgetItem.create(params).then(result => {
                    let json = result.toJSON();
                    res.status(201).json(json);
                }).catch(next)
            }
        }).catch(error => {
            console.log(error)
        });
    }

    private static updateBudgetItem(req: APIRequest, res: APIResponse, next: express.NextFunction) {
        const budgetItemId: number = Number(req.params.budget_item_id);
        let params: BudgetItemAttributes = req.body;

        Wedding.findOne({
            where: {
                user_id: req.currentUser!.id
            }
        }).then(wedding => {
            if (wedding == null) {
              
            } else {
                params = Object.assign({}, params, {
                    updated_at: new Date()
                });
                BudgetItem.update(params, {
                    where: {
                        id: budgetItemId,
                        wedding_id: wedding!.id!
                    },
                    limit: 1
                }).then((result) => {
                    if (!result) {
                        return next(new ResourceNotFoundError(undefined, 'BudgetItem'));
                    } else {
                        res.status(200).json({ 'message': 'Budget item successfully updated' });
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
                BudgetItem.destroy({
                    where: {
                        id: req.params.budget_item_id,
                        wedding_id: wedding!.id!
                    },
                    force: true
                }).then((result) => {
                    if (result === 0) {
                        return next(new ResourceNotFoundError(undefined, 'BudgetItem'));
                    } else {
                        res.status(200).json({ 'message': 'Budget item successfully deleted' });
                    }
                }).catch(next);
            }
        }).catch(next);


    }
}
