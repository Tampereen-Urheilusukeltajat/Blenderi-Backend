import { Type, Static } from '@sinclair/typebox';
import { FastifyRequest } from 'fastify';

export const authResponse = Type.Object({
  refreshToken: Type.String(),
  accessToken: Type.String(),
});

export type AuthResponse = Static<typeof authResponse>;

export const loginRequestBody = Type.Object({
  email: Type.String({ minLength: 3, maxLength: 254, pattern: '^.+@....+$' }),
  password: Type.String({ minLength: 8, maxLength: 1000 }),
});

export type LoginRequestBody = Static<typeof loginRequestBody>;

export type LoginRequest = FastifyRequest<{
  Body: LoginRequestBody;
}>;

export const refreshRequestBody = Type.Object({
  refreshToken: Type.String(),
});

export type RefreshRequestBody = Static<typeof refreshRequestBody>;

export type RefreshRequest = FastifyRequest<{
  Body: RefreshRequestBody;
}>;
