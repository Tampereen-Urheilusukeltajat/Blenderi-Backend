import {
  type FastifyInstance,
  type FastifyReply,
  type FastifyRequest,
} from 'fastify';
import {
  constructEvent,
  processWebhookEvent,
} from '../../lib/payment/stripeWebhook';
import { errorHandler } from '../../lib/utils/errorHandler';

const schema = {
  tags: ['Stripe'],
  response: {
    200: {},
    400: { $ref: 'error' },
    401: { $ref: 'error' },
    500: { $ref: 'error' },
  },
};

const handler = async (
  request: FastifyRequest<{ Body: { raw: string } }>,
  reply: FastifyReply
): Promise<void> => {
  const signature = request.headers['stripe-signature'];
  const rawEventBody = request.body.raw;

  if (!signature || !rawEventBody || Array.isArray(signature)) {
    return errorHandler(reply, 400);
  }

  const signedEvent = await constructEvent(signature, rawEventBody);
  await processWebhookEvent(signedEvent);

  return reply.code(200);
};

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.addContentTypeParser(
    'application/json',
    { parseAs: 'buffer' },
    function (req, body, done) {
      try {
        const newBody = {
          raw: body,
        };
        done(null, newBody);
      } catch (error) {
        error.statusCode = 400;
        done(error as Error, undefined);
      }
    }
  );
  fastify.route({
    method: 'POST',
    url: '/stripe/webhook/',
    handler,
    schema,
  });
};
