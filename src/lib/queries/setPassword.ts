import { knexController } from '../../database/database';
import { log } from '../utils/log';
import { redisClient } from '../auth/redis';
import { hashPassword, passwordIsValid } from '../auth/auth';
import { updateUser } from './user';
import { sendEmail } from '../utils/sendEmail';
import { SetPasswordBody } from '../../types/auth.types';

const APPLICATION_URI: string | undefined = process.env.APPLICATION_URI;

if (APPLICATION_URI === undefined) {
  throw new Error('setPassword function has no application uri!');
}

export const handlePasswordSetRequest = async (
  body: SetPasswordBody
): Promise<void> => {
  const userInfo = await knexController<{ id: string; email: string }>('user')
    .where('id', body.userId)
    .where('archived_at', null)
    .where('deleted_at', null)
    .first('id', 'email');

  if (userInfo === undefined) {
    log.info('password set request with non existent user');
    return;
  }

  const key = `password-reset:${userInfo.id}`;

  const resetTokens = await redisClient.SMEMBERS(key);

  const resetTokenValidationResult = await Promise.all(
    resetTokens.map(async (item) => passwordIsValid(body.token, item))
  );
  const resetTokenIsValid = resetTokenValidationResult.some((x) => x);

  if (!resetTokenIsValid) {
    log.info('password set request with invalid token');
    return;
  }

  await redisClient.DEL(key);

  // invalidate old refresh token sessions
  for await (const key of redisClient.scanIterator({
    TYPE: 'string',
    MATCH: `${userInfo.id}:*`,
    COUNT: 100,
  })) {
    await redisClient.DEL(key);
  }

  const newPasswordHashed = await hashPassword(body.password);

  await updateUser(userInfo.id, {
    salt: newPasswordHashed.salt,
    passwordHash: newPasswordHashed.hash,
  });

  await sendEmail({
    to: userInfo.email,
    subject: 'Salasanasi on vaihdettu',
    text: `Sait tämän viestin, koska olet vaihtanut salasanasi Tampereen Urheilusukeltajien Täyttöpaikka-palveluun. Mikäli et vaihtanut salasanaasi itse, vaihda se uudelleen välittömästi osoitteessa ${APPLICATION_URI}/request-password-reset ja ota yhteyttä ylläpitoon.`,
  });
};
