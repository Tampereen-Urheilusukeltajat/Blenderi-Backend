import { Type, Static } from '@sinclair/typebox';
import { FastifyRequest } from 'fastify';

export const user = Type.Object({
  id: Type.String(),
  email: Type.String(),
  forename: Type.String(),
  surname: Type.String(),
  isAdmin: Type.Boolean(),
  isBlender: Type.Boolean(),
  salt: Type.String(),
  passwordHash: Type.String(),
});

export type User = Static<typeof user>;

export const updateUserBody = Type.Object({
  email: Type.String(),
  forename: Type.String(),
  surname: Type.String(),
  isAdmin: Type.Boolean(),
  isBlender: Type.Boolean(),
  salt: Type.String(),
  password: Type.String(),
});

export type UpdateUserBody = Static<typeof updateUserBody>;

export const userResponse = Type.Object({
  id: Type.String(),
  email: Type.String(),
  forename: Type.String(),
  surname: Type.String(),
  isAdmin: Type.Boolean(),
  isBlender: Type.Boolean(),
});

export type UserResponse = Static<typeof userResponse>;

export const createUserRequestBody = Type.Object({
  email: Type.String({ minLength: 3, maxLength: 254, pattern: '^.+@....+$' }), // We do not accept hosts without top level domain
  forename: Type.String({ minLength: 1, maxLength: 255 }),
  surname: Type.String({ minLength: 1, maxLength: 255 }),
  password: Type.String({ minLength: 8, maxLength: 1000 }),
});

export type CreateUserRequestBody = Static<typeof createUserRequestBody>;

export type CreateUserRequest = FastifyRequest<{
  Body: CreateUserRequestBody;
}>;

export const userIdParamsPayload = Type.Object({
  userId: Type.String(),
});

export type UserIdParamsPayload = Static<typeof userIdParamsPayload>;

const hashObj = Type.Object({
  hash: Type.String(),
  salt: Type.String(),
});

export type HashObj = Static<typeof hashObj>;
