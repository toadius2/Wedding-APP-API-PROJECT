import * as express from "express"
import * as logger from "./logger"
import * as error from "./error"
import * as bodyparser from "body-parser"
import * as Sequelize from "sequelize"
import { prepareErrorForResponse } from "./error/errormiddleware"
import { APIRequest, ExtendedSequelize, APIResponse } from "./router/basicrouter"
import { default as Routers } from "./router"
import * as bearerToken from 'express-bearer-token';
import * as nconf from "nconf"
import DBCache from 'gradelo-db-cache'
import applyCORS from "./router/middleware/cors";

export default class Server {
    app: express.Express;
    db_cache?: DBCache
    private sequelize: Sequelize.Sequelize;

    constructor(new_sequelize: Sequelize.Sequelize, port: number) {
        this.app = express();
        if (nconf.get('REDIS_CONNECTION')) {
            this.db_cache = new DBCache({
                redis_url: nconf.get('REDIS_CONNECTION') || 'localhost',
                room: nconf.get('NODE_ENV') || 'development'
            })
        }
        this.sequelize = new_sequelize;

        this.app.listen(port, () => {
            logger.info("REST server started");
        });

        this.setupHTTPApp();
    }

    private setupHTTPApp() {
        this.app.use((req: APIRequest, res: APIResponse, callback) => {
            res.jsonContent = (body: any, headers?: any | null, pagination?: any | null) => {
                if (Array.isArray(body)) {
                    body = body.map((data) => {
                        if (data.toJSON) {
                            return data.toJSON({ currentUser: req.currentUser })
                        }
                        return data
                    })
                } else if (body.toJSON) {
                    body = body.toJSON({ currentUser: req.currentUser })
                }
                let payload = { data: body };
                if (pagination) {
                    payload['pagination'] = pagination
                }
                if (headers) {
                    payload['headers'] = headers
                }
                res.json(payload);
            };
            callback();
        });
        this.app.use(applyCORS);
        this.app.use(bodyparser.json({
            limit: '20mb'
        }));
        this.app.use(bearerToken());
        this.app.disable('etag');
        this.app.disable('x-powered-by');

        this.app.use((req: APIRequest, res, next) => {
            req.sequelize = <ExtendedSequelize>this.sequelize;
            req.db_cache = this.db_cache;
            next();
        });

        this.app.get("/healthping", (req: APIRequest, res, next) => {
            req.sequelize.query("SELECT 1+1 AS result").then(() => {
                res.status(200).end();
            }).catch(next);
        });

        Object.keys(Routers).forEach((version) => {
            Routers[version].forEach((router) => {
                this.app.use("/" + version, router.getInternalRouter());
            });
        });

        this.app.use((req: express.Request, res: APIResponse, next: express.NextFunction) => {
            next(new error.RouteNotFoundError('Route not found', req.path));
        });
        this.app.use((errRaw: any, req: express.Request, res: APIResponse, next: express.NextFunction) => {
            let err = prepareErrorForResponse(errRaw);
            res.status((<any>err).status || (<any>err).statusCode || 500);
            res.json({
                message: err.message,
                error: err.toErrorJSON()
            });
        })
    }
}
