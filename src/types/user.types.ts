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
  email: Type.Optional(Type.String()),
  forename: Type.Optional(Type.String()),
  surname: Type.Optional(Type.String()),
  isAdmin: Type.Optional(Type.Boolean()),
  isBlender: Type.Optional(Type.Boolean()),
  password: Type.Optional(Type.String()),
});

export type UpdateUserBody = Partial<Static<typeof updateUserBody>>;

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
  email: Type.String(),
  forename: Type.String(),
  surname: Type.String(),
  password: Type.String(),
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
