import BasicError from "./baseerror"

/**
 * This error class indicates a NotImplementedError
 */

export default class NotImplementedError extends BasicError {
    type: string;
    status: number;

    /**
     * Constructs a new WrongImplementationError
     * @param message - The error message
     */
    constructor(message: string = "This is not yet implemented") {
        super(message);
        Object.setPrototypeOf(this, NotImplementedError.prototype);
        this.type = 'NotImplementedError';
        this.status = 500;
        this.isCritical = true;
    }
}