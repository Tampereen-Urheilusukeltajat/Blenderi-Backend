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
  UserResponse,
  User,
} from '../../types/user.types';
import {
  phoneAlreadyExists,
  emailAlreadyExists,
} from '../../lib/collisionChecks';
import { allMembersUndefined } from '../../lib/empty';

const editUserSchema = {
  description: 'Edit data of already existing user or archived user.',
  summary: 'Edit user',
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
// TODO: laita arkistointi tänne
const editUserHandler = async (
  req: FastifyRequest<{
    Body: UpdateUserBody;
    Params: UserIdParamsPayload;
  }>,
  reply: FastifyReply
): Promise<void> => {
  const updateBody: UpdateUserBody = req.body;

  let archiveUser = false;
  if (updateBody.archive !== undefined && updateBody.archive) {
    archiveUser = true;
  }

  if (allMembersUndefined(updateBody) && !archiveUser) {
    return errorHandler(reply, 400, 'Empty body.');
  }

  const userId = req.params.userId;

  // If no user found with given id or user deleted.
  const foundUsers: number = await knexController<User>('user')
    .count('id')
    .where('id', userId)
    .first()
    .then((row: { 'count(`id`)': number }) => Number(row['count(`id`)']));
  if (foundUsers !== 1) {
    return errorHandler(reply, 404, 'User not found.');
  }

  if (updateBody.email !== undefined) {
    if (await emailAlreadyExists(updateBody.email, userId)) {
      const msg = 'Tried to update user with duplicate email';
      log.debug(msg);
      return errorHandler(reply, 409, msg);
    }
  }

  if (updateBody.phone !== undefined) {
    if (await phoneAlreadyExists(updateBody.phone, userId)) {
      const msg = 'Tried to update user with duplicate phone number';
      log.debug(msg);
      return errorHandler(reply, 409, msg);
    }
  }

  let hashObj: HashObj | undefined;
  // If no password given as parameter, no need to hash.
  if (updateBody.password !== undefined) {
    hashObj = await hashPassword(updateBody.password);
  }

  // edit user
  const usersResponse = await knexController('user')
    .where({ id: userId, deleted_at: null })
    .update({
      email: updateBody.email,
      phone: updateBody.phone,
      forename: updateBody.forename,
      surname: updateBody.surname,
      is_admin: updateBody.isAdmin,
      is_blender: updateBody.isBlender,
      password_hash: hashObj !== undefined ? hashObj.hash : undefined,
      salt: hashObj !== undefined ? hashObj.salt : undefined,
      archived_at: archiveUser ? knexController.fn.now() : null,
    });

  if (usersResponse === 0) {
    return errorHandler(reply, 404, 'User not found.');
  }

  // get edited user
  const editedUser = await knexController
    .select(
      'id',
      'email',
      'phone',
      'forename',
      'surname',
      'is_admin as isAdmin',
      'is_blender as isBlender',
      'archived_at as archivedAt'
    )
    .from<UserResponse>('user')
    .where({ id: userId });

  await reply.send(...editedUser);
};

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.route({
    method: 'PATCH',
    url: '/:userId',
    handler: editUserHandler,
    schema: editUserSchema,
  });
};
