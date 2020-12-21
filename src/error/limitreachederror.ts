import BasicError from "./baseerror"

/**
 * This error class indicates a LimitReachedError
 */

export default class LimitReachedError extends BasicError {
    type: string;
    status: number;

    /**
     * Constructs a new LimitReachedError
     * @param message - The error message
     */
    constructor(message: string = 'Limit reached') {
        super(message);
        Object.setPrototypeOf(this, LimitReachedError.prototype);
        this.type = 'LimitReachedError';
        this.status = 403;
    }
}