import BasicError from "./baseerror"

/**
 * This error class indicates a ResourceAlreadyExists
 */

export default class ResourceAlreadyExists extends BasicError {
    type: string;
    status: number;
    existing_keys: string[];

    /**
     * Constructs a new ResourceAlreadyExists
     * @param message - The error message
     * @param existing_keys - The keys that were duplicated
     */
    constructor(message: string = 'Resource already exists', existing_keys: string[] = []) {
        super(message);
        Object.setPrototypeOf(this, ResourceAlreadyExists.prototype);
        this.type = 'ResourceAlreadyExists';
        this.status = 403;
        this.existing_keys = existing_keys;
    }
    
    toErrorJSON(): any {
        return Object.assign({}, super.toErrorJSON(), {
            "existing_keys": this.existing_keys,
        })
    }
}