import BasicError from "./baseerror"

/**
 * This error class indicates a ResourceAlreadyExists
 */

export default class ResourceNotFoundError extends BasicError {
    type: string;
    status: number;
    resource_type: string;

    /**
     * Constructs a new ResourceNotFoundError
     * @param message - The error message
     */
    constructor(message: string = 'Resource not found', resource_type: string) {
        super(message);
        Object.setPrototypeOf(this, ResourceNotFoundError.prototype);
        this.type = 'ResourceNotFound';
        this.resource_type = resource_type;
        this.status = 404;
    }

    toErrorJSON(): any {
        let dict = super.toErrorJSON();
        if (this.resource_type !== 'unknown') {
            dict["resource_type"] = this.resource_type;
        }
        return dict;
    }
}
