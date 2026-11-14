# BrewLite — Traceability Matrix (T-Trace)

> **Owner:** Thanh Tùng (M1) · **Ngày lập:** 2026-11-07 · **Phiên bản:** v1 (sẽ cập nhật hằng ngày đến 14/11).
> **Mục tiêu:** liên kết yêu cầu ↔ use-case/story ↔ sơ đồ ↔ code/API ↔ test theo yêu cầu `Assignment2-BrewLite.pdf` mục 8.
> **Cách dùng:** đọc dọc theo hàng để kiểm chứng 1 FR/NFR có đủ artifact; đọc dọc cột **Test** để sinh checklist PR review.

---

## 1. Ký hiệu

- **FR-xx / NFR-xx:** mã yêu cầu trong `docs/requirements/srs.md`.
- **UC-xx:** mã use-case trong `docs/diagrams/use-case-overview.puml`.
- **Diagram:** `A1..A3` activity (`docs/diagrams/activity-e2e.*`), `S1` sequence (`docs/diagrams/sequence-checkout.*` — do Kiện Minh làm T2.2), `C1` class, `U1` use-case tổng quát (`docs/diagrams/use-case-overview.*`), `U6` zoom UC-06 (`docs/diagrams/uc-checkout.*`).
- **Code/API:** đường dẫn file:line thực tế trong repo (hoặc path HTTP endpoint).
- **Test:** tên file spec trong `backend/test/**/*.spec.ts` hoặc `frontend/src/**/*.spec.*`.

---

## 2. Ma trận FR

