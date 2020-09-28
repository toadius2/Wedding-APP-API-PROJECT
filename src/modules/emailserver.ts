import * as AWS from "aws-sdk";
import * as nconf from "nconf"
import * as logger from '../logger'
export default class EmailServer {
    private SES: AWS.SES;
    /**
     * Construct a new email server
     */
    constructor() {
        this.SES = new AWS.SES();
    }

    /**
     * sends an email 'from' 'to'
     * @param to - must be an Array
     * @param subject
     * @param text
     * @param bcc - if set, must be an array
     * @param from - optional
     * @returns {Promise}
     */
    send(to: AWS.SES.AddressList | AWS.SES.Address, subject: AWS.SES.MessageData, text: AWS.SES.MessageData, bcc?: AWS.SES.AddressList, from?: AWS.SES.Address): Promise<AWS.SES.SendEmailResponse> {
        return new Promise((resolve, reject) => {
            if (!(to instanceof Array)) {
                to = new Array(to);
            }
            this.SES.sendEmail(
                {
                    Source: from ? from : nconf.get("API_EMAIL_FROM"),
                    Destination: {
                        ToAddresses: to,
                        BccAddresses: bcc
                    },
                    Message: {
                        Subject: {
                            Data: subject
                        },
                        Body: {
                            Text: {
                                Data: text
                            }
                        }
                    }
                }
                , (err, email) => {
                    if (err) {
                        logger.error("Error sending email", err, "EmailServer-send")
                        reject(err);
                    } else {
                        resolve(email)
                    }
                });
        });
    }
}