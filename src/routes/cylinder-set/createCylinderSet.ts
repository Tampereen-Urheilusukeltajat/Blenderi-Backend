import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { v4 as uuid } from 'uuid';

import { knexController } from '../../database/database';
import { errorHandler } from '../../lib/errorHandler';
import {
  Cylinder,
  cylinderSet,
  createCylinderSet,
  CreateCylinderSet,
} from '../../types/cylinderSet.types';
import { log } from '../../lib/log';

const schema = {
  description: 'Creates a diving cylinder set',
  tags: ['Cylinder set'],
  body: createCylinderSet,
  response: {
    201: cylinderSet,
    400: { $ref: 'error' },
    401: { $ref: 'error' },
    403: { $ref: 'error' },
    409: { $ref: 'error' },
    500: { $ref: 'error' },
  },
};

const handler = async (
  request: FastifyRequest<{
    Body: CreateCylinderSet;
  }>,
  reply: FastifyReply
): Promise<void> => {
  // TODO: Authorization

  const setId = uuid();
  const cylinderIds: string[] = [];

  await knexController
    .transaction(async (trx) => {
      await trx('diving_cylinder_set').insert({
        id: setId,
        name: request.body.name,
        owner: request.body.owner,
      });

      for (const cylinder of request.body.cylinders) {
        const cylinderId = uuid();

        await trx('diving_cylinder').insert<Cylinder>({
          id: cylinderId,
          volume: cylinder.volume,
          pressure: cylinder.pressure,
          material: cylinder.material,
          serial_number: cylinder.serialNumber,
          inspection: cylinder.inspection,
        });
        cylinderIds.push(cylinderId);

        await trx('diving_cylinder_to_set').insert({
          cylinder: cylinderId,
          cylinder_set: setId,
        });
      }
    })
    .catch(async (error) => {
      log.error(error);
      return errorHandler(reply, 500, '🖕');
    });

  await reply.code(201).send(cylinderSet.static);
};

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.route({
    method: 'POST',
    url: '/',
    handler,
    schema,
  });
};
