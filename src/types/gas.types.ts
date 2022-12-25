import { Type, Static } from '@sinclair/typebox';

export const createGas = Type.Object({
  name: Type.String({ maxLength: 128 }),
});

export type CreateGas = Static<typeof createGas>;

export const gas = Type.Intersect([
  Type.Object({ id: Type.String() }),
  createGas,
]);

export type Gas = Static<typeof gas>;

export const enrichedGas = Type.Object({
  activeFrom: Type.String({ format: 'date-time' }),
  activeTo: Type.Optional(Type.String({ format: 'date-time' })),
  gasId: Type.Integer(),
  gasPriceId: Type.Integer(),
  gasName: Type.String(),
  priceEurCents: Type.Integer({ minimum: 0 }),
});

export type EnrichedGas = Static<typeof enrichedGas>;

export const createGasPrice = Type.Object({
  gasId: Type.Integer(),
  priceEurCents: Type.Integer({ minimum: 0 }),
  activeFrom: Type.String({ format: 'date-time' }),
  activeTo: Type.Optional(Type.String({ format: 'date-time' })),
});

export type CreateGasPrice = Static<typeof createGasPrice>;

export const gasPrice = Type.Intersect([
  Type.Object({ id: Type.String() }),
  createGasPrice,
]);

export type GasPrice = Static<typeof gasPrice>;
