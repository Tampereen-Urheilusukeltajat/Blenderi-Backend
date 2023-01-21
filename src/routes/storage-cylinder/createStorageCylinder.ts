import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { errorHandler } from '../../lib/utils/errorHandler';
import { getGasById } from '../../lib/queries/gas';
import { createStorageCylinder } from '../../lib/queries/storageCylinder';
import {
  CreateStorageCylinderBody,
  createStorageCylinderBody,
  storageCylinder,
} from '../../types/storageCylinder.types';

const schema = {
  description: 'Creates a storage cylinder',
  tags: ['Storage cylinder'],
  body: createStorageCylinderBody,
  response: {
    201: storageCylinder,
    400: { $ref: 'error' },
    401: { $ref: 'error' },
    403: { $ref: 'error' },
    500: { $ref: 'error' },
  },
};

const handler = async (
  request: FastifyRequest<{
    Body: CreateStorageCylinderBody;
  }>,
  reply: FastifyReply
): Promise<void> => {
  const gasExists = await getGasById(request.body.gasId);
  if (!gasExists) return errorHandler(reply, 400, 'Gas does not exist');

  const insertedStorageCylinder = await createStorageCylinder(request.body);
  return reply.code(201).send(insertedStorageCylinder);
};

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.route({
    method: 'POST',
    url: '/',
    // TODO Only admin users can create storage cylinders
    preValidation: [fastify['authenticate']],
    handler,
    schema,
  });
};
