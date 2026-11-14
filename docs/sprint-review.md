# BrewLite — Sprint Review Sprint 3 (T5.4-a)

> **Owner:** Thanh Tùng (M1 — PO/SM/Dev) · **Ngày lập:** 2026-11-07
> **Phiên bản:** 1.0 — review Sprint 3 kết thúc. Có **Phụ lục A** chỗ cập nhật Assignment 2 wrap-up ngày 14/11.

---

## 1. Thông tin Sprint

| Mục                         | Giá trị                                                                                                                                           |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Sprint**                  | Sprint 3                                                                                                                                          |
| **Thời gian kế hoạch**      | 02-03/11/2026 (2 ngày toàn thời gian, ~58 giờ cho 37 SP)                                                                                          |
| **Thời gian thực tế**       | 02-05/11/2026 (chốt commit `e85f59a` ngày 05/11 sau khi fix bug hook composer)                                                                    |
| **Sprint Goal**             | "Khách thanh toán được đơn bằng Ví/Thẻ, thấy xác nhận và lịch sử đơn; backend đúng nghiệp vụ Task 10; `docker compose up` chạy toàn bộ sản phẩm." |
| **Scrum Master**            | Thanh Tùng (M1)                                                                                                                                   |
| **Product Owner**           | Thanh Tùng (M1)                                                                                                                                   |
| **Nhóm phát triển**         | Kiện Minh (M2), Hải Lý (M3), Hoàng Tịnh (M4), Trung Hiếu (M5)                                                                                     |
| **Khách nghiệm thu nội bộ** | Giảng viên môn Công nghệ Phần mềm (nghiệm thu chính thức ngày 14/11)                                                                              |

---

## 2. Đạt / Chưa đạt Sprint Goal

### 2.1 Đạt ✅

| Hạng mục                                                                         | Bằng chứng                                                                               |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Khách đi trọn luồng: menu → cart → checkout → PAID → `/orders/[id]` polling 5 s  | Chạy local demo; verify thủ công; commit `42e7b85` trở về trước đã có đủ UI khách.       |
| State Machine đơn hàng + idempotency + tồn kho đồng thời (Task 10)               | 303/303 test pass (`stock-concurrent.e2e-spec.ts` 20-request stress test).               |
| `GET /orders/me` lịch sử đơn, `GET /orders/:id` chi tiết, phân trang             | `orders.controller.ts:62-115`, `orders-history.e2e-spec.ts`.                             |
| `docker-compose.dev.yml` lên đủ Postgres + Adminer + healthcheck                 | `npm run dev:db` chạy 1 lệnh; container healthy trong < 30 s (xác nhận ở session 07/11). |
| API quầy: `PATCH /orders/:id/status` + `RolesGuard` + seed `barista@brewlite.vn` | `orders.controller.ts:123-139`, `roles.guard.ts`, `backend/prisma/seed.ts:125-137`.      |

### 2.2 Chưa đạt (chuyển stretch / Assignment 2 wrap-up)

| Hạng mục                                           | Trạng thái                                              | Nơi ghi nhận                                         |
| -------------------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------- |
| UI quầy `/barista` (stretch 1, PB-32a)             | ✅ **Đã làm bù** sau Sprint 3 (commit `42e7b85`, 07/11) | README mục "Giao diện quầy pha chế & tài khoản test" |
| Ô nhập mã giảm giá UI (PB-27)                      | ❌ Chưa làm — API `/promotions/validate` có; UI thiếu   | Chuyển backlog Sau MVP                               |
| E2E Playwright luồng end-to-end (PB-28 / T5.2-d)   | ⚠️ Lên kế hoạch 12/11                                   | `docs/Assignment2-TaskAssignment.md` Hải Lý          |
| Deployment production + CD pipeline (T5.3, T5.4-b) | ⚠️ Chuẩn bị staging 12/11, promote prod 13/11           | `docs/Assignment2-TaskAssignment.md` Hoàng Tịnh      |
| `docs/deployment.md` (sub-task 31.2)               | ❌ Chưa làm — chỉ `release-notes.md` có                 | Flag ở session 07/11, chờ M5                         |

---

## 3. Tạo phẩm đã bàn giao trong Sprint 3

### 3.1 Code

Commit tiêu biểu (xem `git log --oneline origin/main`):

