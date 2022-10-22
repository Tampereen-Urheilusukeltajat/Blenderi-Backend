import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { Type, Static } from '@sinclair/typebox';
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

const archiveUserQuery = Type.Object({
  archiveUser: Type.Boolean({ default: false }),
});
type ArchiveUserQuery = Static<typeof archiveUserQuery>;

const editUserSchema = {
  description: 'Edit data of already existing user or archive user.',
  summary: 'Edit user',
  tags: ['User', 'Update'],
  query: archiveUserQuery,
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
    Querystring: ArchiveUserQuery;
  }>,
  reply: FastifyReply
): Promise<void> => {
  const updateBody: UpdateUserBody = req.body;
  const { archiveUser } = req.query;

  // if empty request body.
  if (Object.values(updateBody).every((el) => el === undefined)) {
    return errorHandler(reply, 400, 'Empty body.');
  }

  const userId = req.params.userId;

  if (updateBody.email !== undefined) {
    const emailCount: number = await knexController<User>('user')
      .count('email')
      .where('email', updateBody.email)
      .first()
      .then((row: { 'count(`email`)': number }) =>
        Number(row['count(`email`)'])
      );

    if (emailCount > 0) {
      log.debug('Tried to update user with duplicate email');
      return errorHandler(
        reply,
        409,
        'Tried to update user with duplicate email'
      );
    }
  }

  let hashObj: HashObj | undefined;
  // If no password given as parameter, no need to hash.
  if (updateBody.password !== undefined) {
    hashObj = await hashPassword(updateBody.password);
  }

  // edit user
  const editResponse = await knexController('user')
    .where({ id: userId })
    .update({
      email: updateBody.email,
      forename: updateBody.forename,
      surname: updateBody.surname,
      is_admin: updateBody.isAdmin,
      is_blender: updateBody.isBlender,
      password_hash: hashObj !== undefined ? hashObj.hash : undefined,
      salt: hashObj !== undefined ? hashObj.salt : undefined,
      archived_at: archiveUser ? knexController.fn.now() : null,
    });

  // If no user found with given id.
  if (editResponse === 0) {
    return errorHandler(reply, 404, 'User not found.');
  }

  // get edited user
  const editedUser = await knexController
    .select(
      'id',
      'email',
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
