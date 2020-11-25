import { UserInstance } from "../model"
import * as nconf from 'nconf'

export interface NotificationMessage {
    title: string;
    subTitle: string;
    body: string;
}

export function generateEmailVerification(user: UserInstance, signupMode: boolean, verification_token: string): NotificationMessage {
    if (!signupMode) {
        return {
            body: `You requested an email verification for your account. If this was not you or your intention, just relax and ignore this email.
        <br><br>
        If you wish to verify your new email address, all you need to do is follow this link to complete verification:
        <br><br>
        <a href="${nconf.get('EMAIL_VERIFICATION_URL')}?token=${encodeURIComponent(verification_token)}">Verify Email</a>`,
            title: 'Verify your email address', subTitle: `Hi ${user.full_name},  <br>`
        }
    } else {
        return {
            body: `Welcome to Nuvow!<br><br>
        Just click on this link to verify your email address: <a href="${nconf.get('EMAIL_VERIFICATION_URL')}?token=${encodeURIComponent(verification_token)}">Verify Email</a><br><br>
        Any feedback? Don´t hesitate to give us feedback so we can improve our platform.<br><br>
        Your Nuvow team`,
            title: 'Verify your email address', subTitle: `Hi ${user.full_name},  <br>`
        }
    }
}

export function generatePasswordReset(user: UserInstance, reset_token: string) {
    return {
        body: `You or someone else requested a password reset for your account. If this was not you or your intention, just relax and ignore this email.
    <br><br>
    If you wish to reset your password, all you need to do is follow this link to reset your password:
    <br><br>
    <a href="${nconf.get('FORGOT_PW_URL')}?token=${encodeURIComponent(reset_token!)}">Reset Password</a>`,
        title: 'Reset your password', subTitle: `Hi ${user.full_name},  <br>`
    }
}