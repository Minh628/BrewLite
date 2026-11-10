# BrewLite — Kiến trúc hệ thống (Task 3.1)

- **Mã:** T3.1
- **Phiên bản:** 1.0
- **Ngày:** 2026-11-05
- **Người viết:** Hoàng Tịnh (DevOps / Architect)
- **Trạng thái:** Draft — chờ nhóm review (hạn 07/11)
- **Tài liệu liên quan:** `docs/api-contract.md` (v3), `docs/erd/erd_v2.md`, `docs/architecture/adr/README.md` (chỉ mục ADR 001–005), `docs/architecture.md` (bản mô tả chi tiết v3.0 của M2), `docs/deployment.md` (T3.2)

---

## 1. Tổng quan

BrewLite là ứng dụng đặt cà phê không tiền mặt, gồm hai ứng dụng triển khai độc lập trong một monorepo:

| Thành phần    | Công nghệ                                                               | Thư mục                                 | Vai trò                                                                    |
| ------------- | ----------------------------------------------------------------------- | --------------------------------------- | -------------------------------------------------------------------------- |
| **Web (PWA)** | Next.js 15 (App Router), React 19, TypeScript, TailwindCSS              | `frontend/`                             | Giao diện khách: menu → chi tiết → giỏ → đặt đơn → thanh toán → lịch sử    |
| **API**       | NestJS 11, TypeScript, Prisma 6, passport-jwt, class-validator, Swagger | `backend/`                              | Toàn bộ nghiệp vụ, xác thực, tính giá, đặt đơn, thanh toán, trạng thái đơn |
| **Database**  | PostgreSQL 16                                                           | `docker-compose.yml`, `backend/prisma/` | Lưu trữ bền vững, ràng buộc duy nhất, transaction, khóa dòng               |
| **Hạ tầng**   | Docker Compose, GitHub Actions                                          | repo gốc, `.github/workflows/`          | Chạy local một lệnh, CI tự động                                            |

**Nguyên tắc cốt lõi:** _Server là Single Source of Truth cho mọi con số tài chính._ Client có thể tính trước để hiển thị, nhưng giá, giảm giá, tổng tiền, điểm thưởng đều do API tính lại từ DB rồi trả về.

### 1.1. Sơ đồ phân lớp (C4 — mức Container)

