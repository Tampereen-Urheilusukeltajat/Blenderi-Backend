import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { errorHandler } from '../../lib/utils/errorHandler';
import {
  userResponse,
  userIdParamsPayload,
  UserIdParamsPayload,
} from '../../types/user.types';
import { getUserWithId } from '../../lib/queries/user';

const schema = {
  description: 'Get user with given id',
  summary: 'Get user',
  tags: ['User'],
  params: userIdParamsPayload,
  response: {
    200: userResponse,
    401: { $ref: 'error' },
    403: { $ref: 'error' },
    404: { $ref: 'error' },
  },
};

const handler = async (
  req: FastifyRequest<{
    Params: UserIdParamsPayload;
  }>,
  reply: FastifyReply
): Promise<void> => {
  const userId = req.params.userId;
  const user = await getUserWithId(userId);
  if (user === undefined) {
    return errorHandler(reply, 404, 'User not found.');
  }
  await reply.send(user);
};

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.route({
    method: 'GET',
    url: '/:userId',
    preValidation: [fastify['authenticate']],
    handler,
    schema,
  });
};
