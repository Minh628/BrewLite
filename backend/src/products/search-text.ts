/**
 * Chuẩn hóa chuỗi để tìm kiếm không phân biệt hoa/thường và dấu tiếng Việt (PB-18).
 * Ví dụ: "  Cà  PHÊ sữa " → "ca phe sua"; "Đá xay" → "da xay"
 */
export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Tên có chứa từ khóa không (đã chuẩn hóa cả hai phía)
 */
export function matchesSearch(name: string, keyword: string): boolean {
  return normalizeSearchText(name).includes(normalizeSearchText(keyword));
}
