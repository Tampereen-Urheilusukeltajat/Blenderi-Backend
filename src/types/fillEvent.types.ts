import { Type, Static } from '@sinclair/typebox';

export const storageCylinder = Type.Object({
  id: Type.Integer({ minimum: 0 }),
  gasId: Type.Integer({ minimum: 0 }),
  volume: Type.Number({ minimum: 0 }),
  name: Type.String({ minLength: 1, maxLength: 256 }),
});

export type StorageCylinder = Static<typeof storageCylinder>;

export const storageCylinderUsage = Type.Object({
  storageCylinderId: Type.Integer({ minimum: 0 }),
  startPressure: Type.Integer({ minimum: 0 }),
  endPressure: Type.Integer({ minimum: 0 }),
});

export type StorageCylinderUsage = Static<typeof storageCylinderUsage>;

export const fillEvent = Type.Object({
  id: Type.Integer({ minimum: 0 }),
  userId: Type.String({ format: 'uuid' }),
  cylinderSetId: Type.String({ format: 'uuid' }),
  gasMixture: Type.String({ maxLength: 124 }),
  storageCylinderUsage: Type.Array(storageCylinderUsage),
  description: Type.Optional(Type.String({ maxLength: 1024 })),
});

export type FillEvent = Static<typeof fillEvent>;

export const gas = Type.Object({
  id: Type.Integer({ minimum: 0 }),
  name: Type.String({ maxLength: 128 }),
});

export type Gas = Static<typeof gas>;

export const gasPrice = Type.Object({
  id: Type.Integer({ minimum: 0 }),
  gasId: Type.Integer({ minimum: 0 }),
  priceEurCents: Type.Integer({ minimum: 0 }),
  activeFrom: Type.String({ minLength: 19, maxLength: 19 }),
  activeTo: Type.String({ minLength: 19, maxLength: 19 }),
});

export type GasPrice = Static<typeof gasPrice>;

export const createFillEventBody = Type.Object({
  cylinderSetId: Type.String({ format: 'uuid' }),
  gasMixture: Type.String({ maxLength: 124 }),
  filledAir: Type.Boolean(),
  storageCylinderUsageArr: Type.Array(storageCylinderUsage),
  description: Type.Optional(Type.String({ maxLength: 1024 })),
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
});

export type FillEventResponse = Static<typeof fillEventResponse>;
