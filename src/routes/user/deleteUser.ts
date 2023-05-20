import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { knexController } from '../../database/database';
import { archiveDivingCylinderSet } from '../../lib/queries/divingCylinderSet';
import {
  userIdParamsPayload,
  UserIdParamsPayload,
  deleteUserReply,
} from '../../types/user.types';
import { errorHandler } from '../../lib/utils/errorHandler';

const schema = {
  description:
    'Mark user with given userId as deleted and anonymize relating data.',
  summary: 'Delete user',
  tags: ['User'],
  params: userIdParamsPayload,
  response: {
    200: deleteUserReply,
    401: { $ref: 'error' },
    403: { $ref: 'error' },
    404: { $ref: 'error' },
  },
};

const handler = async (
  req: FastifyRequest<{ Params: UserIdParamsPayload }>,
  reply: FastifyReply
): Promise<void> => {
  const { userId } = req.params;
  const { id, isAdmin } = req.user;

  if (id !== userId && !isAdmin) {
    return errorHandler(reply, 403);
  }

  const transaction = await knexController.transaction();

  const result = await transaction('user').where({ id: userId }).update({
    email: null,
    phone: null,
    forename: null,
    surname: null,
    is_admin: false,
    is_blender: false,
    deleted_at: transaction.fn.now(),
  });
  if (result === 0) {
    await transaction.rollback();
    return errorHandler(reply, 404, 'User not found');
  }
  const cylinderIds = await transaction('diving_cylinder_set')
    .where({ owner: userId })
    .select('id');

  const promises: Array<Promise<void>> = [];
  cylinderIds.map(async (dataPacket) => {
    promises.push(archiveDivingCylinderSet(dataPacket.id, transaction));
  });

  await Promise.all(promises);

  const user = await transaction('user')
    .where({ id: userId })
    .select('id as userId', 'deleted_at as deletedAt');

  await transaction.commit();
  return reply.code(200).send(...user);
};

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.route({
    method: 'DELETE',
    url: '/:userId',
    preValidation: [fastify['authenticate']],
    handler,
    schema,
  });
};
