import { Type, Static } from '@sinclair/typebox';
import { FastifyRequest } from 'fastify';
import { password, email } from './user.types';

export const authResponse = Type.Object({
  refreshToken: Type.String(),
  accessToken: Type.String(),
});

export const loginRequestBody = Type.Object({
  email,
  password,
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

export type AuthTokens = Static<typeof authResponse>;

export type AuthPayload = {
  id: string;
  isAdmin: boolean;
  isBlender: boolean;
  isRefreshToken: boolean;
};

export type AuthUser = AuthPayload & {
  iat: number;
  exp: number;
};

export const logoutRequestBody = Type.Object({
  refreshToken: Type.String(),
});

export type LogoutRequestBody = Static<typeof logoutRequestBody>;

export type LogoutRequest = FastifyRequest<{
  Body: RefreshRequestBody;
}>;

export const logoutResponseBody = Type.Object({
  message: Type.String(),
  id: Type.String({ format: 'uuid' }),
});

export type LogoutResponseBody = FastifyRequest<{
  Body: LogoutResponseBody;
}>;
