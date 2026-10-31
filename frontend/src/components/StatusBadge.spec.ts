import React from 'react';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge component (Sub-task 9.3)', () => {
  it('hiển thị đúng nhãn và màu sắc cho trạng thái PENDING', () => {
    const html = renderToStaticMarkup(React.createElement(StatusBadge, { status: 'PENDING' }));
    expect(html).toContain('Chờ thanh toán');
    expect(html).toContain('bg-amber-50');
    expect(html).toContain('text-amber-900');
  });

  it('hiển thị đúng nhãn đầy đủ cho trạng thái PAID theo yêu cầu Wireframe', () => {
    const html = renderToStaticMarkup(React.createElement(StatusBadge, { status: 'PAID' }));
    expect(html).toContain('Đã thanh toán - Mời tới quầy lấy nước');
    expect(html).toContain('bg-emerald-50');
    expect(html).toContain('text-emerald-900');
  });

  it('hiển thị nhãn rút gọn cho PAID khi bật compact={true}', () => {
    const html = renderToStaticMarkup(
      React.createElement(StatusBadge, { status: 'PAID', compact: true }),
    );
    expect(html).toContain('Đã thanh toán');
    expect(html).not.toContain('Mời tới quầy lấy nước');
  });

  it('hiển thị đúng nhãn và màu đỏ cho trạng thái PAYMENT_FAILED', () => {
    const html = renderToStaticMarkup(
      React.createElement(StatusBadge, { status: 'PAYMENT_FAILED' }),
    );
    expect(html).toContain('Thanh toán thất bại');
    expect(html).toContain('bg-rose-50');
    expect(html).toContain('text-rose-900');
  });

  it('hiển thị đúng nhãn và màu xanh dương cho trạng thái PREPARING', () => {
    const html = renderToStaticMarkup(React.createElement(StatusBadge, { status: 'PREPARING' }));
    expect(html).toContain('Đang pha chế');
    expect(html).toContain('bg-sky-50');
    expect(html).toContain('text-sky-900');
  });

  it('hiển thị đúng nhãn và màu xanh lục đậm cho trạng thái READY', () => {
    const html = renderToStaticMarkup(React.createElement(StatusBadge, { status: 'READY' }));
    expect(html).toContain('Sẵn sàng nhận món');
    expect(html).toContain('bg-teal-50');
    expect(html).toContain('text-teal-950');
    expect(html).toContain('font-bold');
  });

  it('hiển thị đúng nhãn và màu xám đậm cho trạng thái COMPLETED', () => {
    const html = renderToStaticMarkup(React.createElement(StatusBadge, { status: 'COMPLETED' }));
    expect(html).toContain('Đã hoàn thành');
    expect(html).toContain('bg-stone-100');
    expect(html).toContain('text-stone-800');
  });

  it('hiển thị đúng nhãn và gạch ngang cho trạng thái CANCELLED', () => {
    const html = renderToStaticMarkup(React.createElement(StatusBadge, { status: 'CANCELLED' }));
    expect(html).toContain('Đã hủy');
    expect(html).toContain('line-through');
    expect(html).toContain('text-gray-500');
  });

  it('xử lý chuỗi chữ thường hoặc không phân biệt hoa thường', () => {
    const html = renderToStaticMarkup(React.createElement(StatusBadge, { status: 'paid' }));
    expect(html).toContain('Đã thanh toán');
  });
});
