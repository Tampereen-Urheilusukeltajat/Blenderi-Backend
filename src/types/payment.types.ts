import { Type, Static } from '@sinclair/typebox';

export enum PaymentStatus {
  created = 'CREATED',
  inProgress = 'IN_PROGRESS',
  failed = 'FAILED',
  completed = 'COMPLETED',
}

export const paymentStatus = Type.Enum(PaymentStatus);

export const createPaymentEventReply = Type.Object({
  paymentEventId: Type.String({ format: 'uuid' }),
});

export type CreatePaymentEventReply = Static<typeof createPaymentEventReply>;

export const paymentEvent = Type.Object({
  id: Type.String({ format: 'uuid' }),
  userId: Type.String({ format: 'uuid' }),
  status: paymentStatus,
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' }),
});

export type PaymentEvent = Static<typeof paymentEvent>;

export const extendedPaymentEvent = Type.Union([
  paymentEvent,
  Type.Partial(
    Type.Object({
      stripePaymentMethod: Type.String(),
      stripeAmountEurCents: Type.String(),
      stripePaymentStatus: Type.String(),
    })
  ),
]);

export type ExtendedPaymentEvent = Static<typeof extendedPaymentEvent>;

export const paymentEventIdParamsPayload = Type.Object({
  paymentEventId: Type.String({ format: 'uuid' }),
});

export type PaymentEventIdParamsPayload = Static<
  typeof paymentEventIdParamsPayload
>;
