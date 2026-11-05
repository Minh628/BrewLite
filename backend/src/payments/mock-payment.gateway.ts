import { BadRequestException, Injectable } from '@nestjs/common';
import { PaymentMethod } from '@prisma/client';
import { PaymentCharge, PaymentChargeResult, PaymentGateway } from './payment-gateway';

@Injectable()
export class MockPaymentGateway implements PaymentGateway {
  async charge({ method, cardNumber }: PaymentCharge): Promise<PaymentChargeResult> {
    await new Promise((resolve) => setTimeout(resolve, 800 + Math.floor(Math.random() * 701)));

    if (method === PaymentMethod.WALLET) {
      return process.env.MOCK_WALLET_FAIL === 'true'
        ? { succeeded: false, failureReason: 'Ví không đủ số dư' }
        : { succeeded: true };
    }

    const normalizedCard = cardNumber?.replace(/\s/g, '');
    if (!normalizedCard || !/^\d{16}$/.test(normalizedCard)) {
      throw new BadRequestException('Số thẻ không hợp lệ');
    }

    if (normalizedCard === '4000000000000002') {
      return { succeeded: false, failureReason: 'Thẻ bị từ chối' };
    }

    return { succeeded: true };
  }
}
