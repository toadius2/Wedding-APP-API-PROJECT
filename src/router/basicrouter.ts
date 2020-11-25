import * as express from "express"
import * as Sequelize from "sequelize"
import { IncludeOptions, Model } from "sequelize"
import { InvalidParametersError } from "../error";
import { DeviceInstance, UserInstance, WeddingInstance } from "../model";
import { ResourceNotFoundError } from "../error";
import { isObject } from "util";
import DBCache from "gradelo-db-cache";
import { ValidatorFunction } from "./middleware/validationrules";

export interface ExtendedSequelize extends Sequelize.Sequelize {
    dialect: Sequelize.QueryInterface;
}

export interface APIRequest<BodyParameters = any> extends express.Request {
    sequelize: ExtendedSequelize;
    db_cache?: DBCache
    currentUser?: UserInstance;
    currentDevice?: DeviceInstance;
    currentWedding?: WeddingInstance;
    body: BodyParameters;
    token: string;

    invalidateCache(forToken?: string): void
    isMobile(): boolean
    // extended props ts
    aborted: boolean
}

export type IncludeOptionsReturning = <T>(req: APIRequest<T>) => Array<Model<any, any> | IncludeOptions>;

export interface APIResponse extends express.Response {
    jsonContent(body: any, headers?: any | null, pagination?: any | null)
    setAuthCookie(token: string, unset?: boolean, admin?: boolean)
}

export interface ModelRouteRequest<Model, BodyParameters = any> extends APIRequest<BodyParameters> {
    currentModel: Model;
}

export type APINextFunction = express.NextFunction

type ValidationContainer = { [key: string]: (ValidatorFunction<any> | ValidatorFunction<any>[] | ValidationContainer) }

export class BasicRouter {
    internalRouter: express.Router;

    /**
     * Constructs a new basic router object
     */
    constructor() {
        this.internalRouter = express.Router();
        const asyncMiddleware = (fn) =>
            (req, res, next) => {
                Promise.resolve(fn(req, res, next))
                    .catch(next);
            };
        ['get', 'post', 'put', 'delete', 'options', 'head', 'all'].forEach(verb => {
            const _impl = this.internalRouter[verb].bind(this.internalRouter);
            this.internalRouter[verb] = function (path: string, ...handler: any[]) {
                handler = handler.map(h => {
                    return asyncMiddleware(h)
                })
                _impl(path, handler)
            }
        })
    }

    /**
     * This function returns the internal router object
     * @returns {express.Router} - Returns the internal router
     */
    getInternalRouter(): express.Router {
        return this.internalRouter;
    }

    /**
     * This function allows requiring keys for a request
     * @param keys - The keys that have to be present in the request body
     * @returns {Function} - Returns a middleware to use in express
     */
    static requireKeys(keys: Array<string>): express.RequestHandler {
        return function (req: express.Request, res: APIResponse, next: express.NextFunction) {
            let missingKeys: Array<string> = [];
            for (let key of keys) {
                if (req.body[key] == undefined) {
                    missingKeys.push(key);
                }
            }
            if (missingKeys.length > 0) {
                next(new InvalidParametersError(missingKeys, {}))
            } else {
                next();
            }
        }
    }


    /**
     * This function allows requiring keys for a request
     * @param keys - The keys that have to be present in the request body
     * @returns {Function} - Returns a middleware to use in express
     */
    static requireKeysOfTypes(keys: ValidationContainer, keyPath?: string): express.RequestHandler {

        function checkTypes(body: any, keys: ValidationContainer, keyPath?: string, use_keypath?: boolean): Promise<void> {
            return new Promise(async (resolve, reject) => {

                if (keyPath && use_keypath !== false) {
                    body = body[keyPath];
                    if (!body) {
                        return reject(new InvalidParametersError([keyPath], {}));
                    }
                }
                let missingKeys: Array<string> = [];
                let invalidKeys: { [key: string]: string } = {};
                for (let key of Object.keys(keys)) {
                    let requiredValueIsOptional: boolean = false;
                    requiredValueIsOptional = key.endsWith('?');
                    let requiredValue = keys[key];
                    key = key.replace('?', '');
                    if (body[key] == undefined) {
                        if (!requiredValueIsOptional) {
                            missingKeys.push(Boolean(keyPath) ? keyPath + '.' + key : key);
                        }
                    } else {
                        let compareValue = body[key];
                        if (Array.isArray(requiredValue)) {
                            for (let checker of requiredValue) {
                                let result = checker(compareValue);
                                if (result !== true) {
                                    invalidKeys[(Boolean(keyPath) ? keyPath + '.' + key : key)] = result;
                                    break;
                                }
                            }
                        } else if (isObject(requiredValue)) {
                            try {
                                await checkTypes(compareValue, <any>requiredValue, (Boolean(keyPath) ? keyPath + '.' + key : key), false);
                            } catch (error) {
                                return reject(error);
                            }
                        } else {
                            let result = (<any>requiredValue)(compareValue);
                            if (result !== true) {
                                invalidKeys[(Boolean(keyPath) ? keyPath + '.' + key : key)] = result;
                            }
                        }
                    }
                }
                if (missingKeys.length > 0 || Object.keys(invalidKeys).length > 0) {
                    reject(new InvalidParametersError(missingKeys, invalidKeys))
                } else {
                    resolve();
                }
            })

        }

        return function (req: express.Request, res: APIResponse, next: express.NextFunction) {
            checkTypes(req.body, keys, keyPath).then(() => {
                next()
            }).catch(next);
        }
    }

    static populateModel(model: string | Sequelize.Model<any, any>, param: string, include?: Array<Model<any, any> | IncludeOptions> | IncludeOptionsReturning) {
        return function (req: ModelRouteRequest<any, any>, res: APIResponse, next: express.NextFunction) {

            function model_name(): string {
                if (typeof model === 'string') {
                    return model
                }
                return (model.getTableName() as string)
            }

            if (model_name() === 'User' && req.params[param] === 'me') {
                req.params[param] = req.currentUser!.id as string;
            }
            var includeData: Array<Model<any, any> | IncludeOptions>;
            if (typeof include === 'function') {
                includeData = include(req);
            } else {
                includeData = <any>include;
            }
            (typeof model === 'string' ? req.sequelize.model(model) : model).findOne({
                where: { id: req.params[param] },
                include: includeData
            }).then((foundmodel) => {
                if (foundmodel) {
                    req.currentModel = foundmodel;
                    next();
                    return null
                } else {
                    return next(new ResourceNotFoundError(model_name() + ' not found', model_name()));
                }
            });
        }
    }
}
