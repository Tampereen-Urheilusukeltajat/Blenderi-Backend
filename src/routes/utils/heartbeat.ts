import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

const schema = {
  description: 'Life check',
  summary: 'Heartbeat',
  tags: ['Utility'],
  response: {
    200: {
      type: 'object',
      properties: {
        status: {
          type: 'string'
        },
        date: {
          type: 'string'
        }
      }
    }
  }
};

const handler = async (req: FastifyRequest, reply: FastifyReply): Promise<void> => {
  await reply.send({
    status: 'OK',
    date: new Date()
  });
};

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.route({
    method: 'GET',
    url: '/heartbeat',
    handler,
    schema
  });
};
