import { Type, type Static } from '@sinclair/typebox';
import { storageCylinderUsage } from './storageCylinder.types';

export const fillEvent = Type.Object({
  id: Type.Integer({ minimum: 0 }),
  userId: Type.String({ format: 'uuid' }),
  cylinderSetId: Type.String({ format: 'uuid' }),
  gasMixture: Type.String({ maxLength: 124 }),
  storageCylinderUsage: Type.Array(storageCylinderUsage),
  description: Type.Optional(Type.String({ maxLength: 1024 })),
});

export type FillEvent = Static<typeof fillEvent>;

export const createFillEventBody = Type.Object({
  cylinderSetId: Type.String({ format: 'uuid' }),
  gasMixture: Type.String({ maxLength: 124 }),
  filledAir: Type.Boolean(),
  storageCylinderUsageArr: Type.Array(storageCylinderUsage),
  description: Type.Optional(Type.String({ maxLength: 1024 })),
  price: Type.Integer({ minimum: 0 }),
  compressorId: Type.Optional(Type.String({ format: 'uuid' })),
});

export type CreateFillEventBody = Static<typeof createFillEventBody>;

export const fillEventResponse = Type.Object({
  id: Type.Integer({ minimum: 0 }),
  userId: Type.String({ format: 'uuid' }),
  cylinderSetId: Type.String({ format: 'uuid' }),
  gasMixture: Type.String({ maxLength: 124 }),
  storageCylinderUsageArr: Type.Array(storageCylinderUsage),
  description: Type.Optional(Type.String({ maxLength: 1024 })),
  price: Type.Integer({ minimum: 0 }),
  compressorId: Type.Optional(Type.String({ format: 'uuid' })),
});

export type FillEventResponse = Static<typeof fillEventResponse>;

export const fillEventGasFill = Type.Object({
  fillEventId: Type.Integer({ minimum: 0 }),
  storageCylinderId: Type.Integer({ minimum: 0 }),
  volumeLitres: Type.Integer({ minimum: 0 }),
  gasPriceId: Type.Integer({ minimum: 0 }),
});

export type FillEventGasFill = Static<typeof fillEventGasFill>;

export const getFillEventsResponse = Type.Object({
  id: Type.String(),
  userId: Type.String({ format: 'uuid' }),
  cylinderSetId: Type.String({ format: 'uuid' }),
  cylinderSetName: Type.String(),
  gasMixture: Type.String(),
  description: Type.Optional(Type.String({ maxLength: 1024 })),
  price: Type.Integer({ minimum: 0 }),
  createdAt: Type.String({ format: 'date' }),
  compressorId: Type.Optional(Type.String({ format: 'uuid' })),
  compressorName: Type.Optional(Type.String()),
});

export type GetFillEventsResponse = Static<typeof getFillEventsResponse>;
