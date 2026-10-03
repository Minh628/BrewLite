import { describe, expect, it } from 'vitest';
import { calcUnitPrice, type AvailableSize, type SelectedTopping } from './pricing';

describe('calcUnitPrice', () => {
  const basePrice = 35000;

  // Ca 1: Tính giá với Size S (không phụ thu, extraPrice = 0)
  it('tính đúng đơn giá cho Size S không có phụ thu', () => {
    const sizeS: AvailableSize = { size: 'S', extraPrice: 0 };
    const toppings: SelectedTopping[] = [];

    const result = calcUnitPrice(basePrice, sizeS, toppings);
    expect(result).toBe(35000);
  });

  // Ca 2: Tính giá với Size M (có phụ thu 5.000đ)
  it('tính đúng đơn giá cho Size M với phụ thu tương ứng', () => {
    const sizeM: AvailableSize = { size: 'M', extraPrice: 5000 };
    const toppings: SelectedTopping[] = [];

    const result = calcUnitPrice(basePrice, sizeM, toppings);
    expect(result).toBe(40000);
  });

  // Ca 3: Tính giá với Size L (có phụ thu 10.000đ)
  it('tính đúng đơn giá cho Size L với phụ thu tương ứng', () => {
    const sizeL: AvailableSize = { size: 'L', extraPrice: 10000 };
    const toppings: SelectedTopping[] = [];

    const result = calcUnitPrice(basePrice, sizeL, toppings);
    expect(result).toBe(45000);
  });

  // Ca 4: Trường hợp không chọn topping nào (toppings rỗng)
  it('tính đúng khi không chọn topping nào (mảng toppings rỗng)', () => {
    const sizeS: AvailableSize = { size: 'S', extraPrice: 0 };
    const noToppings: readonly SelectedTopping[] = [];

    const result = calcUnitPrice(basePrice, sizeS, noToppings);
    expect(result).toBe(35000);
  });

  // Ca 5: Trường hợp chọn nhiều topping (cộng dồn từng giá topping)
  it('tính đúng khi chọn nhiều loại topping khác nhau', () => {
    const sizeS: AvailableSize = { size: 'S', extraPrice: 0 };
    const multiToppings: SelectedTopping[] = [
      { price: 5000 }, // Trân châu đen
      { price: 7000 }, // Trân châu trắng
      { price: 10000 }, // Kem cheese
    ];

    const result = calcUnitPrice(basePrice, sizeS, multiToppings);
    // 35000 + 0 + (5000 + 7000 + 10000) = 57000
    expect(result).toBe(57000);
  });

  // Ca 6: Kiểm tra cơ chế làm tròn số (Math.round) khi giá có phần thập phân lẻ
  it('làm tròn đúng đơn giá theo Math.round khi giá lẻ có phần thập phân', () => {
    const sizeS: AvailableSize = { size: 'S', extraPrice: 0 };

    // Test làm tròn xuống (35000.4 -> 35000)
    expect(calcUnitPrice(35000.4, sizeS, [])).toBe(35000);

    // Test làm tròn lên (35000.6 -> 35001)
    expect(calcUnitPrice(35000.6, sizeS, [])).toBe(35001);
  });

  // Ca 7: Kết hợp toàn diện: Size L + nhiều topping + giá lẻ làm tròn
  it('tính đúng khi kết hợp size L, nhiều topping và làm tròn số', () => {
    const sizeL: AvailableSize = { size: 'L', extraPrice: 10000 };
    const toppings: SelectedTopping[] = [{ price: 5000.3 }, { price: 7000.4 }];

    // 45000.2 + 10000 + (5000.3 + 7000.4) = 67000.9 -> làm tròn thành 67001
    const result = calcUnitPrice(45000.2, sizeL, toppings);
    expect(result).toBe(67001);
  });

  // Ca 8: Kiểm tra các ngoại lệ dữ liệu không hợp lệ (ném RangeError)
  describe('xử lý ngoại lệ đầu vào không hợp lệ', () => {
    const validSize: AvailableSize = { size: 'S', extraPrice: 0 };

    it('ném lỗi RangeError khi giá gốc (base) âm hoặc không hợp lệ', () => {
      expect(() => calcUnitPrice(-1, validSize, [])).toThrow(RangeError);
      expect(() => calcUnitPrice(NaN, validSize, [])).toThrow(RangeError);
    });

    it('ném lỗi RangeError khi mã size không hợp lệ', () => {
      const invalidSize = { size: 'XL' as any, extraPrice: 15000 };
      expect(() => calcUnitPrice(basePrice, invalidSize, [])).toThrow(RangeError);
    });

    it('ném lỗi RangeError khi phụ thu size âm', () => {
      const negativeSize: AvailableSize = { size: 'M', extraPrice: -5000 };
      expect(() => calcUnitPrice(basePrice, negativeSize, [])).toThrow(RangeError);
    });

    it('ném lỗi RangeError khi giá topping âm', () => {
      expect(() => calcUnitPrice(basePrice, validSize, [{ price: -1000 }])).toThrow(RangeError);
    });
  });
});
