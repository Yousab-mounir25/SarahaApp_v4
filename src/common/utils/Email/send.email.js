import nodemailer from "nodemailer";
import { APP_EMAIL, APP_PASSWORD } from "../../../config.js";
import { BadException } from "../../exceptions/error.exception.js";


export const userEmailKey =  ({email, subject})=>{
  return `User::${email}::${subject}::OTP`
}
export const userEmailTrialsKey =  ({email, subject})=>{
  return `${userEmailKey({email , subject})}::Trials`
}

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: APP_EMAIL,
    pass: APP_PASSWORD,
  },
});

export const sendEmail = async ({
  to, // list of recipients
  subject, // subject line
  cc,
  bcc,
  text, // plain text body
  html, // HTML body
  attachments = [],
} = {}) => {
  try {
    if (!to?.length && !cc?.length && !bcc?.length) {
      throw BadException("invalid reciepients");
    }
    if (!html?.length && !text?.length && !attachments?.length) {
      throw BadException("invalid email payload");
    }

    const info = await transporter.sendMail({
      from: ` "Yousab Mounir Academy" <${APP_EMAIL}>`, // sender address
      to, // list of recipients
      cc,
      bcc,
      subject, // subject line
      text, // plain text body
      html, // HTML body
      attachments
    });

    console.log("Message sent: %s", info.messageId);
    // Preview URL is only available when using an Ethereal test account
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  } catch (err) {
    console.error("Error while sending mail:", err);
  }
};
