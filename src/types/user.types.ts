import { Type, Static } from '@sinclair/typebox';
import { hash } from 'bcrypt';

export const user = Type.Object({
  id: Type.String(),
  email: Type.String(),
  forename: Type.String(),
  surname: Type.String(),
  isAdmin: Type.Boolean(),
  isBlender: Type.Boolean(),
  salt: Type.String(),
  password: Type.String(),
});
export type User = Static<typeof user>;

export const editUserResponse = Type.Object({
  id: Type.String(),
  email: Type.String(),
  forename: Type.String(),
  surname: Type.String(),
  isAdmin: Type.Boolean(),
  isBlender: Type.Boolean(),
});

export type EditUserResponse = Static<typeof editUserResponse>;

const userParamsPayload = Type.Object({
  userId: Type.String(),
});

export type UserParamsPayload = Static<typeof userParamsPayload>;

const hashObj = Type.Object({
  hash: Type.Union([Type.String(), Type.Undefined()]),
  salt: Type.Union([Type.String(), Type.Undefined()]),
});

export type HashObj = Static<typeof hashObj>;