| Commit    | Nội dung                                                                                           |
| --------- | -------------------------------------------------------------------------------------------------- |
| `9170aa0` | feat: complete Trung Hieu backend tasks T4.3-T5.2 (base cho Sprint 3)                              |
| `ae47d4e` | T3.2, T4.1, CD pipeline with GHCR and smoke test                                                   |
| `3404ec5` | docs(diagrams): complete task 2 and task 5 documentation and design diagrams                       |
| `b4c4fbd` | Merge PR: Feature/9.1-9.2-10.1-9.5-9.4_Sprint3 (orders/me, orders/:id, PATCH status)               |
| `2a706d8` | fix(backend/orders): resolve irregular whitespace lint error and restore UTF-8 Vietnamese comments |
| `d24fd82` | fix(test): đồng bộ unit/e2e specs với thay đổi Sprint3 M5                                          |
| `e85f59a` | fix: compose hooks + thêm inStock vào payload add-to-cart (ROOT CAUSE loyalty.db PAID→CANCELLED)   |
| `9225c0d` | fix(orders): khôi phục MAX_QTY = 20 (test CI orders.e2e > qty = 21)                                |
| `42e7b85` | feat(barista): giao diện quầy /barista + endpoint GET /orders/queue                                |
| `70461ed` | feat(dev): dev:barista chạy FE riêng port 3002 cho quầy                                            |
| `a195818` | docs(readme): cập nhật UI quầy, dev:barista, tài khoản test, endpoint                              |

### 3.2 Test

- **303 backend tests xanh** (27 suite), bao gồm:
  - `stock-concurrent.e2e-spec.ts` — 20 req đồng thời (test c, AT-32)
  - `orders-idempotency.spec.ts` — 2 request cùng key → 1 đơn (test b, AT-31)
  - `order-state-machine.spec.ts` — 49 cặp chuyển trạng thái (test a, AT-29)
  - `loyalty.db.spec.ts` — integration DB thật, verify revoke khi CANCELLED
- **59 frontend tests xanh** (5 integration skip vì cần `API_E2E_URL`)
- CI pipeline `.github/workflows/ci.yml` chạy install + lint + test + build.

### 3.3 Tài liệu

| File                                          | Người làm          | Trạng thái                |
| --------------------------------------------- | ------------------ | ------------------------- |
| `docs/architecture.md` (v3 + ADR-003)         | Kiện Minh (M2)     | ✅                        |
| `docs/release-notes.md` v1.0.0                | Hoàng Tịnh (M4)    | ✅                        |
| `docs/api-contract.md` v3                     | ngườitừng viết API | ✅ rolling update         |
| `docs/demo-script.md`                         | Hoàng Tịnh (M4)    | ✅                        |
| `docs/diagrams/activity-e2e.*`                | Kiện Minh (M2)     | ✅                        |
| `docs/BrewLite-Sprint3.md` checklist cập nhật | Thanh Tùng (M1)    | ✅ (ticked session 05/11) |

---

## 4. Demo trong Sprint Review

**Thời điểm demo:** trong buổi Sprint Review nội bộ ngày 05/11 (sau khi fix `e85f59a`).

**Kịch bản đã chạy:**

1. **Luồng khách (`:3000`):**
   - Vào `/menu` → thấy 5 sản phẩm seed với ảnh SVG.
   - Chọn Cappuccino L + topping Trân châu + Kem cheese (2 ly) + Trà đào M (1 ly).
   - Vào giỏ hàng → tổng 178 000đ.
   - Đăng ký tài khoản mới hoặc login `customer@brewlite.vn` / `Password123`.
   - Checkout: bấm thanh toán qua **VNPay**, không dùng mã giảm giá.
   - Nhận 201 PENDING → 200 PAID trong < 2 s.
   - Tự chuyển `/orders/{id}` → badge "Đã thanh toán - Mời tới quầy lấy nước".

2. **Luồng quầy (Swagger thay vì `/barista` lúc demo 05/11):**
   - Mở `http://localhost:3001/api-docs`, Authorize với JWT barista.
   - Gọi `PATCH /orders/{id}/status` body `{"status":"PREPARING"}` → 200.
   - Quay lại tab khách sau ≤5 s → badge chuyển "Đang pha chế".
   - Tiếp tục `{"status":"READY"}` → badge "Sẵn sàng" + banner "Đồ uống đã sẵn sàng!".
   - Cuối cùng `{"status":"COMPLETED"}` → đơn khóa terminal.

3. **Verify loyalty:**
   - Trước checkout `User.loyaltyPoints = 0`.
   - Sau PAID: `pointsEarned = floor(160200/10000) = 16` (nếu áp promo `BREW10`) hoặc `floor(178000/10000) = 17` (không promo).
   - Gọi `GET /auth/me` → thấy điểm mới.

4. **Verify stock concurrent:** chạy thủ công script benchmark `scripts/perf/orders.js` với `PERF_CONNECTIONS=20` — thấy p95 < 100 ms, không có response 500.

**Phản hồi stakeholder (nội bộ):**

- M2 (Kiện Minh): "State machine đã cover đủ 49 cặp, ADR-003 giải thích tại sao chọn `OrderStatusService` làm nơi DUY NHẤT cập nhật `Order.status`."
- M3 (Hải Lý): "FE polling 5 s hoạt động mượt, nhưng cần test Playwright để chắc Chrome mobile viewport không bị overflow."
- M4 (Hoàng Tịnh): "Demo lúc staging/prod cần chạy từ URL HTTPS, đang chuẩn bị 12/11."
- M5 (Trung Hiếu): "docker-compose.dev.yml khởi động OK trong < 30 s; vẫn cần `docs/deployment.md`."

