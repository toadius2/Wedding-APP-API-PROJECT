import * as Redis from 'ioredis'
import * as util from 'util'

export class NotFoundError extends Error {
    constructor(message: string = 'Ressource not found') {
        super(message);
        Object.setPrototypeOf(this, Error.prototype);
    }
}

export class GenericError extends Error {
    constructor(message: string = 'Generic unhandled Error') {
        super(message);
        Object.setPrototypeOf(this, Error.prototype);
    }
}

export enum LogLevel {
    NONE = 0,
    WARNING = 1,
    INFO = 2,
    VERBOSE = 3
}

export const CACHE_DEFAULT_EXPIRE = 120;

export interface DBCacheOptions {
    redis_url: string;
    log_level?: LogLevel;
    logger?: (err: Error | undefined, message: string) => void;
    room?: string;
    // Expire after ttl seconds, Default is CACHE_DEFAULT_EXPIRE
    ttl?: number;
    // The time the object ttl can be reseted. 
    //maximum_object_ttl?: number;
}

export default class DBCache {
    private redisConnection: Redis.Redis;
    constructor(private options: DBCacheOptions) {
        this.options.log_level = this.options.log_level || LogLevel.WARNING;
        this.options.ttl = this.options.ttl || CACHE_DEFAULT_EXPIRE;
        this.options.logger = this.options.logger || ((err: Error | undefined, message: string) => {
            if (err) {
                console.error(err);
                message && console.error(message)
            } else {
                console.info(message);
            }
        });
        this.startRedisConnection(options.redis_url)
    }

    /**
     * Cache a object in the given room (if given), at the model name and the given uniqueidentifier
     * @param modelinstance 
     * @param modelName
     * @param uniqueIdentifier 
     */
    public cacheModel(modelinstance: any, modelName: string, uniqueIdentifier: string) {
        this.redisConnection.set(this.keyForObject(modelName, uniqueIdentifier), JSON.stringify(modelinstance), 'EX', this.options.ttl!);
        this.log(undefined, JSON.stringify({
            type: 'db-cache-info',
            content: 'DB-CACHE: Object stored for model ' + modelName + ' with id ' + uniqueIdentifier,
            timestamp: new Date()
        }), LogLevel.VERBOSE);
    }
    /**
     * Retrieve cached object. This method will reset the expiration timer. 
     * Rejects with NotFoundError if object is not in cache
     * @param modelName the model name
     * @param uniqueIdentifier the identifier
     */
    public getModel<T>(modelName: string, uniqueIdentifier: string) {
        return new Promise<T>((resolve, reject) => {
            let key = this.keyForObject(modelName, uniqueIdentifier)
            this.redisConnection.get(key, (err, result) => {
                if (err || result == undefined) {
                    reject(new NotFoundError());
                    this.log(undefined, JSON.stringify({
                        type: 'db-cache-info',
                        content: 'DB-CACHE: Object not found for model ' + modelName + ' with id ' + uniqueIdentifier,
                        timestamp: new Date()
                    }), LogLevel.VERBOSE);
                } else {
                    try {
                        let obj = JSON.parse(result)
                        /*if (this.options.maximum_object_ttl !== undefined) {
                            obj.__db_cache_ttl_resets__ = obj.__db_cache_ttl_resets__ || this.redisConnection.;
                            let total = obj.__db_cache_ttl_resets__ * this.options.ttl!;
                            if (total > (this.options.maximum_object_ttl - this.options.ttl!)) {
                                reject(new NotFoundError());
                                this.log(undefined, JSON.stringify({
                                    type: 'db-cache-info',
                                    content: 'DB-CACHE: Object expired with maximum ttl ' + this.options.maximum_object_ttl + ' for model ' + modelName + ' with id ' + uniqueIdentifier,
                                    timestamp: new Date()
                                }), LogLevel.VERBOSE);
                                return;
                            } else {
                                obj.__db_cache_ttl_resets__ += 1;
                                this.cacheModel(obj, modelName, uniqueIdentifier);
                                delete obj.__db_cache_ttl_resets__;
                            }

                        } else {
                            this.redisConnection.expire(key, this.options.ttl!);
                        }*/
                        resolve(obj);
                        this.redisConnection.expire(key, this.options.ttl!);
                        this.log(undefined, JSON.stringify({
                            type: 'db-cache-info',
                            content: 'DB-CACHE: Object found for model ' + modelName + ' with id ' + uniqueIdentifier,
                            timestamp: new Date()
                        }), LogLevel.VERBOSE);
                    } catch (e) {
                        reject(new GenericError());
                        this.log(undefined, JSON.stringify({
                            type: 'db-cache-error',
                            content: 'DB-CACHE: Object found for model ' + modelName + ' with id ' + uniqueIdentifier + ', but error parsing object ' + result,
                            timestamp: new Date()
                        }), LogLevel.WARNING);
                    }
                }
            })
        })
    }
    /**
     * Removes a model from the cache
     * @param modelName 
     * @param uniqueidentifier 
     */
    public invalidateModel(modelName: string, uniqueidentifier: string) {
        this.redisConnection.del(this.keyForObject(modelName, uniqueidentifier));
    }

    private keyForObject(modelName: string, uniqueIdentifier: string): string {
        return (this.options.room != undefined ? (this.options.room + '/') : '') + modelName + '/' + uniqueIdentifier
    }

    private startRedisConnection(url: string) {
        this.redisConnection = new Redis(url, {
            retryStrategy: function (times) {
                if (times < 3) {
                    return 200;
                } else {
                    if (process.env['NODE_ENV'] === 'development') {
                        return false
                    }
                    return 10000;
                }
            },
            enableOfflineQueue: false
        });
        this.redisConnection.on('connect', () => {
            this.log(undefined, JSON.stringify({
                type: 'db-cache-info',
                content: 'DB-CACHE: Connection Established',
                timestamp: new Date()
            }), LogLevel.INFO);
        });

        this.redisConnection.on('ready', () => {
            this.log(undefined, JSON.stringify({
                type: 'db-cache-info',
                content: 'DB-CACHE: Connection Ready',
                timestamp: new Date()
            }), LogLevel.INFO);
        });

        this.redisConnection.on('error', (error) => {
            this.log(error, JSON.stringify({
                type: 'db-cache-error',
                content: 'DB-CACHE: ' + util.inspect(error),
                timestamp: new Date()
            }), LogLevel.WARNING);
        });

        this.redisConnection.on('nodeError', (error) => {
            this.log(error, JSON.stringify({
                type: 'db-cache-error',
                content: 'DB-CACHE: ' + util.inspect(error),
                timestamp: new Date()
            }), LogLevel.WARNING);
        });

        this.redisConnection.on('reconnecting', () => {
            this.log(undefined, JSON.stringify({
                type: 'db-cache-info',
                content: 'DB-CACHE: Reconnecting...',
                timestamp: new Date()
            }), LogLevel.INFO);
        });
    };

    private log(err: Error | undefined, message: string, level: LogLevel) {
        if (this.options.log_level! >= level) {
            this.options.logger!(err, message);
        }
    }
}