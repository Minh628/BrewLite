import { BadRequestException } from '@nestjs/common';
import { PaymentMethod } from '@prisma/client';
import { MockPaymentGateway } from './mock-payment.gateway';

describe('MockPaymentGateway', () => {
  let gateway: MockPaymentGateway;
  let originalWalletFail: string | undefined;

  beforeEach(() => {
    gateway = new MockPaymentGateway();
    originalWalletFail = process.env.MOCK_WALLET_FAIL;
  });

  afterEach(() => {
    if (originalWalletFail === undefined) delete process.env.MOCK_WALLET_FAIL;
    else process.env.MOCK_WALLET_FAIL = originalWalletFail;
    jest.useRealTimers();
  });

  it('accepts the success test card', async () => {
    jest.useFakeTimers();
    const result = gateway.charge({
      method: PaymentMethod.CARD,
      cardNumber: '4242 4242 4242 4242',
    });
    await jest.advanceTimersByTimeAsync(1500);
    await expect(result).resolves.toEqual({ succeeded: true });
  });

  it('declines the designated test card', async () => {
    jest.useFakeTimers();
    const result = gateway.charge({
      method: PaymentMethod.CARD,
      cardNumber: '4000 0000 0000 0002',
    });
    await jest.advanceTimersByTimeAsync(1500);
    await expect(result).resolves.toEqual({
      succeeded: false,
      failureReason: 'Thẻ bị từ chối',
    });
  });

  it('rejects malformed card numbers', async () => {
    jest.useFakeTimers();
    const result = gateway.charge({ method: PaymentMethod.CARD, cardNumber: '1234' });
    const expectation = expect(result).rejects.toThrow(BadRequestException);
    await jest.advanceTimersByTimeAsync(1500);
    await expectation;
  });

  it('can simulate a declined wallet payment', async () => {
    process.env.MOCK_WALLET_FAIL = 'true';
    jest.useFakeTimers();
    const result = gateway.charge({ method: PaymentMethod.WALLET });
    await jest.advanceTimersByTimeAsync(1500);
    await expect(result).resolves.toMatchObject({ succeeded: false });
  });
});
