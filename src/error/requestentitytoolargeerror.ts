<<<<<<< HEAD
import BasicError from "./baseerror"

/**
 * This error class indicates a RequestEntityTooLarge
 */

export default class RequestEntityTooLargeError extends BasicError {
    type: string;
    status: number;

    /**
     * Constructs a new RequestEntityTooLarge
     * @param message - The error message
     */
    constructor() {
        super("Request entity is too large");
        Object.setPrototypeOf(this, RequestEntityTooLargeError.prototype);
        this.type = 'RequestEntityTooLarge';
        this.status = 413;
    }
=======
import BasicError from "./baseerror"

/**
 * This error class indicates a RequestEntityTooLarge
 */

export default class RequestEntityTooLargeError extends BasicError {
    type: string;
    status: number;

    /**
     * Constructs a new RequestEntityTooLarge
     * @param message - The error message
     */
    constructor() {
        super("Request entity is too large");
        Object.setPrototypeOf(this, RequestEntityTooLargeError.prototype);
        this.type = 'RequestEntityTooLarge';
        this.status = 413;
    }
>>>>>>> c2067604d8d706b34f7e84642e35a212911907c3
}