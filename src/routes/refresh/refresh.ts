import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import redis from '../../lib/redis';
import { v4 as uuid } from 'uuid';
import { errorHandler } from '../../lib/errorHandler';

const schema = {
  description: 'refresh',
  tags: ['Auth'],
  body: {
    type: 'object',
    properties: {
      refreshToken: { type: 'string' },
    },
    required: ['refreshToken'],
  },
  response: {
    200: {
      description: 'Refreshed',
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
      },
    },
    400: { $ref: 'error' },
    403: { $ref: 'error' },
    500: { $ref: 'error' },
  },
};

const handler = async function (
  request: FastifyRequest<{
    Body: {
      refreshToken: 'string';
    };
  }>,
  reply: FastifyReply
): Promise<void> {
  await redis.connect();

  const jti: string = uuid();

  const oldRefreshTokenDecoded = await this.jwt.verify(
    request.body.refreshToken
  );
  const userId: string = oldRefreshTokenDecoded.id;
  const oldJti: string = oldRefreshTokenDecoded.jti;

  const accessToken = this.jwt.sign({ id: userId }, { expiresIn: 600 });
  const refreshTokenExpireTime = 8640000; // 100 days
  const refreshToken = this.jwt.sign(
    { id: userId },
    { expiresIn: refreshTokenExpireTime, jti }
  );

  const oldTokenFromCache: string | null = await redis.get(
    userId + ':' + oldJti
  );
  if (
    oldTokenFromCache === null ||
    oldTokenFromCache !== request.body.refreshToken
  ) {
    return errorHandler(reply, 403);
  }

  await redis.del(userId + ':' + oldJti);

  await redis.set(userId + ':' + jti, refreshToken, {
    EX: refreshTokenExpireTime,
  });

  await redis.disconnect();

  return reply.code(200).send({ accessToken, refreshToken });
};

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.route({
    method: 'POST',
    url: '/',
    handler,
    schema,
  });
};
