import BasicError from "./baseerror"

/**
 * This error class indicates a routenotfounderror
 */

export default class RouteNotFoundError extends BasicError {
    type: string;
    status: number;

    /**
     * Constructs a new RouteNotFoundError
     * @param message - The error message
     */
    constructor(message: string = 'Route not found', public path: string = '') {
        super(message + " " + path);
        Object.setPrototypeOf(this, RouteNotFoundError.prototype);
        this.type = 'RouteNotFoundError';
        this.status = 404;
    }
}