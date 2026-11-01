# BrewLite API Contract v3.0 (Sprint 3)

> v3 bổ sung so với v2: `POST /promotions/validate`, `promoCode` + `Idempotency-Key` cho `POST /orders`,
> trường `code` trong body lỗi. Các endpoint v2 giữ nguyên trừ khi ghi chú khác.

## I. Quy ước chung

- Base URL: `http://localhost:3001` hoặc biến môi trường `NEXT_PUBLIC_API_URL`
- Định dạng dữ liệu: `application/json`
- Xác thực: Header `Authorization: Bearer <accessToken>` cho các endpoint yêu cầu quyền
- Cấu trúc phản hồi lỗi chuẩn (Global Exception Filter):
  ```json
  {
    "statusCode": 400,
    "message": "Mã giảm giá 'HETHAN' đã hết hạn hoặc chưa tới thời gian sử dụng",
    "error": "Bad Request",
    "code": "PROMO_EXPIRED",
    "path": "/orders",
    "timestamp": "2026-10-12T10:00:00.000Z",
    "requestId": "uuid-v4-string"
  }
  ```
  > `code` chỉ xuất hiện với lỗi nghiệp vụ (PROMO_*, OUT_OF_STOCK, INVALID_TRANSITION…).
- Danh sách HTTP Status Codes quy ước: 200 (OK), 201 (Created), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 409 (Conflict), 422 (Unprocessable Entity), 429 (Too Many Requests), 500 (Internal Server Error)

## II. Danh sách Endpoints chi tiết

### 1. Phân hệ Xác thực (Authentication)

- POST /auth/register
  - Quyền hạn: Public
  - Body:
    ```json
    {
      "email": "customer@brewlite.vn",
      "password": "Password123"
    }
    ```
  - Thành công (201 Created):
    ```json
    {
      "user": { "id": 3, "email": "customer@brewlite.vn" },
      "accessToken": "eyJhbGciOiJIUzI1NiIsIn..."
    }
    ```
  - Lỗi: 400 Bad Request (sai định dạng email, mật khẩu < 8 ký tự), 409 Conflict ("Email already registered"). Tuyệt đối không trả về passwordHash.

- POST /auth/login
  - Quyền hạn: Public
  - Body:
    ```json
    {
      "email": "customer@brewlite.vn",
      "password": "Password123"
    }
    ```
  - Thành công (200 OK):
    ```json
    {
      "accessToken": "eyJhbGciOiJIUzI1NiIsIn...",
      "expiresIn": 3600,
      "user": { "id": 3, "email": "customer@brewlite.vn" }
    }
    ```
  - Lỗi: 401 Unauthorized ("Invalid credentials" - không báo cụ thể sai email hay mật khẩu), 429 Too Many Requests (vượt quá 5 lần gọi/phút).

- GET /auth/me
  - Quyền hạn: Yêu cầu Bearer Token
  - Thành công (200 OK):
    ```json
    {
      "id": 3,
      "email": "customer@brewlite.vn",
      "loyaltyPoints": 0
    }
    ```
  - Lỗi: 401 Unauthorized (thiếu hoặc token không hợp lệ/hết hạn).

### 2. Phân hệ Sản phẩm & Danh mục (Products & Categories)

- GET /categories
  - Quyền hạn: Public
  - Thành công (200 OK):
    ```json
    [
      { "id": 1, "name": "Cà phê" },
      { "id": 2, "name": "Trà" },
      { "id": 3, "name": "Đá xay" }
    ]
    ```

- GET /products?category={id}&q={keyword}
  - Quyền hạn: Public
  - Query Parameters:
    - category: Number (tùy chọn - lọc theo danh mục; số nguyên dương; `category=` rỗng coi như không lọc)
    - q: String (tùy chọn - tìm theo tên, không phân biệt hoa/thường, không phân biệt dấu tiếng Việt: "ca phe" khớp "Cà phê"; tối đa 100 ký tự; rỗng coi như không tìm)
  - Thành công (200 OK):
    ```json
    [
      {
        "id": 1,
        "name": "Cappuccino",
        "price": 45000,
        "imageUrl": "https://...",
        "category": { "id": 1, "name": "Cà phê" },
        "isAvailable": true
      }
    ]
    ```
  - Không có kết quả hoặc danh mục không tồn tại: 200 OK với `[]` (FE hiển thị empty state)
  - Lỗi: 400 Bad Request (category không phải số nguyên dương, q dài quá 100 ký tự, tham số lạ ngoài category/q)

