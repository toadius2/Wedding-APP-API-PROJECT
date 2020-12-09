import { generateWeddingInvite } from "../../messages/email";
import EmailServer from "../../modules/emailserver";
import { WeddingGuestInstance } from "../wedding_guest";

export async function sendInvitationEmail(this: WeddingGuestInstance) {
    if (this.email) {
        const wedding = await this.getWedding()
        if (!wedding) {
            return
        }
        const server = new EmailServer();
        const text = generateWeddingInvite(this, wedding);
        return server.sendTemplate(this.email, text.title, text.subTitle, text.body)
    }
}