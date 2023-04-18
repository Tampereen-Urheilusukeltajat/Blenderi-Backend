import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { knexController } from '../../database/database';
import {
  passwordResetRequestBody,
  PasswordResetRequestBody,
  passwordResetResponseBody,
} from '../../types/auth.types';

const schema = {
  tags: ['Auth'],
  description: 'Responds with 202 Accepted regardless of unverified email.',
  body: passwordResetRequestBody,
  response: {
    202: passwordResetResponseBody,
    400: { $ref: 'error' },
  },
};

schema.body.properties.email.example = 'john.doe@example.com';

const handler = async function (
  request: FastifyRequest<{ Body: PasswordResetRequestBody }>,
  reply: FastifyReply
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const userInfo: { id: string; email: string } | undefined =
    await knexController('user')
      .where('email', request.body.email)
      .where('archived_at', null)
      .first('id', 'email');

  return reply
    .code(202)
    .send({ message: 'Password reset email is being sent.' });
};

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.route({
    method: 'POST',
    url: '/reset-request',
    handler,
    schema,
  });
};
