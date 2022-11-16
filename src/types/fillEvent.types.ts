import { Type, Static } from '@sinclair/typebox';

export const fillEvent = Type.Object({
  id: Type.String({ format: 'uuid' }),
  userId: Type.String({ format: 'uuid' }),
  cylinderSetId: Type.String({ format: 'uuid' }),
  airPressure: Type.Integer({ minimum: 0, default: 0 }),
  oxygenPressure: Type.Integer({ minimum: 0, default: 0 }),
  heliumPressure: Type.Integer({ minimum: 0, default: 0 }),
  argonPressure: Type.Integer({ minimum: 0, default: 0 }),
  diluentPressure: Type.Integer({ minimum: 0, default: 0 }),
  price: Type.Integer({ minimum: 0 }),
  info: Type.String({ maxLength: 1024 }),
});

export type FillEvent = Static<typeof fillEvent>;

export const createFillEventBody = Type.Object({
  cylinderSetId: Type.String({ format: 'uuid' }),
  airPressure: Type.Integer({ minimum: 0, default: 0 }),
  oxygenPressure: Type.Integer({ minimum: 0, default: 0 }),
  heliumPressure: Type.Integer({ minimum: 0, default: 0 }),
  argonPressure: Type.Integer({ minimum: 0, default: 0 }),
  diluentPressure: Type.Integer({ minimum: 0, default: 0 }),
  info: Type.Optional(Type.String({ maxLength: 1024 })),
});

export type CreateFillEventBody = Static<typeof createFillEventBody>;

export const fillEventResponse = Type.Object({
  id: Type.String({ format: 'uuid' }),
  userId: Type.String({ format: 'uuid' }),
  cylinderSetId: Type.String({ format: 'uuid' }),
  airPressure: Type.Optional(Type.Integer({ minimum: 0 })),
  oxygenPressure: Type.Optional(Type.Integer({ minimum: 0 })),
  heliumPressure: Type.Optional(Type.Integer({ minimum: 0 })),
  argonPressure: Type.Optional(Type.Integer({ minimum: 0 })),
  diluentPressure: Type.Optional(Type.Integer({ minimum: 0 })),
  price: Type.Integer({ minimum: 0 }),
  info: Type.String({ maxLength: 1024 }),
});

export type FillEventResponse = Static<typeof fillEventResponse>;
