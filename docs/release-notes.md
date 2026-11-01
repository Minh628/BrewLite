# BrewLite — Release Notes v1.0.0

> Bản bàn giao cuối dự án · Sprint 3 (02/11 – 03/11/2026) · Trạng thái: dự thảo chờ nghiệm thu đợt 2
>
> Người viết: M4 (Hoàng Tịnh) — Sub-task **31.3**. Cập nhật lần cuối: 03/11/2026.

---

## 1. Highlights

BrewLite v1.0.0 là bản hoàn chỉnh của ứng dụng đặt cà phê không dùng tiền mặt, gồm:

| Nhóm       | Tính năng chính                                                                                      |
| ---------- | ---------------------------------------------------------------------------------------------------- |
| Menu       | Danh sách sản phẩm từ API, lọc theo danh mục, tìm theo tên (không phân biệt dấu), nhãn "Hết hàng"    |
| Chi tiết   | Chọn size (S/M/L), chọn topping, giá tính theo quy tắc dùng chung FE–BE                              |
| Giỏ hàng   | Thêm/sửa số lượng/xóa, gộp dòng theo cấu hình, lưu localStorage, badge số lượng                      |
| Tài khoản  | Đăng ký, đăng nhập JWT, route guard, đăng xuất, bảo vệ POST /orders                                  |
| Đặt đơn    | Tạo đơn `PENDING`, giá do server tính, **mã giảm giá** (mới), **chống tạo trùng đơn** (mới)          |
| Thanh toán | Ví/Thẻ (mock), thành công → `PAID`, thất bại → `PAYMENT_FAILED`, thử lại được                        |
| Nghiệp vụ  | State Machine 7 trạng thái, tồn kho optimistic locking, **điểm thưởng** (mới), thanh toán idempotent |
| Lịch sử    | Trang xác nhận `/orders/[id]`, "Đơn của tôi" `/orders` có phân trang                                 |
| Vận hành   | `docker compose up --build` chạy 3 dịch vụ, Swagger, CI, log có requestId                            |

---

## 2. Thay đổi kỹ thuật trong Sprint 3 (phần M4)

### 2.1 Task 10.4 — Khuyến mãi & điểm thưởng

| Sub-task  | Nội dung                                                                                                                                                                                                                                                                    | File                                                              |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| **10.4a** | `PromotionsService.validate(code, subtotal)` — kiểm tra tồn tại, `isActive`, trong hạn, `subtotal ≥ minOrder`, còn lượt; tính giảm PERCENT (trần `maxDiscount`) / FIXED, không vượt subtotal. Endpoint `POST /promotions/validate`.                                         | `backend/src/promotions/`                                         |
| **10.4b** | `POST /orders` nhận `promoCode` (không phân biệt hoa thường): lưu `subtotal`, `discount`, `promoCode`, `total = subtotal − discount`; tăng `usedCount` **có điều kiện trong cùng transaction** (`updateMany ... WHERE usedCount < usageLimit`). Hết lượt → rollback cả đơn. | `backend/src/orders/orders.service.ts`, `dto/create-order.dto.ts` |
| **10.4c** | `LoyaltyService.award/revoke` — `pointsEarned = floor(total / 10.000)`, cộng `User.loyaltyPoints` **một lần** khi đơn vào `PAID`, trừ lại khi `PAID → CANCELLED`. Chống cộng đôi bằng `updateMany ... WHERE pointsEarned = 0`.                                              | `backend/src/loyalty/loyalty.service.ts`                          |

### 2.2 Task 10.2 — Idempotency tạo đơn

| Sub-task  | Nội dung                                                                                                                                                                                                                     | File                                                                        |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| **10.2b** | `POST /orders` nhận header `Idempotency-Key`: unique `(userId, idempotencyKey)`; request lặp lại (hoặc đua) trả **HTTP 200** kèm header `Idempotent-Replayed: true` và đơn cũ. Key rỗng/toàn khoảng trắng coi như không gửi. | `backend/prisma/schema.prisma`, `orders.service.ts`, `orders.controller.ts` |
| **10.2c** | **Test (b)**: 2 request tuần tự và song song cùng key → 1 đơn; response giống nhau; mã giảm giá chỉ trừ 1 lượt; dí đơn vào PAID nhiều lần → user chỉ nhận điểm 1 lần.                                                        | `backend/test/orders/orders-idempotency.spec.ts`                            |

### 2.3 Hợp đồng lỗi và mã lỗi mới

`HttpExceptionFilter` nay trả thêm trường `code` cho lỗi nghiệp vụ:

| HTTP | `code`            | Khi nào                              |
| ---- | ----------------- | ------------------------------------ |
| 400  | `PROMO_NOT_FOUND` | Mã không tồn tại                     |
| 400  | `PROMO_INACTIVE`  | Mã đang tạm ngưng                    |
| 400  | `PROMO_EXPIRED`   | Hết hạn hoặc chưa tới thời gian dùng |
| 400  | `PROMO_MIN_ORDER` | Chưa đủ giá trị đơn tối thiểu        |
| 400  | `PROMO_EXHAUSTED` | Hết lượt sử dụng                     |

### 2.4 Cơ sở dữ liệu

- Bảng mới `Promotion` (`code` unique, `type`, `value`, `minOrder`, `maxDiscount`, `startsAt`, `endsAt`, `usageLimit`, `usedCount`, `isActive`).
- Cột mới trên `Order`: `subtotal`, `discount`, `promoCode`, `pointsEarned`, `idempotencyKey`, `updatedAt`; unique `(userId, idempotencyKey)`.
- Migration: `prisma/migrations/20261101000000_s3_promotions_loyalty_idempotency`.
- Seed mã test: **BREW10** (10%, trần 20.000đ), **GIAM15K** (15.000đ, đơn ≥ 100.000đ), **HETHAN** (đã hết hạn).

