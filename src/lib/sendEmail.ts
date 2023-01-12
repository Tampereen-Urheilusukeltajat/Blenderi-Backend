import sgMail from '@sendgrid/mail';
import { emailMsg } from '../types/email.types';

const API_KEY: string | undefined = process.env.SENDGRID_API_KEY;
const FROM_EMAIL: string | undefined = process.env.SENDGRID_FROM_EMAIL;

if (API_KEY === undefined || FROM_EMAIL === undefined) {
  throw new Error('sendEmail function has no API key or "from" address!');
}

sgMail.setApiKey(API_KEY);

const sendEmail = async (msg: emailMsg): Promise<void> => {
  try {
    const requestEmailBody = {
      ...msg,
      from: FROM_EMAIL,
      mailSettings: {},
    };

    const response = await sgMail.send(requestEmailBody);

    if (response[0].statusCode !== 202) {
      throw new Error(
        `SendGrid returned statusCode ${String(response[0].statusCode)}.`
      );
    }
  } catch (error) {
    let message: string;
    if (error instanceof Error) message = error.message;
    else message = String(error);

    throw new Error(`Error when sending email. Error: ${message}`);
  }
};

export default sendEmail;
