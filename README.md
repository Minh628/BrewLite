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
│     ├─ auth/                # AuthModule: Đăng ký, đăng nhập & JWT
│     │  ├─ dto/              # Data Transfer Objects (RegisterDto)
│     │  ├─ auth.controller.ts
│     │  ├─ auth.service.ts
│     │  └─ auth.module.ts
│     ├─ common/              # Global filters, pipes, interceptors
│     │  └─ filters/
│     │     └─ http-exception.filter.ts
│     ├─ pricing/             # PricingService & logic tính giá
│     ├─ prisma/              # PrismaService & PrismaModule
│     ├─ products/            # ProductsModule & catalog API
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

- **PB-23 (Sub-task 23.1 & 23.2): Log request & mã tương quan `X-Request-Id`**
  - `RequestLoggingMiddleware` ghi một dòng log cho mọi request: requestId, method, url, status, thời gian (kể cả request bị guard chặn 401/429 và route không tồn tại 404).
  - Body lỗi có thêm `requestId` trùng header `X-Request-Id` (xem mục [Đọc log request](#đọc-log-request-pb-23)).
- **PB-16 (Sub-task 16.1): Swagger tại [`/api-docs`](http://localhost:3001/api-docs)** cho products, categories, toppings, auth, orders; nút Authorize (Bearer JWT) gọi thử được `POST /orders`, `GET /auth/me`.
- **PB-29 (Sub-task 29.1 & 29.2): Đo hiệu năng bằng autocannon** — kịch bản ở `scripts/perf/`, kết quả ở [`docs/perf-report.md`](./docs/perf-report.md).
- **PB-07 (Sub-task 7.2): AuthModule - API Đăng ký (`POST /auth/register`)**
  - Xây dựng API đăng ký người dùng với mật khẩu băm bcrypt (salt rounds = 10) và tự động ký phát hành JWT accessToken.
  - Triển khai cơ chế chống race condition (bắt lỗi Prisma P2002 và ném HTTP 409 Conflict), Fast Pre-check tối ưu hóa CPU và Data Whitelisting (loại trừ tuyệt đối `passwordHash`).
- **PB-14 (Sub-task 14.1 & 14.2): Nền tảng API & Chuẩn hóa lỗi**
  - Kích hoạt `ValidationPipe` toàn cục với `whitelist: true`, `transform: true`, `forbidNonWhitelisted: true`, `enableImplicitConversion: true` để validate dữ liệu chặt chẽ và từ chối field lạ (400 Bad Request).
  - Tích hợp `HttpExceptionFilter` toàn cục chuẩn hóa cấu trúc phản hồi lỗi thống nhất cho mọi API.
- **PB-14 (Sub-task 14.3): CORS, Health Check & Quy ước API**
  - Cấu hình CORS linh hoạt theo biến môi trường `CORS_ORIGIN`, bật credentials và mở các header quan trọng như `Idempotency-Key`.
  - Triển khai endpoint `GET /health` trả về mã HTTP 200 kèm uptime và trạng thái service.
  - Ban hành tài liệu quy ước API chi tiết tại [`docs/api-conventions.md`](./docs/api-conventions.md).
- **PB-22 (Sub-task 22.1 & 22.2): Bảo mật API, Helmet, Rate-limiting & Che giấu Stack Trace**
  - Tích hợp `helmet` tại `main.ts` cấu hình các HTTP security headers tiêu chuẩn (`X-Content-Type-Options`, `X-Frame-Options`,...).
  - Cấu hình `@nestjs/throttler` chống brute-force cho route `POST /auth/login`: tối đa 5 requests/phút (request thứ 6 trả về HTTP 429 Too Many Requests theo tiêu chí AT-22).
  - Hoàn thiện CORS Whitelist dựa trên biến môi trường `CORS_ORIGIN` với `credentials: true`.
  - Ẩn toàn bộ stack trace và chi tiết schema/database ở môi trường Production (`NODE_ENV=production`) tại `HttpExceptionFilter`, tự động gán và trả về `X-Request-Id` hỗ trợ đối chiếu log.

## API / Function

### `POST /auth/register`

- **Mô tả:** Đăng ký tài khoản người dùng mới và cấp phát token JWT.
- **Request Body:**
  ```json
  {
    "email": "user@brewlite.vn",
    "password": "securepassword123"
  }
  ```
  _(Email tự động được chuẩn hóa trim/lowercase; Mật khẩu tối thiểu 8 ký tự)._
- **Response Success (HTTP 201 Created):**
  ```json
  {
    "user": {
      "id": "cuid_string",
      "email": "user@brewlite.vn"
    },
    "accessToken": "jwt_token_string"
  }
  ```
- **Response Errors:**
  - `400 Bad Request`: Thiếu trường, email không đúng định dạng, mật khẩu < 8 ký tự, hoặc chứa trường không cho phép.
  - `409 Conflict`: Email đã tồn tại trong hệ thống (`"message": "Email already registered"`).

## Chuẩn hóa lỗi API

Mọi lỗi từ hệ thống (client error 4xx hoặc server error 5xx) đều tuân theo cấu trúc JSON:

```json
{
  "statusCode": 400,
  "message": ["tên trường không hợp lệ"],
  "error": "Bad Request",
  "path": "/api/v1/endpoint",
  "timestamp": "2026-09-30T13:30:00.000Z",
  "requestId": "0b6f8a52-3f7c-4a5e-9d0e-6f1c2b7a9e11"
}
```

Ở môi trường Production (`NODE_ENV=production`), khi gặp lỗi nội bộ máy chủ (HTTP 500), response được làm sạch tối đa nhằm ngăn chặn rò rỉ stack trace hoặc chi tiết CSDL:

```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "requestId": "uuid_string",
  "timestamp": "2026-10-19T20:00:00.000Z"
}
```

## Bảo mật (Security Configuration)

### 1. Biến môi trường bảo mật

| Tên biến         | Kiểu dữ liệu                   | Mặc định                | Mô tả                                                                          |
| :--------------- | :----------------------------- | :---------------------- | :----------------------------------------------------------------------------- |
| `CORS_ORIGIN`    | Chuỗi (phân tách bởi dấu phẩy) | `http://localhost:3000` | Whitelist domain frontend được phép truy cập API kèm `credentials: true`.      |
| `THROTTLE_TTL`   | Số nguyên (giây)               | `60`                    | Chu kỳ thời gian theo dõi tần suất gửi request (Rate-limiting).                |
| `THROTTLE_LIMIT` | Số nguyên                      | `100`                   | Số lượng request tối đa được phép trong mỗi chu kỳ cho các route thông thường. |

### 2. Giới hạn tần suất (Rate Limiting) chống Brute-force

- **Quy tắc endpoint nhạy cảm:** Endpoint `POST /auth/login` được cấu hình chặt chẽ tối đa **5 lần / 60 giây (1 phút)** trên mỗi địa chỉ IP (theo tiêu chí nghiệm thu AT-22).
- **Phản hồi khi vượt ngưỡng (HTTP 429 Too Many Requests):**
  - Khi gửi request thứ 6 trong vòng 1 phút, server lập tức từ chối và phản hồi:
  ```json
  {
    "statusCode": 429,
    "message": "Too Many Requests",
    "error": "Too Many Requests",
    "path": "/auth/login",
    "timestamp": "2026-10-19T20:00:00.000Z"
  }
  ```
  - Đi kèm header `Retry-After` thông báo số giây cần chờ trước khi được phép thử lại.

### 3. Tra cứu log qua `X-Request-Id` khi gặp lỗi 500

- Mọi phản hồi API đều mang header `X-Request-Id`. Nếu client hoặc API Gateway gửi lên header `X-Request-Id`, hệ thống sẽ kế thừa; nếu không, hệ thống sẽ tự sinh UUIDv4.
- Khi gặp mã lỗi `500 Internal Server Error`, client nhận được `requestId` trong thân JSON để báo cáo sự cố.
- **Cách tra cứu:**
  1. Trích xuất mã `requestId` từ response lỗi của người dùng hoặc tab Network.
  2. Tìm kiếm log chi tiết trên server theo mã requestId:
     ```bash
     docker compose logs backend | grep "requestId_can_tim"
     ```
  3. Server log sẽ hiển thị đầy đủ thông tin stack trace và ngữ cảnh lỗi mà không bị rò rỉ ra bên ngoài.

## Đọc log request (PB-23)

Mỗi request sinh đúng một dòng log ngữ cảnh `HTTP` khi response kết thúc:

```text
[Nest] 4821  - 10/24/2026, 10:31:34 AM     LOG [HTTP] [0b6f8a52-3f7c-4a5e-9d0e-6f1c2b7a9e11] GET /products?q=ca%20phe 200 16.8ms
[Nest] 4821  - 10/24/2026, 10:31:35 AM    WARN [HTTP] [5d1c...] POST /orders 401 2.1ms
[Nest] 4821  - 10/24/2026, 10:31:35 AM    WARN [HttpExceptionFilter] [5d1c...] 401 Unauthorized: Unauthorized
```

- **Định dạng:** `[requestId] METHOD url status thời_gian`. Mức `LOG` cho 2xx/3xx, `WARN` cho 4xx, `ERROR` cho 5xx.
- **requestId:** lấy từ header `X-Request-Id` client gửi lên (chỉ nhận chữ, số, `.`, `_`, `-`, tối đa 128 ký tự để không giả mạo được dòng log), nếu không có thì server sinh UUID. Mã này luôn được trả lại trong header `X-Request-Id` và trong body lỗi (`requestId`).
- **Lỗi 4xx:** thêm một dòng `HttpExceptionFilter` ghi lý do (ví dụ thông báo validate). **Lỗi 500:** thêm dòng `Unhandled Exception` kèm stack trace; stack trace chỉ nằm trong log, không trả ra client ở production.
- **Tra một request:** lấy `requestId` từ tab Network (header `X-Request-Id`) hoặc body lỗi, rồi lọc log:
  ```bash
  npm run dev 2>&1 | grep "<requestId>"          # chạy local
  docker compose logs backend | grep "<requestId>" # chạy Docker
  ```

## Tài liệu API (Swagger)

- Mở http://localhost:3001/api-docs (JSON OpenAPI: `/api-docs-json`).
- Gọi thử route cần đăng nhập: chạy `POST /auth/login` với tài khoản seed `customer@brewlite.vn` / `Password123`, copy `accessToken`, bấm **Authorize**, dán token rồi gọi `POST /orders`.

## Đo hiệu năng (PB-29)

Chạy trên database riêng vì `POST /orders` tạo đơn thật. Khởi động backend với `THROTTLE_LIMIT` lớn, nếu không rate-limit 100 request/phút sẽ trả 429:

```bash
THROTTLE_LIMIT=1000000 NODE_ENV=production npm run start --workspace @brewlite/backend
npm run perf:products   # GET /products (menu đầy đủ + lọc/tìm)
npm run perf:orders     # POST /orders có Bearer token
```

Biến tùy chọn: `PERF_BASE_URL`, `PERF_DURATION` (giây, mặc định 20), `PERF_CONNECTIONS` (mặc định 10), `PERF_OUT` (ghi JSON kết quả). Script thoát mã 1 nếu p95 ≥ 500 ms hoặc có response không phải 2xx. Kết quả đo: [`docs/perf-report.md`](./docs/perf-report.md).

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
- Swagger: http://localhost:3001/api-docs

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
