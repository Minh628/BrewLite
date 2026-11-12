# BrewLite — SRS rút gọn (T1.2)

> **Owner:** Thanh Tùng (M1) · **Ngày lập:** 2026-11-07 · **Phiên bản:** 1.0
> **Căn cứ:** `Assignment2-BrewLite.pdf` mục 3.2 + codebase nhánh `feat/T1.1-T5.4a`.
> **Use-case diagram tổng quát:** `docs/diagrams/use-case-overview.puml` / `.svg`.

---

## 1. Quy ước

- **FR** = Functional Requirement; **NFR** = Non-Functional Requirement.
- **MoSCoW:** `Must` bắt buộc cho MVP · `Should` nên có · `Could` có thì tốt · `Won't` không làm phiên bản này.
- **Tiêu chí chấp nhận** viết sao cho **có thể dịch thẳng thành test case** (mỗi FR/NFR ánh xạ ít nhất 1 test trong `docs/traceability-matrix.md`).
- **Bằng chứng code** cột cuối trích file:line thực tế để reviewer verify.

---

## 2. Yêu cầu chức năng (FR)

### 2.1 Menu & khám phá sản phẩm

| Mã    | Mô tả                                                                                                                | MoSCoW | Tiêu chí chấp nhận                                                                                                                                                  | Bằng chứng code                                                  |
| ----- | -------------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| FR-01 | Khách xem danh sách sản phẩm đang bán theo danh mục, không cần đăng nhập.                                            | Must   | `GET /products` trả 200 với mảng sản phẩm `{id, name, price, imageUrl, category, isAvailable, inStock}`; chỉ sản phẩm `isActive = true` và category đang hoạt động. | `products.controller.ts:22-31`, `products.service.ts`            |
| FR-02 | Khách lọc theo `category` (id) và tìm kiếm theo từ khóa `q` (không dấu, không phân biệt hoa thường).                 | Must   | `GET /products?category=1` chỉ trả sản phẩm category=1. `GET /products?q=ca%20phe` match cả "Cà phê", "cafe", "cà phê". `normalizeSearchText` loại dấu + lowercase. | `products-filter.spec.ts`, `products-filter.e2e-spec.ts`         |
| FR-03 | Khách xem chi tiết 1 sản phẩm: mô tả, danh sách size (S/M/L) kèm chênh giá, danh sách topping khả dụng (có thì tốt). | Must   | `GET /products/:id` trả thêm `sizes: [{size, extraPrice}]`; 404 nếu không tồn tại hoặc không active.                                                                | `products.controller.ts:33-40`                                   |
| FR-04 | Khách xem danh sách danh mục + danh sách topping (để render filter).                                                 | Should | `GET /categories` + `GET /toppings` trả mảng; chỉ record `isActive = true`.                                                                                         | `categories.controller.ts:14-19`, `toppings.controller.ts:11-16` |

### 2.2 Giỏ hàng

| Mã    | Mô tả                                                                                           | MoSCoW | Tiêu chí chấp nhận                                                                                                                                     | Bằng chứng code                                                      |
| ----- | ----------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| FR-05 | Giỏ hàng lưu client-side, giữ nguyên khi khách F5 / đóng tab.                                   | Must   | `useCart` (zustand + `persist` vào `localStorage` key `brewlite-cart`); mở lại tab → `cart.lines` bằng lần cuối.                                       | `frontend/src/store/cart.ts`                                         |
| FR-06 | Thêm 1 dòng = `(productId, size, toppingIds[])` + `qty`; dòng cùng key được gộp `qty`.          | Must   | Thêm "Americano L + trân châu" lần 2 → `qty` tăng 1, không đẻ dòng mới.                                                                                | `useCart.add()` logic                                                |
| FR-07 | Sửa/xóa dòng trong giỏ; tính tổng tiền client-side đúng với công thức server (`calcUnitPrice`). | Must   | Trùng kết quả với `PricingService.calcUnitPrice()` cho mọi tổ hợp seed; test unit frontend + backend.                                                  | `frontend/src/lib/pricing.ts`, `pricing.service.spec.ts`             |
| FR-08 | FE chặn thêm món `inStock = false` vào giỏ, và hiện nhãn "Hết hàng" ở menu + chi tiết.          | Should | `ProductCard.tsx` khi `product.inStock === false` → nút "Thêm vào giỏ" `disabled`. Ở checkout, API trả 409 `OUT_OF_STOCK` → hiện "Món X vừa hết hàng". | `ProductCard.tsx`, `ProductDetailClient.tsx`, `checkout/page.tsx:22` |

