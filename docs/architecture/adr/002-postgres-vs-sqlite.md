# ADR 002: PostgreSQL + Prisma ORM thay vì SQLite / TypeORM

- **Mã định danh:** ADR-002
- **Trạng thái:** Accepted
- **Ngày quyết định:** 2026-11-05
- **Người đề xuất:** Hoàng Tịnh (DevOps / Architect)
- **Phạm vi ảnh hưởng:** Backend (`backend/prisma/`), hạ tầng (`docker-compose.yml`), CI

---

## 1. Bối cảnh (Context)

Nghiệp vụ BrewLite cần: giao dịch nhiều bảng (Order + OrderItem + OrderItemTopping), ràng buộc duy nhất phức hợp `(userId, idempotencyKey)`, khóa dòng `SELECT ... FOR UPDATE`, cập nhật có điều kiện `WHERE version = ? AND stock >= ?`, và migration có lịch sử theo thứ tự.

Các lựa chọn:

1. **SQLite** — nhẹ, không cần container, dễ cho người mới.
2. **PostgreSQL + Prisma** — RDBMS mạnh, có enum, transaction, khóa dòng, dịch vụ CI service container.
3. **PostgreSQL + TypeORM / Sequelize** — ORM truyền thống với entity + migration viết tay.

Ràng buộc:

- Đề bài Assignment 2 yêu cầu **PostgreSQL**.
- Toàn bộ backend hiện dùng `PrismaService` (`@Global()` module), schema tập trung ở `prisma/schema.prisma`, migration nằm ở `prisma/migrations/`.
- Docker Compose đã có service `postgres:16-alpine` với healthcheck `pg_isready`; CI có service container Postgres tương ứng.

---

## 2. Quyết định (Decision)

**Dùng PostgreSQL 16 + Prisma ORM.**

| Hạng mục     | Quyết định                                                                                                                         |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| RDBMS        | PostgreSQL 16 (`postgres:16-alpine`), volume `brewlite-postgres`                                                                   |
| ORM          | Prisma 6 (`@prisma/client`)                                                                                                        |
| Truy cập DB  | `PrismaService` là module `@Global()`, inject vào mọi service                                                                      |
| Schema       | Một file `backend/prisma/schema.prisma`, có enum (`Role`, `Size`, `OrderStatus`, `PaymentMethod`, `PaymentStatus`, `DiscountType`) |
| Migration    | `prisma migrate` với thư mục có timestamp; CI chạy `prisma migrate deploy`                                                         |
| Dữ liệu mẫu  | `backend/prisma/seed.ts`, chạy `tsx`, idempotent bằng `upsert`                                                                     |
| SQL thủ công | Chỉ dùng `$queryRaw` cho khóa dòng (`FOR UPDATE`) — ví dụ `OrderStatusService.transition`                                          |

**Vì sao không SQLite:** thiếu enum, `FOR UPDATE` không có, transaction hẹn giờ kém, và CI/prod phải khác nhau → tăng lỗi môi trường.

**Vì sao không TypeORM/Sequelize:** Prisma cho type an toàn hơn (client sinh từ schema), migration diff tự động, và đã có sẵn trong repo. Một số truy vấn nâng cao (khóa dòng, cập nhật có điều kiện OCC) vẫn viết raw SQL — Prisma hỗ trợ qua `$queryRaw`/`$executeRaw`.

---

## 3. Hệ quả (Consequences)

### 3.1. Điểm tích cực (Pros)

- **An toàn kiểu dữ liệu:** client sinh từ schema → TypeScript bắt lỗi tên cột/kiểu khi build; không có "magic string".
- **Transaction rõ ràng:** `prisma.$transaction(async (tx) => ...)` dùng chung ở Orders/Loyalty/Promotions — side-effect rollback cùng nhau.
- **Ràng buộc dữ liệu mạnh:** `@@unique([userId, idempotencyKey])` chính là cơ chế chống tạo trùng đơn ở tầng DB (ADR-003).
- **Migration có lịch sử:** `_prisma_migrations` giúp biết DB đang ở phiên bản nào; `migrate diff` phát hiện lệch schema khi review PR.
- **Cùng một Postgres ở mọi nơi:** local (Docker), CI (service container), prod (managed Postgres) — ít "chạy được máy tôi".

### 3.2. Đánh đổi (Cons & Mitigations)

| Đánh đổi                                                | Giảm thiểu                                                                                            |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Cần container/DB server khi dev                         | `npm run dev:db` kéo `postgres` + `adminer`; `.env.example` có sẵn `DATABASE_URL`                     |
| Prisma giới hạn một số truy vấn phức tạp                | Dùng `$queryRaw` cho khóa dòng; giữ phần raw thật nhỏ và có test                                      |
| Migration lệch checksum khi sửa tay file SQL đã áp dụng | Không sửa migration đã apply; lỗi P3006 → `migrate reset` trên DB dev; migration mới cho thay đổi mới |
| Dịch vụ Postgres trong CI chậm khởi động                | Healthcheck `pg_isready` với retries như trong `ci.yml`                                               |
| Chi phí lưu trữ production                              | Dùng gói free tier của platform (Render/Railway/Neon) hoặc volume nhỏ; dọn dữ liệu test               |

### 3.3. Việc cần làm khi thay đổi schema

1. Sửa `schema.prisma`.
2. `npx prisma migrate dev --name <mô-tả>` → sinh file migration.
3. `npx prisma generate`.
4. Cập nhật `seed.ts` nếu cần dữ liệu mẫu.
5. Chạy `npm test` (backend) — sẽ bắt lỗi kiểu ở service.

---

## 4. Tham chiếu

- `backend/prisma/schema.prisma`, `backend/prisma/migrations/`, `backend/prisma/seed.ts`
- `backend/src/prisma/prisma.service.ts` / `prisma.module.ts`
- `docker-compose.yml` — service `postgres` + `adminer`
- `.github/workflows/ci.yml` — service container `postgres:16-alpine`
- ADR-001 (monorepo), ADR-003 (state machine & idempotency), ADR-004 (JWT)
