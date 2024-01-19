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
