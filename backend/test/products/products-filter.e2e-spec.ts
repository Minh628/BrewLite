import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { HttpExceptionFilter } from '../../src/common/filters/http-exception.filter';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('Products filter API (e2e) - GET /products?category&q, GET /categories (Sub-task 18.2)', () => {
  const coffee = { id: 1, name: 'Cà phê' };
  const tea = { id: 2, name: 'Trà' };
  const menu = [
    { id: 1, name: 'Cà phê sữa', category: coffee },
    { id: 2, name: 'Americano', category: coffee },
    { id: 3, name: 'Trà đào', category: tea },
  ].map((p) => ({ ...p, price: 40000, imageUrl: null, isActive: true }));

  type FindManyArgs = { where: { categoryId?: number } };

  const prismaMock = {
    product: {
      // Giả lập DB lọc theo categoryId như Prisma thật
      findMany: jest.fn(({ where }: FindManyArgs) =>
        Promise.resolve(
          menu.filter((p) => where.categoryId === undefined || p.category.id === where.categoryId),
        ),
      ),
    },
    category: {
      findMany: jest.fn(() => Promise.resolve([coffee, tea])),
    },
  };
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const getNames = async (query: string) => {
    const response = await request(app.getHttpServer()).get(`/products${query}`).expect(200);
    return (response.body as { name: string }[]).map((p) => p.name);
  };

  it('tìm có dấu: q=cà phê', async () => {
    await expect(getNames(`?q=${encodeURIComponent('cà phê')}`)).resolves.toEqual(['Cà phê sữa']);
  });

  it('tìm không dấu: q=ca phe khớp "Cà phê sữa"', async () => {
    await expect(getNames('?q=ca%20phe')).resolves.toEqual(['Cà phê sữa']);
  });

  it('tìm không phân biệt hoa thường: q=AMERI', async () => {
    await expect(getNames('?q=AMERI')).resolves.toEqual(['Americano']);
  });

  it('không có kết quả: q=xyz → 200 []', async () => {
    await expect(getNames('?q=xyz')).resolves.toEqual([]);
  });

  it('q rỗng hoặc toàn khoảng trắng thì trả toàn bộ menu', async () => {
    await expect(getNames('?q=')).resolves.toHaveLength(3);
    await expect(getNames('?q=%20%20')).resolves.toHaveLength(3);
  });

  it('lọc danh mục: category=2 chỉ ra món Trà', async () => {
    await expect(getNames('?category=2')).resolves.toEqual(['Trà đào']);
    expect(prismaMock.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ categoryId: 2 }) }),
    );
  });

  it('category rỗng (tab "Tất cả") thì không lọc', async () => {
    await expect(getNames('?category=')).resolves.toHaveLength(3);
  });

  it('kết hợp category và q', async () => {
    await expect(getNames('?category=1&q=sua')).resolves.toEqual(['Cà phê sữa']);
    await expect(getNames('?category=2&q=ca%20phe')).resolves.toEqual([]);
  });

  it('danh mục không tồn tại: category=999 → 200 []', async () => {
    await expect(getNames('?category=999')).resolves.toEqual([]);
  });

  it.each([
    ['category=abc', 'category phải là số nguyên'],
    ['category=1.5', 'category phải là số nguyên'],
    ['category=0', 'category phải là số nguyên dương'],
    ['category=-1', 'category phải là số nguyên dương'],
    [`q=${'a'.repeat(101)}`, 'q tối đa 100 ký tự'],
  ])('danh mục / từ khóa sai: %s → 400', async (query, expectedMessage) => {
    const response = await request(app.getHttpServer()).get(`/products?${query}`).expect(400);

    expect(response.body).toMatchObject({ statusCode: 400, error: 'Bad Request' });
    expect(response.body.message).toEqual(expect.arrayContaining([expectedMessage]));
    expect(prismaMock.product.findMany).not.toHaveBeenCalled();
  });

  it('tham số lạ bị từ chối 400', async () => {
    await request(app.getHttpServer()).get('/products?sort=price').expect(400);
  });

  it('GET /categories trả danh mục đang hoạt động', async () => {
    const response = await request(app.getHttpServer()).get('/categories').expect(200);

    expect(response.body).toEqual([coffee, tea]);
  });
});