| FR    | Use-case / User story     | Diagram    | Code / API                                                                                                 | Test                                                                                     |
| ----- | ------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| FR-01 | UC-01 Xem menu            | A1, U1     | `GET /products` · `products.controller.ts:22-31`                                                           | `products-filter.e2e-spec.ts`, `products.service.spec.ts`                                |
| FR-02 | UC-02 Lọc / Tìm           | A1, U1     | `GET /products?category=…&q=…` · `products-filter.util.ts`                                                 | `products-filter.spec.ts`, `products-filter.e2e-spec.ts`                                 |
| FR-03 | UC-03 Chi tiết sản phẩm   | A1, U1     | `GET /products/:id` · `products.controller.ts:33-40`                                                       | `products.service.spec.ts`, `products.e2e-spec.ts`                                       |
| FR-04 | UC-01/02                  | U1         | `GET /categories`, `GET /toppings` · `categories.controller.ts`, `toppings.controller.ts`                  | `categories.e2e-spec.ts`, `toppings.e2e-spec.ts` (nếu có), `products-filter.e2e-spec.ts` |
| FR-05 | UC-04 Giỏ hàng            | A1, U1     | `frontend/src/store/cart.ts` (`zustand + persist`)                                                         | `cart.store.spec.ts` (nếu có), smoke test thủ công reload tab                            |
| FR-06 | UC-04                     | A1         | `useCart.add()` logic key hợp nhất `(productId, size, toppingIds[])`                                       | `cart.store.spec.ts`                                                                     |
| FR-07 | UC-04                     | A1         | `frontend/src/lib/pricing.ts` + backend `PricingService.calcUnitPrice()`                                   | `pricing.service.spec.ts`, `cart.store.spec.ts`                                          |
| FR-08 | UC-04, UC-06              | A1, U6     | `ProductCard.tsx` nhãn "Hết hàng", `checkout/page.tsx:22` `mapOrderError`                                  | Verify thủ công + `stock-concurrent.e2e-spec.ts` (xác nhận 409 OUT_OF_STOCK)             |
| FR-09 | UC-07 Đăng ký             | A2, U1     | `POST /auth/register` · `auth.service.ts:register()`                                                       | `auth.e2e-spec.ts`, `auth.service.spec.ts`, `auth/auth.service.spec.ts`                  |
| FR-10 | UC-08 Đăng nhập           | A2, U1     | `POST /auth/login` · `auth.service.ts:login()`                                                             | `auth.e2e-spec.ts`, `auth/auth.e2e-spec.ts`                                              |
| FR-11 | UC-09 Profile             | U1         | `GET /auth/me` · `auth.controller.ts:99-108`                                                               | `auth.e2e-spec.ts`                                                                       |
| FR-12 | UC-08                     | U1         | `@Throttle({…ttl:60000,limit:5})` trong `auth.controller.ts`                                               | `security.e2e-spec.ts`, smoke script 6 req/60s                                           |
| FR-13 | **UC-06 Đặt đơn**         | A3, S1, U6 | `POST /orders` · `orders.controller.ts:182-223`, `create-order.dto.ts:22-23`                               | `orders.e2e-spec.ts`, `orders.service.spec.ts`                                           |
| FR-14 | UC-06                     | S1, U6     | `orders.service.ts:create()` → `priceItems()` dùng DB                                                      | `orders.service.spec.ts` "bỏ qua giá giả do client gửi"                                  |
| FR-15 | UC-06                     | S1, U6     | `orders.service.ts:create()` + `stock.service.ts:reserve()`                                                | `stock-concurrent.e2e-spec.ts` (test c: 20 req đồng thời)                                |
| FR-16 | UC-06                     | S1, U6     | `orders.service.ts` idempotency fast-path + `@@unique([userId, idempotencyKey])`                           | `orders-idempotency.spec.ts` (test b)                                                    |
| FR-17 | UC-05, UC-06              | A3, U6     | `promotions.service.ts:evaluate()` + `computeDiscount()`                                                   | `promotions.service.spec.ts` (16 ca)                                                     |
| FR-18 | UC-06                     | S1, U6     | `POST /payments` · `payments.controller.ts:56-78`                                                          | `payments.e2e-spec.ts`                                                                   |
| FR-19 | UC-06                     | S1, U6     | `VnpayService` + `PaymentsController (/payments/vnpay/*)` & `mock-payment.gateway.ts` (fallback test)      | `vnpay.service.spec.ts`, `mock-payment.gateway.spec.ts`, `payments.e2e-spec.ts`          |
| FR-20 | UC-06                     | S1, U6     | `loyalty.service.ts:award()`, hook `loyalty-hooks.service.ts`                                              | `loyalty.service.spec.ts`, `loyalty.db.spec.ts` (DB thật)                                |
| FR-21 | UC-10 Lịch sử đơn         | U1         | `GET /orders/me` · `orders.controller.ts:62-80`                                                            | `orders-history.e2e-spec.ts`                                                             |
| FR-22 | UC-10, UC-11              | U1, U6     | `GET /orders/:id` · `orders.controller.ts:103-115` + `orders.service.ts:findById()`                        | `orders-history.e2e-spec.ts`                                                             |
| FR-23 | UC-11 Theo dõi trạng thái | A3, U6     | `frontend/src/app/orders/[id]/page.tsx:70-76` polling 5 s, banner READY 194-201                            | Verify thủ công demo + Playwright (kế hoạch 5.2-d)                                       |
| FR-24 | UC-12 Hủy đơn (Customer)  | A3, U1     | `POST /orders/:id/cancel` · `orders.controller.ts:147-172`                                                 | `orders.service.spec.ts` (nhánh cancel), `orders.e2e-spec.ts`                            |
| FR-25 | UC-14, UC-15              | A3, S1     | `order-state-machine.ts:14-27`, `order-status.service.ts:transition()`                                     | `order-state-machine.spec.ts` (49 cặp), `order-status.service.spec.ts`                   |
| FR-26 | UC-14                     | U1         | `PATCH /orders/:id/status` · `orders.controller.ts:123-139`, `roles.guard.ts`                              | `security.e2e-spec.ts` (403 cho customer), `orders.e2e-spec.ts`                          |
| FR-27 | UC-13 Hàng đợi quầy       | U1         | `GET /orders/queue` · `orders.controller.ts:87-97`, `orders.service.ts:getQueue()`, `app/barista/page.tsx` | `security.e2e-spec.ts` (403 cho customer) + verify thủ công demo                         |
| FR-28 | UC-15, hook CANCELLED     | S1, A3     | `loyalty-hooks.service.ts`, `stock-hooks.service.ts`, `order-status.service.ts:22-34`                      | `loyalty-hooks.service.spec.ts`, `loyalty.db.spec.ts` "PAID → CANCELLED thu hồi điểm"    |