---

## 5. Burndown & velocity

- **Cam kết 37 SP** (Must + commit).
- **Hoàn thành 34 SP** (Must).
- **3 SP stretch** (`/barista` UI) làm bù sau Sprint (commit `42e7b85`, 07/11) — không tính vào velocity Sprint 3.
- **Velocity = 34 SP / 2 ngày = 17 SP/ngày** ở cường độ intensive (cao hơn Sprint 2 ~11 SP/ngày do nhóm đã quen workflow + có ADR làm sẵn).

---

## 6. Sự cố & cách xử lý trong Sprint

| Sự cố                                                                                                      | Thời điểm | Cách xử lý                                                                                                                                                              |
| ---------------------------------------------------------------------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CI fail `loyalty.db.spec.ts > PAID → CANCELLED` nhận 16 điểm thay vì 0.                                    | 05/11     | Root cause: `OrderStatusService.registerHooks` spread-merge khiến `StockHooks.onCancelled` ghi đè `LoyaltyHooks.onCancelled`. Fix bằng mảng handler (commit `e85f59a`). |
| CI fail `orders.e2e-spec.ts > qty = 21` expect 400 nhận 201.                                               | 07/11     | Root cause: commit `9cb4930` đổi `MAX_QTY` 20 → 999 không đồng bộ test. Khôi phục 20 (commit `9225c0d`).                                                                |
| `.next` thuộc `root:root` do Docker build cũ, dev mở `npm run dev` bị EACCES.                              | 07/11     | Dùng container Alpine mount volume để `rm -rf .next` bằng quyền root trong container (session fix).                                                                     |
| Port 5432 conflict với container `onecli-postgres-1` của dự án khác → `dev:db` fail.                       | 07/11     | Sửa `dev:db` script dùng `docker-compose.dev.yml` → map `5433:5432` (commit `e8d9244`).                                                                                 |
| Barista UI redirect `/login?next=…` không honor returnUrl (middleware chặn + login mặc định về /checkout). | 07/11     | Sửa `/barista` dùng `?returnUrl=`; đổi fallback `/login` thành `/menu`; gỡ middleware auth-path redirect. (3 commits `31a28ab`, `9fabc4e`, `f31d9fb`).                  |

---

## 7. Metric đo được

| Metric                                 | Giá trị                                                                                        |
| -------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Tổng commit trên `main` trong Sprint 3 | ~20 (từ `3404ec5` đến `a195818`)                                                               |
| Pull request được merge                | 5+ (Feature/9.1-9.2-10.1-9.5-9.4_Sprint3, Feature/Stockservice-10.3-10.3d, docs/31.3-pb-10, …) |
| Test backend tăng mới                  | +45 test (từ 258 lên 303)                                                                      |
| Suite backend                          | 25 → 27                                                                                        |
| Benchmark p95 GET /products            | 7.2 ms (10 conn), 62.4 ms (50 conn) — không đổi, giữ mức Sprint 2                              |
| Benchmark p95 POST /orders             | 16.0 ms (10 conn), 71.9 ms (50 conn)                                                           |
| Thời gian khởi động dev stack đầy đủ   | < 30 s (postgres + adminer + backend + 2 FE instance)                                          |

---

## 8. Quyết định được chốt trong Review

| Quyết định                                                                                            | Hiệu lực |
| ----------------------------------------------------------------------------------------------------- | -------- |
| UI quầy `/barista` làm bù sau Sprint 3 (coi là stretch đã hoàn thành).                                | 05-07/11 |
| Admin KHÔNG có UI riêng — xác nhận lại theo Sprint 3 mục 3.2.                                         | Chốt     |
| Assignment 2 wrap-up tập trung vào: deployment production (Hoàng Tịnh), docs còn thiếu (M5 làm 31.2). | 08-14/11 |
| Nhóm đồng ý dùng `node-plantuml` để render SVG từ `.puml` (CI chưa có gate nhưng docs có `.svg` sẵn). | Chốt     |

---

## Phụ lục A — Assignment 2 wrap-up (cập nhật 14/11)

> **Trạng thái tại 07/11:** chờ cập nhật. Các hạng mục Assignment 2 còn lại (T5.3 CD, T5.4-b Deploy, T1-T5 docs mới trong nhánh `feat/T1.1-T5.4a`) sẽ được tổng hợp vào buổi review cuối cùng ngày 14/11.

**Template để cập nhật:**

- Hạng mục đã deliver tới 14/11:
  - [ ] URL production HTTPS truy cập được
  - [ ] `GET /health` prod trả 200
  - [ ] Video demo end-to-end
  - [ ] README hoàn chỉnh + rollback guide
  - [ ] `docs/deployment.md` (31.2)
  - [ ] Traceability matrix v2 final

- Phản hồi giảng viên tại nghiệm thu: _(chờ)_
- Điểm tự đánh giá nhóm: _(chờ)_
