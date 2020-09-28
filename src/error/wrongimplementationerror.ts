import BasicError from "./baseerror"

/**
 * This error class indicates a WrongImplementationError
 */

export default class WrongImplementationError extends BasicError {
    type: string;
    status: number;

    /**
     * Constructs a new WrongImplementationError
     * @param message - The error message
     */
    constructor(message = "Wrong implementation!") {
        super(message);
        Object.setPrototypeOf(this, WrongImplementationError.prototype);
        this.type = 'WrongImplementationError';
        this.status = 200; // send 200 anyway to prevent client errors, cause this is API workaround
    }
}