```
┌──────────────────────────── Trình duyệt (mobile-first / PWA) ────────────────────────────┐
│                                                                                          │
│  Next.js 15 App Router (frontend/)                                                       │
│  ├─ Server Components: gọi API hoặc SSR lần đầu                                          │
│  ├─ Client Components: form, giỏ hàng, checkout                                          │
│  ├─ Zustand stores: auth (persist + cookie mirror), cart (persist local)                 │
│  ├─ middleware.ts: chặn /checkout khi chưa có cookie brewlite-auth                       │
│  └─ lib/api.ts: fetch + Authorization Bearer + xử lý 401 tập trung                       │
└───────────────────────────────────────┬──────────────────────────────────────────────────┘
                                        │ HTTPS · JSON · Bearer JWT
                                        ▼
┌─────────────────────────────── API NestJS (backend/ :3001) ──────────────────────────────┐
│  main.ts                                                                                 │
│  ├─ helmet()                       bảo mật header                                        │
│  ├─ enableCors(CORS_ORIGIN)         whitelist origin, cho localhost dev                   │
│  ├─ ValidationPipe (whitelist, forbidNonWhitelisted, transform)                           │
│  ├─ HttpExceptionFilter              body lỗi chuẩn + `code` nghiệp vụ                    │
│  ├─ RequestLoggingMiddleware         X-Request-Id, log method/url/status/ms               │
│  └─ Swagger /api-docs                                                                    │
│                                                                                          │
│  AppModule                                                                               │
│  ├─ ThrottlerModule (APP_GUARD)      giới hạn request/phút                               │
│  ├─ PrismaModule (@Global)           PrismaService                                       │
│  ├─ AuthModule                       register/login, JwtStrategy, JwtAuthGuard, RolesGuard│
│  ├─ ProductsModule                   GET /products, /products/:id, /toppings, /categories │
│  ├─ PricingModule                    tính đơn giá & tổng đơn từ DB                        │
│  ├─ OrdersModule                     POST /orders, OrderStatusService (state machine),    │
│  │                                   LoyaltyHooksService (award/revoke)                   │
│  ├─ PromotionsModule                 POST /promotions/validate, evaluate/consumeUsage     │
│  ├─ LoyaltyModule                    award/revoke điểm thưởng                            │
│  └─ StockModule                      kiểm soát tồn kho (OCC)                             │
│  AppController                       GET / (hello), GET /health                          │
└───────────────────────────────────────┬──────────────────────────────────────────────────┘
                                        │ TCP 5432 · Prisma Client
                                        ▼
┌────────────────────────────── PostgreSQL 16 (postgres:16-alpine) ───────────────────────┐
│  Category · Product · ProductSize · Topping · ProductTopping · User                     │
│  Order · OrderItem · OrderItemTopping · Promotion · Payment                             │
│  enums: Role · Size · OrderStatus · PaymentMethod · PaymentStatus · DiscountType         │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Frontend — Next.js PWA

### 2.1. Cấu trúc thư mục

```
frontend/src/
├─ app/
│  ├─ layout.tsx, page.tsx (menu), providers.tsx (React Query + Toast)
│  ├─ products/[id]/     chi tiết: chọn size/topping/số lượng
│  ├─ cart/              giỏ hàng
│  ├─ checkout/          đặt đơn (được bảo vệ)
│  ├─ orders/            lịch sử + chi tiết đơn
│  ├─ login/, register/  xác thực
├─ components/           Button, Input, Header, SizeSelector, ToppingSelector, EmptyState, StatusBadge
├─ store/                auth.ts (Zustand persist), cart.ts (persist)
├─ lib/                  api.ts, types.ts, pricing.ts, format.ts, authSchemas.ts
├─ hooks/                useToast
└─ middleware.ts         route guard
```

### 2.2. State management

| State                             | Công nghệ                       | Lưu trữ                                 | Lý do                                    |
| --------------------------------- | ------------------------------- | --------------------------------------- | ---------------------------------------- |
| Dữ liệu từ API (products, orders) | TanStack React Query            | Cache trong bộ nhớ                      | Có retry, refetch, loading/error sẵn     |
| Phiên đăng nhập                   | Zustand + `persist`             | `localStorage` + cookie `brewlite-auth` | Cần đồng bộ đọc được ở middleware (Edge) |
| Giỏ hàng                          | Zustand + `persist` (version 1) | `localStorage`                          | Giữ giỏ khi reload; không cần server     |

### 2.3. Route guard

`middleware.ts` chỉ chặn **`/checkout`**; `/login` và `/register` bị chặn ngược lại (đã đăng nhập → đẩy về `returnUrl`). Đây là lớp bảo vệ UX; **quyền thực sự nằm ở API** (JwtAuthGuard) — middleware không thay thế được xác thực server.

### 2.4. Hợp đồng với API

- Mọi request đi qua `lib/api.ts`: tự gắn `Authorization`, tự bắt **401** (xóa auth + chuyển `/login?returnUrl=…`), bọc lỗi thành `ApiError` có `status` và `message`.
- Kiểu dữ liệu định nghĩa ở `lib/types.ts`, khớp `docs/api-contract.md`.

---

## 3. Backend — NestJS theo module

### 3.1. Bảng module

| Module       | Controller/Endpoint                                                             | Trách nhiệm chính                                                             | Phụ thuộc                    |
| ------------ | ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------- |
| `prisma`     | —                                                                               | `PrismaService` dùng chung (`@Global`)                                        | —                            |
| `auth`       | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`                       | bcrypt, cấp JWT, `JwtStrategy`, `RolesGuard`, `@CurrentUser`                  | prisma                       |
| `products`   | `GET /products?category=&q=`, `GET /products/:id`                               | Đọc menu, lọc danh mục, tìm không dấu, cờ hết hàng, chi tiết kèm size/topping | prisma                       |
| `pricing`    | — (nội bộ)                                                                      | Tính `unitPrice`/`lineTotal`/`subtotal` từ DB, bỏ qua giá client              | prisma                       |
| `promotions` | `POST /promotions/validate`                                                     | Kiểm tra & tính giảm PERCENT/FIXED; `consumeUsage`/`releaseUsage`             | prisma                       |
| `orders`     | `POST /orders`, `GET /orders/me`, `GET /orders/:id`, `PATCH /orders/:id/status` | Tạo đơn transaction + idempotency; state machine; hook điểm thưởng            | pricing, promotions, loyalty |
| `loyalty`    | — (hook)                                                                        | `award`/`revoke` điểm, chống cộng đôi                                         | prisma                       |
| `stock`      | (nội bộ)                                                                        | Trừ/hoàn tồn kho bằng optimistic locking                                      | prisma                       |
| `common`     | —                                                                               | `HttpExceptionFilter`, `RequestLoggingMiddleware`, DTO lỗi                    | —                            |

### 3.2. Luồng tạo đơn (tóm tắt)