### 2.3 Xác thực

| Mã    | Mô tả                                                                                                              | MoSCoW | Tiêu chí chấp nhận                                                                                                                                                                                | Bằng chứng code                                  |
| ----- | ------------------------------------------------------------------------------------------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| FR-09 | Đăng ký bằng email + password (tối thiểu 8 ký tự). Email được `trim` + `toLowerCase`. Mật khẩu băm bcrypt salt=10. | Must   | `POST /auth/register` body `{email, password}` → 201 + `{user:{id,email,role}, accessToken}`. Sai format → 400. Email đã có → 409 "Email already registered". Response không chứa `passwordHash`. | `auth.service.ts:register()`, `auth.e2e-spec.ts` |
| FR-10 | Đăng nhập email + password → JWT accessToken `expiresIn: 3600 s` kèm `role` trong payload.                         | Must   | `POST /auth/login` → 200 + `{accessToken, expiresIn, user:{id,email,role}}`. Sai → 401 "Invalid credentials". Payload JWT decode có `sub, email, role`.                                           | `auth.service.ts:login()`, `jwt.strategy.ts`     |
| FR-11 | `GET /auth/me` trả profile user hiện tại (loyalty points, role, createdAt) khi có Bearer token hợp lệ.             | Must   | Có JWT → 200 + profile; thiếu/sai token → 401.                                                                                                                                                    | `auth.controller.ts:99-108`                      |
| FR-12 | Rate-limit `POST /auth/login` 5 req/60 s/IP (chống brute-force).                                                   | Must   | Request thứ 6 trong 60 s trả 429 + header `Retry-After`.                                                                                                                                          | `auth.controller.ts` `@Throttle({…ttl:60000})`   |

### 2.4 Đặt đơn

| Mã    | Mô tả                                                                                                                                                                                         | MoSCoW | Tiêu chí chấp nhận                                                                                                                                                                                           | Bằng chứng code                                                                   |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| FR-13 | Khách đã login tạo đơn từ giỏ: `POST /orders` body `{items[], promoCode?}`; mỗi `item` có `productId, size (S/M/L), qty (1..20), toppingIds[]`.                                               | Must   | 201 + `{orderId, code:"#1001", status:"PENDING", subtotal, discount, promoCode, total}`. Sai DTO → 400 chi tiết. Thiếu token → 401. `qty > 20` → 400 "qty tối đa là 20". `qty < 1` → 400.                    | `orders.controller.ts:182-223`, `create-order.dto.ts:22-23`, `orders.e2e-spec.ts` |
| FR-14 | Giá server tính lại từ DB (`PricingService`), **bỏ qua** mọi giá client gửi kèm.                                                                                                              | Must   | Client gửi `unitPrice: 1` → server vẫn tính đúng theo giá DB + extraPrice của size + topping price.                                                                                                          | `orders.service.ts` `priceItems()`, test "bỏ qua giá giả do client gửi"           |
| FR-15 | Tạo đơn + giữ tồn kho + consume promo code chạy trong **cùng transaction**; nếu reserve/consume fail → rollback cả đơn.                                                                       | Must   | 20 request đồng thời mua 1 ly món stock=5 → đúng 5 × 201 + 15 × 409 `OUT_OF_STOCK`, tồn kho sau cùng = 0, không âm.                                                                                          | `orders.service.ts:create()` + `stock.service.ts`, `stock-concurrent.e2e-spec.ts` |
| FR-16 | Idempotency: `POST /orders` với cùng `Idempotency-Key` + cùng user → chỉ tạo 1 đơn; request lặp trả **200** + `replayed: true` thay vì 201.                                                   | Must   | 2 request tuần tự cùng key → 1 đơn trong DB, lần 2 trả 200. 2 request song song cùng key → unique constraint `(userId, idempotencyKey)` chặn → vẫn 1 đơn. Mã promo chỉ trừ 1 lượt.                           | `orders.service.ts`, `orders-idempotency.spec.ts`                                 |
| FR-17 | Áp mã giảm giá: `PromotionsService.evaluate()` kiểm tra `isActive`, `startsAt ≤ now ≤ endsAt`, `subtotal ≥ minOrder`, `usedCount < usageLimit`. PERCENT trần `maxDiscount`; FIXED ≤ subtotal. | Must   | Mã `BREW10` áp lên subtotal 178 000đ → discount 17 800đ, total 160 200đ. Hết lượt → 409 `PROMO_EXHAUSTED`. Hết hạn → 409 `PROMO_INACTIVE_OR_EXPIRED`. `subtotal < minOrder` → 409 `PROMO_MIN_ORDER_NOT_MET`. | `promotions.service.ts`, `promotions.service.spec.ts`                             |

