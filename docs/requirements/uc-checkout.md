# UC-06 — Đặt và thanh toán đơn hàng (T1.3)

> **Owner:** Thanh Tùng (M1) · **Ngày lập:** 2026-11-07 · **Phiên bản:** 1.0
> **Use-case trọng tâm** theo yêu cầu `Assignment2-BrewLite.pdf` mục 3.3.
> **Diagram:** `docs/diagrams/uc-checkout.puml` / `.svg` (use-case diagram phạm vi UC-06).
> **Mapping yêu cầu:** FR-13, FR-14, FR-15, FR-16, FR-17, FR-18, FR-19, FR-20 + NFR-02, NFR-07, NFR-09.

---

## 1. Thông tin use case

| Thuộc tính             | Giá trị                                                                                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Mã UC**              | UC-06                                                                                                                                                        |
| **Tên**                | Đặt và thanh toán đơn hàng                                                                                                                                   |
| **Phạm vi**            | BrewLite — luồng kết thúc giao dịch chính (giỏ hàng → PAID / PAYMENT_FAILED)                                                                                 |
| **Mức độ**             | User goal (mục tiêu người dùng)                                                                                                                              |
| **Ưu tiên**            | Must (MVP)                                                                                                                                                   |
| **Người liên quan FR** | FR-13 Đặt đơn · FR-14 Server tính giá · FR-15 Transaction stock · FR-16 Idempotency · FR-17 Promo · FR-18 /payments key · FR-19 Mock gateway · FR-20 Loyalty |

---

## 2. Actor

| Loại        | Actor                               | Vai trò                                                                                   |
| ----------- | ----------------------------------- | ----------------------------------------------------------------------------------------- |
| **Primary** | **Khách hàng (Customer)**           | Người bấm "Thanh toán" ở `/checkout`, có phiên JWT hợp lệ.                                |
| Secondary   | NestJS Backend                      | Hệ thống thực thi — chịu trách nhiệm tính giá, giữ kho, idempotency, state machine.       |
| Secondary   | PostgreSQL                          | Lưu `Order`, `OrderItem`, `Payment`, `Promotion`, `User.loyaltyPoints` trong transaction. |
| Secondary   | **Mock Payment Gateway** (external) | `MockPaymentGateway` — trả `SUCCEEDED` / `FAILED` deterministic theo số thẻ / env.        |

---

## 3. Trigger

Khách bấm nút **"Xác nhận thanh toán"** trên trang `/checkout` của FE (`frontend/src/app/checkout/page.tsx`) sau khi:

- Đã thêm ≥ 1 món vào giỏ hàng.
- (Tùy chọn) Nhập mã giảm giá và được validate OK.
- Chọn phương thức thanh toán (CARD hoặc WALLET).
- Nhập số thẻ (nếu CARD).

Trigger này sinh ra 2 request liên tiếp từ FE:

1. `POST /orders` (với header `Idempotency-Key`)
2. `POST /payments` (với header `Idempotency-Key` riêng, body `{orderId, method, cardNumber?}`)

---

## 4. Tiền điều kiện (Preconditions)

| ID    | Tiền điều kiện                                                                                                               |
| ----- | ---------------------------------------------------------------------------------------------------------------------------- |
| PRE-1 | Khách đã đăng nhập thành công, `accessToken` hợp lệ còn hạn (≤ 3600 s kể từ login).                                          |
| PRE-2 | `cart.lines.length ≥ 1` trong `useCart` zustand store.                                                                       |
| PRE-3 | Mọi `productId` trong giỏ phải tồn tại và còn `isActive = true` ở DB (FE đã lọc bằng cờ `inStock`, nhưng server verify lại). |
| PRE-4 | (Nếu có promoCode) mã đã được validate thành công qua `POST /promotions/validate` hoặc sẽ được validate lại trong UC này.    |
| PRE-5 | Backend ở trạng thái healthy: `GET /health` trả 200, kết nối Postgres OK.                                                    |

---

## 5. Hậu điều kiện (Postconditions)

### 5.1 Khi UC thành công (nhánh chính kết thúc)

