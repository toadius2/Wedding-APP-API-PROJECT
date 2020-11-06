import BasicError from "../../error/baseerror";
import * as nconf from "nconf";
import * as GoogleAuth from "google-auth-library";

/**
 * This interface defines the data returned from a google token validation
 */
export interface GoogleAuthenticationData {
    name: string;
    email?: string;
    id: string;
}

/**
 * This class defines a generic error when communicating with the google API
 */
export class GenericGoogleError extends BasicError {
    encapsulatedError?: any;

    constructor(message: string = 'An error occurred', error?: any) {
        super(message);
        Object.setPrototypeOf(this, GenericGoogleError.prototype);
        this.encapsulatedError = error;
    }
}

/**
 * This class defines an error with the google api when the provided authentication token is not valid or expired
 */
export class GoogleTokenExpiredError extends GenericGoogleError {
    constructor(message: string = 'Invalid google token', error?: any) {
        super(message, error);
        Object.setPrototypeOf(this, GoogleTokenExpiredError.prototype);
        this.status = 401;
        this.type = "InvalidGoogleToken";
    }
}

/**
 * This function returns a promise containing GoogleAuthenticationData
 * @param {string} google_token - A google authentication token with email access right
 * @returns {Promise<GoogleAuthenticationData>}
 */
export function validateGoogleToken(google_token: string): Promise<GoogleAuthenticationData> {
    return new Promise<GoogleAuthenticationData>((resolve, reject) => {

        const client = new GoogleAuth.OAuth2Client(nconf.get('GOOGLE_CLIENT_ID'), nconf.get('GOOGLE_CLIENT_SECRET'))

        client.verifyIdToken({
            idToken: google_token,
            audience: [nconf.get('GOOGLE_CLIENT_ID')]
        }).then((loginData) => {
            if (!loginData) {
                reject(new GenericGoogleError());
                return;
            }
            let payload = loginData.getPayload();
            if (!payload) {
                reject(new GoogleTokenExpiredError());
                return;
            }
            let userId = loginData.getUserId();
            let display_name = payload.name;
            let email = payload.email;
            return resolve(<GoogleAuthenticationData>{
                name: display_name,
                email: email,
                id: userId
            })
        }).catch((error) => {
            return reject(new GoogleTokenExpiredError("A request error occurred", error));
        });
    });
}
