import BasicError from "./baseerror"

/**
 * This error class indicates a SessionExpiredError
 */

export default class SessionExpiredError extends BasicError {
    type: string;
    status: number;

    /**
     * Constructs a new SessionExpiredError
     * @param message - The error message
     */
    constructor(message: string = 'Session is expired') {
        super(message);
        Object.setPrototypeOf(this, SessionExpiredError.prototype);
        this.type = 'SessionExpiredError';
        this.status = 401;
    }
}