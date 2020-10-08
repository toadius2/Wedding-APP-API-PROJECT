import * as express from "express"
import { isAuthorized } from "../middleware/authorization"
import { hasWedding } from "../middleware/userHasWedding";
import { APIRequest, BasicRouter, APIResponse } from "../basicrouter"
import { BudgetItem, BudgetItemAttributes, BudgetItemInstance } from "../../model";
import { ModelRouteRequest } from "../basicrouter";

export class BudgetItemRouter extends BasicRouter {

    constructor() {
        super();
        this.getInternalRouter().get('/budget-item', isAuthorized, hasWedding, BudgetItemRouter.getItems);
        this.getInternalRouter().post('/budget-item', isAuthorized, hasWedding, BudgetItemRouter.newBudgetItem);
        this.getInternalRouter().put('/budget-item/:budget_item_id', isAuthorized, hasWedding, BasicRouter.populateModel(BudgetItem, 'budget_item_id'), BudgetItemRouter.updateBudgetItem);
        this.getInternalRouter().delete('/budget-item/:budget_item_id', isAuthorized, hasWedding, BasicRouter.populateModel(BudgetItem, 'budget_item_id'), BudgetItemRouter.deleteItem);
    }

    private static getItems(req: APIRequest, res: APIResponse, next: express.NextFunction) {
        BudgetItem.findAll({
            where: {
                wedding_id: req.currentWedding!.id
            }
        }).then(result => {
            res.jsonContent(result);
        }).catch(next);
    }

    private static newBudgetItem(req: APIRequest, res: APIResponse, next: express.NextFunction) {
        let params: BudgetItemAttributes = req.body;
        params = Object.assign({}, params, {
            wedding_id: req.currentWedding!.id
        });
        req.currentWedding!.createBudgetItem(params).then(result => {
            res.status(201).jsonContent(result);
        }).catch(next);
    }

    private static updateBudgetItem(req: ModelRouteRequest<BudgetItemInstance>, res: APIResponse, next: express.NextFunction) {
        let params: BudgetItemAttributes = req.body;
        if (req.currentModel.wedding_id === req.currentWedding!.id) {
            req.currentModel.update(params).then(result => {
                res.jsonContent({ 'message': 'Budget item successfully updated' });
            }).catch(next);
        } else {
            res.status(401).jsonContent({ 'message': 'Budget item inaccessible' });
        }
    }

    /**
     * This function deletes a budget item
     * @param {APIRequest} req
     * @param {e.Response} res
     * @param {e.NextFunction} next
     */
    private static deleteItem(req: ModelRouteRequest<BudgetItemInstance>, res: APIResponse, next: express.NextFunction) {
        if (req.currentModel.wedding_id === req.currentWedding!.id) {
            req.currentModel.destroy().then(result => {
                res.jsonContent({ 'message': 'Budget item successfully deleted' });
            }).catch(next);
        } else {
            res.status(401).jsonContent({ 'message': 'Budget item inaccessible' });
        }
    }
}
