import BasicError from "./baseerror"

/**
 * This error class indicates a internalservererror
 */

export default class InternalServerError extends BasicError {
    encapsulatedError: Error;
    type: string;
    status: number;
    logIngo: string;

    /**
     * Constructs a new InternalServerError
     * @param error - The error that occurred
     * @param message - The error message
     */
    constructor(error: Error, message: string = 'Internal server error', logInfo?: string) {
        if (typeof error === 'string') {
            super(error);
            Object.setPrototypeOf(this, InternalServerError.prototype);
        } else {
            super(message);
            Object.setPrototypeOf(this, InternalServerError.prototype);
            this.encapsulatedError = error;
        }
        this.type = 'InternalServerError';
        this.status = 500;
        this.isCritical = true;
    }
}