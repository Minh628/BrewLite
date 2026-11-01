import { ConflictException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { assertTransition, isValidTransition, TRANSITIONS } from './order-state-machine';

describe('OrderStateMachine (Sub-task 10.1a - Test bắt buộc a)', () => {
  const allStatuses: OrderStatus[] = [
    OrderStatus.PENDING,
    OrderStatus.PAID,
    OrderStatus.PAYMENT_FAILED,
    OrderStatus.PREPARING,
    OrderStatus.READY,
    OrderStatus.COMPLETED,
    OrderStatus.CANCELLED,
  ];

  describe('Ma trận 49 cặp chuyển trạng thái (7 nguồn × 7 đích)', () => {
    let testedPairCount = 0;

    allStatuses.forEach((from) => {
      describe(`Từ trạng thái nguồn: ${from}`, () => {
        allStatuses.forEach((to) => {
          const isAllowed = TRANSITIONS[from]?.includes(to) ?? false;
          testedPairCount++;

          if (isAllowed) {
            it(`[HỢP LỆ] ${from} -> ${to}: Không ném ngoại lệ`, () => {
              expect(isValidTransition(from, to)).toBe(true);
              expect(() => assertTransition(from, to)).not.toThrow();
            });
          } else {
            it(`[BỊ CẤM] ${from} -> ${to}: Ném 409 INVALID_TRANSITION`, () => {
              expect(isValidTransition(from, to)).toBe(false);

              try {
                assertTransition(from, to);
                fail(`Lẽ ra phải ném ConflictException khi chuyển từ ${from} sang ${to}`);
              } catch (error) {
                expect(error).toBeInstanceOf(ConflictException);
                const conflict = error as ConflictException;
                expect(conflict.getStatus()).toBe(409);

                const response = conflict.getResponse() as Record<string, unknown>;
                expect(response.error).toBe('INVALID_TRANSITION');
                expect(response.message).toBe(
                  `Invalid order status transition from ${from} to ${to}`,
                );
              }
            });
          }
        });
      });
    });

    it('Đảm bảo đã kiểm tra đầy đủ đúng 49 cặp chuyển trạng thái', () => {
      expect(testedPairCount).toBe(49);
    });
  });

  describe('Kiểm thử các ca chuyển trạng thái đặc thù được chỉ định trong đặc tả', () => {
    it('PENDING -> READY bị cấm (nhảy cóc bước thanh toán và pha chế)', () => {
      expect(() => assertTransition(OrderStatus.PENDING, OrderStatus.READY)).toThrow(
        ConflictException,
      );
    });

    it('COMPLETED -> PREPARING bị cấm (trạng thái kết thúc không được quay lại)', () => {
      expect(() => assertTransition(OrderStatus.COMPLETED, OrderStatus.PREPARING)).toThrow(
        ConflictException,
      );
    });

    it('READY -> PREPARING bị cấm (không cho phép quay lui)', () => {
      expect(() => assertTransition(OrderStatus.READY, OrderStatus.PREPARING)).toThrow(
        ConflictException,
      );
    });

    it('PAYMENT_FAILED -> PAYMENT_FAILED hợp lệ (khách thử lại thanh toán nhưng vẫn lỗi)', () => {
      expect(() =>
        assertTransition(OrderStatus.PAYMENT_FAILED, OrderStatus.PAYMENT_FAILED),
      ).not.toThrow();
    });

    it('CANCELLED không thể chuyển sang bất kỳ trạng thái nào khác (kể cả chính nó)', () => {
      allStatuses.forEach((target) => {
        expect(() => assertTransition(OrderStatus.CANCELLED, target)).toThrow(ConflictException);
      });
    });
  });
});
