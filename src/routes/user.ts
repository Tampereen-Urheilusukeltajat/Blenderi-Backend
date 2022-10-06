import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { Type, Static } from '@sinclair/typebox';
import { knexController } from '../database/database';

const typeboxParam = Type.Object({
  userId: Type.Optional(Type.String()),
});

export type TypeboxParam = Static<typeof typeboxParam>;

const userAddedResponse = Type.Object({
  status: Type.String(),
});

export type UserAddedResponse = Static<typeof userAddedResponse>;

// TODO: Make another response type with more user information for admin view
const userSearchResponse = Type.Object({
  email: Type.String(),
  firstName: Type.String(),
  lastName: Type.String(),
});

export type UserSearchResponse = Static<typeof userSearchResponse>;

const searchSchema = {
  description: 'Search for an user with given id',
  summary: 'Search user',
  tags: ['User'],
  params: typeboxParam,
  response: {
    200: userSearchResponse,
    401: { $ref: 'error' },
    403: { $ref: 'error' },
    404: { $ref: 'error' },
  },
};

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

const searchUserHandler = async (
  req: FastifyRequest<{ Params: TypeboxParam }>,
  reply: FastifyReply
): Promise<void> => {
  // TODO: Authorization check
  // TODO: DB query
  const userId = req.params.userId;
  if (userId !== undefined) {
    await reply.send({
      email: `${userId}@hello.fi`,
      firstName: userId,
      lastName: 'Esimerkki',
    });
  }
  await reply.send({
    email: `toimiiko`,
    firstName: 'parametriton',
    lastName: 'path vihdoinkin??',
  });
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
  ['/user', '/user/:userId'].forEach((path) =>
    fastify.route({
      method: 'GET',
      url: path,
      handler: searchUserHandler,
      schema: searchSchema,
    })
  );
  fastify.route({
    method: 'POST',
    url: '/user',
    handler: createHandler,
    schema: createSchema,
  });
};
