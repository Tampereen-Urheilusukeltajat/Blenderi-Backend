import { Type, Static } from '@sinclair/typebox';

const user = Type.Object({
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
  admin: Type.Boolean(),
  blender: Type.Boolean(),
});

export type EditUserResponse = Static<typeof editUserResponse>;
