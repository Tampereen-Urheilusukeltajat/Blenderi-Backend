import { Type, type Static } from '@sinclair/typebox';

export enum PaymentStatus {
  created = 'CREATED',
  inProgress = 'IN_PROGRESS',
  failed = 'FAILED',
  completed = 'COMPLETED',
}

export const paymentStatus = Type.Enum(PaymentStatus);

const paymentEventFields = {
  id: Type.String({ format: 'uuid' }),
  userId: Type.String({ format: 'uuid' }),
  status: paymentStatus,
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' }),
  totalAmountEurCents: Type.Integer({ minimum: 0 }),
};

export const paymentEvent = Type.Object({
  ...paymentEventFields,
});

export type PaymentEvent = Static<typeof paymentEvent>;

export const extendedPaymentEvent = Type.Object({
  ...paymentEventFields,
  stripePaymentMethod: Type.Optional(Type.String()),
  stripeAmountEurCents: Type.Optional(Type.String()),
  stripePaymentStatus: Type.Optional(Type.String()),
  stripePaymentClientSecret: Type.Optional(Type.String()),
});

export type ExtendedPaymentEvent = Static<typeof extendedPaymentEvent>;

export const paymentEventIdParamsPayload = Type.Object({
  paymentEventId: Type.String({ format: 'uuid' }),
});

export type PaymentEventIdParamsPayload = Static<
  typeof paymentEventIdParamsPayload
>;