```
Client ──POST /orders (Bearer, Idempotency-Key?, promoCode?)──▶ OrdersController
  1. JwtAuthGuard           → req.user
  2. ValidationPipe         → CreateOrderDto
  3. OrdersService.create
     a. tra đơn theo (userId, key)  ─ có ─▶ 200 replayed
     b. PricingService         tính giá từ DB
     c. PromotionsService      evaluate (PROMO_* nếu sai)
     d. $transaction
          Order + OrderItem + OrderItemTopping
          promo.usedCount (updateMany có điều kiện)
     e. P2002 khi đua ─▶ tra lại ─▶ 200 replayed | 409
  → 201 { orderId, code, status: PENDING, subtotal, discount, promoCode, total, items }
```

Chi tiết quyết định: **ADR-005**; tính toàn vẹn thanh toán/kho: **ADR-003**.

### 3.3. Xử lý lỗi thống nhất

`HttpExceptionFilter` trả mọi lỗi cùng một schema:

```json
{
  "statusCode": 400,
  "code": "PROMO_EXPIRED",
  "message": "Mã giảm giá 'HETHAN' đã hết hạn hoặc chưa tới thời gian sử dụng",
  "error": "Bad Request",
  "path": "/promotions/validate",
  "timestamp": "2026-11-05T10:00:00.000Z",
  "requestId": "uuid-v4"
}
```

Trường `code` chỉ xuất hiện với lỗi nghiệp vụ (`PROMO_*`, `INVALID_TRANSITION`, `ORDER_NOT_PAYABLE`, `OUT_OF_STOCK`, `IDEMPOTENCY_KEY_*`). `requestId` trùng header `X-Request-Id` để đối chiếu log.

### 3.4. Cấu hình (biến môi trường)

| Biến                              | Ví dụ                                                           | Dùng ở                 |
| --------------------------------- | --------------------------------------------------------------- | ---------------------- |
| `DATABASE_URL`                    | `postgresql://brewlite:…@localhost:5432/brewlite?schema=public` | Prisma                 |
| `JWT_SECRET`                      | chuỗi ≥ 32 ký tự                                                | AuthModule/JwtStrategy |
| `PORT`                            | `3001`                                                          | main.ts                |
| `CORS_ORIGIN`                     | `http://localhost:3000` (nhiều giá trị cách dấu phẩy)           | main.ts                |
| `THROTTLE_TTL` / `THROTTLE_LIMIT` | `60` / `100`                                                    | ThrottlerModule        |
| `NEXT_PUBLIC_API_URL`             | `http://localhost:3001`                                         | Frontend               |

`.env.example` ở gốc, `backend/.env.example`, `frontend/.env.example` — **không commit giá trị thật**.

### 3.5. Quan sát & vận hành (Observability)

| Hạng mục     | Hiện có                                                                               |
| ------------ | ------------------------------------------------------------------------------------- |
| Health check | `GET /health` → `{ status, timestamp, uptime, service }`; dùng bởi Docker healthcheck |
| Request ID   | Middleware sinh `X-Request-Id`, trả lại header, đưa vào body lỗi                      |
| Logging      | `RequestLoggingMiddleware` log method, url, status, thời gian, requestId              |
| API docs     | Swagger `/api-docs` (tag Auth, Products, Orders, Promotions, Health)                  |
| Hiệu năng    | `scripts/perf/*` + `docs/perf-report.md` (autocannon)                                 |

---

## 4. Triển khai (tóm tắt — chi tiết ở T3.2)

### 4.1. Local / CI

```
docker compose up --build
├─ postgres  :5432   volume brewlite-postgres (bền vững)
├─ adminer   :8080   xem dữ liệu
├─ backend   :3001   build ./backend    depends_on postgres(healthy)
└─ frontend  :3000   build ./frontend   depends_on backend(healthy)
```

Healthcheck: Postgres `pg_isready` → backend `GET /health` → frontend `GET /`.

### 4.2. Production

Chi tiết đầy đủ (biến môi trường, thứ tự deploy, health check, rollback, checklist nộp): **[`docs/deployment.md`](../deployment.md)**. Sơ đồ: [`deployment.puml`](../diagrams/deployment.puml) / [`deployment.svg`](../diagrams/deployment.svg).

| Thành phần | Nền tảng                    | Ghi chú                                                        |
| ---------- | --------------------------- | -------------------------------------------------------------- |
| Web (PWA)  | Vercel                      | HTTPS + CDN tự động; `NEXT_PUBLIC_API_URL` nhúng lúc **build** |
| API        | Render Web Service (Docker) | Image từ GHCR; `GET /health` 200; migrate trước khi start      |
| DB         | Neon PostgreSQL 16          | SSL bắt buộc; **không** public IP; chỉ API kết nối             |
| Secret     | Env của platform            | `JWT_SECRET`, `DATABASE_URL`, `CORS_ORIGIN`                    |
| Registry   | GHCR                        | Tag = commit SHA (+ semver) → nguồn sự thật để rollback        |

Luồng CD (`.github/workflows/cd.yml`): `tag v*.*.*` → verify → build 2 image → push GHCR → trigger deploy → smoke test `/health`.

