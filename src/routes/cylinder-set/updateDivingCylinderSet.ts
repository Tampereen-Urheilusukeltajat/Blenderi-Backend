import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { knexController } from '../../database/database';
import { errorHandler } from '../../lib/utils/errorHandler';
import { selectCylinderSet } from '../../lib/queries/divingCylinderSet';
import {
  DivingCylinderSet,
  divingCylinderSet,
  divingCylinderSetIdParamsPayload,
  DivingCylinderSetIdParamsPayload,
  UpdateDivingCylinderBody,
  updateDivingCylinderSet,
  UpdateDivingCylinderSet,
} from '../../types/divingCylinderSet.types';

const schema = {
  description: 'Updates a diving cylinder set',
  tags: ['Cylinder set'],
  body: updateDivingCylinderSet,
  params: divingCylinderSetIdParamsPayload,
  response: {
    200: divingCylinderSet,
    400: { $ref: 'error' },
    401: { $ref: 'error' },
    403: { $ref: 'error' },
    404: { $ref: 'error' },
    409: { $ref: 'error' },
    500: { $ref: 'error' },
  },
};

const handler = async (
  request: FastifyRequest<{
    Body: UpdateDivingCylinderSet;
    Params: DivingCylinderSetIdParamsPayload;
  }>,
  reply: FastifyReply
): Promise<void> => {
  // TODO: Authorization

  const setId = request.params.divingCylinderSetId;

  // validate cylinder data
  if (request.body.cylinders !== undefined) {
    for (const cylinder of request.body.cylinders) {
      // inspection date
      if (cylinder.inspection !== undefined) {
        const inspection = new Date(cylinder.inspection);
        const thisYear = new Date().getUTCFullYear();
        if (inspection.getUTCFullYear() > thisYear) {
          await errorHandler(reply, 400, 'Inspection date from the future');
          return;
        }
      }
    }
  }

  await knexController
    .transaction(async (trx) => {
      const updateResult = await trx('diving_cylinder_set')
        .where('id', setId)
        .update<UpdateDivingCylinderSet>({
          name: request.body.name,
          updated_at: trx.fn.now(),
        });

      if (!updateResult) {
        await errorHandler(reply, 404, 'Cylinder set not found');
        return;
      }

      if (request.body.cylinders !== undefined) {
        for (const cylinder of request.body.cylinders) {
          let inspection: string | undefined;
          if (cylinder.inspection !== undefined) {
            const inspectionDate = new Date(cylinder.inspection);
            inspection = inspectionDate.toISOString().slice(0, 23);
          }

          await trx('diving_cylinder')
            .where('id', cylinder.id)
            .update<UpdateDivingCylinderBody>({
              volume: cylinder.volume,
              pressure: cylinder.pressure,
              material: cylinder.material,
              serial_number: cylinder.serialNumber,
              inspection,
            });
        }
      }

      const resultBody: DivingCylinderSet | undefined = await selectCylinderSet(
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
    url: '/:divingCylinderSetId',
    preValidation: [fastify['authenticate']],
    handler,
    schema,
  });
};
