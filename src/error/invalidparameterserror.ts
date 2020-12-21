import BasicError from "./baseerror"

/**
 * This error class indicates a invalidparameterserror
 */

export default class InvalidParametersError extends BasicError {
    type: string;
    status: number;
    missingKeys: Array<string>;
    invalidKeys: { [key: string]: string };

    /**
     * Initializes a new InvalidParametersError
     * @param {Array<string>} missingParameters
     * @param {Array<string>} invalidParameters
     * @param {string} message
     */
    constructor(missingParameters: Array<string>, invalidParameters: { [key: string]: string }, message: string = 'Invalid parameters') {
        super(message);
        Object.setPrototypeOf(this, InvalidParametersError.prototype);
        this.missingKeys = missingParameters;
        this.invalidKeys = invalidParameters;
        this.type = 'InvalidParametersError';
        this.status = 400;
    }

    toErrorJSON(): any {
        return Object.assign({}, super.toErrorJSON(), {
            "missing_keys": this.missingKeys,
            "invalid_keys": this.invalidKeys
        })
    }

}