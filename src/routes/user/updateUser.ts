import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { knexController } from '../../database/database';
import { hashPassword, passwordIsValid } from '../../lib/auth/auth';
import { errorHandler } from '../../lib/utils/errorHandler';
import { log } from '../../lib/utils/log';
import {
  updateUserBody,
  UpdateUserBody,
  UserIdParamsPayload,
  HashObj,
  userResponse,
  userIdParamsPayload,
} from '../../types/user.types';
import {
  phoneAlreadyExists,
  emailAlreadyExists,
} from '../../lib/utils/collisionChecks';
import { updateUser } from '../../lib/queries/user';
import { convertDateToMariaDBDateTime } from '../../lib/utils/dateTime';

const editUserSchema = {
  description: 'Update existing or archived user.',
  summary: 'Update user',
  tags: ['User'],
  params: userIdParamsPayload,
  body: updateUserBody,
  response: {
    200: userResponse,
    500: { $ref: 'error' },
    400: { $ref: 'error' },
    404: { $ref: 'error' },
    409: { $ref: 'error' },
  },
};

const handler = async (
  req: FastifyRequest<{
    Body: UpdateUserBody;
    Params: UserIdParamsPayload;
  }>,
  reply: FastifyReply
): Promise<void> => {
  const { userId } = req.params;
  const {
    archive,
    currentPassword,
    email,
    forename,
    isAdmin,
    isBlender,
    password,
    phone,
    surname,
  } = req.body;

  // If no user found with given id or user deleted.
  const response = await knexController('user')
    .select('id', 'password_hash')
    .where({ id: userId, deleted_at: null });

  if (!response || response.length !== 1) {
    return errorHandler(reply, 404, 'User not found.');
  }

  // If user is updating email or password, require current password
  if (email !== undefined || password !== undefined) {
    if (currentPassword === undefined)
      return errorHandler(reply, 400, 'Current password is required');

    if (!(await passwordIsValid(currentPassword, response[0].password_hash)))
      return errorHandler(reply, 400, 'Invalid current password');
  }

  if (email !== undefined) {
    if (await emailAlreadyExists(email, userId)) {
      const msg = 'Tried to update user with duplicate email';
      log.debug(msg);
      return errorHandler(reply, 409, msg);
    }
  }

  if (phone !== undefined) {
    if (await phoneAlreadyExists(phone, userId)) {
      const msg = 'Tried to update user with duplicate phone number';
      log.debug(msg);
      return errorHandler(reply, 409, msg);
    }
  }

  let hashObj: HashObj | undefined;
  // If no password given as parameter, no need to hash.
  if (password !== undefined) {
    hashObj = await hashPassword(password);
  }

  const editedUser = await updateUser(userId, {
    email,
    phone,
    forename,
    surname,
    isAdmin,
    isBlender,
    passwordHash: hashObj ? hashObj.hash : undefined,
    salt: hashObj ? hashObj.salt : undefined,
    archivedAt: archive
      ? convertDateToMariaDBDateTime(new Date(Date.now()))
      : undefined,
  });

  await reply.send(editedUser);
};

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.route({
    method: 'PATCH',
    url: '/:userId',
    handler,
    schema: editUserSchema,
  });
};