---

## 3. Ma trận NFR

| NFR    | Use-case liên quan            | Diagram | Code / cấu hình                                                                    | Test / cách kiểm chứng                                                             |
| ------ | ----------------------------- | ------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| NFR-01 | UC-01, UC-02                  | —       | `backend/src/main.ts` + Prisma query                                               | `scripts/perf/products.js` (autocannon p95 < 500 ms)                               |
| NFR-02 | UC-06                         | S1      | `orders.service.ts` tối ưu transaction                                             | `scripts/perf/orders.js`                                                           |
| NFR-03 | UC-01 (FE)                    | —       | `frontend/src/app/menu/*` + manifest PWA                                           | Lighthouse mobile (Performance ≥70, PWA ≥80) — manual                              |
| NFR-04 | UC-11, UC-13                  | A3      | `app/orders/[id]/page.tsx:70-76`, `app/barista/page.tsx:74`                        | Smoke test thủ công polling                                                        |
| NFR-05 | UC-08, UC-09                  | U1      | `auth.service.ts:login()` + `jwt.strategy.ts` + `@nestjs/jwt expiresIn:3600`       | `auth.e2e-spec.ts` decode token                                                    |
| NFR-06 | UC-07, UC-08, UC-09           | U1      | `auth.service.ts` select whitelist bỏ `passwordHash`                               | `security.e2e-spec.ts`, `auth.e2e-spec.ts` assert response không có `passwordHash` |
| NFR-07 | UC-08, UC-06                  | —       | `@Throttle` trong auth.controller + `ThrottlerModule` toàn cục ở `app.module.ts`   | `security.e2e-spec.ts` test 429                                                    |
| NFR-08 | tất cả endpoint               | —       | `main.ts:12-49` helmet + CORS whitelist                                            | `security.e2e-spec.ts`, curl OPTIONS preflight                                     |
| NFR-09 | tất cả endpoint               | —       | `http-exception.filter.ts:99-109` production masking                               | `security.e2e-spec.ts`                                                             |
| NFR-10 | UC-08                         | —       | `auth.service.ts:validateUser()` dummy bcrypt compare                              | `auth.service.spec.ts`                                                             |
| NFR-11 | UC-01 → UC-06 (FE)            | —       | Tailwind mobile-first + responsive classes                                         | Verify thủ công DevTools + Playwright viewport 375×667                             |
| NFR-12 | tất cả API                    | —       | `request-logging.middleware.ts`, `http-exception.filter.ts:27`                     | `request-logging.e2e-spec.ts`                                                      |
| NFR-13 | UC-07, UC-08                  | —       | `app/login/page.tsx`, `app/register/page.tsx` (aria-invalid, role=alert)           | `docs/a11y-auth.md` + Lighthouse A11y                                              |
| NFR-14 | —                             | —       | **Won't** — không có i18n ở MVP                                                    | n/a                                                                                |
| NFR-15 | UC-11, UC-13 (healthcheck CD) | —       | `GET /health` · `app.controller.ts:21-60`                                          | `app.e2e-spec.ts`, Docker healthcheck trong `docker-compose.dev.yml`               |
| NFR-16 | —                             | —       | `docker-compose.dev.yml`, `backend/docker-entrypoint.sh`, `README.md` "Chạy local" | Smoke clone sạch → `npm run dev:db` → 3 container healthy                          |
| NFR-17 | UC-13, UC-06                  | —       | `frontend/package.json` `dev:barista`, `backend/.env` CORS                         | Manual: login customer `:3000` + barista `:3002` song song                         |

