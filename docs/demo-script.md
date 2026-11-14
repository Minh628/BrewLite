# BrewLite — Kịch bản Sprint Review (demo cuối)

> Sprint Review v1.0.0 · T3 03/11/2026, 19:30 · **≤ 15 phút**
>
> Người viết: M4 (Hoàng Tịnh) — Sub-task **31.3**. Người dẫn: M1.

---

## 0. Chuẩn bị trước khi bắt đầu (10 phút trước giờ)

| #   | Việc cần làm                                                                                                                | Người làm |
| --- | --------------------------------------------------------------------------------------------------------------------------- | --------- |
| 1   | `docker compose up --build` chạy sẵn từ clone sạch; đợi 3 dịch vụ `healthy`                                                 | M5        |
| 2   | Seed lại DB để dữ liệu sạch (tồn kho, lượt mã, điểm = 0)                                                                    | M1        |
| 3   | Mở sẵn 5 tab: (a) UI BrewLite, (b) Swagger `/api-docs`, (c) Adminer `:8080`, (d) terminal `npm test`, (e) trang lịch sử đơn | M1        |
| 4   | Đăng nhập sẵn bằng `customer@brewlite.vn` / `Password123` ở tab UI                                                          | M4        |
| 5   | Kiểm tra cấu hình VNPay Sandbox (`TMN_CODE`, `HASH_SECRET`) và mã `BREW10` còn lượt                                         | M3        |

**Tài khoản test**

| Vai trò | Email                  | Mật khẩu      |
| ------- | ---------------------- | ------------- |
| Khách   | `customer@brewlite.vn` | `Password123` |
| Quầy    | `barista@brewlite.vn`  | `matkhau123`  |
| Admin   | `admin@brewlite.vn`    | `matkhau123`  |
| Khách 2 | `an@brewlite.vn`       | `matkhau123`  |

**Dữ liệu test**

| Mục                   | Giá trị                                                                   |
| --------------------- | ------------------------------------------------------------------------- |
| VNPay thành công      | `vnp_ResponseCode=00` (qua `/payments/vnpay/create-url` → `vnpay-return`) |
| VNPay thất bại / hủy  | `vnp_ResponseCode=24` (khách hủy) hoặc `99` → `PAYMENT_FAILED`            |
| Mã giảm giá dùng được | `BREW10` (10%, trần 20.000đ) · `GIAM15K` (15.000đ, đơn ≥ 100.000đ)        |
| Mã giảm giá lỗi       | `HETHAN` (hết hạn → `PROMO_EXPIRED`)                                      |
| Món hết hàng          | "Bạc xỉu" (tồn kho 0)                                                     |

**Bảng giá seed (dùng cho toàn bộ kịch bản)**

| #   | Sản phẩm   | Giá S (base) | Size M | Size L  | Tồn kho |
| --- | ---------- | ------------ | ------ | ------- | ------- |
| 1   | Ca phe sua | 35.000đ      | +5.000 | +10.000 | 100     |
| 2   | Americano  | 40.000đ      | +5.000 | +10.000 | 100     |
| 3   | Cappuccino | 45.000đ      | +5.000 | +10.000 | 100     |
| 4   | Tra dao    | 39.000đ      | +5.000 | +10.000 | 100     |
| 5   | Bạc xỉu    | 35.000đ      | +5.000 | +10.000 | **0**   |

| Topping (id)        | Giá      |
| ------------------- | -------- |
| 1 · Trân châu đen   | +5.000đ  |
| 2 · Trân châu trắng | +7.000đ  |
| 3 · Thạch trái cây  | +6.000đ  |
| 4 · Pudding trứng   | +8.000đ  |
| 5 · Kem Cheese      | +10.000đ |

---

## 1. Kịch bản 15 phút

### (1 phút) Mở đầu

**M1:** nhắc mục tiêu sản phẩm, 3 Sprint, phạm vi Sprint 3 (chỉ Must 37 SP), quyết định **không làm trang Admin**, **API quầy là bắt buộc**.

### (1 phút) Sản phẩm chạy được từ một lệnh

**M5:** cho xem terminal `docker compose up --build` — 3 dịch vụ `frontend / backend / postgres` đều `healthy`; không thao tác DB thủ công.

### (2 phút) Menu → Giỏ → Món hết hàng

**M1** (vai khách):

1. Mở Menu; lọc danh mục "Cà phê"; tìm `ca phe` (không dấu) → vẫn khớp.
2. Vào **Cappuccino** (45.000đ) → chọn size **L** (+10.000đ), topping **Trân châu đen** (+5.000đ) + **Kem Cheese** (+10.000đ) → đơn giá **70.000đ**, số lượng **×2** → 140.000đ.
3. Thêm **Trà đào** size **M** (39.000 + 5.000 = **44.000đ**) ×1. Giỏ: tạm tính **184.000đ**.
4. Mở **Bạc xỉu** → nhãn **"Hết hàng"**, nút "Thêm vào giỏ" bị tắt → không thêm được. _(10.3 — M1)_

### (2 phút) Thanh toán thất bại → thử lại → thành công

**M3** bấm **Thanh toán qua VNPay**, mô phỏng hủy/lỗi tại cổng VNPay (`vnp_ResponseCode=24`) → quay về **PAYMENT_FAILED**.

**M4** (phần 24.2):

- Nút Thanh toán có **loading**, bấm đúp **không** sinh request tạo đơn thứ hai.
- Trang chi tiết đơn hiện trạng thái `PAYMENT_FAILED` cùng nút **"Thử thanh toán lại qua VNPay"**.
- Bấm thử lại qua VNPay thành công (`vnp_ResponseCode=00`) → **PAID** → chuyển trang xác nhận, giỏ được xóa. _(Task 8, PB-24)_

