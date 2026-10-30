import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../src/prisma/prisma.service';
import { calcUnitPrice, PricingService } from '../../src/pricing/pricing.service';

describe('PricingService & calcUnitPrice (PB-21 / Sub-task 21.1)', () => {
  // =========================================================================
  // PHẦN 1: BỘ CA KIỂM THỬ DÙNG CHUNG VỚI calcUnitPrice CỦA FRONTEND
  // (Đồng bộ 100% logic với frontend/src/lib/pricing.ts)
  // =========================================================================
  describe('calcUnitPrice (Pure Domain Function - FE & BE Shared Logic)', () => {
    it('tính đúng đơn giá cơ bản khi chọn size S không phụ thu và không có topping', () => {
      const price = calcUnitPrice(40000, { size: 'S', extraPrice: 0 }, []);
      expect(price).toBe(40000);
    });

    it('tính đúng đơn giá khi phụ thu size M (+5.000) và size L (+10.000)', () => {
      const priceM = calcUnitPrice(40000, { size: 'M', extraPrice: 5000 }, []);
      const priceL = calcUnitPrice(40000, { size: 'L', extraPrice: 10000 }, []);

      expect(priceM).toBe(45000);
      expect(priceL).toBe(50000);
    });

    it('tính đúng đơn giá khi thêm một hoặc nhiều topping', () => {
      const priceWithOneTopping = calcUnitPrice(40000, { size: 'S', extraPrice: 0 }, [
        { price: 5000 },
      ]);
      expect(priceWithOneTopping).toBe(45000);

      // Khớp chính xác với ví dụ mẫu trong frontend/src/lib/pricing.ts:
      // Base: 45_000, Size L: 10_000, Toppings: [5_000, 7_000] -> 67_000
      const priceCombo = calcUnitPrice(45000, { size: 'L', extraPrice: 10000 }, [
        { price: 5000 },
        { price: 7000 },
      ]);
      expect(priceCombo).toBe(67000);
    });

    it('làm tròn số nguyên chuẩn xác theo Math.round', () => {
      const price = calcUnitPrice(45000.4, { size: 'M', extraPrice: 5000.2 }, [{ price: 5000.1 }]);
      expect(price).toBe(55001);
    });

    it('ném ngoại lệ RangeError khi giá gốc không hợp lệ (âm hoặc NaN hoặc Infinity)', () => {
      expect(() => calcUnitPrice(-1, { size: 'S', extraPrice: 0 }, [])).toThrow(RangeError);
      expect(() => calcUnitPrice(NaN, { size: 'S', extraPrice: 0 }, [])).toThrow(
        'Giá gốc không hợp lệ',
      );
      expect(() => calcUnitPrice(Infinity, { size: 'S', extraPrice: 0 }, [])).toThrow(
        'Giá gốc không hợp lệ',
      );
    });

    it('ném ngoại lệ RangeError khi size không thuộc danh sách cho phép (S, M, L)', () => {
      expect(() => calcUnitPrice(40000, { size: 'XL' as any, extraPrice: 10000 }, [])).toThrow(
        'Size không hợp lệ',
      );
      expect(() => calcUnitPrice(40000, { size: '' as any, extraPrice: 0 }, [])).toThrow(
        'Size không hợp lệ',
      );
    });

    it('ném ngoại lệ RangeError khi phụ thu size không hợp lệ', () => {
      expect(() => calcUnitPrice(40000, { size: 'M', extraPrice: -5000 }, [])).toThrow(
        'Phụ thu size không hợp lệ',
      );
      expect(() => calcUnitPrice(40000, { size: 'M', extraPrice: NaN }, [])).toThrow(
        'Phụ thu size không hợp lệ',
      );
    });

    it('ném ngoại lệ RangeError khi giá topping không hợp lệ', () => {
      expect(() => calcUnitPrice(40000, { size: 'S', extraPrice: 0 }, [{ price: -1000 }])).toThrow(
        'Giá topping không hợp lệ',
      );
      expect(() => calcUnitPrice(40000, { size: 'S', extraPrice: 0 }, [{ price: NaN }])).toThrow(
        'Giá topping không hợp lệ',
      );
    });
  });

  // =========================================================================
  // PHẦN 2: BỘ CA KIỂM THỬ SERVER TÍNH LẠI GIÁ (CHỐNG GIAN LẬN TỪ CLIENT)
  // (Nghiệm thu Sub-task 21.1: Server là nguồn sự thật cho lineTotal/total)
  // =========================================================================
  describe('PricingService.calculateOrderPricing (Server-side Anti-fraud Calculation)', () => {
    let service: PricingService;
    const mockPrisma = {
      product: {
        findMany: jest.fn(),
      },
    };

    beforeEach(() => {
      jest.resetAllMocks();
      service = new PricingService(mockPrisma as unknown as PrismaService);
    });

    const mockCatalogProducts = [
      {
        id: 1,
        name: 'Americano',
        price: 40000,
        isActive: true,
        sizes: [
          { size: 'S', extraPrice: 0 },
          { size: 'M', extraPrice: 5000 },
          { size: 'L', extraPrice: 10000 },
        ],
        toppings: [
          {
            toppingId: 1,
            topping: { id: 1, name: 'Trân châu đen', price: 5000, isActive: true },
          },
          {
            toppingId: 2,
            topping: { id: 2, name: 'Kem Cheese', price: 10000, isActive: true },
          },
          {
            toppingId: 3,
            topping: { id: 3, name: 'Thạch cũ', price: 5000, isActive: false },
          },
        ],
      },
      {
        id: 2,
        name: 'Trà Đào Cam Sả',
        price: 45000,
        isActive: true,
        sizes: [
          { size: 'M', extraPrice: 0 }, // Chỉ có size M
        ],
        toppings: [
          {
            toppingId: 4,
            topping: { id: 4, name: 'Miếng đào ngâm', price: 8000, isActive: true },
          },
        ],
      },
    ];

    it('bỏ qua hoàn toàn giá giả mạo từ client và tính lại chính xác theo Product + Size + Topping từ DB', async () => {
      mockPrisma.product.findMany.mockResolvedValue(mockCatalogProducts);

      // Client cố tình gửi giá giả mạo (clientPrice = 100đ, clientUnitPrice = 1đ,...)
      const clientPayload = [
        {
          productId: 1,
          size: 'M' as const,
          toppingIds: [1],
          qty: 2,
          clientPrice: 100,
          clientUnitPrice: 1,
          clientLineTotal: 2,
        },
      ];

      const result = await service.calculateOrderPricing(clientPayload);

      // Giá đúng:
      // Base: 40.000 + Size M (+5.000) + Trân châu (+5.000) = 50.000
      // Số lượng: 2 ly -> Thành tiền dòng (lineTotal): 100.000
      // Tổng đơn hàng: 100.000 (không bị ảnh hưởng bởi giá giả 100đ từ client)
      expect(result.subtotal).toBe(100000);
      expect(result.total).toBe(100000);
      expect(result.discountAmount).toBe(0);
      expect(result.items).toHaveLength(1);

      const itemSnapshot = result.items[0];
      expect(itemSnapshot.productName).toBe('Americano');
      expect(itemSnapshot.basePrice).toBe(40000);
      expect(itemSnapshot.sizeExtra).toBe(5000);
      expect(itemSnapshot.unitPrice).toBe(50000);
      expect(itemSnapshot.qty).toBe(2);
      expect(itemSnapshot.lineTotal).toBe(100000);
      expect(itemSnapshot.toppings).toEqual([
        {
          toppingId: 1,
          toppingName: 'Trân châu đen',
          price: 5000,
        },
      ]);
    });

    it('tính đúng tổng tiền khi giỏ hàng có nhiều món và nhiều topping khác nhau', async () => {
      mockPrisma.product.findMany.mockResolvedValue(mockCatalogProducts);

      const clientPayload = [
        // Món 1: Americano size L (+10.000) kèm Trân châu (+5.000) và Kem Cheese (+10.000), qty = 1
        // Đơn giá: 40k + 10k + 5k + 10k = 65k * 1 = 65k
        {
          productId: 1,
          size: 'L' as const,
          toppingIds: [1, 2],
          qty: 1,
        },
        // Món 2: Trà Đào size M (+0) kèm Đào ngâm (+8.000), qty = 3
        // Đơn giá: 45k + 0k + 8k = 53k * 3 = 159k
        {
          productId: 2,
          size: 'M' as const,
          toppingIds: [4],
          qty: 3,
        },
      ];

      const result = await service.calculateOrderPricing(clientPayload);

      expect(result.subtotal).toBe(65000 + 159000); // 224.000
      expect(result.total).toBe(224000);
      expect(result.items[0].lineTotal).toBe(65000);
      expect(result.items[1].lineTotal).toBe(159000);
    });

    it('từ chối khi danh sách món gửi lên rỗng', async () => {
      await expect(service.calculateOrderPricing([])).rejects.toThrow(BadRequestException);
    });

    it('từ chối khi số lượng món không hợp lệ (qty <= 0 hoặc không phải số nguyên)', async () => {
      await expect(
        service.calculateOrderPricing([{ productId: 1, size: 'S', qty: 0 }]),
      ).rejects.toThrow('Số lượng sản phẩm phải là số nguyên dương');

      await expect(
        service.calculateOrderPricing([{ productId: 1, size: 'S', qty: -2 }]),
      ).rejects.toThrow('Số lượng sản phẩm phải là số nguyên dương');
    });

    it('từ chối khi món ăn không tồn tại hoặc đã ngừng kinh doanh trong DB', async () => {
      mockPrisma.product.findMany.mockResolvedValue([]);

      await expect(
        service.calculateOrderPricing([{ productId: 999999, size: 'S', qty: 1 }]),
      ).rejects.toThrow(NotFoundException);
    });

    it('từ chối khi món ăn không hỗ trợ size mà khách đã chọn', async () => {
      mockPrisma.product.findMany.mockResolvedValue(mockCatalogProducts);

      // Trà Đào chỉ có size M, khách cố tình chọn size L
      await expect(
        service.calculateOrderPricing([{ productId: 2, size: 'L', qty: 1 }]),
      ).rejects.toThrow(BadRequestException);
    });

    it('từ chối khi khách chọn topping bị trùng lặp trong cùng 1 món', async () => {
      await expect(
        service.calculateOrderPricing([
          {
            productId: 1,
            size: 'S',
            qty: 1,
            toppingIds: [1, 1],
          },
        ]),
      ).rejects.toThrow('Topping không được chọn trùng lặp trong cùng một món');
    });

    it('từ chối khi khách chọn topping không được gán cho món hoặc topping đã ngừng bán', async () => {
      mockPrisma.product.findMany.mockResolvedValue(mockCatalogProducts);

      // top-peach không được gán cho món Americano
      await expect(
        service.calculateOrderPricing([
          {
            productId: 1,
            size: 'S',
            qty: 1,
            toppingIds: [4],
          },
        ]),
      ).rejects.toThrow(BadRequestException);

      // top-disabled là topping đã ngừng bán (isActive = false)
      await expect(
        service.calculateOrderPricing([
          {
            productId: 1,
            size: 'S',
            qty: 1,
            toppingIds: [3],
          },
        ]),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
