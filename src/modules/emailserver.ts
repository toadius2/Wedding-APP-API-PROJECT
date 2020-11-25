import * as AWS from "aws-sdk";
import * as nconf from "nconf"
import * as exprhbs from 'express-handlebars'
import { join } from 'path'
const hb = exprhbs.create({
    extname: 'hbs', // for layouts
    defaultLayout: (false as any)
})
export default class EmailServer {
    private SES: AWS.SES;

    /**
     * Construct a new email server
     */
    constructor() {
        this.SES = new AWS.SES();
    }

    sendTemplate(to: AWS.SES.AddressList | AWS.SES.Address, title: string, subtitle: string, content: string, bcc?: AWS.SES.AddressList, from?: AWS.SES.Address) {
        return hb.render(join(__dirname, '..', '..', 'views', 'template.hbs'), Object.assign({}, {
            title: title,
            subtitle: subtitle,
            subject_line: title,
            content_body: content
        }, { in_email: true })).then((value) => {
            return this.sendContent(to, title, value, bcc, from)
        })
    }

    sendContent(to: AWS.SES.AddressList | AWS.SES.Address, subject: AWS.SES.MessageData,
        text: AWS.SES.MessageData, bcc?: AWS.SES.AddressList,
        from?: AWS.SES.Address): Promise<null> {
        if (!(to instanceof Array)) {
            to = new Array(to);
        }
        return this.SES.sendEmail({
            Source: from ? from : nconf.get("API_EMAIL_FROM"),
            Destination: {
                ToAddresses: to as AWS.SES.AddressList,
                BccAddresses: bcc
            },
            Message: {
                Subject: {
                    Data: subject,
                },
                Body: {
                    Text: {
                        Data: text
                    },
                    Html: {
                        Data: text
                    }
                }
            }
        }).promise().catch((err) => {
            return null
        }).then(() => {
            return null
        })
    }
}