import { Resend } from "resend";
import { config } from "../config/app.config";

type Params = {
  to: string | string[];
  subject: string;
  text: string;
  html: string;
  from?: string;
};

// Initialize Resend client
const resend = new Resend(config.RESEND.API_KEY);

export const sendEmail = async ({
  to,
  subject,
  text,
  html,
  from = config.RESEND.FROM_EMAIL
}: Params) => {
  try {
    const info = await resend.emails.send({
      from,
      to, // Resend accepts string or array of strings
      subject,
      text,
      html,
    });
    console.log(info)

    console.log("Email sent: ", info)
  } catch (error) {
    console.error("Error sending email: ", error);
    throw new Error("Failed to send email via Resend");
  }
};
