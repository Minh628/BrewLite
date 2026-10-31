# BrewLite API Contract v3.0 (Sprint 3)

Tài liệu hợp đồng giao tiếp API giữa Backend (NestJS) và Frontend (Next.js) cho Sprint 3 (Thanh toán không tiền mặt, State Machine, Khuyến mãi, Lịch sử đơn hàng, Kiểm soát tồn kho đồng thời).

---

## I. Quy ước bổ sung Sprint 3

### 1. Quy ước chung

- **Base URL**: `http://localhost:3001` hoặc biến môi trường `NEXT_PUBLIC_API_URL`
- **Định dạng dữ liệu**: `application/json`
- **Xác thực**: Header `Authorization: Bearer <accessToken>` cho các endpoint yêu cầu quyền.
- **Phân quyền (RBAC)**: Phân quyền theo trường `role` trong payload của JWT (`CUSTOMER`, `BARISTA`, `ADMIN`).

### 2. Header Idempotency (Chống lặp thanh toán & đơn hàng)

- **Header gửi lên**: `Idempotency-Key: <uuid>`
  - **Bắt buộc** đối với `POST /payments`.
  - **Tùy chọn** đối với `POST /orders`.
- **Header phản hồi khi xử lý trùng lặp**: `Idempotent-Replayed: true` (HTTP 200) khi client gửi lại cùng `Idempotency-Key` và cùng nội dung payload.

### 3. Cấu trúc phản hồi lỗi chuẩn (Global Exception Filter)

Mọi phản hồi lỗi (4xx, 5xx) đều tuân theo định dạng JSON thống nhất:

```json
{
  "statusCode": 400,
  "code": "IDEMPOTENCY_KEY_REQUIRED",
  "message": "Thiếu header Idempotency-Key khi thực hiện thanh toán",
  "error": "Bad Request",
  "path": "/payments",
  "timestamp": "2026-11-02T10:00:00.000Z",
  "requestId": "uuid-v4-string"
}
```

### 4. Bảng mã lỗi nghiệp vụ mới (Sprint 3)

| HTTP Code | `code` nghiệp vụ           | Khi nào xảy ra                                                    | Chi tiết bổ sung trong body                  |
| :-------- | :------------------------- | :---------------------------------------------------------------- | :------------------------------------------- |
| **400**   | `IDEMPOTENCY_KEY_REQUIRED` | Thiếu header `Idempotency-Key` ở API thanh toán                   | —                                            |
| **400**   | `PROMO_NOT_FOUND`          | Mã khuyến mãi không tồn tại                                       | —                                            |
| **400**   | `PROMO_EXPIRED`            | Mã khuyến mãi đã hết hạn sử dụng                                  | —                                            |
| **400**   | `PROMO_MIN_ORDER`          | Đơn hàng chưa đạt giá trị tối thiểu để áp dụng                    | —                                            |
| **400**   | `PROMO_EXHAUSTED`          | Mã khuyến mãi đã hết lượt sử dụng                                 | —                                            |
| **403**   | `FORBIDDEN_ROLE`           | Khách hàng (`CUSTOMER`) cố tình gọi API quầy pha chế              | —                                            |
| **404**   | —                          | Đơn hàng không tồn tại **hoặc không thuộc quyền sở hữu của user** | —                                            |
| **409**   | `INVALID_TRANSITION`       | Vi phạm luồng máy trạng thái đơn hàng (State Machine)             | `currentStatus`, `targetStatus`              |
| **409**   | `ORDER_NOT_PAYABLE`        | Thanh toán đơn không ở trạng thái `PENDING` hoặc `PAYMENT_FAILED` | `currentStatus`                              |
| **409**   | `OUT_OF_STOCK`             | Món hết hàng khi đặt đồng thời                                    | `{ "code": "OUT_OF_STOCK", "productId": 9 }` |
| **422**   | `IDEMPOTENCY_KEY_REUSED`   | Dùng lại `Idempotency-Key` cũ nhưng gửi kèm payload khác          | —                                            |

---

## II. Danh sách Endpoints chi tiết

### 1. Phân hệ Xác thực (Authentication)

#### POST /auth/register

- **Quyền**: Public
- **Body**:
  ```json
  {
    "email": "customer@brewlite.vn",
    "password": "Password123"
  }
  ```
- **Thành công (201 Created)**:
  ```json
  {
    "user": { "id": 3, "email": "customer@brewlite.vn", "role": "CUSTOMER" },
    "accessToken": "eyJhbGciOiJIUzI1NiIsIn..."
  }
  ```
- **Lỗi**: 400 Bad Request, 409 Conflict ("Email already registered"). Tuyệt đối không trả về `passwordHash`.

#### POST /auth/login

- **Quyền**: Public
- **Body**:
  ```json
  {
    "email": "customer@brewlite.vn",
    "password": "Password123"
  }
  ```
