import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { knexController } from '../../database/database';
import { hashPassword } from '../../lib/auth';
import {
  UpdateUserBody,
  userAdminResponse,
  user,
  UserIdParamsPayload,
  HashObj,
  User,
} from '../../types/user.types';

const editUserSchema = {
  description: 'Edit data of already existing user.',
  summary: 'Edit user',
  tags: ['User', 'Update'],
  body: user,
  response: {
    200: userAdminResponse,
    500: { $ref: 'error' },
    400: { $ref: 'error' },
    404: { $ref: 'error' },
  },
};

const editUserHandler = async (
  req: FastifyRequest<{ Body: UpdateUserBody; Params: UserIdParamsPayload }>,
  reply: FastifyReply
): Promise<void> => {
  const { email, password, forename, surname, isAdmin, isBlender } = req.body;

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
      'id',
      'email',
      'forename',
      'surname',
      'is_admin as isAdmin',
      'is_blender as isBlender'
    )
    .from<UpdateUserBody>('user')
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
