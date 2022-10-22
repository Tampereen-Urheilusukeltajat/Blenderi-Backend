import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { knexController } from '../../database/database';
import { testPassword } from '../../lib/auth';

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
        token: { type: 'string' },
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
  const result: { id: 'String'; salt: 'String'; password_hash: 'String' } =
    await knexController('user')
      .where('email', request.body.email)
      .first('id', 'salt', 'password_hash');
  if (
    await testPassword(request.body.password, result.password_hash, result.salt)
  ) {
    const token = this.jwt.sign({ id: result.id });
    return reply.code(200).send({ token });
  }
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
