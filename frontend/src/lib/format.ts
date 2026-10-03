export function formatVND(amount: number): string {
  if (!Number.isFinite(amount)) return '0đ';
  return `${new Intl.NumberFormat('vi-VN').format(Math.round(amount))}đ`;
}
