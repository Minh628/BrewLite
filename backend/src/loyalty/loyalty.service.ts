import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/** VND trên mỗi điểm thưởng (Mục 11.4: floor(total / 10.000)) */
export const VND_PER_POINT = 10_000;

/**
 * Tính số điểm thưởng cho một đơn dựa trên số tiền phải trả.
 * Là hàm thuần túy để FE/BE và test dùng chung một công thức.
 */
export function pointsForTotal(total: number): number {
  if (!Number.isFinite(total) || total <= 0) {
    return 0;
  }
  return Math.floor(total / VND_PER_POINT);
}

/**
 * Tối thiểu các trường của đơn cần cho việc cộng/trừ điểm.
 */
export interface OrderForLoyalty {
  id: number;
  userId: number;
  total: number;
  pointsEarned: number;
}

/**
 * LoyaltyService (Sub-task 10.4c)
 *
 * Cộng điểm MỘT LẦN khi đơn vào PAID, trừ lại khi đơn PAID bị hủy.
 *
 * Chống cộng đôi: `award` chỉ cập nhật đơn khi `pointsEarned = 0`. Nếu `updateMany`
 * trả 0 dòng thì đơn đã được cộng trước đó → bỏ qua. Nhờ vậy dù OrderStatusService
 * bị gọi lại nhiều lần (retry, đua idempotency) thì user vẫn chỉ nhận điểm một lần.
 *
 * Phải chạy trong CÙNG transaction với việc đổi trạng thái đơn (nối vào 10.1b).
 */
@Injectable()
export class LoyaltyService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cộng điểm khi đơn vào PAID. Trả về số điểm thực sự được cộng (0 nếu đã cộng trước đó).
   */
  async award(tx: Prisma.TransactionClient, order: OrderForLoyalty): Promise<number> {
    const points = pointsForTotal(order.total);

    // Bộ chặn "cộng đôi": chỉ chuyển pointsEarned 0 → points đúng một lần.
    const claimed = await tx.order.updateMany({
      where: { id: order.id, pointsEarned: 0 },
      data: { pointsEarned: points },
    });

    if (claimed.count === 0) {
      return 0;
    }

    if (points > 0) {
      await tx.user.update({
        where: { id: order.userId },
        data: { loyaltyPoints: { increment: points } },
      });
    }

    return points;
  }

  /**
   * Trừ lại điểm khi đơn PAID bị hủy. Trả về số điểm đã trừ (0 nếu đơn chưa từng được cộng).
   */
  async revoke(tx: Prisma.TransactionClient, order: OrderForLoyalty): Promise<number> {
    // Chốt snapshot trước khi cập nhật: object truyền vào có thể bị sửa bởi tx
    const pointsToRevoke = order.pointsEarned;

    if (pointsToRevoke <= 0) {
      return 0;
    }

    // Chỉ trừ khi đơn đang giữ điểm > 0, và đưa pointsEarned về 0 để không trừ lần hai.
    const released = await tx.order.updateMany({
      where: { id: order.id, pointsEarned: { gt: 0 } },
      data: { pointsEarned: 0 },
    });

    if (released.count === 0) {
      return 0;
    }

    // Nếu có thể kiểm tra trước thông tin user, đảm bảo không bao giờ trừ điểm xuống dưới 0
    // để tránh vi phạm CHECK ("loyaltyPoints" >= 0) trên PostgreSQL
    if (typeof (tx.user as PrismaService['user'])?.findUnique === 'function') {
      const currentUser = await tx.user.findUnique({
        where: { id: order.userId },
        select: { loyaltyPoints: true },
      });
      const safeDecrypt = currentUser
        ? Math.min(pointsToRevoke, Math.max(0, currentUser.loyaltyPoints))
        : pointsToRevoke;

      if (safeDecrypt > 0) {
        await tx.user.update({
          where: { id: order.userId },
          data: { loyaltyPoints: { decrement: safeDecrypt } },
        });
      }
      return safeDecrypt;
    }

    await tx.user.update({
      where: { id: order.userId },
      data: { loyaltyPoints: { decrement: pointsToRevoke } },
    });

    return pointsToRevoke;
  }
}
