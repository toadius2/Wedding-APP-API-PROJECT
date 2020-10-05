import BasicError from "./baseerror"

/**
 * This error class indicates a sessionnotfounderror
 */

export default class SessionNotFoundError extends BasicError {
    type: string;
    status: number;

    /**
     * Constructs a new SessionNotFoundError
     * @param message - The error message
     */
    constructor(message: string = 'No session was found for this token') {
        super(message);
        Object.setPrototypeOf(this, SessionNotFoundError.prototype);
        this.type = 'SessionNotFoundError';
        this.status = 401;
    }
}