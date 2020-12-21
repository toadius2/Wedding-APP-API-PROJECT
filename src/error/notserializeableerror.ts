import BasicError from "./baseerror"

/**
 * This error class indicates a NotSerializeableError
 */

export default class NotSerializeableError extends BasicError {
    type: string;
    status: number;

    /**
     * Constructs a new NotSerializeableError
     * @param message - The error message
     */
    constructor() {
        super("Not NotSerializeable Message given");
        Object.setPrototypeOf(this, NotSerializeableError.prototype);
        this.type = 'NotSerializeableError';
        this.status = 400;
    }
}