### 2.5 Thanh toán

| Mã    | Mô tả                                                                                                                                                                                | MoSCoW | Tiêu chí chấp nhận                                                                                                                                                      | Bằng chứng code                                           |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| FR-18 | `POST /payments` **bắt buộc** header `Idempotency-Key`; body `{orderId, method ∈ {CARD, WALLET}, cardNumber?}`. Thiếu key → 400.                                                     | Must   | Có key → nếu chưa có payment → xử lý và lưu. Cùng key + cùng payload → 200 `Idempotent-Replayed`. Cùng key + payload khác → 422. Đơn đã PAID → 409 `ORDER_NOT_PAYABLE`. | `payments.controller.ts:56-78`, `payments.e2e-spec.ts`    |
| FR-19 | `MockPaymentGateway` phản hồi deterministic: thẻ `4000 0000 0000 0002` → `FAILED`, các thẻ 16 chữ số khác → `SUCCEEDED`. Ví fail khi env `MOCK_WALLET_FAIL=true`. Delay 800-1500 ms. | Must   | Test thẻ fail → `Payment.status = FAILED`, order chuyển `PAYMENT_FAILED`. Thẻ pass → `SUCCEEDED`, order chuyển `PAID`. Lưu chỉ 4 số cuối thẻ (`cardLast4`).             | `mock-payment.gateway.ts`, `mock-payment.gateway.spec.ts` |
| FR-20 | Sau PAID, `LoyaltyService.award()` cộng `floor(total/10 000)` điểm vào `User.loyaltyPoints`. Chạy trong cùng transaction với `OrderStatusService.transition(PAID)`.                  | Must   | Tổng 160 200đ → +16 điểm. Gọi award lần 2 cho cùng đơn → không cộng đôi (guard `WHERE pointsEarned = 0`).                                                               | `loyalty.service.ts:award()`, `loyalty.service.spec.ts`   |

### 2.6 Lịch sử đơn & theo dõi trạng thái

| Mã    | Mô tả                                                                                                                                                                   | MoSCoW | Tiêu chí chấp nhận                                                                                                                                   | Bằng chứng code                                                |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| FR-21 | `GET /orders/me?page=1&limit=10` (limit tối đa 50) trả lịch sử đơn của chính user hiện tại, mới nhất trước, kèm `totalItems`, `totalPages`.                             | Must   | Login user A → chỉ thấy đơn A; không thấy đơn user B. Thiếu token → 401.                                                                             | `orders.controller.ts:62-80`, `orders-history.e2e-spec.ts`     |
| FR-22 | `GET /orders/:id` trả chi tiết (items + toppings + subtotal + discount + promoCode + pointsEarned + payment gần nhất). Đơn của người khác → **404** (không lộ tồn tại). | Must   | User A xem đơn user B → 404 `Không tìm thấy đơn hàng #...`. Chính chủ xem đúng → 200 + full detail.                                                  | `orders.controller.ts:103-115`, `orders.service.ts:findById()` |
| FR-23 | Trang xác nhận `/orders/[id]` polling 5 s khi `status ∈ {PAID, PREPARING}`. Khi `READY` hiện banner "Đồ uống đã sẵn sàng!".                                             | Must   | TanStack Query `refetchInterval: 5000` chỉ chạy khi status trong set này; `READY` dừng polling + render banner.                                      | `frontend/src/app/orders/[id]/page.tsx:70-76,194-201`          |
| FR-24 | Khách hủy đơn khi `status = PENDING`: `POST /orders/:id/cancel` → `CANCELLED`, hoàn kho qua `StockService.release`, revoke điểm nếu đã award.                           | Should | Đơn PENDING → cancel OK, stock trở về số cũ, `pointsEarned = 0`. Đơn `PAID/PREPARING/READY` → 409 `INVALID_TRANSITION` (do state machine không cho). | `orders.controller.ts:147-172`, `orders.service.ts:cancel()`   |

