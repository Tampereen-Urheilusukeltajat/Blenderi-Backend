import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { knexController } from '../../database/database';
import { errorHandler } from '../../lib/errorHandler';
import selectCylinderSet from '../../lib/selectCylinderSet';
import {
  cylinderSet,
  CylinderSet,
  updateCylinderSet,
  UpdateCylinderSet,
  UpdateCylinderBody,
  cylinderSetIdParamsPayload,
  CylinderSetIdParamsPayload,
} from '../../types/cylinderSet.types';

const schema = {
  description: 'Creates a diving cylinder set',
  tags: ['Cylinder set'],
  body: updateCylinderSet,
  params: cylinderSetIdParamsPayload,
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
    Body: UpdateCylinderSet;
    Params: CylinderSetIdParamsPayload;
  }>,
  reply: FastifyReply
): Promise<void> => {
  // TODO: Authorization

  const setId = request.params.cylinderSetId;

  // validate cylinder data
  if (request.body.cylinders !== undefined) {
    for (const cylinder of request.body.cylinders) {
      // inspection date
      if (cylinder.inspection !== undefined) {
        const inspection = new Date(cylinder.inspection);
        const thisYear = new Date().getUTCFullYear();
        if (inspection.getUTCFullYear() > thisYear) {
          return errorHandler(reply, 400, 'Inspection date from the future');
        }
      }
    }
  }

  await knexController
    .transaction(async (trx) => {
      await trx('diving_cylinder_set')
        .where('id', setId)
        .update<UpdateCylinderSet>({
          name: request.body.name,
          owner: request.body.owner,
        });

      if (request.body.cylinders !== undefined) {
        for (const cylinder of request.body.cylinders) {
          let inspection: string | undefined;
          if (cylinder.inspection !== undefined) {
            const inspectionDate = new Date(cylinder.inspection);
            inspection = inspectionDate.toISOString().slice(0, 23);
          }

          await trx('diving_cylinder')
            .where('id', cylinder.id)
            .update<UpdateCylinderBody>({
              volume: cylinder.volume,
              pressure: cylinder.pressure,
              material: cylinder.material,
              serial_number: cylinder.serialNumber,
              inspection,
            });
        }
      }

      const resultBody: CylinderSet | undefined = await selectCylinderSet(
        trx,
        setId
      );
      if (resultBody === undefined) {
        throw new Error('Database update failed: update cylinder set');
      }

      await reply.code(200).send(resultBody);
    })
    .catch(async (error) => {
      if (error?.code === 'ER_DUP_ENTRY') {
        return errorHandler(
          reply,
          409,
          'Tried to create duplicate diving cylinder set'
        );
      }

      throw error;
    });
};

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.route({
    method: 'PATCH',
    url: '/:cylinderSetId',
    handler,
    schema,
  });
};