| ID     | Hậu điều kiện (success)                                                                                                                                 |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| POST-1 | 1 bản ghi `Order` mới trong DB với `status = PAID`, đúng `subtotal`, `discount`, `promoCode`, `total`, `pointsEarned = floor(total / 10 000)`.          |
| POST-2 | Các bản ghi `OrderItem` + `OrderItemTopping` tương ứng được tạo; `OrderItem.unitPrice` và `lineTotal` khớp công thức `PricingService.calcUnitPrice`.    |
| POST-3 | `Product.stock` của các sản phẩm liên quan đã giảm đúng số qty, `Product.version` tăng (optimistic locking).                                            |
| POST-4 | Nếu có promo: `Promotion.usedCount` tăng 1 trong **cùng transaction tạo đơn**.                                                                          |
| POST-5 | `User.loyaltyPoints` tăng `pointsEarned` (await trong cùng transaction state transition PAID).                                                          |
| POST-6 | 1 bản ghi `Payment` với `status = SUCCEEDED`, `method` khớp request, `cardLast4` = 4 số cuối thẻ (nếu CARD), `idempotencyKey` được lưu làm primary key. |
| POST-7 | FE điều hướng `/orders/{orderId}` và bắt đầu polling trạng thái 5 s.                                                                                    |
| POST-8 | Giỏ hàng được xóa ở client (`useCart.clear()` chạy sau khi response /payments PAID).                                                                    |

### 5.2 Khi UC thất bại (nhánh thay thế)

| ID      | Hậu điều kiện (fail)                                                                                                                                                       |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| POSTF-1 | Nếu lỗi ở `POST /orders` (stock/promo/validate): không có `Order` được persist (transaction rollback).                                                                     |
| POSTF-2 | Nếu lỗi ở `POST /payments` sau khi đã có `Order`: `Order.status = PAYMENT_FAILED`, `Payment.status = FAILED`, giỏ hàng **không bị xóa** để khách retry.                    |
| POSTF-3 | Mọi lỗi phải trả body theo format `HttpExceptionFilter` chuẩn (`statusCode`, `message`, `error`, `code?`, `requestId`, `timestamp`). Header `X-Request-Id` luôn hiện diện. |

---

## 6. Luồng chính (Main Success Scenario)