### 2.7 Quản lý trạng thái đơn (Barista / Admin)

| Mã    | Mô tả                                                                                                                                                                                       | MoSCoW | Tiêu chí chấp nhận                                                                                                                                                                                                                 | Bằng chứng code                                                                       |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| FR-25 | State machine 7 trạng thái: `PENDING → PAID → PREPARING → READY → COMPLETED`, với `PAYMENT_FAILED` và `CANCELLED`. Chỉ `OrderStatusService.transition()` được phép cập nhật `Order.status`. | Must   | Mọi cặp chuyển sai → 409 `INVALID_TRANSITION`. Cặp hợp lệ: xem `TRANSITIONS` bảng tại `order-state-machine.ts:14-27`. 49 test cặp trong `order-state-machine.spec.ts`.                                                             | `order-state-machine.ts`, `order-status.service.ts`, `order-state-machine.spec.ts`    |
| FR-26 | `PATCH /orders/:id/status` chỉ BARISTA/ADMIN được phép. Role khác → 403 `FORBIDDEN_ROLE`.                                                                                                   | Must   | Khách gọi → 403. Nhân viên gọi với `status ∈ {PREPARING, READY, COMPLETED}` (hoặc `CANCELLED`) → 200 + trạng thái mới. Sai thứ tự → 409.                                                                                           | `orders.controller.ts:123-139`, `security.e2e-spec.ts`, `roles.guard.ts`              |
| FR-27 | `GET /orders/queue` trả tất cả đơn `PAID/PREPARING/READY`, FIFO theo `createdAt`, chỉ BARISTA/ADMIN. FE `/barista` nhóm theo status thành Kanban 3 cột.                                     | Must   | Khách gọi → 403. Nhân viên gọi → 200 + mảng. Trang `/barista` polling 10 s, bấm "Nhận pha" → PATCH + refetch → đơn chuyển cột.                                                                                                     | `orders.controller.ts:87-97`, `orders.service.ts:getQueue()`, `app/barista/page.tsx`  |
| FR-28 | Khi đơn chuyển `CANCELLED` (bởi khách hoặc staff), `StockService.release()` hoàn kho và `LoyaltyService.revoke()` trừ điểm đã cộng — chạy trong cùng transaction với state transition.      | Must   | Đơn PAID (đã cộng 16 điểm) → CANCELLED → `User.loyaltyPoints -= 16`, `Order.pointsEarned = 0`, stock về mức trước đó. Hook `onCancelled` phải chạy TẤT CẢ handler (Loyalty + Stock) — sau fix spread-merge bug (commit `e85f59a`). | `loyalty-hooks.service.ts`, `stock-hooks.service.ts`, `order-status.service.ts:22-34` |

---

## 3. Yêu cầu phi chức năng (NFR)

### 3.1 Hiệu năng

