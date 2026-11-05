# Architecture Decision Records — BrewLite

Chỉ mục các quyết định kiến trúc. Mỗi quyết định nằm trong một file riêng, theo định dạng **Context → Decision → Consequences** (Assignment 2 — T3.1-b).

| Mã                                                | Quyết định                                                                        | Trạng thái | Ngày       | Người đề xuất  | Phạm vi                                                |
| ------------------------------------------------- | --------------------------------------------------------------------------------- | ---------- | ---------- | -------------- | ------------------------------------------------------ |
| [ADR-001](./001-monorepo.md)                      | Monorepo npm workspaces (`frontend/` + `backend/`)                                | Accepted   | 2026-11-05 | Hoàng Tịnh     | Toàn repo, CI                                          |
| [ADR-002](./002-postgres-vs-sqlite.md)            | PostgreSQL 16 + Prisma thay vì SQLite/TypeORM                                     | Accepted   | 2026-11-05 | Hoàng Tịnh     | Backend, DB, CI                                        |
| [ADR-003](./003-state-machine-and-idempotency.md) | State machine đơn hàng tập trung + idempotency thanh toán + khóa lạc quan tồn kho | Accepted   | 2026-10-31 | M2 (Tech Lead) | `orders`, `payments`, `stock`, `promotions`, `loyalty` |
| [ADR-004](./004-jwt-stateless.md)                 | Xác thực JWT stateless (HS256) + phân quyền theo `role`                           | Accepted   | 2026-11-05 | Hoàng Tịnh     | `auth`, FE auth store/middleware                       |
| [ADR-005](./005-orders-idempotency.md)            | Idempotency cho `POST /orders`: unique `(userId, idempotencyKey)` + replay 200    | Accepted   | 2026-11-05 | Hoàng Tịnh     | `orders`, `promotions`, schema                         |

## Ghi chú về đánh số

Assignment 2 gợi ý `001-monorepo`, `002-postgres-vs-sqlite`, `003-jwt-stateless`, `004-idempotency`. Thực tế:

- **ADR-003** đã được M2 dùng trước cho _State Machine & Idempotency thanh toán_ (Sprint 3), và được tham chiếu trong `docs/release-notes.md` → **giữ nguyên số** để không phá tham chiếu.
- **ADR-004** vì vậy mang nội dung _JWT stateless_.
- **ADR-005** tách riêng _idempotency cho `POST /orders`_ (cơ chế khác hẳn ADR-003: unique composite + replay 200 thay vì khóa chính `Payment` + `requestHash`).

## Liên kết

- `docs/architecture/overview.md` — tài liệu kiến trúc chính (T3.1)
- `docs/architecture.md` — bản mô tả kiến trúc chi tiết v3.0 của M2 (Sprint 3)
- `docs/deployment.md` — triển khai (T3.2)
