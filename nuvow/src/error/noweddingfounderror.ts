import BasicError from "./baseerror"

/**
 * This error class indicates a NoWeddingFoundError
 */

export default class NoWeddingFoundError extends BasicError {
    type: string;
    status: number;

    /**
     * Constructs a new NoWeddingFoundError
     * @param message - The error message
     */
    constructor(message: string = 'NoWeddingFoundError') {
        super(message);
        Object.setPrototypeOf(this, NoWeddingFoundError.prototype);
        this.type = 'NoWeddingFoundError';
        this.status = 403;
    }
}