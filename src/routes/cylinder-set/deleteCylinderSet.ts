import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { knexController } from '../../database/database';
import { errorHandler } from '../../lib/errorHandler';
import { Type } from '@sinclair/typebox';
import {
  cylinderSetIdParamsPayload,
  CylinderSetIdParamsPayload,
} from '../../types/cylinderSet.types';

const deleteSetReply = Type.Object({
  setId: Type.String(),
  message: Type.String(),
});

const schema = {
  description: 'Deletes a diving cylinder set',
  tags: ['Cylinder set', 'Delete'],
  params: cylinderSetIdParamsPayload,
  response: {
    200: deleteSetReply,
    404: { $ref: 'error' },
    500: { $ref: 'error' },
  },
};

const handler = async (
  request: FastifyRequest<{
    Params: CylinderSetIdParamsPayload;
  }>,
  reply: FastifyReply
): Promise<void> => {
  // TODO: Authorization

  const setId = request.params.cylinderSetId;

  await knexController.transaction(async (trx) => {
    // Get id's of cylinders that belong to given set.
    const rowData = await trx
      .select('cylinder')
      .from('diving_cylinder_to_set')
      .where('cylinder_set', setId);

    // Delete single cylinders from set.
    await trx('diving_cylinder_to_set').where('cylinder_set', setId).del();

    // Delete single cylinders.
    for (const cylinder of rowData) {
      await trx('diving_cylinder').where({ id: cylinder.cylinder }).del();
    }

    // Delete set.
    const setResponse = await trx('diving_cylinder_set')
      .where('id', setId)
      .del();

    if (setResponse === 0) {
      return errorHandler(reply, 404, 'No set with given id found.');
    }
  });

  await reply.code(200).send({ setId, message: 'Set deleted successfully!' });
};

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.route({
    method: 'DELETE',
    url: '/:cylinderSetId',
    handler,
    schema,
  });
};
