import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { BEARER_AUTH, setupSwagger } from '../src/swagger';

describe('Swagger /api-docs (PB-16 / Sub-task 16.1)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();

    app = moduleFixture.createNestApplication();
    setupSwagger(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const getDocument = async () =>
    (await request(app.getHttpServer()).get('/api-docs-json').expect(200)).body;

  it('phục vụ Swagger UI tại /api-docs', async () => {
    const response = await request(app.getHttpServer()).get('/api-docs').expect(200);

    expect(response.headers['content-type']).toContain('text/html');
    expect(response.text).toContain('BrewLite API Docs');
  });

  it('liệt kê đủ route products, categories, toppings, auth, orders', async () => {
    const document = await getDocument();

    expect(Object.keys(document.paths)).toEqual(
      expect.arrayContaining([
        '/products',
        '/products/{id}',
        '/toppings',
        '/categories',
        '/auth/register',
        '/auth/login',
        '/auth/me',
        '/orders',
      ]),
    );
  });

  it('khai báo Bearer JWT cho nút Authorize', async () => {
    const document = await getDocument();

    expect(document.components.securitySchemes[BEARER_AUTH]).toMatchObject({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    });
  });

  it('route có JwtAuthGuard yêu cầu Bearer, route public thì không', async () => {
    const document = await getDocument();
    const bearer = [{ [BEARER_AUTH]: [] }];

    expect(document.paths['/orders'].post.security).toEqual(bearer);
    expect(document.paths['/auth/me'].get.security).toEqual(bearer);
    expect(document.paths['/products'].get.security).toBeUndefined();
    expect(document.paths['/auth/login'].post.security).toBeUndefined();
  });

  it('mô tả query category, q của GET /products', async () => {
    const document = await getDocument();
    const params = document.paths['/products'].get.parameters.map(
      (p: { name: string; in: string }) => `${p.in}:${p.name}`,
    );

    expect(params).toEqual(expect.arrayContaining(['query:category', 'query:q']));
  });

  it('mô tả body POST /orders, ẩn các trường giá bị server bỏ qua', async () => {
    const { schemas } = (await getDocument()).components;

    expect(schemas.CreateOrderDto.required).toContain('items');
    expect(Object.keys(schemas.CreateOrderItemDto.properties).sort()).toEqual([
      'productId',
      'qty',
      'size',
      'toppingIds',
    ]);
    expect(schemas.CreateOrderItemDto.properties.size.enum).toEqual(['S', 'M', 'L']);
    expect(schemas.CreatedOrderDto.properties).toHaveProperty('code');
  });
});
