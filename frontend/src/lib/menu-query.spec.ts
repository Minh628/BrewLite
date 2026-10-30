import { describe, expect, it } from 'vitest';
import { buildMenuUrl, parseCategoryParam } from './menu-query';

describe('parseCategoryParam', () => {
  it('trả null khi không có tham số', () => {
    expect(parseCategoryParam(null)).toBeNull();
    expect(parseCategoryParam('')).toBeNull();
  });

  it('trả số nguyên dương khi tham số hợp lệ', () => {
    expect(parseCategoryParam('2')).toBe(2);
  });

  it('bỏ qua giá trị không hợp lệ để không gọi API sai', () => {
    expect(parseCategoryParam('abc')).toBeNull();
    expect(parseCategoryParam('0')).toBeNull();
    expect(parseCategoryParam('-1')).toBeNull();
    expect(parseCategoryParam('1.5')).toBeNull();
  });
});

describe('buildMenuUrl', () => {
  it('giữ nguyên path khi không có bộ lọc', () => {
    expect(buildMenuUrl('/', null, '')).toBe('/');
  });

  it('chỉ thêm category', () => {
    expect(buildMenuUrl('/', 3, '')).toBe('/?category=3');
  });

  it('chỉ thêm q', () => {
    expect(buildMenuUrl('/', null, 'ca phe')).toBe('/?q=ca+phe');
  });

  it('gộp cả category và q, giữ thứ tự ổn định', () => {
    expect(buildMenuUrl('/', 2, 'tra')).toBe('/?category=2&q=tra');
  });

  it('giữ các tham số khác đang có trên URL', () => {
    expect(buildMenuUrl('/', 1, 'latte', 'utm=fb')).toBe('/?utm=fb&category=1&q=latte');
  });
});
