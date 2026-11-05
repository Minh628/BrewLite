import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import { OrderStatus, PaymentMethod, PaymentStatus } from '@prisma/client';
import { OrderStatusService } from '../orders/order-status.service';
import { PrismaService } from '../prisma/prisma.service';
import { MockPaymentGateway } from './mock-payment.gateway';
import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: jest.Mocked<PrismaService>;
  let tx: Record<string, any>;
  let gateway: jest.Mocked<MockPaymentGateway>;
  let orderStatus: jest.Mocked<OrderStatusService>;

  const payment = {
    idempotencyKey: 'pay-key',
    orderId: 7,
    amount: 50000,
    method: PaymentMethod.CARD,
    status: PaymentStatus.SUCCEEDED,
    requestHash: '',
    cardLast4: '4242',
    failureReason: null,
    createdAt: new Date(),
  };

  beforeEach(() => {
    tx = {
      $queryRaw: jest
        .fn()
        .mockResolvedValue([{ id: 7, userId: 3, status: OrderStatus.PENDING, total: 50000 }]),
      payment: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue(payment),
      },
    };
    prisma = {
      $transaction: jest.fn((callback: (transaction: unknown) => unknown) => callback(tx)),
      payment: { findUnique: jest.fn().mockResolvedValue(null) },
    } as unknown as jest.Mocked<PrismaService>;
    gateway = { charge: jest.fn().mockResolvedValue({ succeeded: true }) } as never;
    orderStatus = {
      transition: jest.fn().mockResolvedValue({ status: OrderStatus.PAID }),
    } as never;
    service = new PaymentsService(prisma, gateway, orderStatus);
  });

  it('requires an idempotency key', async () => {
    await expect(
      service.create(3, { orderId: 7, method: PaymentMethod.CARD, cardNumber: '4242424242424242' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('locks the owned order and stores only the card suffix', async () => {
    const result = await service.create(
      3,
      { orderId: 7, method: PaymentMethod.CARD, cardNumber: '4242 4242 4242 4242' },
      'pay-key',
    );

    expect(tx.$queryRaw).toHaveBeenCalled();
    expect(tx.payment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        idempotencyKey: 'pay-key',
        orderId: 7,
        amount: 50000,
        cardLast4: '4242',
        status: PaymentStatus.SUCCEEDED,
      }),
    });
    expect(tx.payment.create.mock.calls[0][0].data).not.toHaveProperty('cardNumber');
    expect(orderStatus.transition).toHaveBeenCalledWith(tx, 7, OrderStatus.PAID);
    expect(result.replayed).toBe(false);
  });

  it('persists declined payments and transitions the order to PAYMENT_FAILED', async () => {
    gateway.charge.mockResolvedValue({ succeeded: false, failureReason: 'Thẻ bị từ chối' });
    tx.payment.create.mockResolvedValue({
      ...payment,
      status: PaymentStatus.FAILED,
      failureReason: 'Thẻ bị từ chối',
    });

    const result = await service.create(
      3,
      { orderId: 7, method: PaymentMethod.CARD, cardNumber: '4000 0000 0000 0002' },
      'failed-key',
    );

    expect(orderStatus.transition).toHaveBeenCalledWith(tx, 7, OrderStatus.PAYMENT_FAILED);
    expect(result.payment.status).toBe(OrderStatus.PAYMENT_FAILED);
  });

  it('returns the original result for the same key and payload', async () => {
    const requestHash = createHash('sha256').update('3|7|CARD|4242').digest('hex');
    tx.payment.findUnique.mockResolvedValue({ ...payment, requestHash });

    const result = await service.create(
      3,
      { orderId: 7, method: PaymentMethod.CARD, cardNumber: '4242 4242 4242 4242' },
      'pay-key',
    );

    expect(result.replayed).toBe(true);
    expect(gateway.charge).not.toHaveBeenCalled();
    expect(tx.payment.create).not.toHaveBeenCalled();
  });

  it('rejects reusing a key with a different payload', async () => {
    tx.payment.findUnique.mockResolvedValue({ ...payment, requestHash: 'different' });

    await expect(
      service.create(
        3,
        { orderId: 7, method: PaymentMethod.CARD, cardNumber: '4242 4242 4242 4242' },
        'pay-key',
      ),
    ).rejects.toThrow(UnprocessableEntityException);
  });

  it('hides orders that do not belong to the caller', async () => {
    tx.$queryRaw.mockResolvedValue([]);

    await expect(
      service.create(
        3,
        { orderId: 7, method: PaymentMethod.CARD, cardNumber: '4242424242424242' },
        'pay-key',
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('rejects payments for orders that are not payable', async () => {
    tx.$queryRaw.mockResolvedValue([{ id: 7, userId: 3, status: OrderStatus.PAID, total: 50000 }]);

    await expect(
      service.create(
        3,
        { orderId: 7, method: PaymentMethod.CARD, cardNumber: '4242424242424242' },
        'pay-key',
      ),
    ).rejects.toThrow(ConflictException);
    expect(gateway.charge).not.toHaveBeenCalled();
  });
});
