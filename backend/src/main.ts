import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Kích hoạt Helmet để thiết lập các HTTP headers bảo mật tiêu chuẩn (X-Content-Type-Options, X-Frame-Options, CSP,...)
  app.use(helmet());

  // Cấu hình CORS động: hỗ trợ domain theo env, cho phép máy local (localhost/127.0.0.1 mọi port)
  // và các công cụ gọi trực tiếp không có header origin (Postman, curl, server-to-server)
  const corsOriginEnv = process.env.CORS_ORIGIN ?? 'http://localhost:3000';
  const allowedOrigins = corsOriginEnv
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Cho phép request không có header origin (máy gọi trực tiếp từ URL bar, Postman, curl)
      if (!origin) {
        return callback(null, true);
      }

      // Cho phép nếu nằm trong cấu hình CORS_ORIGIN
      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Cho phép mọi request xuất phát từ máy local (localhost hoặc 127.0.0.1 ở mọi cổng)
      const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
      if (isLocalhost) {
        return callback(null, true);
      }

      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'Accept', 'X-Request-Id'],
    exposedHeaders: ['Idempotency-Key', 'X-Request-Id'],
  });

  // Cấu hình ValidationPipe toàn cục: whitelist, transform, và từ chối field lạ (forbidNonWhitelisted)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Cấu hình HttpExceptionFilter toàn cục để chuẩn hóa JSON lỗi cho mọi API
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger UI tại /docs, JSON tại /docs-json
  const swaggerConfig = new DocumentBuilder()
    .setTitle('BrewLite API')
    .setDescription('REST API đặt cà phê không tiền mặt BrewLite')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swaggerConfig));

  await app.listen(process.env.PORT ?? 3001);
}

void bootstrap();
