export default class BasicError extends Error {
    isCritical?: boolean = false;
    type: string = 'InternalServerError';
    status: number = 500;
    message: string;

    constructor(message?: any) {
        super(message);
        Object.setPrototypeOf(this, BasicError.prototype);
    }

    toErrorJSON(): any {
        return {
            "type": this.type,
            "status": this.status,
            "message": this.message
        }
    }
}
