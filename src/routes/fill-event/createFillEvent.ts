import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { v4 as uuid } from 'uuid';
// import { knexController } from "../../database/database";
import {
  createFillEventBody,
  CreateFillEventBody,
  fillEventResponse,
  GasPrices,
  GasPressures,
} from '../../types/fillEvent.types';
import { User } from '../../types/user.types';
import { errorHandler } from '../../lib/errorHandler';
import { knexController } from '../../database/database';
import {
  calcFillEventPrice,
  getGasPrices,
  insertFillEvent,
  selectFillEventByUser,
} from '../../lib/fillEvent';
// import { log } from 'console';
import selectCylinderSet from '../../lib/selectCylinderSet';

const schema = {
  description: 'Creates a new fill event',
  tags: ['Fill event'],
  body: createFillEventBody,
  response: {
    201: fillEventResponse,
    400: { $ref: 'error' },
    401: { $ref: 'error' },
    403: { $ref: 'error' },
    500: { $ref: 'error' },
  },
};

type authUser = {
  id: string;
  iat: number;
  exp: number;
};

const handler = async (
  request: FastifyRequest<{ Body: CreateFillEventBody }>,
  reply: FastifyReply
): Promise<void> => {
  const {
    cylinderSetId,
    airPressure,
    oxygenPressure,
    heliumPressure,
    argonPressure,
    diluentPressure,
    info,
  } = request.body;

  if (
    airPressure === 0 &&
    oxygenPressure === 0 &&
    heliumPressure === 0 &&
    argonPressure === 0 &&
    diluentPressure === 0
  ) {
    return errorHandler(reply, 400, 'No gases were given.');
  }
  // cast that bad boy
  const auth = request.user as authUser;

  const user: User = await knexController<User>('user')
    .where('id', auth.id)
    .first('id', 'is_blender as isBlender');

  if (
    !user.isBlender &&
    (oxygenPressure !== 0 ||
      heliumPressure !== 0 ||
      argonPressure !== 0 ||
      diluentPressure !== 0)
  ) {
    return errorHandler(reply, 403, 'User does not have blender priviledges.');
  }

  const set = await knexController.transaction(async (trx) => {
    return selectCylinderSet(trx, cylinderSetId);
  });
  if (set === undefined) {
    return errorHandler(reply, 400, 'Cylinder set was not found');
  }

  const prices: GasPrices | undefined = await getGasPrices();
  if (prices === undefined) {
    return errorHandler(reply, 500, 'Prices are not set');
  }

  const pressures: GasPressures = {
    air: airPressure,
    oxygen: oxygenPressure,
    helium: heliumPressure,
    argon: argonPressure,
    diluent: diluentPressure,
  };
  const price: number = calcFillEventPrice(prices, pressures);
  const eventId = uuid();
  await insertFillEvent(
    eventId,
    auth.id,
    cylinderSetId,
    airPressure,
    oxygenPressure,
    heliumPressure,
    argonPressure,
    diluentPressure,
    price,
    info
  );
  // now this is a fine race condition
  const res = await selectFillEventByUser(auth.id, eventId);
  // console.log(res);

  return reply.code(201).send(res);
};

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.route({
    method: 'POST',
    url: '/',
    preValidation: [fastify['authenticate']],
    handler,
    schema,
  });
};
