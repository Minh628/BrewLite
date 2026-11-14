# BrewLite — Context & Scope (T1.1)

> **Nguồn:** `Assignment2-BrewLite.pdf` mục 3.1 + codebase hiện tại tại nhánh `feat/T1.1-T5.4a`.
> **Phiên bản:** 1.0 · **Ngày lập:** 2026-11-07 · **Owner:** Thanh Tùng (M1)
> **Deliverable bắt buộc:** đi kèm Task 1.1.

---

## 1. Vấn đề nghiệp vụ

Quán cà phê cỡ nhỏ (1 cửa hàng, 1-3 nhân viên quầy) đang gặp **3 vấn đề cụ thể**:

1. **Khách phải xếp hàng** ở quầy để đọc menu + gọi món + trả tiền — giờ cao điểm gây tắc nghẽn 2-5 phút/khách.
2. **Giao dịch tiền mặt** dễ nhầm tiền thối, không có log, khó đối soát cuối ngày.
3. **Khách không biết trạng thái đồ uống** đang pha đến đâu — hay quay lại hỏi quầy.

BrewLite giải quyết bằng một **PWA mobile-first** cho khách tự đặt + thanh toán không tiền mặt (ví/thẻ mô phỏng), kèm **giao diện quầy pha chế** để nhân viên cập nhật trạng thái; khách tự xem trạng thái realtime (polling).

Phạm vi Assignment 2: **1 cửa hàng duy nhất**, **không có đa chi nhánh**, **không tích hợp cổng thanh toán thật**.

---

## 2. Stakeholder

| Mã  | Stakeholder                         | Vai trò chính trong hệ thống                                                                                                      |
| --- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| S1  | **Khách hàng (Customer)**           | Người dùng cuối: xem menu, chọn size/topping, đặt đơn, thanh toán, theo dõi trạng thái, xem lịch sử.                              |
| S2  | **Nhân viên quầy (Barista)**        | Nhận đơn PAID, pha chế, chuyển trạng thái PREPARING → READY → COMPLETED qua `/barista` UI hoặc Swagger.                           |
| S3  | **Quản lý cửa hàng (Admin)**        | Role ADMIN: có quyền của Barista + (mở rộng) quản lý menu/promotion qua Adminer `:8080` hoặc `prisma studio` (không có UI riêng). |
| S4  | **Giảng viên / Khách nghiệm thu**   | Người chấm Assignment 2: clone repo, chạy theo README, truy cập URL production, chạy test, xem tài liệu.                          |
| S5  | **Nhóm phát triển (5 thành viên)**  | Thanh Tùng (PO/SM/BA), Kiện Minh (Modeler/BE), Hải Lý (FE), Hoàng Tịnh (DevOps/Architect), Trung Hiếu (BE/QA).                    |
| S6  | **Đơn vị thanh toán mô phỏng**      | `MockPaymentGateway` (`backend/src/payments/mock-payment.gateway.ts`) — đóng vai cổng thẻ/ví. Không có vendor thật ở MVP.         |
| S7  | **Người vận hành hạ tầng (DevOps)** | Hoàng Tịnh: quản lý CI/CD (`.github/workflows/ci.yml`), Docker Compose (`docker-compose.yml`, `docker-compose.dev.yml`), deploy.  |

---

## 3. Mục tiêu và kỳ vọng từng stakeholder

