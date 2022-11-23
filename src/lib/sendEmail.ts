import sgMail from '@sendgrid/mail';
import { emailMsg } from '../types/email.types';
import { log } from './log';

const API_KEY: string | undefined = process.env.SENDGRID_API_KEY;
const FROM_EMAIL: string | undefined = process.env.SENDGRID_FROM_EMAIL;

/* 
Return true if email was sent succesfully. 
Use second sandbox = true in tests, so no real emails are sent.
*/
const sendEmail = (msg: emailMsg, sandbox = false): boolean => {
  if (API_KEY === undefined || FROM_EMAIL === undefined) {
    log.error('sendEmail function has no API key or "from" address!');
    return false;
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
        return false;
      }
    } catch (error) {
      log.error('Error when sending email. Error:', error);
      return false;
    }
  })();

  return true;
};

export default sendEmail;
