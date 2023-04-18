import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import {
  passwordResetResponseBody,
  SetPasswordBody,
  setPasswordBody,
} from '../../types/auth.types';

const schema = {
  tags: ['Auth'],
  body: setPasswordBody,
  response: {
    204: passwordResetResponseBody,
    400: { $ref: 'error' },
  },
};

const handler = async function (
  request: FastifyRequest<{ Body: SetPasswordBody }>,
  reply: FastifyReply
): Promise<void> {
  return reply
    .code(204)
    .send({ message: 'Password reset done, if applicable' });
};

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.route({
    method: 'POST',
    url: '/set-password',
    handler,
    schema,
  });
};
