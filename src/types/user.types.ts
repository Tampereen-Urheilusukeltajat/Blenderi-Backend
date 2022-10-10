import { Type, Static } from '@sinclair/typebox';

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
  id: Type.String(),
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
  email: Type.String(),
  forename: Type.String(),
  surname: Type.String(),
  isAdmin: Type.Boolean(),
  isBlender: Type.Boolean(),
});

export type UserResponse = Static<typeof userResponse>;

export const editUserResponse = Type.Object({
  id: Type.String(),
  email: Type.String(),
  forename: Type.String(),
  surname: Type.String(),
  isAdmin: Type.Boolean(),
  isBlender: Type.Boolean(),
});

export type EditUserResponse = Static<typeof editUserResponse>;

const userIdParamsPayload = Type.Object({
  userId: Type.String(),
});

export type UserIdParamsPayload = Static<typeof userIdParamsPayload>;

const hashObj = Type.Object({
  hash: Type.String(),
  salt: Type.String(),
});

export type HashObj = Static<typeof hashObj>;