| Mã     | Yêu cầu                                                                                                                        | MoSCoW | Tiêu chí chấp nhận                                                                                                              | Bằng chứng                                                  |
| ------ | ------------------------------------------------------------------------------------------------------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| NFR-01 | `p95(GET /products) < 500 ms` ở tải 10 concurrent connections, benchmark bằng `autocannon`.                                    | Must   | Baseline đo được `7.2 ms` ở 10 conn, `62.4 ms` ở 50 conn (`docs/perf-report.md`). CI/local phải giữ dưới 500 ms.                | `docs/perf-report.md`, `scripts/perf/products.js`           |
| NFR-02 | `p95(POST /orders)` với Bearer token `< 500 ms` ở 10 conn.                                                                     | Must   | Baseline `16.0 ms` ở 10 conn, `71.9 ms` ở 50 conn. Script thoát exit-1 nếu p95 ≥ 500 ms hoặc có response không phải 2xx.        | `docs/perf-report.md`, `scripts/perf/orders.js`             |
| NFR-03 | FE Lighthouse Performance ≥ 70, PWA ≥ 80 ở mobile (iPhone 12 preset).                                                          | Should | Chạy `lighthouse http://localhost:3000/menu --preset=mobile` cho PR → artifact. Hiện chưa có gate CI; verify thủ công lúc demo. | `frontend/public/manifest.webmanifest`                      |
| NFR-04 | Polling backend ≤ 10 s cho barista queue, ≤ 5 s cho trang xác nhận khi đơn đang hoạt động. Dừng polling ở trạng thái terminal. | Must   | `app/barista/page.tsx` `refetchInterval: 10_000`; `app/orders/[id]/page.tsx` 5 s chỉ khi status ∈ {PAID, PREPARING}.            | `app/barista/page.tsx:74`, `app/orders/[id]/page.tsx:70-76` |

### 3.2 Bảo mật

| Mã     | Yêu cầu                                                                                                                           | MoSCoW | Tiêu chí chấp nhận                                                                                                                                                                    | Bằng chứng                                                 |
| ------ | --------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| NFR-05 | JWT ký HS256, chứa `{sub, email, role}`, hết hạn 3600 s.                                                                          | Must   | Decode token sau login phải có 3 trường trên; sau 3600 s request trả 401.                                                                                                             | `auth.service.ts:login()`, `jwt.strategy.ts`               |
| NFR-06 | Không response nào chứa `passwordHash`.                                                                                           | Must   | Search `grep -r "passwordHash" backend/src/*/dto/` chỉ thấy trong DTO internal, không có trong response schema.                                                                       | `auth.service.ts` select whitelist, `security.e2e-spec.ts` |
| NFR-07 | Rate-limit toàn cục 100 req/60 s/IP (env `THROTTLE_LIMIT`, `THROTTLE_TTL`); endpoint nhạy cảm `POST /auth/login` 5 req/60 s.      | Must   | Vượt → 429 + header `Retry-After`.                                                                                                                                                    | `main.ts`, `auth.controller.ts` `@Throttle`                |
| NFR-08 | Helmet + CORS whitelist theo env `CORS_ORIGIN` với `credentials: true`. Cho phép localhost mọi port (dev) + origin cụ thể (prod). | Must   | Header response có các security header tiêu chuẩn (`X-Content-Type-Options: nosniff`, `X-Frame-Options`, CSP). CORS preflight OPTIONS trả `Access-Control-Allow-Origin` khớp request. | `main.ts:12-49`                                            |
| NFR-09 | Ở `NODE_ENV=production`, 500 response che stack trace, chỉ trả `{statusCode, message, requestId, timestamp}`.                     | Must   | Trigger lỗi 500 giả → response không có field `stack`; stack chỉ trong log server.                                                                                                    | `http-exception.filter.ts:99-109`                          |
| NFR-10 | Mật khẩu băm bcrypt (`salt rounds = 10`); chống user enumeration bằng dummy bcrypt compare khi email không tồn tại.               | Must   | Đăng nhập email không tồn tại và email tồn tại sai password có thời gian phản hồi gần bằng nhau (± 50 ms trong local).                                                                | `auth.service.ts:validateUser()`                           |

### 3.3 Khả dụng & trải nghiệm

