import BasicError from "./baseerror"

/**
 * This error class indicates a genericdberror
 */

export default class GenericDBError extends BasicError {
    encapsulatedError: Error;
    type: string;
    status: number;

    /**
     * Constructs a new GenericDBError
     * @param encapsulatedError - The error that came from the database
     * @param message - The error message
     */
    constructor(encapsulatedError: Error, message: string = 'An internal error occurred') {
        super(message);
        Object.setPrototypeOf(this, GenericDBError.prototype);
        this.encapsulatedError = encapsulatedError;
        this.type = 'GenericDBError';
        this.status = 500;
        this.isCritical = true;
    }
}