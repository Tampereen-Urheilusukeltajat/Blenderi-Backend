import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { Type, Static } from '@sinclair/typebox';
import { knexController } from '../../database/database';

const user = Type.Object({
  id: Type.Number(),
  email: Type.String(),
  forename: Type.String(),
  surname: Type.String(),
  admin: Type.Boolean(),
  blender: Type.Boolean(),
  salt: Type.String(),
  password_hash: Type.String(),
});
export type User = Static<typeof user>;

const searchParamsPayload = Type.Object({
  userId: Type.String(),
});
export type SearchParamsPayload = Static<typeof searchParamsPayload>;

const userAddedResponse = Type.Object({
  status: Type.String(),
});
export type UserAddedResponse = Static<typeof userAddedResponse>;

// TODO: Make another response type with more user information for admin view
const userSearchResponse = Type.Object({
  email: Type.String(),
  forename: Type.String(),
  surname: Type.String(),
  isAdmin: Type.Boolean(),
  isBlender: Type.Boolean(),
});
export type UserSearchResponse = Static<typeof userSearchResponse>;

const fetchAllResponse = Type.Array(userSearchResponse);
export type FetchAllResponse = Static<typeof fetchAllResponse>;

const searchSchema = {
  description: 'Search for an user with given id',
  summary: 'Search user',
  tags: ['User'],
  params: searchParamsPayload,
  response: {
    200: userSearchResponse,
    400: { $ref: 'error' },
    401: { $ref: 'error' },
    403: { $ref: 'error' },
    404: { $ref: 'error' },
  },
};

const fetchAllSchema = {
  description: 'Fetch all users',
  summary: 'Fetch all users',
  tags: ['User'],
  response: {
    200: userSearchResponse,
    401: { $ref: 'error' },
    403: { $ref: 'error' },
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
  req: FastifyRequest<{
    Params: SearchParamsPayload;
  }>,
  reply: FastifyReply
): Promise<void> => {
  // Search by id and/or email?
  // TODO: Authorization check
  // TODO: Don't return if user is archived
  const userId = req.params.userId;

  if (userId !== undefined) {
    const result = await knexController<User>('user')
      .where('id', userId)
      .first();
    await reply.send({
      email: result?.email,
      forename: result?.forename,
      surname: result?.surname,
      isAdmin: result?.admin,
      isBlender: result?.blender,
    });
  }
};

const fetchAllHandler = async (
  req: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  // TODO: Authorization
  const result = await knexController<User>('user').select();
  console.log(result);

  await reply.send({
    email: `TODO:`,
    forename: 'adminin kaikki',
    surname: 'käyttäjät-haku',
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
  fastify.route({
    method: 'GET',
    url: '/user',
    handler: fetchAllHandler,
    schema: fetchAllSchema,
  });
  fastify.route({
    method: 'GET',
    url: '/user/:userId',
    handler: searchUserHandler,
    schema: searchSchema,
  });
  fastify.route({
    method: 'POST',
    url: '/user',
    handler: createHandler,
    schema: createSchema,
  });
};
