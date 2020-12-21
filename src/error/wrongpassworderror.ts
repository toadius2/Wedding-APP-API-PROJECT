import BasicError from "./baseerror"

/**
 * This error class indicates a wrongpasswroderror
 */

export default class WrongPasswordError extends BasicError {
    type: string;
    status: number;

    /**
     * Constructs a new WrongPasswordError
     * @param message - The error message
     */
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, WrongPasswordError.prototype);
        this.type = 'WrongPasswordError';
        this.status = 403;
    }
}