| Mã     | Yêu cầu                                                                                                                                                     | MoSCoW | Tiêu chí chấp nhận                                                                                               | Bằng chứng                                                         |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| NFR-11 | Mobile-first: UI hiển thị đúng ở viewport 375×667 (iPhone SE), 390×844 (iPhone 12). Không overflow ngang, nút tối thiểu 44×44 px.                           | Must   | Manual Chrome DevTools responsive mode: không horizontal scroll ở `/menu`, `/cart`, `/checkout`, `/orders/[id]`. | Verify demo thủ công                                               |
| NFR-12 | Mỗi response API có header `X-Request-Id` (UUID v4 nếu client không gửi); mỗi request có đúng 1 dòng log `[HTTP] [requestId] METHOD url status durationMs`. | Must   | Fail path 500 → 1 dòng log level ERROR kèm stack; 4xx → WARN; 2xx → LOG.                                         | `request-logging.middleware.ts`, `request-logging.e2e-spec.ts`     |
| NFR-13 | A11y auth flow tối thiểu: `label for="…"` cho input, `aria-invalid`, `role="alert"` cho thông báo lỗi, focus-visible ring.                                  | Should | `docs/a11y-auth.md` mô tả hạng mục đã audit. Chạy axe-core / Lighthouse A11y ≥ 90 ở form login/register.         | `app/login/page.tsx`, `app/register/page.tsx`, `docs/a11y-auth.md` |
| NFR-14 | Hỗ trợ 2 ngôn ngữ nội dung (UI VI, lỗi kỹ thuật EN theo library).                                                                                           | Won't  | Không làm MVP. Chỉ tiếng Việt cho UI.                                                                            | —                                                                  |

### 3.4 Khả năng triển khai

| Mã     | Yêu cầu                                                                                                                                                                                                                                         | MoSCoW | Tiêu chí chấp nhận                                                                                | Bằng chứng                                               |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| NFR-15 | `GET /health` trả 200 + `{status:"ok", uptime, version}` và trạng thái kết nối DB (`SELECT 1`). Dùng cho healthcheck Docker + smoke test CD.                                                                                                    | Must   | Dừng Postgres → `/health` trả 503 với `db:"down"`. Chạy bình thường → 200 trong < 50 ms.          | `app.controller.ts:21-60`                                |
| NFR-16 | `docker-compose.dev.yml` lên đủ Postgres (healthcheck `pg_isready`) + Adminer. Backend `docker-entrypoint.sh` chạy `prisma migrate deploy` + seed idempotent trước khi start. Clone sạch + `cp .env.example .env` + `npm run dev:db` chạy được. | Must   | Chạy từ repo clone mới → 3 container healthy trong < 30 s (`docker ps --filter "name=brewlite"`). | `docker-compose.dev.yml`, `backend/docker-entrypoint.sh` |
| NFR-17 | Khách và quầy chạy trên 2 port khác nhau (`:3000` và `:3002`) để tách localStorage/cookie — login song song trong cùng browser không đụng.                                                                                                      | Should | `npm run dev:barista` chạy được; backend CORS chấp nhận cả 2 origin.                              | `frontend/package.json`, `backend/.env`                  |

---

## 4. Use-case diagram tổng quát

Xem `docs/diagrams/use-case-overview.puml` (nguồn) và `docs/diagrams/use-case-overview.svg` (kết xuất).

**Tóm tắt actor + use case trong diagram:**

- **Customer:** Xem menu, Tìm/Lọc, Xem chi tiết, Quản lý giỏ, Đăng ký, Đăng nhập, Đặt đơn, Thanh toán, Theo dõi trạng thái, Xem lịch sử, Hủy đơn.
- **Barista:** Đăng nhập, Xem hàng đợi quầy, Chuyển trạng thái đơn, Hủy đơn.
- **Admin:** (bao gồm quyền của Barista) + Quản lý dữ liệu qua Adminer (ngoài hệ thống UI).
- **External — Mock Payment Gateway:** Xử lý thanh toán (được gọi bởi backend trong UC "Thanh toán").

---

## 5. Danh mục mã yêu cầu (quick index)

**FR tổng cộng: 28** (FR-01 … FR-28)
**NFR tổng cộng: 17** (NFR-01 … NFR-17)

**MoSCoW breakdown:**

| MoSCoW | FR                                                                                                 | NFR                                                |
| ------ | -------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Must   | 01, 02, 03, 05, 06, 07, 09, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 25, 26, 27, 28 | 01, 02, 04, 05, 06, 07, 08, 09, 10, 11, 12, 15, 16 |
| Should | 04, 08, 24                                                                                         | 03, 13, 17                                         |
| Could  | —                                                                                                  | —                                                  |
| Won't  | —                                                                                                  | 14                                                 |

Mọi FR/NFR Must có **ít nhất 1 test ánh xạ** trong `docs/traceability-matrix.md`. Tiêu chí chấp nhận viết chủ động ("khi X thì Y") để dịch thẳng thành `describe/it` block.
