import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { knexController } from '../../database/database';
import { testPassword } from '../../lib/auth';
import { createClient } from 'redis';
import { v4 as uuid } from 'uuid';

// REMOVE
const redis = createClient();

const schema = {
  description: 'login',
  tags: ['Auth'],
  body: {
    type: 'object',
    properties: {
      email: { type: 'string' },
      password: { type: 'string' },
    },
    required: ['email', 'password'],
  },
  response: {
    200: {
      description: 'Logged in',
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
      email: 'string';
      password: 'string';
    };
  }>,
  reply: FastifyReply
): Promise<void> {
  await redis.connect();

  const result: { id: 'String'; salt: 'String'; password_hash: 'String' } =
    await knexController('user')
      .where('email', request.body.email)
      .first('id', 'salt', 'password_hash');
  if (
    await testPassword(request.body.password, result.password_hash, result.salt)
  ) {
    const jti: string = uuid();
    const accessToken = this.jwt.sign({ id: result.id }, { expiresIn: 600 });
    const refreshTokenExpireTime = 8640000; // 100 days
    const refreshToken = this.jwt.sign(
      { id: result.id },
      { expiresIn: refreshTokenExpireTime, jti }
    );
    await redis.set(result.id + ':' + jti, refreshToken, {
      EX: refreshTokenExpireTime,
    });
    await redis.disconnect();
    return reply.code(200).send({ accessToken, refreshToken });
  }

  await redis.disconnect();

  return reply.code(401).send({
    statusCode: 401,
    error: 'Unauthorized',
    message: '🖕',
  });
};

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.route({
    method: 'POST',
    url: '/',
    handler,
    schema,
  });
};
