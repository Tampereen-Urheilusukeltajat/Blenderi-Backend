import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { knexController } from '../../database/database';
import { hashPassword } from '../../lib/auth';
import { errorHandler } from '../../lib/errorHandler';
import { log } from '../../lib/log';
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
} from '../../lib/collisionChecks';
import { updateUser } from '../../lib/user';
import { convertDateToMariaDBDateTime } from '../../lib/dateTime';

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
// TODO: Put archiving here
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
    email,
    forename,
    isAdmin,
    isBlender,
    password,
    phone,
    surname,
  } = req.body;

  // If no user found with given id or user deleted.
  const foundUsers: number = await knexController('user')
    .count('id')
    .where({ id: userId, deleted_at: null })
    .first()
    .then((row: { 'count(`id`)': number }) => Number(row['count(`id`)']));

  if (foundUsers !== 1) {
    return errorHandler(reply, 404, 'User not found.');
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
    hashObj = hashPassword(password);
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
