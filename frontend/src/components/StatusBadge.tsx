'use client';

import React from 'react';
import type { OrderStatus } from '@/lib/types';

export interface StatusBadgeProps {
  /** Trạng thái đơn hàng (1 trong 7 trạng thái chuẩn hoặc chuỗi từ API) */
  status: OrderStatus | string;
  /** Class tùy chỉnh bổ sung cho badge */
  className?: string;
  /**
   * Chế độ rút gọn: Khi true, nhãn dài của PAID ("Đã thanh toán - Mời tới quầy lấy nước")
   * sẽ hiển thị ngắn gọn thành "Đã thanh toán" (thích hợp cho danh sách lịch sử đơn).
   * Mặc định: false (hiển thị đầy đủ nhãn theo tiêu chí Sprint 3).
   */
  compact?: boolean;
}

interface StatusConfig {
  fullLabel: string;
  compactLabel: string;
  badgeClass: string;
  dotClass: string;
}

/**
 * Bảng cấu hình nhãn tiếng Việt và màu sắc trực quan cho 7 trạng thái đơn hàng (Mục 6.1 & Task 9)
 */
const STATUS_CONFIGS: Record<string, StatusConfig> = {
  PENDING: {
    fullLabel: 'Chờ thanh toán',
    compactLabel: 'Chờ thanh toán',
    badgeClass: 'bg-amber-50 text-amber-900 border-amber-300',
    dotClass: 'bg-amber-500 animate-pulse',
  },
  PAID: {
    fullLabel: 'Đã thanh toán - Mời tới quầy lấy nước',
    compactLabel: 'Đã thanh toán',
    badgeClass: 'bg-emerald-50 text-emerald-900 border-emerald-300',
    dotClass: 'bg-emerald-500',
  },
  PAYMENT_FAILED: {
    fullLabel: 'Thanh toán thất bại',
    compactLabel: 'Thanh toán thất bại',
    badgeClass: 'bg-rose-50 text-rose-900 border-rose-300',
    dotClass: 'bg-rose-500',
  },
  PREPARING: {
    fullLabel: 'Đang pha chế',
    compactLabel: 'Đang pha chế',
    badgeClass: 'bg-sky-50 text-sky-900 border-sky-300',
    dotClass: 'bg-sky-500 animate-pulse',
  },
  READY: {
    fullLabel: 'Sẵn sàng nhận món',
    compactLabel: 'Sẵn sàng nhận món',
    badgeClass: 'bg-teal-50 text-teal-950 border-teal-400 font-bold',
    dotClass: 'bg-teal-600',
  },
  COMPLETED: {
    fullLabel: 'Đã hoàn thành',
    compactLabel: 'Đã hoàn thành',
    badgeClass: 'bg-stone-100 text-stone-800 border-stone-300',
    dotClass: 'bg-stone-500',
  },
  CANCELLED: {
    fullLabel: 'Đã hủy',
    compactLabel: 'Đã hủy',
    badgeClass: 'bg-gray-100 text-gray-500 line-through border-gray-200',
    dotClass: 'bg-gray-400',
  },
};

const DEFAULT_CONFIG: StatusConfig = {
  fullLabel: 'Không xác định',
  compactLabel: 'Không xác định',
  badgeClass: 'bg-gray-100 text-gray-700 border-gray-300',
  dotClass: 'bg-gray-400',
};

/**
 * Component hiển thị nhãn trạng thái đơn hàng với màu sắc rõ ràng (Sub-task 9.3)
 */
export function StatusBadge({ status, className = '', compact = false }: StatusBadgeProps) {
  const normalizedStatus = (status || '').toUpperCase();
  const config = STATUS_CONFIGS[normalizedStatus] ?? DEFAULT_CONFIG;
  const label = compact ? config.compactLabel : config.fullLabel;

  return (
    <span
      data-testid="status-badge"
      data-status={normalizedStatus}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shadow-xs transition-colors duration-150 ${config.badgeClass} ${className}`}
    >
      <span
        aria-hidden="true"
        className={`inline-block h-2 w-2 rounded-full flex-shrink-0 ${config.dotClass}`}
      />
      <span>{label}</span>
    </span>
  );
}

export default StatusBadge;
