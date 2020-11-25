import { generateEmailVerification } from "../../messages/email";
import EmailServer from "../../modules/emailserver";
import { UserInstance } from "../user";
import * as uuid from 'uuid'

export async function sendVerificationEmail(this: UserInstance, signupMode: boolean) {
    const infos = await this.getAuthentication_infos()
    const email_info = infos.find(a => a.provider == 'email')
    if (email_info) {
        email_info.verification_code = uuid.v4()
        await email_info.save()
        let server = new EmailServer();
        let text = generateEmailVerification(this, signupMode, email_info.verification_code);
        return server.sendTemplate(email_info.external_id, text.title, text.subTitle, text.body)
    }
}