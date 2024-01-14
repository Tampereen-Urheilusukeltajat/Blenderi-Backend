import { Type } from '@sinclair/typebox';

export enum PaymentStatus {
  created = 'created',
  failed = 'failed',
  inProgress = 'inProgress',
  completed = 'completed',
}

export const paymentStatus = Type.Enum(PaymentStatus);
