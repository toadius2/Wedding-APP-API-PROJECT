import * as er from "../error"
import * as l from "../logger"
import * as seq from "sequelize"
import {UniqueConstraintError} from "sequelize"
import BasicError from "./baseerror"
import ResourceAlreadyExists from "./resourcealreadyexists";
import InvalidParametersError from "./invalidparameterserror";

export let prepareErrorForResponse = (err: Error, route?: string): BasicError => {
    let mperr = <er.BasicError>err;
    if (err instanceof er.BasicError) {
    } else {
        if (err instanceof UniqueConstraintError) {
            mperr = new ResourceAlreadyExists('Resource already exists', (<UniqueConstraintError>err).errors.map((error) => {
                return error.path;
            }));
        } else if (<any>err instanceof seq.ValidationError) {
            let valiError = err as seq.ValidationError;
            let invalidKeys = {};
            for (let error of valiError.errors) {
                invalidKeys[error.path] = error.message;
            }
            mperr = new InvalidParametersError([], invalidKeys)
        } else if (<any>err instanceof seq.ForeignKeyConstraintError) {
            mperr = new er.ResourceNotFoundError(undefined, 'unknown');
        } else if (<any>err instanceof seq.EmptyResultError) {
            mperr = new er.ResourceNotFoundError(undefined, 'unknown');
        } else
            mperr = new er.InternalServerError(err);
    }
    (<any>mperr).route = route;
    if (mperr.type == "MissingParametersError" || mperr.type == "RouteNotFoundError") {
    } else if (mperr.isCritical) {
        l.error("Critical Error", mperr, "Server-RouteEndHandler-CatchError");
    }
    else {
        l.error("Error", mperr, "Server-RouteEndHandler-CatchError");
    }
    delete mperr.isCritical;
    if ('encapsulatedError' in mperr) {
        delete (<any>mperr).encapsulatedError
    }
    return mperr;
};

