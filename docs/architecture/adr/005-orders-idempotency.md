# ADR 005: Idempotency cho `POST /orders` — bảo vệ ở tầng DB và replay response

- **Mã định danh:** ADR-005
- **Trạng thái:** Accepted
- **Ngày quyết định:** 2026-11-05
- **Người đề xuất:** Hoàng Tịnh (DevOps / Architect)
- **Phạm vi ảnh hưởng:** Backend (`orders`, `promotions`), Database schema, Frontend (`checkout`)
- **Liên quan:** ADR-003 §2.2 (idempotency **thanh toán**), ADR-002

---

## 1. Bối cảnh (Context)

Tạo đơn có các side-effect không thể hoàn tác tùy tiện: ghi `Order`, `OrderItem`, `OrderItemTopping`, **tăng `Promotion.usedCount`**, sau đó chuyển sang thanh toán. Nếu `POST /orders` bị gửi hai lần — người dùng bấm đúp, mạng timeout rồi retry, hoặc hai tab cùng submit — hậu quả:

- Hai đơn trùng làm khách bị trừ kho/điểm/thanh toán hai lần.
- Mã giảm giá bị trừ hai lượt cho một lần mua.
- Mã đã hết lượt có thể bị vượt (`usedCount > usageLimit`).

Trong khi ADR-003 đã giải quyết idempotency **thanh toán** (`Payment.idempotencyKey` là khóa chính, sai payload → 422), tạo đơn **không thể** dùng cùng thiết kế vì:

- `Idempotency-Key` là **tùy chọn** (contract v3) — không thể là khóa chính bắt buộc.
- Khi trùng key, hành vi mong muốn là **trả lại đơn cũ (200)** để client tiếp tục thanh toán, không phải báo lỗi.

---

## 2. Quyết định (Decision)

**Dùng ràng buộc unique `(userId, idempotencyKey)` ở tầng DB + fast-path replay trả `200 Idempotent-Replayed: true`.**

### 2.1. Tầng dữ liệu

```prisma
model Order {
  id             Int     @id @default(autoincrement())
  userId         Int
  idempotencyKey String?
  // ...
  @@unique([userId, idempotencyKey])   // composite unique
}
```

- Khóa là **cặp** `(userId, idempotencyKey)` để hai người khác nhau dùng trùng key vẫn tạo được đơn riêng.
- `idempotencyKey` được **chuẩn hóa**: trim, rỗng/toàn khoảng trắng → `null`; cắt tối đa 128 ký tự.

### 2.2. Luồng xử lý

```
POST /orders  (header Idempotency-Key: optional)

1. normalize key
2. nếu có key: findUnique(userId, key)  ──có──▶ 200 + Idempotent-Replayed: true (trả đơn cũ)
3. PricingService tính giá từ DB
4. PromotionsService.evaluate(promo, subtotal)   (ném PROMO_* nếu sai)
5. $transaction:
     create Order (idempotencyKey, subtotal, discount, promoCode, total)
     create OrderItem + OrderItemTopping
     PromotionsService.consumeUsage(tx, promo)   // updateMany WHERE usedCount < usageLimit
6. commit ──▶ 201 Created
```

### 2.3. Xử lý đua (race)

Hai request song song cùng key đều qua bước 2 (chưa thấy đơn) → cả hai vào transaction. DB chỉ cho **một** insert thành công; bên còn lại nhận `P2002` (unique violation). Bắt `P2002` này và **tra lại** đơn theo key:

- Tìm thấy → `200` + `Idempotent-Replayed: true` (không lỗi 500 cho khách).
- Không tìm thấy (hiếm) → `409 Conflict`.

### 2.4. Tăng lượt mã giảm giá có điều kiện

`consumeUsage` dùng `updateMany` với `WHERE usedCount < usageLimit` **trong cùng transaction**:

- Cập nhật được 1 dòng → tăng thành công.
- Cập nhật 0 dòng → mã vừa hết lượt do request khác → ném `PROMO_EXHAUSTED`, **rollback cả đơn**.

Nhờ vậy `usedCount` không bao giờ vượt `usageLimit` kể cả khi nhiều request đồng thời.

---

## 3. Hệ quả (Consequences)

### 3.1. Điểm tích cực (Pros)

- **Không tạo đơn trùng** dù client retry hay bấm đúp; khách nhận đúng một đơn.
- **Không trừ lượt mã hai lần**, không vượt `usageLimit` — bảo vệ ở tầng DB, không chỉ ở application.
- **API thân thiện với retry:** lần lặp trả **200 + `Idempotent-Replayed: true`** kèm đơn cũ, client chuyển sang trang thanh toán mà không cần xử lý lỗi.
- **Không cần bảng phụ** (`IdempotencyRecord`) — chi phí thấp, một index composite.

### 3.2. Đánh đổi (Cons & Mitigations)

| Đánh đổi                                                                                                  | Giảm thiểu                                                                                                                                                                                                        |
| --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Không lưu hash payload** → cùng key + body khác vẫn trả đơn cũ                                          | Chấp nhận cho `/orders` (contract v3 chỉ bắt 422 với `/payments`). FE luôn dùng key mới cho mỗi lần đặt thật; key chỉ tái dùng khi retry. Nếu cần siết: thêm cột `requestHash` + trả `422 IDEMPOTENCY_KEY_REUSED` |
| Key tùy chọn → client cũ không gửi key vẫn tạo trùng nếu retry                                            | FE bắt buộc sinh key (uuid) cho mỗi lượt submit; xem `checkout`                                                                                                                                                   |
| `idempotencyKey` NULL nhiều dòng: Postgres cho phép nhiều NULL trong unique → đơn không key không bị chặn | Đúng như mong muốn: không key = không idempotent                                                                                                                                                                  |
| Bảng `Order` phình theo thời gian                                                                         | Index `@@index([userId, createdAt])` sẵn có; cân nhắc archive > 1 năm                                                                                                                                             |
| Chỉ áp dụng cho tạo đơn, không cho cập nhật                                                               | Các thao tác khác dùng `If-Match`/version hoặc khóa dòng (ADR-003)                                                                                                                                                |

### 3.3. Kiểm chứng

- `backend/test/orders/orders-idempotency.spec.ts` — 2 request tuần tự & **song song** cùng key → 1 đơn; mã chỉ trừ 1 lượt; điểm chỉ cộng 1 lần.
- `backend/test/promotions/promotions.service.spec.ts` — `consumeUsage` ném `PROMO_EXHAUSTED` khi `updateMany` trả 0 dòng.
- `backend/test/orders/orders.e2e-spec.ts` — HTTP lần 2 trả **200 + `Idempotent-Replayed: true`**.

---

## 4. Tham chiếu

- `backend/src/orders/orders.service.ts` (`create`, `findExistingByKey`, `isUniqueViolation`)
- `backend/src/promotions/promotions.service.ts` (`consumeUsage`)
- `backend/prisma/schema.prisma` — `@@unique([userId, idempotencyKey])`
- `docs/api-contract.md` §4 — `POST /orders`, header `Idempotency-Key`, `Idempotent-Replayed`
- ADR-003 §2.2 — idempotency cho `POST /payments`
