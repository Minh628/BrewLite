import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { performance } from 'node:perf_hooks';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { HttpExceptionFilter } from '../../src/common/filters/http-exception.filter';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('Products API (e2e)', () => {
  const product = {
    id: 'product-1',
    name: 'Americano',
    price: 40000,
    imageUrl: '/americano.svg',
    isActive: true,
    category: { id: 'category-coffee', name: 'Cà phê' },
  };
  const detailedProduct = {
    ...product,
    description: 'Cà phê đen pha loãng',
    sizes: [{ size: 'S', extraPrice: 0 }],
  };
  const prismaMock = {
    product: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    topping: {
      findMany: jest.fn(),
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

  beforeEach(() => {
    prismaMock.product.findMany.mockReset().mockResolvedValue([product]);
    prismaMock.product.findFirst.mockReset().mockResolvedValue(detailedProduct);
    prismaMock.topping.findMany
      .mockReset()
      .mockResolvedValue([{ id: 'topping-1', name: 'Trân châu đen', price: 5000 }]);
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /products responds with the active menu in under 500 ms', async () => {
    const startedAt = performance.now();
    const response = await request(app.getHttpServer()).get('/products').expect(200);
    const responseTimeMs = performance.now() - startedAt;

    expect(responseTimeMs).toBeLessThan(500);
    expect(response.body).toEqual([
      {
        id: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        category: product.category,
        isAvailable: true,
      },
    ]);
  });

  it('GET /products/:id responds with product details in under 500 ms', async () => {
    const startedAt = performance.now();
    const response = await request(app.getHttpServer()).get('/products/product-1').expect(200);
    const responseTimeMs = performance.now() - startedAt;

    expect(responseTimeMs).toBeLessThan(500);
    expect(response.body).toEqual({
      id: detailedProduct.id,
      name: detailedProduct.name,
      description: detailedProduct.description,
      price: detailedProduct.price,
      imageUrl: detailedProduct.imageUrl,
      category: detailedProduct.category,
      isAvailable: true,
      sizes: [{ code: 'S', extra: 0 }],
    });
  });

  it('GET /toppings responds with active toppings in under 500 ms', async () => {
    const startedAt = performance.now();
    const response = await request(app.getHttpServer()).get('/toppings').expect(200);
    const responseTimeMs = performance.now() - startedAt;

    expect(responseTimeMs).toBeLessThan(500);
    expect(response.body).toEqual([{ id: 'topping-1', name: 'Trân châu đen', price: 5000 }]);
  });

  it('returns 404 for a product ID that does not exist', async () => {
    prismaMock.product.findFirst.mockResolvedValueOnce(null);

    await request(app.getHttpServer()).get('/products/missing-product').expect(404);
  });
});