### 2.5 API contract v3 (phần liên quan M4)

```
POST /orders                 Authorization: Bearer · Idempotency-Key: <uuid> (tùy chọn)
   { "items": [...], "promoCode": "BREW10" }
    -> 201 { orderId, code, status: PENDING, subtotal, discount, promoCode, total, items, createdAt }
    -> 200 + Idempotent-Replayed: true   (cùng user + cùng key)
    -> 400 PROMO_* | 409 OUT_OF_STOCK

POST /promotions/validate    Authorization: Bearer
   { "code": "brew10", "subtotal": 178000 }
    -> 200 { "code": "BREW10", "discount": 17800 }
    -> 400 PROMO_NOT_FOUND | PROMO_INACTIVE | PROMO_EXPIRED | PROMO_MIN_ORDER | PROMO_EXHAUSTED
```

---

## 3. Kiểm thử

| Hạng mục                                                         | Số test | Trạng thái |
| ---------------------------------------------------------------- | ------- | ---------- |
| `test/promotions/promotions.service.spec.ts` (10.4a)             | 16      | xanh       |
| `test/loyalty/loyalty.service.spec.ts` (10.4c)                   | 10      | xanh       |
| `test/orders/orders.service.spec.ts` (10.4b + 10.2b)             | 24      | xanh       |
| `test/orders/orders-idempotency.spec.ts` (10.2c — test (b))      | 7       | xanh       |
| `test/orders/orders.e2e-spec.ts` (HTTP v3 + promo + idempotency) | 18      | xanh       |
| Toàn bộ backend (`npm test`)                                     | **208** | **xanh**   |

Build (`npm run build`) và lint (`npm run lint`) không lỗi.

---

## 4. Cách dùng nhanh (phần M4)

```bash
# 1. Luôn cập nhật DB + seed mã giảm giá
cd backend
npx prisma migrate deploy
npm run prisma:seed

# 2. Kiểm tra mã giảm giá
curl -X POST http://localhost:3001/promotions/validate \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"code":"brew10","subtotal":178000}'
# → {"code":"BREW10","discount":17800}

# 3. Tạo đơn có mã + idempotency (gửi lại đúng lệnh này chỉ nhận 1 đơn)
curl -X POST http://localhost:3001/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Idempotency-Key: 5f0c1f4e-8a1d-4b9e-9c2b-77d1a0f3c2a1" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"productId":3,"size":"L","qty":2,"toppingIds":[1,5]},
                {"productId":5,"size":"M","qty":1}],"promoCode":"BREW10"}'
# → 201 {subtotal: 178000, discount: 17800, total: 160200, status: "PENDING"}
```

---

## 5. Hạng mục chưa hoàn thành / giới hạn đã biết

### 5.1 Stretch chưa làm (nếu có)

| PB     | Hạng mục                                           | Ghi chú                                                                                                                  |
| ------ | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| PB-27  | Ô nhập mã giảm giá ở `/checkout`, hiển thị điểm    | Backend 10.4 đã sẵn sàng; nếu chưa làm thì khách áp mã qua API/Swagger.                                                  |
| PB-25  | Hủy đơn (API + UI)                                 | State Machine đã cho phép `CANCELLED`; `LoyaltyService.revoke` và `PromotionsService.releaseUsage` đã có sẵn để nối vào. |
| PB-32a | UI quầy pha chế `/barista`                         | Dùng Swagger + tài khoản barista để demo State Machine.                                                                  |
| PB-28  | E2E Playwright                                     | Chưa làm trong 2 ngày Sprint 3.                                                                                          |
| PB-S2  | Test 5.2, 19.2, 21.2; a11y 30.1 còn mở từ Sprint 2 | Nợ chất lượng, không ảnh hưởng tiêu chí gốc.                                                                             |

### 5.2 Giới hạn đã biết của phần M4

1. **Chưa có endpoint hủy đơn** → `LoyaltyService.revoke` và `PromotionsService.releaseUsage` hiện chỉ được unit-test, chưa được gọi từ API. Khi PB-25 làm, gắn hai lời gọi này vào tác vụ `→ CANCELLED` của `OrderStatusService`.
2. **Cộng điểm chưa nối vào State Machine** (chờ 10.1b của M2): `OrderStatusService.transition` cần gọi `LoyaltyService.award` khi vào `PAID` và `revoke` khi `PAID → CANCELLED`, trong **cùng transaction**. Hiện `award/revoke` đã an toàn để gọi lặp lại (chống cộng đôi bằng điều kiện DB).
3. **Idempotency-Key không lưu hash payload**: cùng key + payload khác vẫn trả đơn cũ (khóa là key). Contract v3 chỉ bắt buộc 422 cho `POST /payments` (10.2a của M3), không bắt buộc cho `POST /orders`.
4. **`usedCount` hoàn lượt** khi hủy đơn phụ thuộc PB-25 (mục 5.2.1).
5. **Không đổi điểm lấy giảm giá** trong v1.0.0 (ngoài phạm vi, Mục 4.2 Sprint 3).

---

## 6. Tài liệu liên quan

- `docs/api-contract.md` (v3) · Swagger `/api-docs`
- `docs/architecture.md` (v3) — ADR-003 về State Machine/idempotency (M2)
- `docs/deployment.md` — biến môi trường, Adminer (M5)
- `docs/demo-script.md` — kịch bản demo cuối
- `docs/erd/erd_v2.md` — ERD
