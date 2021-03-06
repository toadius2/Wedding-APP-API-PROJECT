<<<<<<< HEAD
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
import * as cookieParser from 'cookie-parser'
import { DOMAINS } from "./config"

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
            req.invalidateCache = (forToken?: string) => {
                if (req.db_cache && (forToken || req.token || req.cookies['bpm_session'])) {
                    req.db_cache.invalidateModel('Device', forToken || req.token || req.cookies['bpm_session'])
                }
            }
            req.isMobile = () => {
                return Boolean(req.headers['user-agent'] && req.headers['user-agent'].startsWith('bpmmobile'))
            }
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
                    if (req.query['skip']) {
                        payload['pagination'].skipped = req.query['skip'];
                    }
                    if (req.query['limit']) {
                        payload['pagination'].limited = req.query['limit'];
                        if (req.query['skip']) {
                            pagination['page'] = Math.ceil(parseInt(req.query['skip'] as string) / parseInt(req.query['limit'] as string)) + 1
                        }
                    }
                }
                if (headers) {
                    payload['headers'] = headers
                }
                res.json(payload);
            };
            res.setAuthCookie = (token: string, unset: boolean = false, admin: boolean = false) => {
                let domain = DOMAINS[0].replace(/[^a-zA-Z]/gi, '')
                const key = admin ? `${domain}_session_admin` : `${domain}_session`
                if (unset) {
                    DOMAINS.forEach(domain => {
                        res.clearCookie(key, {
                            secure: false,
                            path: '/',
                            domain: domain
                        })
                    })
                } else {
                    DOMAINS.forEach(domain => {
                        res.cookie(key, token, {
                            secure: false,
                            path: '/',
                            domain: domain
                        })
                    })
                }
            };
            callback();
        });
        this.app.use(applyCORS);
        this.app.use(bodyparser.json({
            limit: '20mb'
        }));
        this.app.use(bearerToken());
        this.app.use(cookieParser());
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
            let err = prepareErrorForResponse(errRaw, req.path);
            res.status((<any>err).status || (<any>err).statusCode || 500);
            res.json({
                message: err.message,
                error: err.toErrorJSON()
            });
        })
    }
=======
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
import * as cookieParser from 'cookie-parser'
import { DOMAINS } from "./config"

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
            req.invalidateCache = (forToken?: string) => {
                if (req.db_cache && (forToken || req.token || req.cookies['bpm_session'])) {
                    req.db_cache.invalidateModel('Device', forToken || req.token || req.cookies['bpm_session'])
                }
            }
            req.isMobile = () => {
                return Boolean(req.headers['user-agent'] && req.headers['user-agent'].startsWith('bpmmobile'))
            }
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
                    if (req.query['skip']) {
                        payload['pagination'].skipped = req.query['skip'];
                    }
                    if (req.query['limit']) {
                        payload['pagination'].limited = req.query['limit'];
                        if (req.query['skip']) {
                            pagination['page'] = Math.ceil(parseInt(req.query['skip'] as string) / parseInt(req.query['limit'] as string)) + 1
                        }
                    }
                }
                if (headers) {
                    payload['headers'] = headers
                }
                res.json(payload);
            };
            res.setAuthCookie = (token: string, unset: boolean = false, admin: boolean = false) => {
                let domain = DOMAINS[0].replace(/[^a-zA-Z]/gi, '')
                const key = admin ? `${domain}_session_admin` : `${domain}_session`
                if (unset) {
                    DOMAINS.forEach(domain => {
                        res.clearCookie(key, {
                            secure: false,
                            path: '/',
                            domain: domain
                        })
                    })
                } else {
                    DOMAINS.forEach(domain => {
                        res.cookie(key, token, {
                            secure: false,
                            path: '/',
                            domain: domain
                        })
                    })
                }
            };
            callback();
        });
        this.app.use(applyCORS);
        this.app.use(bodyparser.json({
            limit: '20mb'
        }));
        this.app.use(bearerToken());
        this.app.use(cookieParser());
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
            let err = prepareErrorForResponse(errRaw, req.path);
            res.status((<any>err).status || (<any>err).statusCode || 500);
            res.json({
                message: err.message,
                error: err.toErrorJSON()
            });
        })
    }
>>>>>>> c2067604d8d706b34f7e84642e35a212911907c3
}