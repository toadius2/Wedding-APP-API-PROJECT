import * as express from "express"
import { APIRequest, APIResponse } from "../basicrouter"
import { NoWeddingFoundError } from "../../error"
import { Wedding } from "../../model";

/**
 * This function checks if the current user has wedding
 * @param {APIRequest} req
 * @param {e.Response} res
 * @param {e.NextFunction} next
 */
export function hasWedding(req: APIRequest, res: APIResponse, next: express.NextFunction) {
    Wedding.findOne({
        where: {
            user_id: req.currentUser!.id
        }
    }).then(wedding => {
        if (wedding != null) {
            req.currentWedding = wedding;
            next();
        } else {
            next(new NoWeddingFoundError());
        }
    }).catch(next)
}