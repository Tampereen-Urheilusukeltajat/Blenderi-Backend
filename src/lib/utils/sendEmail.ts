import { type EmailMessage } from '../../types/email.types';
import { createClient, TransactionalEmail } from '@scaleway/sdk';

const SCW_ACCESS_KEY: string | undefined = process.env.SCW_ACCESS_KEY;
const SCW_SECRET_KEY: string | undefined = process.env.SCW_SECRET_KEY;
const SCW_DEFAULT_ORGANIZATION_ID: string | undefined =
  process.env.SCW_DEFAULT_ORGANIZATION_ID;
const SCW_DEFAULT_PROJECT_ID: string | undefined =
  process.env.SCW_DEFAULT_PROJECT_ID;

const FROM_EMAIL: string | undefined = process.env.TRANSACTIONAL_FROM_EMAIL;

if (
  SCW_ACCESS_KEY === undefined ||
  SCW_SECRET_KEY === undefined ||
  SCW_DEFAULT_ORGANIZATION_ID === undefined ||
  SCW_DEFAULT_PROJECT_ID === undefined ||
  FROM_EMAIL === undefined
) {
  throw new Error(
    'sendEmail function has no required SCW secrets or "from" address!',
  );
}

export const sendEmail = async (msg: EmailMessage): Promise<void> => {
  const client = createClient({
    accessKey: SCW_ACCESS_KEY,
    secretKey: SCW_SECRET_KEY,
    defaultProjectId: SCW_DEFAULT_PROJECT_ID,
    defaultOrganizationId: SCW_DEFAULT_ORGANIZATION_ID,
    defaultRegion: 'fr-par',
  });

  const emailService = new TransactionalEmail.v1alpha1.API(client);

  await emailService.createEmail({
    subject: msg.subject,
    to: [{ email: msg.to }],
    text: msg.text,
    html: '',
    from: {
      email: FROM_EMAIL,
      name: 'Täyttöpaikka',
    },
  });
};
