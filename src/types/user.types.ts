import { Type, type Static } from '@sinclair/typebox';
import { type FastifyRequest } from 'fastify';

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
  salt: Type.String(),
  passwordHash: Type.String(),
  archivedAt: Type.String(),
  deletedAt: Type.String(),
});

export const userRoles = Type.Object({
  isUser: Type.Boolean(),
  isAdmin: Type.Boolean(),
  isBlender: Type.Boolean(),
  isAdvancedBlender: Type.Boolean(),
  isInstructor: Type.Boolean(),
});

type UserBase = Static<typeof user>;
export type UserRoles = Static<typeof userRoles>;
export type User = UserBase & UserRoles;

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
  { minProperties: 1 },
);

export type UpdateUserBody = Static<typeof updateUserBody>;

export const updateUserRolesBody = Type.Partial(userRoles, {
  minProperties: 1,
});
export type UpdateUserRolesBody = Static<typeof updateUserRolesBody>;

export const userResponse = Type.Object({
  id: Type.String({ format: 'uuid' }),
  email,
  phoneNumber: Type.String(),
  forename: Type.String(),
  surname: Type.String(),
  isUser: Type.Boolean(),
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
  turnstileToken: Type.String({ minLength: 1, maxLength: 2048 }),
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

export const minifiedUserResponse = Type.Object({
  id: Type.String({ format: 'uuid' }),
  email,
  forename: Type.String(),
  surname: Type.String(),
});

export type MinifiedUserResponse = Static<typeof minifiedUserResponse>;
