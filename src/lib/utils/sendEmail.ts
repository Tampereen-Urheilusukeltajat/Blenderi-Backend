import sgMail from '@sendgrid/mail';
import { type emailMsg } from '../../types/email.types';

const API_KEY: string | undefined = process.env.SENDGRID_API_KEY;
const FROM_EMAIL: string | undefined = process.env.SENDGRID_FROM_EMAIL;

if (API_KEY === undefined || FROM_EMAIL === undefined) {
  throw new Error('sendEmail function has no API key or "from" address!');
}

sgMail.setApiKey(API_KEY);

export const sendEmail = async (msg: emailMsg): Promise<void> => {
  try {
    const requestEmailBody = {
      ...msg,
      from: {
        email: FROM_EMAIL,
        name: 'Täyttöpaikka',
      },

      mailSettings: {},
    };

    const response = await sgMail.send(requestEmailBody);

    // TODO: handle 401 from SendGrid
    if (response[0].statusCode !== 202) {
      throw new Error(
        `SendGrid returned statusCode ${String(response[0].statusCode)}.`,
      );
    }
  } catch (error) {
    let message: string;
    if (error instanceof Error) message = error.message;
    else message = String(error);

    throw new Error(`Error when sending email. Error: ${message}`);
  }
};