### 3. Phân hệ Đơn hàng (Orders)

- POST /orders
  - Quyền hạn: Yêu cầu Bearer Token
  - Header tùy chọn: `Idempotency-Key: <uuid>` — chống tạo trùng đơn (Sub-task 10.2b).
    Cùng user + cùng key chỉ tạo 1 đơn; request lặp lại trả **200** kèm `Idempotent-Replayed: true`.
    Header rỗng/toàn khoảng trắng coi như không gửi.
  - Cơ chế giá: Server là Single Source of Truth; bỏ qua hoàn toàn các trường giá client gửi kèm, server tự tính đơn giá và thành tiền qua PricingService.
  - Body:
    ```json
    {
      "items": [
        {
          "productId": 3,
          "size": "L",
          "qty": 2,
          "toppingIds": [1, 2]
        },
        {
          "productId": 5,
          "size": "M",
          "qty": 1,
          "toppingIds": []
        }
      ],
      "promoCode": "BREW10"
    }
    ```
    `promoCode` tùy chọn, không phân biệt hoa thường (server tự IN HOA), tối đa 64 ký tự.
  - Thành công (201 Created):
    ```json
    {
      "orderId": 1001,
      "code": "#1001",
      "status": "PENDING",
      "subtotal": 178000,
      "discount": 17800,
      "promoCode": "BREW10",
      "total": 160200,
      "items": [
        { "productId": 3, "size": "L", "qty": 2, "unitPrice": 67000, "lineTotal": 134000 },
        { "productId": 5, "size": "M", "qty": 1, "unitPrice": 44000, "lineTotal": 44000 }
      ],
      "createdAt": "2026-10-12T10:30:00.000Z"
    }
    ```
  - Thành công khi lặp lại key (200 OK + `Idempotent-Replayed: true`): cùng body như trên với `orderId` của đơn đã tạo.
  - Lỗi:
    - 400 Bad Request: items rỗng, qty không thuộc [1..20], size không nằm trong enum (S, M, L), productId hoặc toppingId không tồn tại hoặc đã ngừng bán
    - 400 + `code` mã giảm giá: `PROMO_NOT_FOUND`, `PROMO_INACTIVE`, `PROMO_EXPIRED`, `PROMO_MIN_ORDER`, `PROMO_EXHAUSTED`
    - 401 Unauthorized: thiếu hoặc sai Bearer Token
    - 409 Conflict: xung đột dữ liệu khi tạo đơn

### 4. Phân hệ Khuyến mãi (Promotions) — Sub-task 10.4a

- POST /promotions/validate
  - Quyền hạn: Yêu cầu Bearer Token
  - Body:
    ```json
    { "code": "brew10", "subtotal": 178000 }
    ```
    `code`: chuỗi 1–64 ký tự, không phân biệt hoa thường · `subtotal`: số nguyên ≥ 0 (VND)
  - Thành công (200 OK):
    ```json
    { "code": "BREW10", "discount": 17800 }
    ```
  - Quy tắc tính: PERCENT = `floor(subtotal × value / 100)`, không vượt `maxDiscount`; FIXED = `min(value, subtotal)`; kết quả không vượt `subtotal` và không âm.
  - Lỗi (400 Bad Request + `code`): `PROMO_NOT_FOUND`, `PROMO_INACTIVE`, `PROMO_EXPIRED`, `PROMO_MIN_ORDER`, `PROMO_EXHAUSTED`; 401 khi thiếu/sai token.

### 5. Quy tắc điểm thưởng (Sub-task 10.4c)

- `pointsEarned = floor(total / 10.000)` — tính trên **total sau giảm giá**.
- Cộng điểm **một lần** khi đơn vào `PAID` (hệ thống gọi `LoyaltyService.award` trong cùng transaction với đổi trạng thái); trừ lại khi đơn `PAID → CANCELLED`.
- Gọi lặp (retry, đua idempotency) không cộng đôi: điều kiện `pointsEarned = 0` bảo đảm chỉ một lần cộng thành công.
- Điểm hiện tại trả về ở `GET /auth/me` (`loyaltyPoints`).