---

## 4. Ma trận Use-case ngược (UC → FR/NFR)

| UC    | Tên                            | FR liên quan                           | NFR liên quan                          |
| ----- | ------------------------------ | -------------------------------------- | -------------------------------------- |
| UC-01 | Xem menu                       | FR-01, FR-04                           | NFR-01, NFR-03, NFR-11                 |
| UC-02 | Lọc / Tìm                      | FR-02                                  | NFR-01                                 |
| UC-03 | Chi tiết sản phẩm              | FR-03                                  | NFR-11                                 |
| UC-04 | Quản lý giỏ hàng               | FR-05, FR-06, FR-07, FR-08             | NFR-11                                 |
| UC-05 | Áp mã giảm giá                 | FR-17                                  | —                                      |
| UC-06 | **Đặt và thanh toán đơn hàng** | FR-13..FR-20 + FR-25 (transition PAID) | NFR-02, NFR-04, NFR-07, NFR-09, NFR-12 |
| UC-07 | Đăng ký                        | FR-09                                  | NFR-06, NFR-10, NFR-13                 |
| UC-08 | Đăng nhập                      | FR-10, FR-12                           | NFR-05, NFR-07, NFR-10, NFR-13         |
| UC-09 | Profile /auth/me               | FR-11                                  | NFR-05, NFR-06                         |
| UC-10 | Lịch sử đơn                    | FR-21, FR-22                           | NFR-11                                 |
| UC-11 | Theo dõi trạng thái            | FR-22, FR-23, FR-25                    | NFR-04, NFR-11                         |
| UC-12 | Hủy đơn (PENDING)              | FR-24, FR-25, FR-28                    | —                                      |
| UC-13 | Hàng đợi quầy                  | FR-27                                  | NFR-04, NFR-17                         |
| UC-14 | Chuyển trạng thái đơn          | FR-25, FR-26                           | NFR-07                                 |
| UC-15 | Hủy đơn (PAID+)                | FR-25, FR-28                           | —                                      |
| UC-16 | Xem / sửa dữ liệu (Adminer)    | — (ngoài UI)                           | NFR-15                                 |

---

## 5. Danh sách test → yêu cầu (ngược)

| Test spec                       | FR / NFR phủ                                 | Loại                   |
| ------------------------------- | -------------------------------------------- | ---------------------- |
| `app.controller.spec.ts`        | NFR-15                                       | Unit                   |
| `app.e2e-spec.ts`               | NFR-12, NFR-15                               | E2E                    |
| `auth.e2e-spec.ts`              | FR-09, FR-10, FR-11, NFR-05, NFR-06          | E2E                    |
| `auth/auth.e2e-spec.ts`         | FR-09, FR-10, FR-11                          | E2E                    |
| `auth.service.spec.ts`          | FR-09, FR-10, NFR-10                         | Unit                   |
| `auth/auth.service.spec.ts`     | FR-09, FR-10, NFR-10                         | Unit                   |
| `orders.service.spec.ts`        | FR-13, FR-14, FR-16, FR-17, FR-24            | Unit                   |
| `orders-idempotency.spec.ts`    | FR-16                                        | Unit                   |
| `orders.e2e-spec.ts`            | FR-13, FR-17, FR-24, FR-26                   | E2E                    |
| `orders-history.e2e-spec.ts`    | FR-21, FR-22                                 | E2E                    |
| `loyalty-hooks.service.spec.ts` | FR-20, FR-28                                 | Unit                   |
| `loyalty.service.spec.ts`       | FR-20                                        | Unit                   |
| `loyalty.db.spec.ts`            | FR-20, FR-28                                 | Integration (DB thật)  |
| `promotions.service.spec.ts`    | FR-17                                        | Unit                   |
| `pricing.service.spec.ts`       | FR-07, FR-14                                 | Unit                   |
| `products.service.spec.ts`      | FR-01, FR-03                                 | Unit                   |
| `products-filter.spec.ts`       | FR-02                                        | Unit                   |
| `products-filter.e2e-spec.ts`   | FR-01, FR-02, FR-04                          | E2E                    |
| `products.e2e-spec.ts`          | FR-01, FR-03                                 | E2E                    |
| `payments.e2e-spec.ts`          | FR-18, FR-19                                 | E2E                    |
| `mock-payment.gateway.spec.ts`  | FR-19                                        | Unit                   |
| `stock-concurrent.e2e-spec.ts`  | FR-15                                        | E2E / stress (DB thật) |
| `request-logging.e2e-spec.ts`   | NFR-12                                       | E2E                    |
| `security.e2e-spec.ts`          | FR-26, FR-27, NFR-06, NFR-07, NFR-08, NFR-09 | E2E                    |
| `swagger.e2e-spec.ts`           | — (kiểm chứng Swagger 200)                   | E2E                    |
| `order-state-machine.spec.ts`   | FR-25                                        | Unit                   |
| `order-status.service.spec.ts`  | FR-25, FR-28                                 | Unit                   |

