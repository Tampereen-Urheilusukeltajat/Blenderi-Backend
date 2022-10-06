import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { Type, Static } from '@sinclair/typebox';
import { knexController } from '../../database/database';

const userAddedResponse = Type.Object({
  status: Type.String(),
});
export type UserAddedResponse = Static<typeof userAddedResponse>;

const createSchema = {
  description: 'Add new user or return error if add is not successful',
  summary: 'Add user',
  tags: ['User'],
  body: {
    type: 'object',
    required: ['email', 'forename', 'surname', 'password'],
    properties: {
      email: {
        type: 'string',
      },
      forename: {
        type: 'string',
      },
      surname: {
        type: 'string',
      },
      password: {
        type: 'string',
      },
    },
  },
  response: {
    201: {
      description: 'User added',
      type: 'null',
    },
    409: {
      description: 'Email already in use',
      type: 'null',
    },
    500: {
      description: 'Server error',
      type: 'null',
    },
  },
};

const createHandler = async (
  req: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  if (req.body) {
    // it has it believe or not...
    const result = await knexController('user')
      .count()
      .where('email', req.body['email']);
    const count: Number = Number(result[0]['count(*)']);
    if (count > 0) {
      reply.code(409);
      await reply.send();
    } else {
      const body: any = req.body;
      console.log('foo');
      await knexController('user').insert({
        email: body['email'] as string,
        forename: body['forename'] as string,
        surname: body['surname'] as string,
        admin: false,
        blender: false,
        salt: 'suolaa haavoihin',
        password_hash: 'hassi',
      });
      console.log('bar');
      reply.code(201);
      await reply.send();
    }
  }
};

export default async (fastify: FastifyInstance): Promise<void> => {
  fastify.route({
    method: 'POST',
    url: '/user',
    handler: createHandler,
    schema: createSchema,
  });
};