| Stakeholder        | Mục tiêu                                                                               | Kỳ vọng đo được                                                                                       |
| ------------------ | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| S1 Khách hàng      | Đặt + thanh toán 1 ly cà phê trong ≤ 2 phút trên điện thoại, biết đồ uống đã sẵn sàng. | Lighthouse Performance ≥ 70 trên mobile; `p95(POST /orders) < 500 ms` ở 10 conn.                      |
| S2 Nhân viên quầy  | Thấy danh sách đơn cần pha theo thứ tự FIFO, bấm 1 nút để chuyển trạng thái.           | Độ trễ chuyển trạng thái → khách nhìn thấy ≤ 10 s (polling 10 s + render ≤ 100 ms).                   |
| S3 Quản lý         | Xem đơn, hoàn kho, thay đổi menu/promotion khi cần.                                    | Có Adminer `:8080` (dev) + `prisma studio` + API quản lý tồn kho.                                     |
| S4 Giảng viên      | Clone repo + đọc README là chạy được; có đủ tài liệu (SRS/UC/Diagram/ADR/Deployment).  | README 1 lệnh chạy; `docs/traceability-matrix.md` phủ hết FR ↔ test; 303/303 test.                    |
| S5 Nhóm            | Phân công rõ, CI chặn merge khi đỏ, tránh conflict.                                    | Có Product Backlog + Sprint plan + `Assignment2-TaskAssignment.md`; branch protect.                   |
| S6 Payment Gateway | Tích hợp VNPay Sandbox & trả về kết quả xác định để test deterministic.                | VNPay callback (`vnp_ResponseCode=00` pass, khác `00` fail); `MockPaymentGateway` cho automated test. |
| S7 DevOps          | Deploy 1 lệnh, rollback ≤ 5 phút, không lộ secret.                                     | CI pipeline Install→Lint→Test→Build xanh trên PR; `.env` gitignored.                                  |

---

## 4. Phạm vi MVP (In-scope)

### 4.1 Luồng nghiệp vụ end-to-end

```
Xem menu → Lọc/Tìm → Chi tiết sản phẩm (chọn size + topping)
  → Giỏ hàng → Đăng nhập (nếu chưa)
  → Checkout: nhập mã giảm giá (tùy chọn) → chọn phương thức thanh toán
  → POST /orders (giữ tồn kho + idempotency)
  → POST /payments (thẻ/ví mô phỏng)
  → PAID (hoặc PAYMENT_FAILED + thử lại)
  → /orders/[id] xác nhận → polling 5s theo dõi trạng thái
  → PREPARING → READY ("Đồ uống đã sẵn sàng!") → COMPLETED
```

### 4.2 Bảng chức năng MVP