- **Thành công (200 OK)**:
  ```json
  {
    "accessToken": "eyJhbGciOiJIUzI1NiIsIn...",
    "expiresIn": 3600,
    "user": { "id": 3, "email": "customer@brewlite.vn", "role": "CUSTOMER" }
  }
  ```
- **Lỗi**: 401 Unauthorized ("Invalid credentials"), 429 Too Many Requests.

#### GET /auth/me

- **Quyền**: Yêu cầu Bearer Token
- **Thành công (200 OK)**:
  ```json
  {
    "id": 3,
    "email": "customer@brewlite.vn",
    "role": "CUSTOMER",
    "loyaltyPoints": 16
  }
  ```
- **Lỗi**: 401 Unauthorized.

---

### 2. Phân hệ Sản phẩm & Danh mục (Products & Categories)

#### GET /categories

- **Quyền**: Public
- **Thành công (200 OK)**:
  ```json
  [
    { "id": 1, "name": "Cà phê" },
    { "id": 2, "name": "Trà" },
    { "id": 3, "name": "Đá xay" }
  ]
  ```

#### GET /products?category={id}&q={keyword}

- **Quyền**: Public
- **Query Parameters**:
  - `category`: Number (tùy chọn)
  - `q`: String (tùy chọn)
- **Thành công (200 OK)**:
  ```json
  [
    {
      "id": 1,
      "name": "Cappuccino",
      "price": 45000,
      "imageUrl": "https://...",
      "category": { "id": 1, "name": "Cà phê" },
      "isAvailable": true,
      "inStock": true
    }
  ]
  ```

#### GET /products/:id

- **Quyền**: Public
- **Thành công (200 OK)**: Chi tiết sản phẩm kèm toppings khả dụng và trạng thái `inStock`.

#### GET /toppings

- **Quyền**: Public
- **Thành công (200 OK)**: Danh sách topping khả dụng.

---

### 3. Phân hệ Khuyến mãi (Promotions)

#### POST /promotions/validate

- **Mục đích**: Kiểm tra tính hợp lệ của mã giảm giá trước khi đặt hàng.
- **Quyền**: Yêu cầu Bearer Token
- **Headers**:
  - `Authorization: Bearer <accessToken>`
- **Body**:
  ```json
  {
    "code": "brew10",
    "subtotal": 178000
  }
  ```
- **Thành công (200 OK)**:
  ```json
  {
    "code": "BREW10",
    "discount": 17800
  }
  ```
- **Lỗi**:
  - 400 Bad Request kèm code: `PROMO_NOT_FOUND`, `PROMO_EXPIRED`, `PROMO_MIN_ORDER`, `PROMO_EXHAUSTED`.
  - 401 Unauthorized.

---

### 4. Phân hệ Đơn hàng (Orders)

#### POST /orders

- **Quyền**: Yêu cầu Bearer Token
- **Headers**:
  - `Authorization: Bearer <accessToken>`
  - `Idempotency-Key: <uuid>` (Tùy chọn)
- **Cơ chế tính toán**: Server là Single Source of Truth; tính toán `subtotal`, kiểm tra và trừ lượt dùng `promoCode`, kiểm tra tồn kho đồng thời, trừ tồn kho và tính `total = subtotal - discount`.
- **Body**:
  ```json
  {
    "items": [
      {
        "productId": 3,
        "size": "L",
        "qty": 2,
        "toppingIds": [1, 2]
      }
    ],
    "promoCode": "BREW10"
  }
  ```
- **Thành công (201 Created)**:
  ```json
  {
    "orderId": 1001,
    "code": "#1001",
    "status": "PENDING",
    "subtotal": 178000,
    "discount": 17800,
    "total": 160200,
    "items": [
      {
        "productId": 3,
        "size": "L",
        "qty": 2,
        "unitPrice": 67000,
        "lineTotal": 134000
      }
    ],
    "createdAt": "2026-11-02T10:30:00.000Z"
  }
  ```
- **Xử lý lặp (200 OK + Header `Idempotent-Replayed: true`)**: Nếu gửi cùng `Idempotency-Key` và cùng payload, trả lại đơn hàng đã tạo trước đó.
- **Lỗi**:
  - 400 Bad Request: Dữ liệu items không hợp lệ hoặc các mã lỗi `PROMO_*`.
  - 401 Unauthorized: Thiếu hoặc sai token.
  - 409 Conflict: Mã lỗi `OUT_OF_STOCK` kèm `{ "productId": 9 }` nếu sản phẩm vừa hết hàng.
  - 422 Unprocessable Entity: `IDEMPOTENCY_KEY_REUSED` (gửi lại cùng key với payload khác).

#### GET /orders/me?page=1&limit=10

- **Mục đích**: Lấy danh sách lịch sử đơn hàng của người dùng hiện tại (phân trang).
- **Quyền**: Yêu cầu Bearer Token
- **Query Parameters**:
  - `page`: Number (mặc định 1)
  - `limit`: Number (mặc định 10)
