import BaseError from "./baseerror"

/**
 * This error class indicates a db not found error
 */
export default class DBNotFoundError extends BaseError {
    type: string;
    status: number;

    /**
     * Constructs a new DB not found error
     * @param message - The error message
     */
    constructor(message: string = 'Resource not found') {
        super(message);
        Object.setPrototypeOf(this, DBNotFoundError.prototype);
        this.type = 'DBNotFoundError';
        this.status = 404;
    }
}