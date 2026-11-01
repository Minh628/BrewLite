import { LoyaltyService, pointsForTotal } from '../../src/loyalty/loyalty.service';

type FakeOrder = {
  id: number;
  userId: number;
  total: number;
  pointsEarned: number;
};

type FakeUser = { id: number; loyaltyPoints: number };

/**
 * Tx giả lập có bộ nhớ: updateMany tôn trọng điều kiện where để mô phỏng
 * cơ chế chặn "cộng đôi" thật của Postgres (so khớp pointsEarned = 0 / gt 0).
 */
function createTx(orders: FakeOrder[], users: FakeUser[]) {
  const tx = {
    order: {
      updateMany: jest.fn(
        ({
          where,
          data,
        }: {
          where: { id: number; pointsEarned?: number | { gt: number } };
          data: { pointsEarned: number };
        }) => {
          const order = orders.find((o) => o.id === where.id);
          if (!order) return Promise.resolve({ count: 0 });

          const matches =
            where.pointsEarned === undefined ||
            (typeof where.pointsEarned === 'number'
              ? order.pointsEarned === where.pointsEarned
              : order.pointsEarned > where.pointsEarned.gt);

          if (!matches) return Promise.resolve({ count: 0 });

          order.pointsEarned = data.pointsEarned;
          return Promise.resolve({ count: 1 });
        },
      ),
    },
    user: {
      update: jest.fn(
        ({
          where,
          data,
        }: {
          where: { id: number };
          data: { loyaltyPoints: { increment?: number; decrement?: number } };
        }) => {
          const user = users.find((u) => u.id === where.id);
          if (!user) throw new Error('User không tồn tại');
          if (data.loyaltyPoints.increment != null)
            user.loyaltyPoints += data.loyaltyPoints.increment;
          if (data.loyaltyPoints.decrement != null)
            user.loyaltyPoints -= data.loyaltyPoints.decrement;
          return Promise.resolve(user);
        },
      ),
    },
  };

  return tx;
}

describe('LoyaltyService (Sub-task 10.4c)', () => {
  describe('pointsForTotal', () => {
    it('floor(total / 10.000) theo ví dụ demo 160.200đ → 16 điểm', () => {
      expect(pointsForTotal(160_200)).toBe(16);
    });

    it('làm tròn xuống: 19.999đ → 1 điểm', () => {
      expect(pointsForTotal(19_999)).toBe(1);
    });

    it('dưới 10.000đ hoặc 0 → 0 điểm', () => {
      expect(pointsForTotal(9_999)).toBe(0);
      expect(pointsForTotal(0)).toBe(0);
    });

    it('giá trị âm hoặc không hữu hạn → 0 điểm', () => {
      expect(pointsForTotal(-50_000)).toBe(0);
      expect(pointsForTotal(Number.NaN)).toBe(0);
    });
  });

  describe('award', () => {
    it('cộng điểm vào user và ghi pointsEarned lên đơn', async () => {
      const orders: FakeOrder[] = [{ id: 1001, userId: 7, total: 160_200, pointsEarned: 0 }];
      const users: FakeUser[] = [{ id: 7, loyaltyPoints: 0 }];
      const tx = createTx(orders, users);
      const service = new LoyaltyService({} as never);

      const awarded = await service.award(tx as never, orders[0]);

      expect(awarded).toBe(16);
      expect(users[0].loyaltyPoints).toBe(16);
      expect(orders[0].pointsEarned).toBe(16);
    });

    it('gọi award 2 lần chỉ cộng điểm 1 lần (không cộng đôi)', async () => {
      const orders: FakeOrder[] = [{ id: 1001, userId: 7, total: 160_200, pointsEarned: 0 }];
      const users: FakeUser[] = [{ id: 7, loyaltyPoints: 0 }];
      const tx = createTx(orders, users);
      const service = new LoyaltyService({} as never);

      const first = await service.award(tx as never, orders[0]);
      const second = await service.award(tx as never, orders[0]);

      expect(first).toBe(16);
      expect(second).toBe(0);
      expect(users[0].loyaltyPoints).toBe(16);
      expect(tx.user.update).toHaveBeenCalledTimes(1);
    });

    it('đơn dưới 10.000đ vẫn đánh dấu đã xử lý nhưng không cộng điểm', async () => {
      const orders: FakeOrder[] = [{ id: 1002, userId: 7, total: 5_000, pointsEarned: 0 }];
      const users: FakeUser[] = [{ id: 7, loyaltyPoints: 3 }];
      const tx = createTx(orders, users);
      const service = new LoyaltyService({} as never);

      const awarded = await service.award(tx as never, orders[0]);

      expect(awarded).toBe(0);
      expect(users[0].loyaltyPoints).toBe(3);
      expect(tx.user.update).not.toHaveBeenCalled();
    });
  });

  describe('revoke', () => {
    it('trừ lại đúng số điểm đã cộng khi đơn PAID bị hủy', async () => {
      const orders: FakeOrder[] = [{ id: 1001, userId: 7, total: 160_200, pointsEarned: 16 }];
      const users: FakeUser[] = [{ id: 7, loyaltyPoints: 20 }];
      const tx = createTx(orders, users);
      const service = new LoyaltyService({} as never);

      const revoked = await service.revoke(tx as never, orders[0]);

      expect(revoked).toBe(16);
      expect(users[0].loyaltyPoints).toBe(4);
      expect(orders[0].pointsEarned).toBe(0);
    });

    it('gọi revoke 2 lần chỉ trừ 1 lần', async () => {
      const orders: FakeOrder[] = [{ id: 1001, userId: 7, total: 160_200, pointsEarned: 16 }];
      const users: FakeUser[] = [{ id: 7, loyaltyPoints: 20 }];
      const tx = createTx(orders, users);
      const service = new LoyaltyService({} as never);

      await service.revoke(tx as never, orders[0]);
      const second = await service.revoke(tx as never, { ...orders[0], pointsEarned: 16 });

      expect(second).toBe(0);
      expect(users[0].loyaltyPoints).toBe(4);
      expect(tx.user.update).toHaveBeenCalledTimes(1);
    });

    it('đơn chưa từng cộng điểm thì không làm gì', async () => {
      const orders: FakeOrder[] = [{ id: 1003, userId: 7, total: 44_000, pointsEarned: 0 }];
      const users: FakeUser[] = [{ id: 7, loyaltyPoints: 5 }];
      const tx = createTx(orders, users);
      const service = new LoyaltyService({} as never);

      await expect(service.revoke(tx as never, orders[0])).resolves.toBe(0);
      expect(users[0].loyaltyPoints).toBe(5);
      expect(tx.order.updateMany).not.toHaveBeenCalled();
    });
  });
});
