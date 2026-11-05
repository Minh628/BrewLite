import { PaymentMethod } from '@prisma/client';

export type PaymentCharge = {
  method: PaymentMethod;
  cardNumber?: string;
};

export type PaymentChargeResult = {
  succeeded: boolean;
  failureReason?: string;
};

export interface PaymentGateway {
  charge(payment: PaymentCharge): Promise<PaymentChargeResult>;
}
