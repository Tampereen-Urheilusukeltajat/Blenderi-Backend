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
import { validateTurnstileToken } from '../../lib/auth/turnstile';
import { errorHandler } from '../../lib/utils/errorHandler';

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
  const turnstileValidationSuccess = await validateTurnstileToken(
    request.body.turnstileToken,
    request.ip,
  );

  if (!turnstileValidationSuccess) {
    return errorHandler(reply, 403, 'Turnstile validation failed');
  }

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
