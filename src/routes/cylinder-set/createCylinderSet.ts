import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { v4 as uuid } from 'uuid';

import { knexController } from '../../database/database';
import { errorHandler } from '../../lib/errorHandler';
import {
  Cylinder,
  cylinderSet,
  CylinderSet,
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

      const resultBody: CylinderSet | undefined = await trx(
        'diving_cylinder_set'
      )
        .select<CylinderSet>('id', 'owner', 'name')
        .where('id', setId)
        .first();

      if (resultBody === undefined)
        return errorHandler(reply, 500, 'Database error');

      resultBody.cylinders = await trx('diving_cylinder')
        .innerJoin(
          'diving_cylinder_to_set',
          'diving_cylinder.id',
          '=',
          'diving_cylinder_to_set.cylinder'
        )
        .select<Cylinder[]>(
          'id',
          'volume',
          'pressure',
          'material',
          'serial_number as serialNumber',
          'inspection'
        )
        .where('diving_cylinder_to_set.cylinder_set', setId);

      await reply.code(201).send(resultBody);
    })
    .catch(async (error) => {
      if (error?.code === 'ER_DUP_ENTRY') {
        return errorHandler(
          reply,
          409,
          'Tried to create duplicate diving cylinder set'
        );
      }
      log.error(error);
      return errorHandler(reply, 500, '🖕');
    });
};

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.route({
    method: 'POST',
    url: '/',
    handler,
    schema,
  });
};
