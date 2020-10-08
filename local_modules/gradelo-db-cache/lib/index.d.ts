export declare class NotFoundError extends Error {
    constructor(message?: string);
}
export declare class GenericError extends Error {
    constructor(message?: string);
}
export declare enum LogLevel {
    NONE = 0,
    WARNING = 1,
    INFO = 2,
    VERBOSE = 3
}
export declare const CACHE_DEFAULT_EXPIRE = 120;
export interface DBCacheOptions {
    redis_url: string;
    log_level?: LogLevel;
    logger?: (err: Error | undefined, message: string) => void;
    room?: string;
    ttl?: number;
}

export default class DBCache {
    private options;
    private redisConnection;
    constructor(options: DBCacheOptions);
    /**
     * Cache a object in the given room (if given), at the model name and the given uniqueidentifier
     * @param modelinstance
     * @param modelName
     * @param uniqueIdentifier
     */
    cacheModel(modelinstance: any, modelName: string, uniqueIdentifier: string): void;
    /**
     * Retrieve cached object. This method will reset the expiration timer.
     * Rejects with NotFoundError if object is not in cache
     * @param modelName the model name
     * @param uniqueIdentifier the identifier
     */
    getModel<T>(modelName: string, uniqueIdentifier: string): Promise<T>;
    /**
     * Removes a model from the cache
     * @param modelName
     * @param uniqueidentifier
     */
    invalidateModel(modelName: string, uniqueidentifier: string): void;
    private keyForObject;
    private startRedisConnection;
    private log;
}
