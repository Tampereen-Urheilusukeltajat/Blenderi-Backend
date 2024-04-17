import {
  type FastifyInstance,
  type FastifyReply,
  type FastifyRequest,
} from 'fastify';
import {
  passwordResetRequestBody,
  type PasswordResetRequestBody,
  passwordResetResponseBody,
} from '../../types/auth.types';
import { handlePasswordResetRequest } from '../../lib/queries/resetRequest';

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

const handler = async (
  request: FastifyRequest<{ Body: PasswordResetRequestBody }>,
  reply: FastifyReply,
): Promise<void> => {
  await reply
    .code(202)
    .send({ message: 'Password reset email is being sent.' });

  return handlePasswordResetRequest(request.body);
};

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.route({
    method: 'POST',
    url: '/reset-request',
    handler,
    schema,
  });
};
