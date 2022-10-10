import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { Type, Static } from '@sinclair/typebox';
import { knexController } from '../../database/database';
import { hashPassword } from '../../lib/auth';
import {
  UpdateUserBody,
  user,
  UserIdParamsPayload,
  HashObj,
  User,
  userResponse,
} from '../../types/user.types';

const archiveUserQuery = Type.Object({
  archiveUser: Type.Boolean({ default: false }),
});
type ArchiveUserQuery = Static<typeof archiveUserQuery>;

const editUserSchema = {
  description: 'Edit data of already existing user.',
  summary: 'Edit user',
  tags: ['User', 'Update'],
  query: archiveUserQuery,
  body: {
    type: 'object',
    required: [],
    properties: user.static,
  },
  response: {
    200: userResponse,
    500: { $ref: 'error' },
    400: { $ref: 'error' },
    404: { $ref: 'error' },
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
  const { email, password, forename, surname, isAdmin, isBlender } = req.body;
  const { archiveUser } = req.query;
  const userId = req.params.userId;

  let hashObj: HashObj | undefined;
  // If no password given as parameter, no need to hash.
  if (password !== undefined) {
    hashObj = await hashPassword(password);
  }

  // edit user
  const editResponse = await knexController('user')
    .where({ id: userId })
    .update({
      email,
      forename,
      surname,
      password_hash: hashObj !== undefined ? hashObj.hash : undefined,
      salt: hashObj !== undefined ? hashObj.salt : undefined,
      is_admin: isAdmin,
      is_blender: isBlender,
      archived_at: archiveUser ? knexController.fn.now() : null,
    });

  // If no user found with given id.
  if (editResponse === 0) {
    return reply.code(404).send({
      statusCode: 404,
      error: 'Not Found',
      message: 'User not found.',
    });
  }

  // get edited user
  const editedUser = await knexController
    .select(
      'id as userId',
      'email',
      'forename',
      'surname',
      'is_admin as isAdmin',
      'is_blender as isBlender',
      'archived_at as archivedAt'
    )
    .from<User>('user')
    .where({ id: userId });

  await reply.send(...editedUser);
};

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.route({
    method: 'PATCH',
    url: '/user/:userId',
    handler: editUserHandler,
    schema: editUserSchema,
  });
};