> Phương án nền tảng là **đề xuất** để không chặn Task 3; nếu nhóm chốt platform khác, chỉ sửa nhãn node trong `.puml` + bảng trên, cấu trúc luồng không đổi.

---

## 5. Ưu điểm, nhược điểm, đánh đổi

### 5.1. Ưu điểm

- **Phân tách rõ FE/BE:** API có thể kiểm thử độc lập bằng Swagger/curl; FE thay UI không ảnh hưởng nghiệp vụ.
- **Nghiệp vụ tập trung ở server:** giá, giảm giá, điểm, trạng thái đơn — một chỗ sửa, nhiều client dùng.
- **Module hóa NestJS:** mỗi miền có module riêng, dễ test và mở rộng (thêm `stock`/`payments` không phá `orders`).
- **Ràng buộc DB là tuyến phòng thủ cuối:** unique `(userId, idempotencyKey)`, `updateMany` có điều kiện — đúng kể cả khi app có bug.
- **Chạy được một lệnh:** giảm rào cản cho người mới và cho giảng viên chấm.

### 5.2. Nhược điểm

- **Hai runtime cho một sản phẩm nhỏ:** tăng số chỗ có thể hỏng khi deploy (2 image, 2 biến môi trường, CORS).
- **JWT stateless không thu hồi được:** đăng xuất không vô hiệu hóa token đã phát (ADR-004).
- **Dữ liệu dùng chung nhưng không có shared types package:** FE/BE có thể lệch kiểu nếu không cập nhật `lib/types.ts` cùng lúc.
- **Phụ thuộc Prisma cho truy vấn phức tạp:** khóa dòng và OCC phải viết SQL thô.
- **Chưa có lớp cache:** mọi lần mở menu đều vào DB (đủ cho MVP, chưa tối ưu).

### 5.3. Các đánh đổi chính

| Đánh đổi                                    | Chọn                     | Vì                                                              |
| ------------------------------------------- | ------------------------ | --------------------------------------------------------------- |
| Monorepo vs đa repo                         | **Monorepo workspaces**  | Chung CI, sửa xuyên tầng cùng PR (ADR-001)                      |
| PostgreSQL vs SQLite                        | **PostgreSQL**           | Cần enum, transaction, `FOR UPDATE`, unique composite (ADR-002) |
| JWT vs session                              | **JWT stateless**        | SPA gọi API cross-origin, scale ngang đơn giản (ADR-004)        |
| Lock bi quan vs lạc quan cho tồn kho        | **Optimistic (version)** | Đọc menu không bị chặn; retry ngắn (ADR-003)                    |
| Idempotency ở app hay DB                    | **Cả hai, DB là chốt**   | Unique + `updateMany` có điều kiện (ADR-003, ADR-005)           |
| Trả giá trị hay trả 409 khi đua idempotency | **Replay 200**           | Client tiếp tục thanh toán liền mạch (ADR-005)                  |

---

## 6. Truy vết

| Thành phần trong tài liệu           | Mã nguồn                                                                                      |
| ----------------------------------- | --------------------------------------------------------------------------------------------- |
| Bootstrap, CORS, Helmet, Validation | `backend/src/main.ts`                                                                         |
| Module graph                        | `backend/src/app.module.ts`                                                                   |
| Auth & phân quyền                   | `backend/src/auth/**`                                                                         |
| Đơn hàng & state machine            | `backend/src/orders/**`                                                                       |
| Khuyến mãi                          | `backend/src/promotions/**`                                                                   |
| Điểm thưởng                         | `backend/src/loyalty/**`, `backend/src/orders/loyalty-hooks.service.ts`                       |
| Tồn kho                             | `backend/src/stock/**`                                                                        |
| Schema & migration                  | `backend/prisma/schema.prisma`, `backend/prisma/migrations/**`                                |
| FE routing & guard                  | `frontend/src/middleware.ts`, `frontend/src/app/**`                                           |
| FE state                            | `frontend/src/store/**`                                                                       |
| FE API client                       | `frontend/src/lib/api.ts`                                                                     |
| Hạ tầng                             | `docker-compose.yml`, `backend/Dockerfile`, `frontend/Dockerfile`, `.github/workflows/ci.yml` |

---

## 7. Việc tiếp theo (ngoài phạm vi T3.1)

1. **T3.2:** `docs/diagrams/deployment.puml` + `.svg`, `docs/deployment.md` — chốt nền tảng trước 07/11.
2. **T5.3:** `cd.yml` (GHCR + deploy + smoke test + rollback).
3. **T5.4-b:** URL production + `README.md` + health 200.
4. Cập nhật `docs/traceability-matrix.md` (T-Trace của Task 1) trỏ tới tài liệu này.
