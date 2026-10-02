# BrewLite

Ứng dụng đặt cà phê không tiền mặt theo đề bài môn Công nghệ Phần mềm.

## Stack

- Frontend: Next.js App Router, React, TypeScript, Tailwind CSS, TanStack Query, Zustand
- Backend: NestJS REST, Prisma ORM, PostgreSQL, class-validator, Passport JWT, bcrypt
- Thanh toán: Mock Payment Service (ví/thẻ)
- DevOps: Docker Compose, npm workspaces

## Cấu trúc

```text
BrewLite/
├─ frontend/                  # Next.js UI
├─ backend/                   # NestJS REST API
│  ├─ prisma/                 # schema và seed
│  └─ src/
│     ├─ common/              # Global filters, pipes, interceptors
│     │  └─ filters/
│     │     └─ http-exception.filter.ts
│     ├─ prisma/              # PrismaService & PrismaModule
│     ├─ app.controller.ts
│     ├─ app.module.ts
│     └─ main.ts
├─ docs/                      # Tài liệu kỹ thuật
│  ├─ architecture.md         # Kiến trúc 3 lớp, ADR & thiết kế module
│  ├─ erd/                    # Sơ đồ CSDL, DBML & ERD
│  └─ ui/                     # Thiết kế giao diện & luồng UI
├─ docker-compose.yml          # production: PostgreSQL + backend + frontend
├─ docker-compose.dev.yml      # dev: PostgreSQL 16 với credentials từ Neon.tech
├─ .env.dev                    # credentials dev (git-ignored)
├─ package.json                # scripts dùng chung
└─ .env.example
```

## Tài liệu dự án

- **Kiến trúc hệ thống (Architecture):** [`docs/architecture.md`](./docs/architecture.md) (Sơ đồ 3 lớp, ADR-001 đến 005, cấu trúc module)
- **Thiết kế CSDL (ERD):** [`docs/erd/erd.md`](./docs/erd/erd.md)
- **Quy ước API (API Conventions):** [`docs/api-conventions.md`](./docs/api-conventions.md)

## Thay đổi gần đây

- **PB-14 (Sub-task 14.1 & 14.2): Nền tảng API & Chuẩn hóa lỗi**
  - Kích hoạt `ValidationPipe` toàn cục với `whitelist: true`, `transform: true`, `forbidNonWhitelisted: true`, `enableImplicitConversion: true` để validate dữ liệu chặt chẽ và từ chối field lạ (400 Bad Request).
  - Tích hợp `HttpExceptionFilter` toàn cục chuẩn hóa cấu trúc phản hồi lỗi thống nhất cho mọi API.
- **PB-14 (Sub-task 14.3): CORS, Health Check & Quy ước API**
  - Cấu hình CORS linh hoạt theo biến môi trường `CORS_ORIGIN`, bật credentials và mở các header quan trọng như `Idempotency-Key`.
  - Triển khai endpoint `GET /health` trả về mã HTTP 200 kèm uptime và trạng thái service.
  - Ban hành tài liệu quy ước API chi tiết tại [`docs/api-conventions.md`](./docs/api-conventions.md).
- **PB-4 (Sub-task 4.5): Unit Test hàm tính đơn giá calcUnitPrice**
  - Cài đặt Vitest cho frontend, xây dựng bộ 11 ca kiểm thử bao phủ toàn bộ size (S, M, L), nhiều topping, không topping, làm tròn số thực và ngoại lệ đầu vào.

## Chuẩn hóa lỗi API

Mọi lỗi từ hệ thống (client error 4xx hoặc server error 5xx) đều tuân theo cấu trúc JSON:

```json
{
  "statusCode": 400,
  "message": ["tên trường không hợp lệ"],
  "error": "Bad Request",
  "path": "/api/v1/endpoint",
  "timestamp": "2026-09-30T13:30:00.000Z"
}
```

## Chạy local (không Docker)

Yêu cầu: Node.js 20+, npm 10+, Docker Desktop.

```powershell
Copy-Item .env.example .env
npm install
npm run dev:db
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Health check: http://localhost:3001/health
- Menu: http://localhost:3001/products

## Chạy bằng Docker (dev)

Yêu cầu: Docker Desktop, file `.env.dev` (tạo từ `.env.example`).

```bash
# Lần đầu: tạo file env
cp .env.example .env.dev
# Điền credentials vào .env.dev

docker compose --env-file .env.dev -f docker-compose.dev.yml up --build
```

PostgreSQL dev chạy trên `localhost:5433` (tránh xung đột với port 5432 local).

## Chạy bằng Docker (production)

```powershell
Copy-Item .env.example .env
docker compose up --build
```

## Lộ trình API MVP

- `GET /health`
- `GET /products`
- `GET /products/:id`
- `POST /auth/register`
- `POST /auth/login`
- `POST /orders`
- `POST /payments` với header `Idempotency-Key`
- `GET /orders/me`

## Lệnh hữu ích

```powershell
npm run build
npm run lint
npm run db:migrate
npm run db:seed
npm run docker:down
```