- **Thành công (200 OK)**:
  ```json
  {
    "items": [
      {
        "orderId": 1001,
        "code": "#1001",
        "status": "PAID",
        "total": 160200,
        "itemCount": 2,
        "createdAt": "2026-11-02T10:30:00.000Z"
      }
    ],
    "page": 1,
    "limit": 10,
    "totalItems": 1,
    "totalPages": 1
  }
  ```
- **Lỗi**: 401 Unauthorized.

#### GET /orders/:id

- **Mục đích**: Lấy thông tin chi tiết một đơn hàng để hiển thị xác nhận đơn hoặc xem lại.
- **Quyền**: Yêu cầu Bearer Token (chỉ xem được đơn của chính mình; đơn của người khác trả 404 để bảo mật).
- **Thành công (200 OK)**:
  ```json
  {
    "orderId": 1001,
    "code": "#1001",
    "status": "PAID",
    "subtotal": 178000,
    "discount": 17800,
    "promoCode": "BREW10",
    "total": 160200,
    "pointsEarned": 16,
    "createdAt": "2026-11-02T10:30:00.000Z",
    "items": [
      {
        "productId": 3,
        "productName": "Trà đào cam sả",
        "size": "L",
        "qty": 2,
        "unitPrice": 67000,
        "lineTotal": 134000,
        "toppings": [
          { "id": 1, "name": "Trân châu trắng", "price": 10000 },
          { "id": 2, "name": "Đào miếng", "price": 12000 }
        ]
      }
    ],
    "payment": {
      "method": "CARD",
      "cardLast4": "4242",
      "paidAt": "2026-11-02T10:31:00.000Z"
    }
  }
  ```
- **Lỗi**:
  - 401 Unauthorized.
  - 404 Not Found (đơn không tồn tại hoặc không thuộc user hiện tại).

#### PATCH /orders/:id/status

- **Mục đích**: Cập nhật trạng thái chế biến của đơn hàng theo State Machine.
- **Quyền**: Yêu cầu Bearer Token với vai trò `BARISTA` hoặc `ADMIN`.
- **Headers**:
  - `Authorization: Bearer <accessToken>`
- **Body**:
  ```json
  {
    "status": "PREPARING"
  }
  ```
  _(Các trạng thái hợp lệ nhận từ quầy: `PREPARING`, `READY`, `COMPLETED`)_
- **Thành công (200 OK)**:
  ```json
  {
    "orderId": 1001,
    "code": "#1001",
    "status": "PREPARING",
    "updatedAt": "2026-11-02T10:35:00.000Z"
  }
  ```
- **Lỗi**:
  - 401 Unauthorized: Chưa đăng nhập.
  - 403 Forbidden: Mã lỗi `FORBIDDEN_ROLE` (khách hàng cố gọi API quầy pha chế).
  - 404 Not Found: Đơn hàng không tồn tại.
  - 409 Conflict: Mã lỗi `INVALID_TRANSITION` (vi phạm luồng máy trạng thái).

---

### 5. Phân hệ Thanh toán (Payments)

#### POST /payments

- **Mục đích**: Thực hiện thanh toán không tiền mặt cho một đơn hàng.
- **Quyền**: Yêu cầu Bearer Token
- **Headers**:
  - `Authorization: Bearer <accessToken>`
  - `Idempotency-Key: <uuid>` **(Bắt buộc)**
- **Body**:

  ```json
  {
    "orderId": 1001,
    "method": "CARD",
    "cardNumber": "4242424242424242"
  }
  ```

  _(method: `"CARD"` \| `"WALLET"`. `cardNumber` bắt buộc nếu method là `CARD`)_

- **Thành công (201 Created)**:

  ```json
  {
    "orderId": 1001,
    "status": "PAID",
    "amount": 160200,
    "method": "CARD",
    "cardLast4": "4242",
    "pointsEarned": 16
  }
  ```

- **Thất bại thẻ (201 Created)**:

  ```json
  {
    "orderId": 1001,
    "status": "PAYMENT_FAILED",
    "reason": "Thẻ bị từ chối"
  }
  ```

- **Xử lý lặp (200 OK + Header `Idempotent-Replayed: true`)**:
  Khi client gửi lại cùng `Idempotency-Key` và cùng payload, server trả về kết quả thanh toán trước đó kèm header `Idempotent-Replayed: true`.

- **Lỗi**:
  - 400 Bad Request: Thiếu thông tin hoặc mã lỗi `IDEMPOTENCY_KEY_REQUIRED` (thiếu header `Idempotency-Key`).
  - 401 Unauthorized: Thiếu hoặc sai token.
  - 404 Not Found: Đơn không tồn tại hoặc không thuộc user hiện tại.
  - 409 Conflict: Mã lỗi `ORDER_NOT_PAYABLE` (đơn không ở trạng thái `PENDING` hoặc `PAYMENT_FAILED`).
  - 422 Unprocessable Entity: Mã lỗi `IDEMPOTENCY_KEY_REUSED` (sử dụng lại `Idempotency-Key` với payload khác).
