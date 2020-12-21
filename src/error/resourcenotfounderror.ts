<<<<<<< HEAD
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
        this.message = `${resource_type || 'Resource'} not found`
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
=======
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
        this.message = `${resource_type || 'Resource'} not found`
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
>>>>>>> c2067604d8d706b34f7e84642e35a212911907c3