| #   | Actor    | Hành động                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| --- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Customer | Ở `/checkout`, xem tóm tắt giỏ hàng + tổng tạm tính, chọn phương thức (CARD/WALLET), nhập số thẻ (nếu CARD), (tùy chọn) nhập mã giảm giá, bấm **"Xác nhận thanh toán"**.                                                                                                                                                                                                                                                                                                           |
| 2   | FE       | Sinh `orderKey` (UUID v4) cho phiên checkout và `paymentKey` (UUID v4) cho lần thử thanh toán. Lưu `orderKey` vào localStorage để không tạo đơn trùng khi retry.                                                                                                                                                                                                                                                                                                                   |
| 3   | FE       | Gọi `POST /orders` với header `Idempotency-Key: {orderKey}`, body `{items, promoCode?}`, Authorization: `Bearer {token}`.                                                                                                                                                                                                                                                                                                                                                          |
| 4   | Backend  | **Fast-path idempotency**: nếu tồn tại đơn cũ với cùng `(userId, orderKey)` → trả lại đơn cũ, HTTP 200, `replayed: true`. Sang bước 11.                                                                                                                                                                                                                                                                                                                                            |
| 5   | Backend  | **Pricing**: `PricingService.priceItems()` tính lại `unitPrice`, `lineTotal` từ DB cho từng item (bỏ qua giá client gửi — FR-14).                                                                                                                                                                                                                                                                                                                                                  |
| 6   | Backend  | **Validate promo** (nếu `promoCode` có): `PromotionsService.findPromotion()` + `evaluate()` → tính `discount`. `total = max(0, subtotal - discount)`.                                                                                                                                                                                                                                                                                                                              |
| 7   | Backend  | Mở **transaction**: (a) `tx.order.create(…)`; (b) với mỗi item: `tx.orderItem.create(…)` + `tx.orderItemTopping.create(…)`; (c) `StockService.reserve(tx, items)` optimistic locking + retry tối đa 3 lần; (d) nếu có promo: `PromotionsService.consumeUsage(tx, promotion)`.                                                                                                                                                                                                      |
| 8   | Backend  | Commit transaction. Emit event `order.payment.pending` qua `orderEvents` (log/analytics). Trả 201 + `{orderId, code, status:"PENDING", subtotal, discount, promoCode, total, replayed:false}`.                                                                                                                                                                                                                                                                                     |
| 9   | FE       | Nhận response → lưu `orderId` vào localStorage (phục vụ retry). Gọi `POST /payments` với header `Idempotency-Key: {paymentKey}`, body `{orderId, method, cardNumber?}`.                                                                                                                                                                                                                                                                                                            |
| 10  | Backend  | `PaymentsController` (`/payments/vnpay/create-url`, `return`, `ipn`) & `VnpayService`: (a) tạo URL VNPay có chữ ký HMAC-SHA512; (b) khi nhận callback/IPN `vnp_ResponseCode = '00'` hợp lệ, mở transaction kiểm `order.status ∈ {PENDING, PAYMENT_FAILED}` và idempotency; (c) lưu `Payment` (`SUCCEEDED`); (d) `OrderStatusService.transition(tx, orderId, PAID)` — cùng transaction kích hoạt hook `LoyaltyService.award()` cộng điểm. (`POST /payments` giữ làm fallback test). |
| 11  | Backend  | Trả 200 + `{orderId, status:"PAID", amount, method, cardLast4, paidAt}`. Header `X-Request-Id` set.                                                                                                                                                                                                                                                                                                                                                                                |
| 12  | FE       | Nhận response PAID → `useCart.clear()` xóa giỏ → `router.push('/orders/{orderId}')`.                                                                                                                                                                                                                                                                                                                                                                                               |
| 13  | FE       | Trang `/orders/{orderId}` fetch `GET /orders/:id` → render `StatusBadge "Đã thanh toán - Mời tới quầy lấy nước"`, bắt đầu polling 5 s để theo dõi `PREPARING`/`READY`/`COMPLETED`.                                                                                                                                                                                                                                                                                                 |

---

## 7. Luồng thay thế (Alternative flows)

### 7.1 A1 — Thanh toán thất bại, khách thử lại

| #     | Actor    | Hành động                                                                                                                                                                                    |
| ----- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 10a.1 | Backend  | VNPay trả `vnp_ResponseCode != '00'` (VD: `24` khách hủy). `Payment.status = FAILED`. `OrderStatusService.transition(PAYMENT_FAILED)`. Redirect về `/orders/vnpay-return` hiển thị thất bại. |
| 10a.2 | FE       | Hiện lỗi "Thẻ bị từ chối", nút **"Thử lại"**; giỏ hàng **giữ nguyên**; `orderId` cũ giữ nguyên trong localStorage.                                                                           |
| 10a.3 | Customer | Đổi số thẻ hoặc đổi phương thức, bấm "Thử lại".                                                                                                                                              |
| 10a.4 | FE       | Sinh `paymentKey` MỚI, gọi lại `POST /payments` với `orderId` cũ. Backend thấy order `PAYMENT_FAILED` → cho phép transition về `PAID` nếu lần này thành công.                                |

### 7.2 A2 — Retry POST /orders (idempotency replay)

| #    | Actor   | Hành động                                                                                                                                                                                               |
| ---- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3a.1 | FE      | Request `/orders` timeout. FE retry với **cùng `orderKey`**.                                                                                                                                            |
| 3a.2 | Backend | Fast-path (step 4) phát hiện đơn tồn tại → trả 200 + `replayed: true`. Không tạo đơn trùng, không trừ promo 2 lần, không giữ stock 2 lần.                                                               |
| 3a.3 | Backend | Nếu request đầu còn trong flight khi request thứ 2 đến (race) → unique constraint `@@unique([userId, idempotencyKey])` chặn request thứ 2 ở `tx.order.create`; service catch P2002 → trả lại đơn thứ 1. |

### 7.3 A3 — Đặt đơn không kèm promoCode

