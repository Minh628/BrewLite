# Quy ước thiết kế & Tích hợp API (API Conventions)

Tài liệu chuẩn hóa giao thức giao tiếp, định dạng dữ liệu, quy ước xử lý lỗi và cấu hình bảo mật giữa Frontend và Backend cho hệ thống BrewLite (thuộc Sub-task 14.3).

---

## 1. Địa chỉ gốc & Đánh phiên bản (Base URL & Versioning)

- **Backend Base URL (Local):** `http://localhost:3001`
- **Frontend URL (Local):** `http://localhost:3000`
- **Health Check Endpoint:** `GET /health` (trả về trạng thái hoạt động của service, không yêu cầu xác thực).
- **Domain API Resource:**
  - Menu & Sản phẩm: `/products`
  - Đơn hàng: `/orders`
  - Thanh toán: `/payments`
  - Xác thực người dùng: `/auth`

---

## 2. Tiêu đề HTTP (Request Headers)

Mọi yêu cầu gửi từ Frontend tới Backend cần tuân thủ các header chuẩn sau:

| Header            | Bắt buộc                        | Mô tả / Giá trị mẫu                                                    |
| :---------------- | :------------------------------ | :--------------------------------------------------------------------- |
| `Content-Type`    | Có (với POST, PUT, PATCH)       | `application/json`                                                     |
| `Accept`          | Khuyến nghị                     | `application/json`                                                     |
| `Authorization`   | Có (với endpoint bảo vệ)        | `Bearer <JWT_TOKEN>`                                                   |
| `Idempotency-Key` | **Bắt buộc với POST /payments** | Chuỗi UUID v4 duy nhất cho mỗi giao dịch để chống thanh toán trùng lặp |

---

## 3. Chính sách CORS (Cross-Origin Resource Sharing)

Backend áp dụng CORS linh hoạt dựa theo biến môi trường `CORS_ORIGIN`:

- **Biến môi trường:** `CORS_ORIGIN` trong file `.env`.
- **Giá trị mặc định (Fallback):** `http://localhost:3000`
- **Hỗ trợ đa domain:** Có thể cấu hình nhiều domain phân tách bởi dấu phẩy, ví dụ:
  ```env
  CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:3000
  ```
- **Credentials:** Bật `credentials: true` cho phép gửi cookie / token xác thực an toàn.
- **Allowed Methods:** `GET, HEAD, PUT, PATCH, POST, DELETE, OPTIONS`.
- **Allowed & Exposed Headers:** Cho phép và công khai header `Idempotency-Key`.

---

## 4. Kiểm tra sức khỏe hệ thống (Health Check)

Endpoint phục vụ Docker healthcheck probe và giám sát liveness:

- **Method & Path:** `GET /health`
- **Mã phản hồi:** `200 OK`
- **Dữ liệu trả về (JSON):**
  ```json
  {
    "status": "ok",
    "timestamp": "2026-10-02T06:50:00.000Z",
    "uptime": 34.56,
    "service": "brewlite-backend"
  }
  ```

---

## 5. Quy chuẩn Mã phản hồi HTTP (HTTP Status Codes)

| Mã trạng thái        | Ý nghĩa              | Khi nào sử dụng                                                   |
| :------------------- | :------------------- | :---------------------------------------------------------------- |
| `200 OK`             | Thành công           | Trả về dữ liệu cho các truy vấn `GET`, `PUT`, `PATCH`.            |
| `201 Created`        | Tạo mới thành công   | Tạo mới bản ghi thành công qua `POST` (Order, Payment,...).       |
| `400 Bad Request`    | Dữ liệu không hợp lệ | Vi phạm validation của DTO hoặc truyền thừa field bị chặn.        |
| `401 Unauthorized`   | Chưa xác thực        | Thiếu token hoặc token JWT hết hạn/không hợp lệ.                  |
| `403 Forbidden`      | Không có quyền       | Đã đăng nhập nhưng không đủ quyền truy cập tài nguyên.            |
| `404 Not Found`      | Không tìm thấy       | ID sản phẩm, đơn hàng,... không tồn tại trong hệ thống.           |
| `409 Conflict`       | Xung đột dữ liệu     | Trùng lặp dữ liệu độc bản (Unique) hoặc Idempotency-Key đã xử lý. |
| `500 Internal Error` | Lỗi máy chủ          | Lỗi ngoại lệ chưa được xử lý từ phía server.                      |

---

## 6. Định dạng phản hồi lỗi chuẩn hóa (Error Response Format)

Mọi lỗi ném ra từ Backend (4xx hoặc 5xx) đều được bộ lọc toàn cục `HttpExceptionFilter` chuẩn hóa theo cấu trúc thống nhất:

```json
{
  "statusCode": 400,
  "message": ["tên sản phẩm không được để trống", "giá phải lớn hơn 0"],
  "error": "Bad Request",
  "path": "/products",
  "timestamp": "2026-10-02T06:50:00.000Z"
}
```

_Lưu ý đối với Frontend:_

- Thuộc tính `message` có thể là một chuỗi (`string`) hoặc mảng chuỗi (`string[]`) đối với lỗi validation.
- Frontend nên kiểm tra `Array.isArray(response.data.message)` để hiển thị thông báo lỗi phù hợp trên UI.

---

## 7. Quy tắc xác thực dữ liệu đầu vào (Validation Rules)

Toàn bộ payload đầu vào được xử lý qua `ValidationPipe` toàn cục:

1. **Whitelist:** Tự động loại bỏ các thuộc tính không được khai báo trong DTO.
2. **ForbidNonWhitelisted (`true`):** Báo lỗi `400 Bad Request` nếu client gửi kèm các trường dữ liệu lạ/không hợp lệ.
3. **Transform (`true`):** Tự động chuyển đổi kiểu dữ liệu tương thích (chuỗi số sang `number`, chuỗi ngày sang `Date`).
