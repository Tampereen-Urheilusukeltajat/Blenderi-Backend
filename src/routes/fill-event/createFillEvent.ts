import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
// import { knexController } from "../../database/database";
import {
  createFillEventBody,
  CreateFillEventBody,
  fillEventResponse,
} from '../../types/fillEvent.types';
import { errorHandler } from '../../lib/errorHandler';
// import { getGasPrice, /*insertFillEvent*/ } from '../../lib/fillEvent';

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

const handler = async (
  request: FastifyRequest<{ Body: CreateFillEventBody }>,
  reply: FastifyReply
): Promise<void> => {
  // console.log(request.body);
  /* const { airPressure, oxygenPressure, heliumPressure, argonPressure, diluentPressure, info } = request.body
  if (!airPressure && !oxygenPressure && !heliumPressure && !argonPressure && !diluentPressure ){
    return errorHandler(reply, 400, 'No gases were given')
  }
  if (airPressure && !oxygenPressure && !heliumPressure && !argonPressure && !diluentPressure){
    await insertFillEvent("lmao", "cylinderSet", airPressure, oxygenPressure, heliumPressure, argonPressure, diluentPressure, 0, info) 
    return reply.status(201);
  }
  const price: Number = await getGasPrice('oxygen')
  // console.log(price);
  */
  return errorHandler(reply, 403, 'lol');
};

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.route({
    method: 'POST',
    url: '/',
    handler,
    schema,
  });
};
