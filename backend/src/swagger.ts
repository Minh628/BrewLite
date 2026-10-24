import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';

export const SWAGGER_PATH = 'api-docs';
export const BEARER_AUTH = 'bearer';

/**
 * Tài liệu OpenAPI của BrewLite (PB-16 / Sub-task 16.1).
 * UI tại /api-docs, JSON tại /api-docs-json; nút Authorize nhận accessToken từ POST /auth/login.
 */
export function setupSwagger(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('BrewLite API')
    .setDescription(
      'REST API đặt cà phê BrewLite. Gọi POST /auth/login, bấm Authorize và dán accessToken để thử các route cần JWT.',
    )
    .setVersion('2.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'accessToken từ /auth/login',
      },
      BEARER_AUTH,
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(SWAGGER_PATH, app, document, {
    customSiteTitle: 'BrewLite API Docs',
    swaggerOptions: { persistAuthorization: true },
  });
  return document;
}
