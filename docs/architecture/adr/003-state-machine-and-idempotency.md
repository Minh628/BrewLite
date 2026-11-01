# ADR 003: Quản lý trạng thái đơn hàng tập trung, Chống thanh toán lặp bằng Idempotency Key và Khóa lạc quan tồn kho

- **Mã định danh:** ADR-003
- **Trạng thái:** Accepted
- **Ngày quyết định:** 2026-10-31
- **Người đề xuất:** M2 (Software Architect / Tech Lead)
- **Phạm vi ảnh hưởng:** Backend (`orders`, `payments`, `stock`, `promotions`, `loyalty`), Database Schema (Prisma)

---

## 1. Bối cảnh (Context)

Trong Sprint 3 của dự án BrewLite (Hệ thống đặt cà phê không tiền mặt), lưu lượng người dùng và độ phức tạp của các quy trình nghiệp vụ tăng đáng kể. Ba thách thức kỹ thuật trọng yếu xuất hiện:

1. **Phân mảnh logic trạng thái đơn hàng (Order State Lifecycle Fragmentation):**
   - Vòng đời đơn hàng trải qua 7 trạng thái (`PENDING`, `PAID`, `PAYMENT_FAILED`, `PREPARING`, `READY`, `COMPLETED`, `CANCELLED`).
   - Nếu việc cập nhật trường `Order.status` nằm phân tán ở nhiều controller/service khác nhau (`PaymentsService`, `OrdersService`, `BaristaService`), hệ thống dễ rơi vào tình trạng chuyển trạng thái bất hợp lệ (ví dụ: nhảy cóc từ `PENDING` sang thẳng `READY`, hoặc đơn đã `CANCELLED` nhưng nhân viên vẫn bấm `COMPLETED`).
   - Cần một "chốt chặn duy nhất" (Single Source of Truth for State Transitions) để quản lý ma trận chuyển đổi hợp lệ và kích hoạt các tác vụ nghiệp vụ đi kèm (Side-effects / Hooks) một cách nguyên tử.

2. **Rủi ro trừ tiền nhiều lần do mạng chập chờn (Payment Duplication & Idempotency):**
   - Trong môi trường mạng di động không ổn định, request `POST /payments` có thể bị timeout hoặc mất kết nối giữa client và server dù server đã trừ tiền thành công. Khách hàng hoặc ứng dụng client sẽ tự động gửi lại request (Retry).
   - Nếu không có cơ chế chặn trùng lặp, tài khoản khách hàng hoặc hạn mức thẻ sẽ bị trừ nhiều lần cho cùng một đơn hàng.
   - Đồng thời, xuất hiện nguy cơ tấn công giả mạo (Payload Tampering) khi kẻ xấu tái sử dụng cùng một `Idempotency-Key` nhưng gửi kèm tham số gian lận khác (`amount`, `method`, `cardLast4`).

3. **Hiện tượng bán âm kho do đặt hàng đồng thời (Overselling Race Condition):**
   - Trong giờ cao điểm, nhiều khách hàng cùng đặt một món đồ uống (ví dụ: món "Bạc xỉu" chỉ còn 2 ly trong kho nhưng có 5 request thanh toán tới cùng một mili-giây).
   - Nếu dùng cách đọc - kiểm tra - cập nhật thông thường (`SELECT stock ... -> if (stock >= qty) -> UPDATE stock = stock - qty`), hiện tượng Race Condition chắc chắn xảy ra dẫn đến tồn kho bị âm (`stock < 0`).
   - Ngược lại, nếu dùng khóa bi quan toàn bảng (`LOCK TABLE`) hoặc khóa bi quan theo dòng (`SELECT FOR UPDATE`) trên bảng `Product`, toàn bộ các luồng xem menu, tìm kiếm, tính giá giỏ hàng sẽ bị tắc nghẽn nghiêm trọng (blocking), làm sụt giảm throughput của hệ thống.

---

## 2. Quyết định kiến trúc (Decision)

Đội ngũ kiến trúc BrewLite thống nhất triển khai 3 trụ cột giải pháp:

### 2.1. Cỗ máy trạng thái tập trung (`OrderStatusService` & `assertTransition`)

1. **Cấu trúc State Machine thuần túy (`order-state-machine.ts`):**
   - Định nghĩa ma trận các bước chuyển đổi hợp lệ (`TRANSITIONS` Map):
     - `PENDING` $\rightarrow$ `PAID`, `PAYMENT_FAILED`, `CANCELLED`
     - `PAYMENT_FAILED` $\rightarrow$ `PAID`, `PAYMENT_FAILED` (thử lại thất bại), `CANCELLED`
     - `PAID` $\rightarrow$ `PREPARING`, `CANCELLED`
     - `PREPARING` $\rightarrow$ `READY`
     - `READY` $\rightarrow$ `COMPLETED`
     - `COMPLETED`, `CANCELLED`: Trạng thái kết thúc (Terminal States), bất khả biến.
   - Hàm `assertTransition(from, to)` ném lỗi HTTP 409 Conflict với error code `INVALID_TRANSITION` nếu cặp chuyển đổi không hợp lệ.

