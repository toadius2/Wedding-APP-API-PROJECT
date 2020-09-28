import BasicError from "./baseerror"
import * as sequelize from "sequelize";

/**
 * This error class indicates a validationerror
 */

export default class ValidationError extends BasicError {
    type: string;
    status: number;
    missingKeys: Array<string>;
    invalidKeys: Array<string>;

    /**
     * Constructs a new ValidationError
     * @param errors - The errors that happened
     * @param message - The error message
     */
    constructor(errors: Object = {}, message: string = 'ValidationError') {
        super(message);
        Object.setPrototypeOf(this, ValidationError.prototype);
        this.missingKeys = [];
        this.invalidKeys = [];

        if (Array.isArray(errors)) {
            this.invalidKeys = errors.map((error: sequelize.ValidationErrorItem) => {
                return error.path;
            })
        } else {
            for (let key of Object.keys(errors)) {
                let object = errors[key];
                if (object['kind'] && object['kind'] === 'required') {
                    this.missingKeys.push(key);
                } else {
                    this.invalidKeys.push(key);
                }
            }
        }

        this.type = 'ValidationError';
        this.status = 400;
    }
}
