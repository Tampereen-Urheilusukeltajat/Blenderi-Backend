import { Type, Static } from '@sinclair/typebox';

export const stripePaymentIntent = Type.Object({
  id: Type.Integer(),
  paymentEventId: Type.String({ format: 'uuid' }),
  paymentIntentId: Type.String(),
  amountEurCents: Type.Integer(),
  clientSecret: Type.String(),
  status: Type.String(),
  paymentMethod: Type.String(),
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' }),
});

export type StripePaymentIntent = Static<typeof stripePaymentIntent>;

export const stripeDispute = Type.Object({
  stripePaymentIntentId: Type.Integer(),
  status: Type.String(),
  reason: Type.String(),
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' }),
});

export type StripeDispute = Static<typeof stripeDispute>;

export const createPaymentIntentRequest = Type.Object({
  paymentEventId: Type.String({ format: 'uuid' }),
});

export type CreatePaymentIntentRequest = Static<
  typeof createPaymentIntentRequest
>;

export const createPaymentIntentReply = Type.Object({
  paymentEventId: Type.String({ format: 'uuid' }),
  paymentIntentId: Type.String(),
  amountDueInEurCents: Type.Integer(),
  clientSecret: Type.Optional(Type.String()),
});

export type CreatePaymentIntentReply = Static<typeof createPaymentIntentReply>;
