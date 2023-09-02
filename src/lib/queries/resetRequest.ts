import { knexController } from '../../database/database';
import { log } from '../utils/log';
import { redisClient } from '../auth/redis';
import { hashPassword } from '../auth/auth';
import { sendEmail } from '../utils/sendEmail';
import { PasswordResetRequestBody } from '../../types/auth.types';
import { randomUUID } from 'crypto';

export const PASSWORD_RESET_TOKEN_EXPIRE_TIME = 600; // ten minutes
const REDIS_NO_ASSOCIATED_EXPIRE = -1;

const APPLICATION_URI: string | undefined = process.env.APPLICATION_URI;

if (APPLICATION_URI === undefined) {
  throw new Error('resetRequest function has no application uri!');
}

export const handlePasswordResetRequest = async (
  body: PasswordResetRequestBody
): Promise<void> => {
  const userInfo: { id: string; email: string } | undefined =
    await knexController('user')
      .where('email', body.email)
      .where('archived_at', null)
      .where('deleted_at', null)
      .first('id', 'email');

  if (userInfo === undefined) {
    log.info('password reset request with non existent email');
    return;
  }

  const key = `password-reset:${userInfo.id}`;

  const resetTokenCount: number = await redisClient.SCARD(key);

  if (resetTokenCount >= 5) {
    log.warn('Too many password reset request for user');
    return;
  }

  const newResetToken = randomUUID();
  const hashedResetToken = await hashPassword(newResetToken);

  await redisClient.SADD(key, [hashedResetToken.hash]);

  // Set expire time if it is not yet set
  const tllResult = await redisClient.TTL(key);
  if (tllResult === REDIS_NO_ASSOCIATED_EXPIRE) {
    await redisClient.EXPIRE(key, PASSWORD_RESET_TOKEN_EXPIRE_TIME);
  }

  const b64Email = Buffer.from(userInfo.email).toString('base64');

  await sendEmail({
    to: userInfo.email,
    subject: 'Pyysit salasanan vaihtamista',
    text: `Olet pyytänyt Tampereen Urheilusukeltajien Täyttöpaikka-palvelun salasanan vaihtoa.
Avaa seuraava linkki selaimessa vaihtaaksesi salasanan. ${APPLICATION_URI}/reset-password?token=${newResetToken}&id=${userInfo.id}&email=${b64Email}

Mikäli et pyytänyt salasanan vaihtamista, voit jättää tämän sähköpostin huomiotta. Jos saat useamman sähköpostin pyytämättä, ole hyvä ja ota yhteyttä ylläpitoon.`,
  });
};
