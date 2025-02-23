import { Type, type Static } from '@sinclair/typebox';
import { type FastifyRequest } from 'fastify';
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

export const passwordResetRequestBody = Type.Object({
  email,
  turnstileToken: Type.String({ minLength: 1, maxLength: 2048 }),
});

export type PasswordResetRequestBody = Static<typeof passwordResetRequestBody>;

export const passwordResetResponseBody = Type.Object({
  message: Type.String(),
});

export const setPasswordBody = Type.Object({
  token: Type.String({ format: 'uuid' }),
  userId: Type.String({ format: 'uuid' }),
  password,
});

export type SetPasswordBody = Static<typeof setPasswordBody>;

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
  isUser: boolean;
  isAdvancedBlender: boolean;
  isInstructor: boolean;
  isRefreshToken: boolean;
  fullName: string;
};

export type AuthUser = AuthPayload & {
  iat: number;
  exp: number;
  jti: string;
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
