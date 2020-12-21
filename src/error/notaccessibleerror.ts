import BasicError from "./baseerror"

/**
 * This error class indicates a notaccessibleerror
 */

export default class NotAccessibleError extends BasicError {
    type: string;
    status: number;

    /**
     * Constructs a new NotAccessibleError
     * @param message - The error message
     */
    constructor(message: string = 'This resource is not accessible') {
        super(message);
        Object.setPrototypeOf(this, NotAccessibleError.prototype);
        this.type = 'NotAccessibleError';
        this.status = 403;
    }
}