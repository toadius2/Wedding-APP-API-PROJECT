import BasicError from "./baseerror"

/**
 * This error class indicates a missingauthorizationerror
 */

export default class MissingAuthorizationError extends BasicError {
    type: string;
    status: number;

    /**
     * Constructs a new MissingAuthorizationError
     * @param message - The error message
     */
    constructor(message: string = 'Authorization header missing') {
        super(message);
        Object.setPrototypeOf(this, MissingAuthorizationError.prototype);
        this.type = 'MissingAuthorizationError';
        this.status = 401;
    }
}