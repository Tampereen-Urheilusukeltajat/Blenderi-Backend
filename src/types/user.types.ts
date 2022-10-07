import { Type, Static } from '@sinclair/typebox';

const user = Type.Object({
  id: Type.String(),
  email: Type.String(),
  forename: Type.String(),
  surname: Type.String(),
  admin: Type.Boolean(),
  blender: Type.Boolean(),
  salt: Type.String(),
  password_hash: Type.String(),
});
export type User = Static<typeof user>;

const userResponse = Type.Object({
  email: Type.String(),
  forename: Type.String(),
  surname: Type.String(),
  admin: Type.Boolean(),
  blender: Type.Boolean(),
});
export type UserResponse = Static<typeof userResponse>;

export default { user, userResponse };
