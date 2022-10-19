import { Type, Static } from '@sinclair/typebox';
import { FastifyRequest } from 'fastify';

export const user = Type.Object({
  id: Type.String(),
  email: Type.String(),
  phone: Type.Optional(Type.String()),
  forename: Type.String(),
  surname: Type.String(),
  isAdmin: Type.Boolean(),
  isBlender: Type.Boolean(),
  salt: Type.String(),
  passwordHash: Type.String(),
  archivedAt: Type.String(),
  deletedAt: Type.String(),
});

export type User = Static<typeof user>;

export const updateUserBody = Type.Object({
  email: Type.Optional(Type.String()),
  phone: Type.Optional(Type.String()),
  forename: Type.Optional(Type.String()),
  surname: Type.Optional(Type.String()),
  isAdmin: Type.Optional(Type.Boolean()),
  isBlender: Type.Optional(Type.Boolean()),
  password: Type.Optional(Type.String()),
  archive: Type.Optional(Type.Boolean()),
});

export type UpdateUserBody = Static<typeof updateUserBody>;

export const userResponse = Type.Object({
  id: Type.String(),
  email: Type.String(),
  phone: Type.Optional(Type.String()),
  forename: Type.String(),
  surname: Type.String(),
  isAdmin: Type.Boolean(),
  isBlender: Type.Boolean(),
  archivedAt: Type.String(),
});

export type UserResponse = Static<typeof userResponse>;

export const createUserRequestBody = Type.Object({
  email: Type.String({ minLength: 3, maxLength: 254, pattern: '^.+@....+$' }), // We do not accept hosts without top level domain
  phone: Type.Optional(Type.String({ minLength: 1, maxLength: 64 })),
  forename: Type.String({ minLength: 1, maxLength: 255 }),
  surname: Type.String({ minLength: 1, maxLength: 255 }),
  password: Type.String({ minLength: 8, maxLength: 1000 }),
});

export type CreateUserRequestBody = Static<typeof createUserRequestBody>;

export type CreateUserRequest = FastifyRequest<{
  Body: CreateUserRequestBody;
}>;

export const userIdParamsPayload = Type.Object({
  userId: Type.String({ format: 'uuid' }),
});

export type UserIdParamsPayload = Static<typeof userIdParamsPayload>;

export const deleteUserReply = Type.Object({
  userId: Type.String({ format: 'uuid' }),
  deletedAt: Type.String(),
});

export type DeleteUserReply = Static<typeof deleteUserReply>;

const hashObj = Type.Object({
  hash: Type.String(),
  salt: Type.String(),
});

export type HashObj = Static<typeof hashObj>;