**Tổng:** 303 test backend (27 suite) xanh tại commit `a195818` (xem `README.md` phần Thay đổi gần đây).

---

## 6. Gap analysis (yêu cầu chưa đủ test)

| Yêu cầu             | Hiện trạng                                               | Hành động                                                     | Hạn   |
| ------------------- | -------------------------------------------------------- | ------------------------------------------------------------- | ----- |
| FR-05/06/07 (FE)    | Store `useCart` chưa có spec riêng — chỉ verify thủ công | Viết `cart.store.spec.ts` (Vitest) — persistence + merge key  | 12/11 |
| FR-23 (FE polling)  | Chưa có Playwright test                                  | T5.2-d (Hải Lý): Playwright luồng Menu→Checkout→PAID→polling  | 12/11 |
| NFR-03 (Lighthouse) | Chưa có gate CI                                          | (tùy chọn) Chạy Lighthouse manual + attach report cho release | 13/11 |
| NFR-11 (mobile)     | Chưa có Playwright viewport                              | T5.2-d bổ sung viewport 375×667                               | 12/11 |
| NFR-13 (A11y auth)  | `docs/a11y-auth.md` mô tả, chưa có axe-core CI           | (optional) chạy axe thủ công                                  | 13/11 |

---

## 7. Changelog

- **v1 — 2026-11-07:** Phiên bản khởi tạo cho nhánh `feat/T1.1-T5.4a`. Bao phủ 28 FR + 17 NFR + 16 UC + 27 test file. Có gap analysis.
- (Dự kiến **v1.1 — 10/11**) Cập nhật thêm test mới sau khi Hải Lý đưa Playwright E2E.
- (Dự kiến **v2 final — 14/11**) Khóa trước nộp bài, đối chiếu với URL production.

---

## 8. Phụ lục — Liên kết file

- SRS chi tiết: `docs/requirements/srs.md`
- Context & scope: `docs/requirements/context-and-scope.md`
- UC trọng tâm: `docs/requirements/uc-checkout.md`
- Diagram tổng quát: `docs/diagrams/use-case-overview.puml` / `.svg`
- Diagram UC-06: `docs/diagrams/uc-checkout.puml` / `.svg`
- Diagram Activity E2E: `docs/diagrams/activity-e2e.puml` / `.svg` (T2.1 Kiện Minh)
- Perf baseline: `docs/perf-report.md`
- Backlog & priority: `docs/BrewLite-ProductBacklog.md`, `docs/BrewLite-Sprint3.md`
- Phân công & deadline: `docs/Assignment2-TaskAssignment.md`
