import BasicError from "./baseerror"

/**
 * This error class indicates a invalidloginerror
 */

export default class InvalidLoginError extends BasicError {
    type: string;
    status: number;

    /**
     * Constructs a new InternalServerError
     * @param error - The error that occurred
     * @param message - The error message
     */
    constructor(message: string = 'Invalid login') {
        super(message);
        Object.setPrototypeOf(this, InvalidLoginError.prototype);

        this.type = 'InvalidLoginError';
        this.status = 401;
    }
}