2. **Chốt chặn tập trung (`OrderStatusService.transition`):**
   - Đây là **nơi duy nhất được phép cập nhật `Order.status`** trên toàn bộ hệ thống:
     ```typescript
     async transition(
       tx: Prisma.TransactionClient,
       orderId: number,
       toStatus: OrderStatus,
       options?: TransitionOptions
     ): Promise<Order>
     ```
   - **Khóa dòng bi quan trên bản ghi đơn hàng:** Thực thi câu lệnh SQL raw:
     ```sql
     SELECT id, status, "userId", total FROM "Order" WHERE id = $1 FOR UPDATE;
     ```
     Điều này đảm bảo tại một thời điểm chỉ có duy nhất 1 tiến trình được thay đổi trạng thái của đơn hàng đó.
   - **Kích hoạt Hook đồng bộ trong Transaction:**
     - Khi vào `PAID`: Kích hoạt Hook tích lũy điểm thưởng thành viên (`LoyaltyService.awardPoints`).
     - Khi vào `CANCELLED`: Kích hoạt Hook hoàn trả tồn kho (`StockService.refundStock`) và hủy điểm tích lũy.

### 2.2. Chống thanh toán lặp bằng `Idempotency-Key` & `requestHash`

1. **Bắt buộc Header `Idempotency-Key`:**
   - Mọi request `POST /payments` bắt buộc phải kèm header `Idempotency-Key: <UUID-v4>`.
   - Bảng `Payment` sử dụng `idempotencyKey String @id` làm khóa chính (Primary Key).

2. **Cơ chế xác thực băm toàn vẹn (`requestHash`):**
   - Server tính toán mã băm SHA-256 từ các trường nghiệp vụ quan trọng:
     ```typescript
     requestHash = crypto
       .createHash('sha256')
       .update(`${orderId}|${method}|${cardLast4 ?? ''}`)
       .digest('hex');
     ```
3. **Quy trình xử lý giao dịch:**
   - Khi nhận request với `Idempotency-Key`:
     - Kiểm tra trong bảng `Payment`:
       - Nếu khóa **đã tồn tại**:
         - So sánh `requestHash` gửi lên với `requestHash` đã lưu trong DB.
         - Nếu **khớp**: Trả về ngay lập tức bản ghi thanh toán đã lưu trước đó kèm mã HTTP `200 OK` (hoặc `201 Created` đã cache), hoàn toàn không gọi lại Cổng thanh toán (Mock Gateway).
         - Nếu **không khớp**: Ném lỗi HTTP `422 Unprocessable Entity` với thông báo _"Idempotency-Key đã được sử dụng cho một yêu cầu khác"_, ngăn chặn triệt để hành vi tráo đổi thông tin thanh toán.
       - Nếu khóa **chưa tồn tại**: Tiến hành khóa dòng đơn hàng (`FOR UPDATE`), kiểm tra trạng thái đơn (`PENDING` hoặc `PAYMENT_FAILED`), gọi Cổng thanh toán và lưu bản ghi `Payment` mới trong cùng transaction.

### 2.3. Kiểm soát tồn kho đồng thời bằng Optimistic Concurrency Control (OCC)

1. **Bổ sung cột `version`:**
   - Bổ sung trường `version Int @default(0)` vào model `Product` trong `schema.prisma`.
2. **Cơ chế trừ tồn kho không khóa đọc (Lock-free Read):**
   - Khi khách đặt hàng, server đọc tồn kho và `version` hiện tại của sản phẩm mà không cần khóa bảng.
   - Khi thanh toán thành công và chốt trừ tồn kho, thực thi câu lệnh cập nhật có điều kiện:
     ```sql
     UPDATE "Product"
     SET stock = stock - :qty,
         version = version + 1
     WHERE id = :productId
       AND version = :currentVersion
       AND stock >= :qty;
     ```
   - **Xử lý xung đột (Conflict Handling):**
     - Nếu số dòng ảnh hưởng (`affected_rows`) bằng 1: Trừ kho thành công.
     - Nếu `affected_rows = 0`: Có thể do món đã hết hàng (`stock < qty`) hoặc một tiến trình khác đã cập nhật trước làm thay đổi `version`. Hệ thống sẽ tự động retry tối đa 3 lần với `version` mới nhất trước khi báo lỗi `409 Conflict` (Hết hàng).

---

## 3. Hệ quả (Consequences)

### 3.1. Điểm tích cực (Pros)

- **Tính toàn vẹn dữ liệu tuyệt đối (Zero Inconsistency):** Không bao giờ xảy ra tình trạng đơn hàng chuyển trạng thái sai lệch hoặc đơn đã hủy vẫn được đem đi pha chế.
- **An toàn tài chính (Financial Safety):** Đảm bảo không bao giờ trừ tiền 2 lần cho dù client retry liên tục khi mạng chập chờn; phát hiện ngay lập tức các nỗ lực tấn công đổi payload.
- **Hiệu năng và thông lượng cao (High Throughput):** Đọc menu và giỏ hàng không bị khóa. Optimistic locking loại bỏ tình trạng kẹt kết nối (deadlock / connection exhaustion) trên bảng `Product`.
- **Dễ dàng kiểm toán (Auditability):** Mọi giao dịch thanh toán đều gắn với `idempotencyKey` và `requestHash` rõ ràng, đối soát độc lập với cổng thanh toán thuận tiện.

### 3.2. Đánh đổi & Giải pháp khắc phục (Cons & Mitigations)

- **Đánh đổi 1:** Backend phải viết thêm logic retry khi gặp xung đột phiên bản `version` ở bảng `Product`.
  - _Giải pháp:_ Viết hàm tiện ích retry tập trung với Exponential Backoff (10ms, 25ms, 50ms) trong `StockService`.
- **Đánh đổi 2:** Cột `idempotencyKey` làm khóa chính có thể khiến bảng `Payment` phình to theo thời gian.
  - _Giải pháp:_ Thiết lập Index tối ưu trên `orderId` và cân nhắc cơ chế dọn dẹp (Housekeeping / Archival) các key cũ sau 90 ngày.