Bỏ qua bước 6 (`discount = 0`, `promoCode = null`, không `consumeUsage`). Mọi bước còn lại giữ nguyên.

### 7.4 A4 — Thanh toán WALLET thành công / fail

- `method: "WALLET"`: gateway bỏ qua `cardNumber`. Env `MOCK_WALLET_FAIL=true` → fail giống nhánh A1. Mặc định ví pass.

---

## 8. Luồng ngoại lệ (Exception flows)

| Mã  | Điều kiện xảy ra                                                                                | Hệ thống xử lý                                                                                                                                     |
| --- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| E1  | Thiếu/sai JWT token trong `POST /orders` hoặc `POST /payments`.                                 | `JwtAuthGuard` → 401 `Unauthorized`. FE redirect `/login?returnUrl=/checkout`.                                                                     |
| E2  | `qty < 1` hoặc `qty > 20` trong body `/orders`.                                                 | `ValidationPipe` → 400 `Bad Request` với `message: ["qty tối thiểu là 1"]` hoặc `["qty tối đa là 20"]`.                                            |
| E3  | `productId` không tồn tại hoặc `isActive=false`.                                                | `PricingService` ném `NotFoundException` → 404 `PRODUCT_NOT_FOUND`.                                                                                |
| E4  | 1 sản phẩm trong đơn hết hàng (`stock < qty`) → `StockService.reserve` fail sau retry.          | 409 `OUT_OF_STOCK` với body `{code:"OUT_OF_STOCK", productId: <id>}`. FE hiện "Món X vừa hết hàng, vui lòng kiểm tra lại giỏ hàng" (FR-08).        |
| E5  | Promo không tồn tại / hết hạn / hết lượt / không đạt minOrder.                                  | 409 kèm `code ∈ {PROMO_NOT_FOUND, PROMO_INACTIVE_OR_EXPIRED, PROMO_EXHAUSTED, PROMO_MIN_ORDER_NOT_MET}`.                                           |
| E6  | `POST /payments` thiếu header `Idempotency-Key`.                                                | 400 `Bad Request` với `message:"Idempotency-Key header bắt buộc"`.                                                                                 |
| E7  | `POST /payments` cùng key, khác payload.                                                        | 422 `Unprocessable Entity` — tránh double-process với state inconsistent.                                                                          |
| E8  | Đơn đã PAID, cố gọi `/payments` lại.                                                            | 409 `ORDER_NOT_PAYABLE`. FE điều hướng `/orders/{id}`.                                                                                             |
| E9  | Rate-limit `POST /auth/login` 5 req/60 s — khi user nhập sai password nhiều lần trước checkout. | 429 `Too Many Requests` + header `Retry-After`. (Không xảy ra trong luồng UC-06 trực tiếp — là E8 của UC-08, nhưng có thể chặn user trước UC-06.)  |
| E10 | Postgres down giữa transaction → connection reset.                                              | Prisma throw → bắt bởi `HttpExceptionFilter`. Production: 500 với `requestId`, không lộ stack. Transaction tự rollback nhờ cơ chế atomic.          |
| E11 | Network timeout giữa FE và backend khi `/payments` đang pending.                                | FE báo "Không nhận được phản hồi, nhấn Thử lại" — **phải dùng cùng `paymentKey`** để tránh double charge; backend trả replayed-200 nếu đã process. |

---

## 9. Dữ liệu vào / ra

### 9.1 Input từ Customer → FE

| Trường     | Kiểu                | Validate                                                                                      |
| ---------- | ------------------- | --------------------------------------------------------------------------------------------- |
| items      | `CreateOrderItem[]` | min 1 phần tử, mỗi item có `productId:int≥1, size:'S'\|'M'\|'L', qty:1..20, toppingIds:int[]` |
| promoCode  | string?             | toUpperCase, length 2..30 (tùy promo có hoặc không)                                           |
| method     | 'CARD' \| 'WALLET'  | required                                                                                      |
| cardNumber | string              | required nếu method=CARD; 16 chữ số, chỉ dùng cho mock                                        |

### 9.2 Output từ Backend → FE

**Response thành công của `POST /orders` (201):**

