import { Type, Static } from '@sinclair/typebox';
import { FastifyRequest } from 'fastify';

export const compressor = Type.Object({
  id: Type.String({ format: 'uuid' }),
  name: Type.String(),
  description: Type.String(),
  isEnabled: Type.Boolean(),
});

export type Compressor = Static<typeof compressor>;

export const createCompressorRequestBody = Type.Object({
  name: Type.String({ minLength: 1, maxLength: 32 }),
  description: Type.String({ minLength: 1, maxLength: 128 }),
});

export type CreateCompressorRequestBody = Static<
  typeof createCompressorRequestBody
>;

export type CreateCompressorRequest = FastifyRequest<{
  Body: CreateCompressorRequestBody;
}>;
