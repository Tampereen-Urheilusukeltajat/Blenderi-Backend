import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import {
  createFillEventBody,
  CreateFillEventBody,
  fillEventResponse,
} from '../../types/fillEvent.types';
import { errorHandler } from '../../lib/errorHandler';
import { createFillEvent, calcTotalCost } from '../../lib/fillEvent';

const schema = {
  description: 'Creates a new fill event',
  tags: ['Fill event'],
  body: createFillEventBody,
  response: {
    201: fillEventResponse,
    400: { $ref: 'error' },
    401: { $ref: 'error' },
    403: { $ref: 'error' },
    500: { $ref: 'error' },
  },
};

schema.body.properties.gasMixture.example = 'EAN21';

const handler = async (
  request: FastifyRequest<{ Body: CreateFillEventBody }>,
  reply: FastifyReply
): Promise<void> => {
  const res = await createFillEvent(request.user, request.body);
  if (res.fillEventId === undefined) {
    return errorHandler(reply, res.status, res.message);
  }
  const totalCost = await calcTotalCost(res.fillEventId);
  return reply.code(201).send({
    id: res.fillEventId,
    userId: request.user.id,
    price: totalCost,
    ...request.body,
  });
};

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.route({
    method: 'POST',
    url: '/',
    preValidation: [fastify['authenticate']],
    handler,
    schema,
  });
};
