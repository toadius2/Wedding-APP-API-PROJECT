import * as request from 'request'
import BasicError from "../../error/baseerror";

/**
 * This interface defines the data returned from a facebook token validation
 */
export interface FacebookAuthenticationData {
    name: string;
    email?: string;
    id: string;
}

/**
 * This class defines a generic error when communicating with the facebook API
 */
export class GenericFacebookError extends BasicError {
    encapsulatedError?: any;

    constructor(message: string = 'An error occurred', error?: any) {
        super(message);
        Object.setPrototypeOf(this, GenericFacebookError.prototype);
        this.encapsulatedError = error;
    }
}

/**
 * This class defines an error with the facebook api when the provided authentication token is not valid or expired
 */
export class FacebookTokenExpiredError extends GenericFacebookError {
    constructor(message: string = 'Invalid facebook token', error?: any) {
        super(message, error);
        Object.setPrototypeOf(this, FacebookTokenExpiredError.prototype);
        this.status = 401;
        this.type = "InvalidFacebookToken";
    }
}

/**
 * This function returns a promise containing FacebookAuthenticationData
 * @param {string} fb_token - A facebook authentication token with email access right
 * @returns {Promise<FacebookAuthenticationData>}
 */
export function validateFacebookToken(fb_token: string): Promise<FacebookAuthenticationData> {
    return new Promise<FacebookAuthenticationData>((resolve, reject) => {
        const options = {
            url: 'https://graph.facebook.com/v2.8/me?fields=name,id,email&access_token=' + fb_token
        };

        function callback(error, response, body) {
            if (!error) {
                const info = JSON.parse(body);

                if (info['error'] && info['error']['type']) {
                    if (info['error']['type'] === 'OAuthException') {
                        return reject(new FacebookTokenExpiredError());
                    } else {
                        return reject(new GenericFacebookError());
                    }
                } else {

                    const display_name = info['name'];
                    const email = info['email'];
                    const userId = info['id'];

                    if (!display_name || !userId) {
                        return reject(new GenericFacebookError());
                    }

                    return resolve(<FacebookAuthenticationData>{
                        name: display_name,
                        email: email,
                        id: userId
                    })
                }
            } else {
                return reject(new GenericFacebookError("A request error occurred", error));
            }
        }

        request(options, callback);
    });
}