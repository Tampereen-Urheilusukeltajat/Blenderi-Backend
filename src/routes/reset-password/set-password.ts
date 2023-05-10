import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import {
  passwordResetResponseBody,
  SetPasswordBody,
  setPasswordBody,
} from '../../types/auth.types';
import { redisClient } from '../../lib/auth/redis';
import { errorHandler } from '../../lib/utils/errorHandler';
import { handlePasswordSetRequest } from '../../lib/queries/setPassword';

const schema = {
  tags: ['Auth'],
  body: setPasswordBody,
  response: {
    204: passwordResetResponseBody,
    400: { $ref: 'error' },
    429: { $ref: 'error' },
  },
};

const handler = async (
  request: FastifyRequest<{ Body: SetPasswordBody }>,
  reply: FastifyReply
): Promise<void> => {
  const rateLimiterKey = `rate-limiter:${request.body.email}`;

  // Limit password resetting attempts to 1 attempt per second
  if ((await redisClient.EXISTS(rateLimiterKey)) !== 0) {
    return errorHandler(reply, 429);
  }
  await redisClient.SET(rateLimiterKey, 'limit-rate', { EX: 1 });

  await reply.code(204).send({ message: 'Password set' });

  return handlePasswordSetRequest(request.body);
};

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.route({
    method: 'POST',
    url: '/set-password',
    handler,
    schema,
  });
};
