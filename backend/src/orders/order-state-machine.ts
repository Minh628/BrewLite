import { ConflictException, HttpStatus } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';

/**
 * Bảng định nghĩa các quy tắc chuyển trạng thái đơn hàng (Order State Machine)
 * Tham chiếu Mục 6.1 tài liệu kế hoạch Sprint 3:
 * - PENDING: Đơn vừa tạo, chờ thanh toán. Có thể chuyển sang PAID, PAYMENT_FAILED hoặc CANCELLED.
 * - PAYMENT_FAILED: Thanh toán lỗi. Khách có thể thử lại (sang PAID hoặc tiếp tục PAYMENT_FAILED) hoặc CANCELLED.
 * - PAID: Đã thanh toán. Có thể chuyển sang PREPARING (quầy nhận pha chế) hoặc CANCELLED.
 * - PREPARING: Quầy đang pha chế. Chỉ có thể chuyển sang READY khi xong món.
 * - READY: Đã chuẩn bị xong, chờ khách lấy. Chỉ có thể chuyển sang COMPLETED khi khách đã nhận.
 * - COMPLETED, CANCELLED: Các trạng thái kết thúc (Terminal states), không được phép chuyển đi đâu.
 */
export const TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.PAID, OrderStatus.PAYMENT_FAILED, OrderStatus.CANCELLED],
  [OrderStatus.PAYMENT_FAILED]: [
    OrderStatus.PAID,
    OrderStatus.PAYMENT_FAILED, // Cho phép thử lại thanh toán nhưng vẫn tiếp tục lỗi
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.PAID]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [OrderStatus.READY],
  [OrderStatus.READY]: [OrderStatus.COMPLETED],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELLED]: [],
};

/**
 * Kiểm tra xem cặp chuyển trạng thái từ `from` sang `to` có hợp lệ theo bảng TRANSITIONS hay không.
 *
 * @param from Trạng thái nguồn hiện tại của đơn hàng
 * @param to Trạng thái đích muốn chuyển sang
 * @returns true nếu hợp lệ, false nếu bị cấm
 */
export function isValidTransition(from: OrderStatus, to: OrderStatus): boolean {
  const allowed = TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}

/**
 * Xác thực tính hợp lệ của việc chuyển trạng thái.
 * Nếu cặp chuyển đổi bị cấm, ném ngoại lệ ConflictException với mã lỗi 409 INVALID_TRANSITION.
 *
 * @param from Trạng thái nguồn hiện tại của đơn hàng
 * @param to Trạng thái đích muốn chuyển sang
 * @throws ConflictException (409) nếu chuyển trạng thái không hợp lệ
 */
export function assertTransition(from: OrderStatus, to: OrderStatus): void {
  if (!isValidTransition(from, to)) {
    throw new ConflictException({
      statusCode: HttpStatus.CONFLICT,
      message: `Invalid order status transition from ${from} to ${to}`,
      error: 'INVALID_TRANSITION',
    });
  }
}
