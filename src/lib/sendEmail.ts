import sgMail from '@sendgrid/mail';
import { emailMsg } from '../types/email.types';
import { log } from './log';

// return true if email was sent succesfully.
export const sendEmail = async (msg: emailMsg): Promise<boolean> => {
  const apiKey: string | undefined = process.env.SENDGRID_API_KEY;
  const from: string | undefined = process.env.SENDGRID_FROM_EMAIL;

  if (apiKey === undefined || from === undefined) {
    log.error('sendEmail function has no API key or "from" address!');
    return false;
  }
  sgMail.setApiKey(apiKey);

  try {
    const response = await sgMail.send({ ...msg, from });

    if (response[0].statusCode !== 202) {
      log.error('Sending email failed. StatusCode:', response[0].statusCode);
      return false;
    }
  } catch (error) {
    log.error('Error when sending email. Error:', error);
    return false;
  }

  return true;
};
