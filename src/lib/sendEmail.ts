import sgMail from '@sendgrid/mail';
import { emailMsg } from '../types/email.types';

const API_KEY: string | undefined = process.env.SENDGRID_API_KEY;
const FROM_EMAIL: string | undefined = process.env.SENDGRID_FROM_EMAIL;

/* 
Use second sandbox = true in tests, so no real emails are sent.
*/
const sendEmail = (msg: emailMsg, sandbox = false): void => {
  if (API_KEY === undefined || FROM_EMAIL === undefined) {
    throw new Error('sendEmail function has no API key or "from" address!');
  }
  sgMail.setApiKey(API_KEY);

  void (async () => {
    try {
      // Request body for sending the email.
      const reqBody = {
        ...msg,
        from: FROM_EMAIL,
        mailSettings: { sandboxMode: { enable: sandbox } },
      };

      const response = await sgMail.send(reqBody);

      // 200 on sandbox, 202 on real email.
      if (response[0].statusCode !== 202 && response[0].statusCode !== 200) {
        throw new Error(
          `SendGrid returned statusCode ${response[0].statusCode}.`
        );
      }
    } catch (error) {
      let message = 'Unknown Error on sendEmail';
      if (error instanceof Error) message = error.message;
      else message = String(error);

      throw new Error(`Error when sending email. Error: ${message}.`);
    }
  })();
};

export default sendEmail;
