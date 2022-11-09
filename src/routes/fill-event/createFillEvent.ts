import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
// import { knexController } from "../../database/database";
import {
  createFillEventBody,
  fillEventResponse,
} from '../../types/fillEvent.types';
import { errorHandler } from '../../lib/errorHandler';
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

const handler = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  // console.log(request.body);
  return errorHandler(reply, 403, 'lol');
};

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.route({
    method: 'POST',
    url: '/',
    handler,
    schema,
  });
};
