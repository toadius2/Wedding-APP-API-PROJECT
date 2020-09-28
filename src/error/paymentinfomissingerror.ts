import BasicError from "./baseerror"

export default class PaymentInfoMissingError extends BasicError {
    type: string;
    status: number;

    /**
     * Constructs a new PaymentInfoMissingError
     * @param message - The error message
     */
    constructor(message: string = 'Payment info is missing') {
        super(message);
        Object.setPrototypeOf(this, PaymentInfoMissingError.prototype);
        this.type = 'PaymentInfoMissingError';
        this.status = 402;
    }
}