```json
{
  "orderId": 1003,
  "code": "#1003",
  "status": "PENDING",
  "subtotal": 178000,
  "discount": 17800,
  "promoCode": "BREW10",
  "total": 160200,
  "replayed": false
}
```

**Response thành công của `POST /payments` (200):**

```json
{
  "orderId": 1003,
  "status": "PAID",
  "amount": 160200,
  "method": "CARD",
  "cardLast4": "4242",
  "paidAt": "2026-11-07T10:31:34.456Z"
}
```

**Response lỗi chuẩn (`HttpExceptionFilter`):**

```json
{
  "statusCode": 409,
  "message": "OUT_OF_STOCK",
  "error": "Conflict",
  "code": "OUT_OF_STOCK",
  "productId": 5,
  "path": "/orders",
  "timestamp": "2026-11-07T10:31:34.000Z",
  "requestId": "0b6f8a52-3f7c-4a5e-9d0e-6f1c2b7a9e11"
}
```

---

## 10. Liên kết với FR / NFR

| Yêu cầu | Thỏa mãn ở bước nào trong UC                                         |
| ------- | -------------------------------------------------------------------- |
| FR-13   | Bước 3 (schema validate) + bước 8 (trả response PENDING)             |
| FR-14   | Bước 5 (server tính giá, bỏ qua client)                              |
| FR-15   | Bước 7 (transaction: create order + stock reserve)                   |
| FR-16   | Bước 4 (fast-path) + A2 (unique constraint)                          |
| FR-17   | Bước 6 (evaluate) + bước 7d (consumeUsage)                           |
| FR-18   | Bước 9 + E6 (Idempotency-Key check) + E7 (same-key payload mismatch) |
| FR-19   | Bước 10c (MockPaymentGateway deterministic)                          |
| FR-20   | Bước 10e (LoyaltyService.award trong hook PAID)                      |
| NFR-02  | `p95(POST /orders) < 500 ms` ở 10 conn (xem perf-report)             |
| NFR-07  | E9 (rate-limit trên login trước đó)                                  |
| NFR-09  | E10 (500 masking production)                                         |
| NFR-12  | E3-E10 (mọi lỗi có `requestId`)                                      |

---

## 11. Kiểm chứng (test mapping)

Mỗi bước / exception path có test tương ứng (xem `docs/traceability-matrix.md` cột Test):

- `orders.service.spec.ts` — unit test tính giá, promo logic, idempotency fast-path.
- `orders-idempotency.spec.ts` — test (b) idempotency key: 2 request tuần tự + song song.
- `orders.e2e-spec.ts` — HTTP end-to-end: 201/400/401/409, nhánh promo, nhánh qty > 20.
- `stock-concurrent.e2e-spec.ts` — test (c): 20 req đồng thời, OUT_OF_STOCK đúng.
- `payments.e2e-spec.ts` — thẻ pass/fail, idempotency, 409 ORDER_NOT_PAYABLE.
- `loyalty.service.spec.ts` + `loyalty.db.spec.ts` — award/revoke, chống cộng đôi.
- `promotions.service.spec.ts` — 16 ca validate promo (expired, exhausted, min-order, etc.).
- `order-state-machine.spec.ts` — 49 cặp transition (hợp lệ + chặn).

---

## 12. Ghi chú thiết kế

- **2 request riêng biệt `/orders` và `/payments`** thay vì 1 "pay-and-create" vì: (1) stock phải được reserve trước khi charge thẻ, nếu gộp thì trường hợp thẻ fail phải rollback stock — phức tạp hơn; (2) tách để khách retry thanh toán mà không tạo đơn mới (A1).
- **Idempotency key tách riêng** cho orders và payments: `orderKey` cố định cho phiên checkout, `paymentKey` mới mỗi lần "Thử lại". Đúng ý `Assignment2-BrewLite.pdf` mục 4.2 (idempotency khi client gửi lại).
- **Hook composition sau commit `e85f59a`**: `OrderStatusService.registerHooks` lưu mảng handler thay vì spread-merge — đảm bảo cả `LoyaltyService` và `StockService` đều chạy khi state chuyển.
