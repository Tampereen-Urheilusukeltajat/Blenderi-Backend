import {
  type FastifyRequest,
  type FastifyInstance,
  type FastifyReply,
} from 'fastify';
import { getAllInvoices } from '../../lib/queries/invoice';
import { invoice } from '../../types/invoices.types';
import { Type } from '@sinclair/typebox';

const schema = {
  description: 'Get all Invoices',
  tags: ['Invoices'],
  query: {},
  response: {
    200: Type.Array(invoice),
    400: { $ref: 'error' },
    401: { $ref: 'error' },
    403: { $ref: 'error' },
    409: { $ref: 'error' },
    500: { $ref: 'error' },
  },
};

const handler = async (
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> => {
  const invoices = await getAllInvoices();

  return reply.code(200).send(invoices);
};

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.route({
    method: 'GET',
    url: '/',
    preValidation: [fastify['authenticate'], fastify['admin']],
    handler,
    schema,
  });
};
