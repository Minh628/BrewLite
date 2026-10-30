import { PrismaService } from '../../src/prisma/prisma.service';
import { ProductsService } from '../../src/products/products.service';
import { matchesSearch, normalizeSearchText } from '../../src/products/search-text';

const menu = [
  { id: 1, name: 'Cà phê sữa đá', category: { id: 1, name: 'Cà phê' } },
  { id: 2, name: 'Cà Phê Muối', category: { id: 1, name: 'Cà phê' } },
  { id: 3, name: 'Americano', category: { id: 1, name: 'Cà phê' } },
  { id: 4, name: 'Trà đào cam sả', category: { id: 2, name: 'Trà' } },
  { id: 5, name: 'Đá xay matcha', category: { id: 3, name: 'Đá xay' } },
].map((p) => ({ ...p, price: 40000, imageUrl: null, isActive: true }));

describe('normalizeSearchText (PB-18 / Sub-task 18.2)', () => {
  it.each([
    ['Cà phê', 'ca phe'],
    ['CÀ PHÊ SỮA', 'ca phe sua'],
    ['Đá xay', 'da xay'],
    ['  trà   đào  ', 'tra dao'],
    ['Americano', 'americano'],
  ])('"%s" → "%s"', (input, expected) => {
    expect(normalizeSearchText(input)).toBe(expected);
  });

  it('khớp được cả hai chiều có dấu / không dấu', () => {
    expect(matchesSearch('Cà phê sữa đá', 'ca phe')).toBe(true);
    expect(matchesSearch('Ca phe sua', 'cà phê')).toBe(true);
    expect(matchesSearch('Trà đào', 'ca phe')).toBe(false);
  });

  it('khớp chuỗi tổ hợp Unicode (NFD) gõ từ macOS/iOS giống chuỗi dựng sẵn (NFC)', () => {
    expect(matchesSearch('Cà phê', 'Cà phê'.normalize('NFD'))).toBe(true);
  });
});

describe('ProductsService.findAll với category và q (PB-18 / Sub-task 18.2)', () => {
  const prisma = {
    product: { findMany: jest.fn() },
    category: { findMany: jest.fn() },
  };
  let service: ProductsService;

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.product.findMany.mockResolvedValue(menu);
    service = new ProductsService(prisma as unknown as PrismaService);
  });

  const names = async (query: Parameters<ProductsService['findAll']>[0]) =>
    (await service.findAll(query)).map((p) => p.name);

  it('tìm có dấu "cà phê" ra các món cà phê', async () => {
    await expect(names({ q: 'cà phê' })).resolves.toEqual(['Cà phê sữa đá', 'Cà Phê Muối']);
  });

  it('tìm không dấu "ca phe" ra cùng kết quả', async () => {
    await expect(names({ q: 'ca phe' })).resolves.toEqual(['Cà phê sữa đá', 'Cà Phê Muối']);
  });

  it('tìm "da" khớp cả "đá" và "đào" (đ → d)', async () => {
    await expect(names({ q: 'da' })).resolves.toEqual([
      'Cà phê sữa đá',
      'Trà đào cam sả',
      'Đá xay matcha',
    ]);
  });

  it('không có kết quả thì trả mảng rỗng', async () => {
    await expect(names({ q: 'xyz' })).resolves.toEqual([]);
  });

  it('không truyền q thì trả toàn bộ menu', async () => {
    await expect(names({})).resolves.toHaveLength(menu.length);
  });

  it('lọc danh mục trong DB, vẫn giữ điều kiện món và danh mục đang bán', async () => {
    await service.findAll({ category: 2 });

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isActive: true, category: { isActive: true }, categoryId: 2 },
      }),
    );
  });

  it('không truyền category thì không thêm điều kiện categoryId', async () => {
    await service.findAll({ q: 'tra' });

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isActive: true, category: { isActive: true } },
      }),
    );
  });

  it('GET /categories chỉ lấy danh mục đang hoạt động, sắp theo id', async () => {
    prisma.category.findMany.mockResolvedValue([{ id: 1, name: 'Cà phê' }]);

    await expect(service.findAllCategories()).resolves.toEqual([{ id: 1, name: 'Cà phê' }]);
    expect(prisma.category.findMany).toHaveBeenCalledWith({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { id: 'asc' },
    });
  });
});
