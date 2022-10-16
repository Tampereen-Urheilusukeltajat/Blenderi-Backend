import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { Type, Static } from '@sinclair/typebox';

const heartBeatResponse = Type.Object({
  status: Type.String(),
  date: Type.String(),
});

export type HeartbeatResponse = Static<typeof heartBeatResponse>;

const schema = {
  description: 'Life check',
  summary: 'Heartbeat',
  tags: ['Utility'],
  response: {
    200: heartBeatResponse,
  },
};

const handler = async (
  req: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  await reply.send({
    status: 'OK',
    date: new Date(),
  });
};

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.route({
    method: 'GET',
    url: '/heartbeat',
    handler,
    schema,
  });
};
