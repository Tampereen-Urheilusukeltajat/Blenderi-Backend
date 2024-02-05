/**
 * This should be actually part of getFillEvents, but since I'm not yet brave
 * enough to open that can of worms, own endpoint will do just fine
 *
 * TODO: When refactoring fillEvents endpoints, remove this and add its
 * functionality to getFillEvents
 */
import {
  type FastifyInstance,
  type FastifyReply,
  type FastifyRequest,
} from 'fastify';
import { getUnpaidFillEventsResponse } from '../../types/fillEvent.types';
import { getFillEvents } from '../../lib/queries/fillEvent';
import { paymentStatus } from '../../types/payment.types';
import {
  calculateFillEventTotalPrice,
  getUnpaidFillEventIdsForUser,
} from '../../lib/queries/paymentQueries';

const schema = {
  description: 'Get diving cylinder fill events',
  tags: ['Fill event'],
  query: {
    type: 'object',
    properties: {
      paymentStatus,
    },
  },
  response: {
    200: getUnpaidFillEventsResponse,
    401: { $ref: 'error' },
    403: { $ref: 'error' },
  },
};

const handler = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const { id: userId } = request.user;
  const unpaidFillEventIds = await getUnpaidFillEventIdsForUser(userId);
  const fillEvents = await getFillEvents(userId, unpaidFillEventIds);
  const totalPrice = await calculateFillEventTotalPrice(unpaidFillEventIds);

  return reply.send({
    fillEvents,
    totalPriceInEurCents: totalPrice,
  });
};

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.route({
    method: 'GET',
    url: '/unpaid',
    preValidation: [fastify['authenticate']],
    handler,
    schema,
  });
};
