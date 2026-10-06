import { EventEmitter } from "node:events";
import { emailTemplate } from "../utils/Email/template/confirmEmail.template.js";
import { sendEmail } from "../utils/Email/send.email.js";

export const emailEvent = new EventEmitter();

emailEvent.on("sendEmail", async ({ recipient, subject, data }) => {
  try {
    await sendEmail({
      ...recipient,
      subject,
      html: emailTemplate({subject ,data }),
    });
  } catch (error) {
    console.log("Failed to send email");
  }
});