| Nhóm                       | Có trong MVP? | Bằng chứng code                                                                                      |
| -------------------------- | ------------- | ---------------------------------------------------------------------------------------------------- |
| Menu                       | ✅            | `GET /products`, `GET /categories`, `GET /toppings`                                                  |
| Chi tiết sản phẩm          | ✅            | `GET /products/:id` + `frontend/src/app/products/[id]/ProductDetailClient.tsx`                       |
| Giỏ hàng                   | ✅            | `frontend/src/store/cart.ts` (zustand persist)                                                       |
| Xác thực JWT               | ✅            | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` + `JwtAuthGuard` + `RolesGuard`            |
| Đặt đơn                    | ✅            | `POST /orders` với `Idempotency-Key` + stock reserve optimistic locking                              |
| Thanh toán VNPay & mock    | ✅            | `/payments/vnpay/create-url`, `return`, `ipn` + `MockPaymentGateway` (cho automated test)            |
| Mã giảm giá                | ✅            | `POST /promotions/validate` + `PromotionsService` (PERCENT/FIXED, minOrder, maxDiscount, usageLimit) |
| Điểm thưởng (loyalty)      | ✅            | `LoyaltyService.award()` công thức `floor(total / 10 000)` khi vào PAID; revoke khi CANCELLED        |
| Lịch sử đơn                | ✅            | `GET /orders/me` phân trang + `frontend/src/app/orders/page.tsx`                                     |
| Xác nhận & theo dõi đơn    | ✅            | `GET /orders/:id` + `frontend/src/app/orders/[id]/page.tsx` polling 5 s khi PAID/PREPARING           |
| Quản lý trạng thái đơn     | ✅            | 7-state machine `backend/src/orders/order-state-machine.ts` + `OrderStatusService.transition()`      |
| Giao diện quầy pha chế     | ✅            | `/barista` Kanban 3 cột — `GET /orders/queue`, `PATCH /orders/:id/status` (BARISTA/ADMIN)            |
| Hủy đơn (API)              | ✅            | `POST /orders/:id/cancel` — hoàn kho + revoke điểm                                                   |
| Health check               | ✅            | `GET /health` trả uptime + DB status                                                                 |
| Rate-limit auth            | ✅            | `POST /auth/login` 5 req / 60 s (AT-22); global 100 req / 60 s                                       |
| Log request + X-Request-Id | ✅            | `RequestLoggingMiddleware` + `HttpExceptionFilter` chèn `requestId` vào body + header                |
| Swagger                    | ✅            | `/api-docs` (NestJS Swagger)                                                                         |
| PWA (mobile-first)         | ✅            | `frontend/public/manifest.webmanifest` + service worker                                              |
| Docker Compose             | ✅            | `docker-compose.yml` (prod-style) + `docker-compose.dev.yml` (dev + Adminer + healthcheck)           |

### 4.3 Ngoài phạm vi (Out-of-scope) — Backlog tương lai

| Hạng mục                                     | Lý do loại ra                                                                                                  |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Trang quản trị Admin (UI riêng)              | `BrewLite-Sprint3.md` mục 3.2 chốt "KHÔNG làm" — role ADMIN dùng API quầy; dữ liệu qua Adminer/prisma studio.  |
| Cổng thanh toán thật (Stripe / VNPay / Momo) | Dùng `MockPaymentGateway` theo đề; endpoint `/payments/vnpay/*` có skeleton nhưng chưa tích hợp merchant thật. |
| Thông báo realtime (WebSocket / push)        | Polling 5-10 s đã đủ cho MVP; WebSocket thêm độ phức tạp và không nằm trong tiêu chí gốc.                      |
| Đa ngôn ngữ, chủ đề (i18n / theme)           | Chỉ tiếng Việt, 1 theme cho MVP.                                                                               |
| Đặt lại đơn, yêu thích                       | Backlog PB-36 (Sau MVP).                                                                                       |
| Đa chi nhánh                                 | 1 cửa hàng cho MVP.                                                                                            |
| Tải ảnh / quản lý file                       | Ảnh sản phẩm là static `/public/*.svg`, không cần upload.                                                      |
| Refresh token / OAuth social login           | Chỉ JWT access token expiresIn 3600 s; đăng nhập lại khi hết hạn.                                              |
| Thanh toán phân tách / split bill            | 1 đơn = 1 payment.                                                                                             |
| Báo cáo doanh thu / dashboard thống kê       | Không có yêu cầu gốc; nếu cần, dùng Adminer SQL query.                                                         |

---

## 5. Giả định (Assumptions)

| Mã  | Giả định                                                                                                                                                                     |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | Khách có smartphone ≥ iOS 14 / Android 10, Chrome / Safari phiên bản gần đây, mạng 4G/Wi-Fi ổn định tại cửa hàng.                                                            |
| A2  | Nhân viên quầy có laptop/tablet mở sẵn `/barista` trong ca làm việc (polling 10 s cần tab active).                                                                           |
| A3  | Giảng viên có Node.js 20+, npm 10+, Docker Desktop khi chấm bài; hoặc truy cập URL production qua browser.                                                                   |
| A4  | Dữ liệu seed (`npm run db:seed`) là đủ để demo: 4 user (customer/barista/admin/an), danh mục, sản phẩm, 3 mã giảm giá.                                                       |
| A5  | Thanh toán thực tế trên UI dùng **VNPay Sandbox** (`vnp_ResponseCode=00` thành công, `24`/khác `00` thất bại); `MockPaymentGateway` chỉ giữ làm fallback cho automated test. |
| A6  | VND là đơn vị tiền duy nhất; giá và loyalty points là số nguyên (không có lẻ đồng).                                                                                          |
| A7  | Nhóm dùng Postgres 16 (theo `docker-compose.dev.yml` image `postgres:16-alpine`) cho cả dev + prod.                                                                          |
| A8  | Không có SLA chính thức — mục tiêu nội bộ: uptime demo 99% trong tuần chấm (07-14/11).                                                                                       |

---

## 6. Ràng buộc (Constraints)

| Mã  | Loại         | Ràng buộc                                                                                                                           |
| --- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| C1  | Công nghệ    | **Bắt buộc theo đề**: Next.js (FE PWA mobile-first), NestJS (BE), PostgreSQL. Không thay thế 3 thành phần này.                      |
| C2  | Deadline     | Toàn bộ Assignment 2 nộp hết ngày **14/11/2026** (xem `Assignment2-TaskAssignment.md` phần tiêu đề).                                |
| C3  | Nhân lực     | 5 thành viên, part-time (song song học kỳ); trung bình 6,5 giờ dev/ngày trong sprint intensive (xem `BrewLite-Sprint3.md` mục 7.2). |
| C4  | Hạ tầng      | Chỉ 1 instance backend; Postgres chạy container Docker port 5433 (dev) / 5432 (prod). Không có Redis / Kafka / queue thật ở MVP.    |
| C5  | Quy trình    | Mọi tạo phẩm đi qua **Pull Request + CI xanh** mới được merge `main`; branch bảo vệ; `main` phản ánh version mới nhất chạy được.    |
| C6  | Bảo mật      | Không lộ `User.passwordHash` ở bất kỳ response nào; secret không nằm trong repo (`.env` + `backend/.env` đều `.gitignore`-ed).      |
| C7  | Thương mại   | Không giao dịch tiền thật; không thu thập PII ngoài email + mật khẩu băm bcrypt.                                                    |
| C8  | Localization | Toàn bộ UI + log nghiệp vụ bằng tiếng Việt; lỗi kỹ thuật (stack trace) bằng tiếng Anh theo library chuẩn.                           |

---

## 7. Rủi ro ban đầu (Initial risks)

| Mã  | Rủi ro                                                           | Mức     | Người chịu              | Giảm thiểu                                                                                                                 |
| --- | ---------------------------------------------------------------- | ------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| R1  | Thanh toán mock không idempotent → double charge khi retry       | Cao     | Kiện Minh + Trung Hiếu  | Thiết kế `Idempotency-Key` ngay từ `POST /orders` + `POST /payments`; spec e2e idempotency ở `orders-idempotency.spec.ts`. |
| R2  | Xung đột tồn kho khi 20 user cùng mua 1 món stock=5              | Cao     | Thanh Tùng              | Optimistic locking `Product.version` + retry 3 lần (`StockService.reserve`); spec `stock-concurrent.e2e-spec.ts`.          |
| R3  | Deploy production fail sát deadline 14/11                        | Rất cao | Hoàng Tịnh              | Staging trước 12/11; 13/11 promote; 14/11 là buffer. (`Assignment2-TaskAssignment.md` mục 8).                              |
| R4  | Task 1-3 trễ kéo theo Task 4-5 không kịp 14/11                   | Rất cao | Thanh Tùng + Hoàng Tịnh | Đóng cứng Task 1 hạn 06/11, Task 2+3 hạn 07/11. Sau 07/11 không mở lại scope.                                              |
| R5  | Secret bị commit vào repo công khai                              | Rất cao | Hoàng Tịnh              | Pre-commit hook (lint-staged) + review kỹ `.env.example`; `backend/.env` đã `.gitignore`.                                  |
| R6  | CI chậm → blocker PR merge                                       | Vừa     | Hoàng Tịnh              | Cache deps; chạy backend unit + frontend build song song; test chạy ~6 s trên local.                                       |
| R7  | E2E test flaky do thời gian polling / Playwright headless        | Vừa     | Hải Lý                  | Dùng `data-testid` cố định; retry Playwright 2 lần; mock tối đa nếu có thể.                                                |
| R8  | DB migration drift khi dev dùng `prisma migrate dev --name init` | Vừa     | Trung Hiếu              | Có migration drift đã flag ở `backend/prisma/migrations/20261107035437_init/` chưa commit — cần review trước 14/11.        |

---

## 8. Phụ lục — Liên kết chéo

- **Đề bài gốc:** `Assignment2-BrewLite.pdf` (mục 1.1, 3.1, 3.2).
- **Phân công & timeline:** `docs/Assignment2-TaskAssignment.md`.
- **Product Backlog & MoSCoW gốc:** `docs/BrewLite-ProductBacklog.md`.
- **Kế hoạch Sprint hiện tại:** `docs/BrewLite-Sprint3.md`.
- **SRS chi tiết (FR/NFR):** `docs/requirements/srs.md` (T1.2).
- **Use-case trọng tâm Checkout:** `docs/requirements/uc-checkout.md` (T1.3).
- **Traceability matrix:** `docs/traceability-matrix.md` (T-Trace).
