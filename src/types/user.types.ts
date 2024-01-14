import { Type, Static } from '@sinclair/typebox';
import { FastifyRequest } from 'fastify';

export const email = Type.String({
  minLength: 3,
  maxLength: 254,
  pattern: '^.+@....+$', // We do not accept hosts without top level domain
});

export const password = Type.String({ minLength: 8, maxLength: 1000 });

export const user = Type.Object({
  id: Type.String({ format: 'uuid' }),
  email,
  phoneNumber: Type.String(),
  forename: Type.String(),
  surname: Type.String(),
  isMember: Type.Boolean(),
  isAdmin: Type.Boolean(),
  isBlender: Type.Boolean(),
  isAdvancedBlender: Type.Boolean(),
  isInstructor: Type.Boolean(),
  salt: Type.String(),
  passwordHash: Type.String(),
  archivedAt: Type.String(),
  deletedAt: Type.String(),
});

export type User = Static<typeof user>;

export const updateUserBody = Type.Partial(
  Type.Object({
    email,
    phoneNumber: Type.String(),
    forename: Type.String(),
    surname: Type.String(),
    password,
    currentPassword: Type.String(),
    archive: Type.Boolean(),
  }),
  { minProperties: 1 }
);

export type UpdateUserBody = Static<typeof updateUserBody>;

export const userResponse = Type.Object({
  id: Type.String({ format: 'uuid' }),
  email,
  phoneNumber: Type.String(),
  forename: Type.String(),
  surname: Type.String(),
  isMember: Type.Boolean(),
  isAdmin: Type.Boolean(),
  isBlender: Type.Boolean(),
  isAdvancedBlender: Type.Boolean(),
  isInstructor: Type.Boolean(),
});

export type UserResponse = Static<typeof userResponse>;

export const createUserRequestBody = Type.Object({
  email,
  phoneNumber: Type.String({ minLength: 3, maxLength: 32 }),
  forename: Type.String({ minLength: 1, maxLength: 255 }),
  surname: Type.String({ minLength: 1, maxLength: 255 }),
  password,
  turnstileToken: Type.String({ minLength: 517, maxLength: 517 }),
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

export const userIdQueryString = Type.Object({
  userId: Type.String({ format: 'uuid' }),
});

export type UserIdQueryString = Static<typeof userIdQueryString>;