### (3 phút) Mã giảm giá + điểm thưởng (phần M4)

**M4** trên Swagger:

1. `POST /promotions/validate` với `{"code":"brew10","subtotal":184000}` → **`{"code":"BREW10","discount":18400}`** (chuẩn hóa chữ thường → IN HOA).
2. Thử `HETHAN` → **400 `PROMO_EXPIRED`**; thử `GIAM15K` với đơn 44.000đ → **400 `PROMO_MIN_ORDER`**; thử `GIAM15K` với 184.000đ → **`discount: 15000`** (FIXED, không bị trần).
3. Tạo đơn có mã:
   ```json
   POST /orders
   { "items":[{"productId":3,"size":"L","qty":2,"toppingIds":[1,5]},
              {"productId":4,"size":"M","qty":1}],
     "promoCode":"BREW10" }
   ```
   → **201** `subtotal: 184000, discount: 18400, total: 165600, status: PENDING`.
4. Thanh toán đơn đó qua **VNPay** (`vnp_ResponseCode=00`) → **`/auth/me`** cho thấy `loyaltyPoints: 16` (`floor(165600 / 10000)`).

> Nếu đã làm stretch **PB-27** thì làm bước 1–3 này ngay trên UI `/checkout`.

### (2 phút) Idempotency — gửi lặp không tạo đơn trùng

**M4** trên Swagger, gửi **hai lần** cùng `Idempotency-Key: demo-key-1`:

- Lần 1 → **201** đơn mới.
- Lần 2 → **200** kèm header **`Idempotent-Replayed: true`** và **cùng `orderId`**.
- Adminer (`:8080`) → bảng `Order` chỉ có **1 dòng** với `idempotencyKey = demo-key-1`.

### (2 phút) Quầy pha chế & lịch sử đơn

**M5** trên Swagger, đăng nhập `barista@brewlite.vn`:

- `PATCH /orders/:id/status` `PAID → PREPARING → READY → COMPLETED` → 3 × **200**.
- Thử `READY → PREPARING` → **409 `INVALID_TRANSITION`**. Thử bằng token khách → **403**. _(10.1 — M2, M5)_

> Nếu đã làm stretch **PB-32a** thì thao tác trên trang `/barista`.

**M2** mở trang xác nhận `/orders/[id]`; **M5** mở "Đơn của tôi" `/orders` → trạng thái `COMPLETED`, phân trang đúng. _(Task 9)_

### (2 phút) Test bắt buộc của Task 10 chạy trong CI

**M1** chạy `npm test` ở backend, chỉ ra:

| Test bắt buộc                                             | Kết quả |
| --------------------------------------------------------- | ------- |
| (a) 49 cặp chuyển trạng thái (M2)                         | xanh    |
| (b) Idempotency tạo đơn + điểm thưởng chỉ cộng 1 lần (M4) | xanh    |
| (c) 20 request đồng thời với tồn kho 5 → đúng 5 đơn (M1)  | xanh    |

Tổng: **208 test** xanh.

### (1 phút) Kết thúc

**M1:** trình bày tài liệu bàn giao (`README`, `architecture v3`, `api-contract v3`, `deployment`, `release-notes`, `demo-script`), Burndown 3 Sprint, biên bản nghiệm thu, danh sách hạng mục stretch chưa làm, tag **v1.0.0**.

---

## 2. Số liệu chuẩn cho demo

> Tính theo **giá seed thực tế** (đã kiểm chứng bằng API trên DB thật, 01/11/2026).

| Bước                                                                         | Giá trị                               |
| ---------------------------------------------------------------------------- | ------------------------------------- |
| Cappuccino L (45.000 + 10.000) + Trân châu đen (5.000) + Kem Cheese (10.000) | **70.000đ** × 2 = **140.000đ**        |
| Trà đào M (39.000 + 5.000)                                                   | **44.000đ**                           |
| Tạm tính (subtotal)                                                          | **184.000đ**                          |
| BREW10                                                                       | 10% = 18.400đ (dưới trần 20.000đ)     |
| Tổng phải trả (total)                                                        | **165.600đ**                          |
| Điểm thưởng                                                                  | floor(165.600 / 10.000) = **16 điểm** |
| GIAM15K trên đơn này (nếu dùng thay BREW10)                                  | **15.000đ** (FIXED) → total 169.000đ  |

---

## 3. Phương án dự phòng

| Sự cố                                    | Xử lý nhanh                                                                                                                       |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Docker chưa lên kịp                      | Demo bằng `npm run dev` ở backend + frontend; M1 ghi chú "đã xác nhận compose ở đợt 2".                                           |
| Seed bẩn (mã/điểm/tồn kho đã dùng)       | Chạy lại `npm run prisma:seed` trước Review; phần seed idempotent không reset `usedCount`, nên dùng DB sạch hoặc reset container. |
| Mã `BREW10` hết lượt                     | Dùng `GIAM15K` với đơn ≥ 100.000đ, hoặc `DELETE FROM "Promotion"` rồi seed lại.                                                   |
| Không có UI mã giảm giá (PB-27 chưa làm) | Làm theo §1 bước "Mã giảm giá" trên Swagger — backend là nguồn sự thật.                                                           |
| Thanh toán chập chờn                     | M3 làm lại đơn qua Swagger; UI thử lại với **Ví** (key thanh toán mới).                                                           |
| Mạng hỏng khi thanh toán                 | Nhấn "Thử lại" — gửi **cùng key**, không tạo đơn/trừ tiền lần hai.                                                                |
