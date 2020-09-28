import * as AWS from "aws-sdk";

export class PushServer {

    private SNS: AWS.SNS;

    /**
     * Construct a new push server
     * @param options - The options to pass to AWS sdk
     */
    constructor() {
        this.SNS = new AWS.SNS();
    }

    /**
     * Register a new device to the push service
     * @param applicationARN - The applications ARN
     * @param {String} deviceToken - The token of the device
     * @returns {Promise}
     */
    registerNewDevice(applicationARN: string, deviceToken: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this.SNS.createPlatformEndpoint({ PlatformApplicationArn: applicationARN, Token: deviceToken },
                function (err, result) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
        });
    };

    /**
     * Update a devices token
     * @param endpointARN - The ARN of the endpoint
     * @param newDeviceToken - The new device token
     * @returns {Promise}
     */
    updateDeviceToken(endpointARN: string, newDeviceToken: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this.SNS.setEndpointAttributes({
                EndpointArn: endpointARN,
                Attributes: { Enabled: "true", Token: newDeviceToken }
            }, function (err, data) {
                if (err) {
                    reject(err);
                } else {
                    resolve(data)
                }
            });
        });
    };

    /**
     * Removes a device
     * @param endpointARN - The ARN of the endpoint
     * @returns {Promise}
     */
    removeEndpoint(endpointARN: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this.SNS.deleteEndpoint({ EndpointArn: endpointARN }, function (err, response) {
                if (err) {
                    reject(err);
                } else {
                    resolve(response);
                }
            });
        });
    };

    /**
     * Sends a push notification to the endpoint
     * @param endpointARN - The ARN of the devices endpoint
     * @param message - The message text to send to the device
     * @param additionalAttributes - Any additional APS payload to include in the message
     * @returns {Promise}
     */
    sendPushToEndpoint(endpointARN: string, message: string, additionalAttributes?: string): Promise<any> {
        return new Promise((resolve, reject) => {
            let messageToSend;
            let parameters;
            if (!additionalAttributes) {
                messageToSend = message;
                parameters = { Message: messageToSend, TargetArn: endpointARN };
            } else {
                var data = (mergeRecursive(additionalAttributes, { alert: message }));
                var apsData = { aps: data };
                messageToSend = {
                    GCM: JSON.stringify({ data: data }),
                    APNS_SANDBOX: JSON.stringify(apsData),
                    APNS: JSON.stringify(apsData),
                    default: JSON.stringify(data)
                };
                messageToSend = JSON.stringify(messageToSend);
                parameters = { Message: messageToSend, TargetArn: endpointARN, MessageStructure: "json" };
            }

            this.SNS.publish(parameters, function (err, response) {
                if (err) {
                    reject(err);
                } else {
                    resolve(response);
                }
            });
        });
    };

    /**
     * Sends a push notification to a group of devices
     * @param topicArn - The ARN of the topic
     * @param message - The message text to send to the topic
     * @param additionalAttributes - Any additional APS payload to include in the message
     * @returns {Promise}
     */
    sendPushToTopic(topicArn: string, message: string, additionalAttributes?: string): Promise<any> {
        return new Promise((resolve, reject) => {
            let messageToSend;
            let parameters;
            if (!additionalAttributes) {
                messageToSend = message;
                parameters = { Message: messageToSend, TopicArn: topicArn };
            } else {
                var data = (mergeRecursive(additionalAttributes, { alert: message }));
                var apsData = { aps: data };
                messageToSend = {
                    default: message, GCM: JSON.stringify(data),
                    APNS_SANDBOX: JSON.stringify(apsData), APNS: JSON.stringify(apsData)
                };

                messageToSend = JSON.stringify(messageToSend);
                parameters = { Message: messageToSend, TopicArn: topicArn, MessageStructure: "json" };
            }

            this.SNS.publish(parameters, function (err, response) {
                if (err) {
                    reject(err);
                } else {
                    resolve(response);
                }
            });
        });
    };


    /**
     * Creates a new topic
     * @param name - The name of the topic
     * @returns {Promise}
     */
    createTopic(name: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this.SNS.createTopic({ Name: name }, function (err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    };

    /**
     * Removes a topic
     * @param topicArn - The ARN of the topic
     * @returns {Promise}
     */
    removeTopic(topicArn: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this.SNS.deleteTopic({ TopicArn: topicArn }, function (err, response) {
                if (err) {
                    reject(err);
                } else {
                    resolve(response);
                }
            });
        });
    };

    /**
     * Subscribes a device to a topic
     * @param endpointArn - The ARN of the device endpoint
     * @param topicArn - The ARN of the topic
     * @returns {Promise}
     */
    subscribe(endpointArn: string, topicArn: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this.SNS.subscribe({
                Endpoint: endpointArn,
                Protocol: "application",
                TopicArn: topicArn
            }, function (err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    };

    /**
     * Removes a subscription
     * @param subscriptionArn - The ARN of the subscription
     * @returns {Promise}
     */
    unsubscribe(subscriptionArn: string): Promise<any> {
        return new Promise((resolve, reject) => {
            this.SNS.unsubscribe({ SubscriptionArn: subscriptionArn }, function (err, response) {
                if (err) {
                    reject(err);
                } else {
                    resolve(response);
                }
            });
        });
    };
}

/**
 * Merge obj1 with obj2
 * @param obj1
 * @param obj2
 * @returns mixed
 */
export function mergeRecursive(obj1, obj2) {

    for (var p in obj2) {
        try {
            // Property in destination object set; update its value.
            if (obj2[p].constructor == Object) {
                obj1[p] = mergeRecursive(obj1[p], obj2[p]);

            } else {
                obj1[p] = obj2[p];

            }

        } catch (e) {
            // Property in destination object not set; create it and set its value.
            obj1[p] = obj2[p];

        }
    }

    return obj1;
}
