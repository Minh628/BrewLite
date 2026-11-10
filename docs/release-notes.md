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

- Bảng `Promotion` (`code` unique, `type`, `value`, `minOrder`, `maxDiscount`, `startsAt`, `endsAt`, `usageLimit`, `usedCount`, `isActive`).
- Cột trên `Order`: `subtotal`, `discount`, `promoCode`, `pointsEarned`, `idempotencyKey`, `updatedAt`; unique `(userId, idempotencyKey)`.
- Cột `Payment.requestHash`, `cardLast4`, `failureReason`; enum `PaymentStatus`; `Product.version` (optimistic locking) — phần của M1/M3 trong cùng migration Sprint 3.
- Migration Sprint 3: `prisma/migrations/20261031145000_sprint_3_advanced_business` (bản hợp nhất của nhóm).
- Seed mã test: **BREW10** (10%, trần 20.000đ), **GIAM15K** (15.000đ, đơn ≥ 100.000đ), **HETHAN** (đã hết hạn). Ngày hiệu lực tính tương đối theo thời điểm seed để bản demo luôn chạy được.

### 2.5 API contract v3 (phần liên quan M4)

```
POST /orders                 Authorization: Bearer · Idempotency-Key: <uuid> (tùy chọn)
   { "items": [...], "promoCode": "BREW10" }
    -> 201 { orderId, code, status: PENDING, subtotal, discount, promoCode, total, items, createdAt }
    -> 200 + Idempotent-Replayed: true   (cùng user + cùng key)
    -> 400 PROMO_* | 409 OUT_OF_STOCK

POST /promotions/validate    Authorization: Bearer
   { "code": "brew10", "subtotal": 184000 }
    -> 200 { "code": "BREW10", "discount": 18400 }
    -> 400 PROMO_NOT_FOUND | PROMO_INACTIVE | PROMO_EXPIRED | PROMO_MIN_ORDER | PROMO_EXHAUSTED
```

---

## 3. Kiểm thử

| Hạng mục                                                              | Số test | Trạng thái |
| --------------------------------------------------------------------- | ------- | ---------- |
| `test/promotions/promotions.service.spec.ts` (10.4a)                  | 16      | xanh       |
| `test/loyalty/loyalty.service.spec.ts` (10.4c)                        | 10      | xanh       |
| `test/orders/orders.service.spec.ts` (10.4b + 10.2b)                  | 24      | xanh       |
| `test/orders/orders-idempotency.spec.ts` (10.2c — test (b))           | 7       | xanh       |
| `test/orders/loyalty-hooks.service.spec.ts` (10.4c nối State Machine) | 4       | xanh       |
| `test/loyalty/loyalty.db.spec.ts` (10.4c trên **PostgreSQL thật**)    | 4       | xanh       |
| `test/orders/orders.e2e-spec.ts` (HTTP v3 + promo + idempotency)      | 18      | xanh       |
| Toàn bộ backend (`npm test`)                                          | **275** | **xanh**   |

**Kiểm chứng thủ công trên DB thật (01/11/2026):**

| Bước                                         | Kết quả                                                                     |
| -------------------------------------------- | --------------------------------------------------------------------------- |
| `migrate reset` + seed                       | 5/5 migration sạch, seed OK                                                 |
| `POST /promotions/validate` BREW10 @184.000đ | 200 `{code:"BREW10", discount:18400}`                                       |
| HETHAN / GIAM15K @44.000đ / KHONGCO          | 400 `PROMO_EXPIRED` / `PROMO_MIN_ORDER` / `PROMO_NOT_FOUND`                 |
| `POST /orders` + `promoCode`                 | 201, `subtotal 184000 / discount 18400 / total 165600` lưu đúng trong DB    |
| `POST /orders` cùng `Idempotency-Key` ×2     | lần 2 = **200 + `Idempotent-Replayed: true`**, cùng `orderId`, DB chỉ 1 đơn |
| `usedCount` sau 2 đơn có mã                  | = 2 (không trừ đôi)                                                         |
| `OrderStatusService.transition` → PAID       | `pointsEarned = 16`, `User.loyaltyPoints = 16`                              |
| award lặp / PAID → CANCELLED                 | +0 điểm; thu hồi đúng 16 điểm, không trừ hai lần                            |

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
  -d '{"code":"brew10","subtotal":184000}'
# → {"code":"BREW10","discount":18400}

# 3. Tạo đơn có mã + idempotency (gửi lại đúng lệnh này chỉ nhận 1 đơn)
curl -X POST http://localhost:3001/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Idempotency-Key: 5f0c1f4e-8a1d-4b9e-9c2b-77d1a0f3c2a1" \
  -H "Content-Type: application/json" \
  -d '{"items":[{"productId":3,"size":"L","qty":2,"toppingIds":[1,5]},
                {"productId":4,"size":"M","qty":1}],"promoCode":"BREW10"}'
# → 201 {subtotal: 184000, discount: 18400, total: 165600, status: "PENDING"}
#   (Cappuccino L + Trân châu đen + Kem Cheese = 70.000đ × 2; Trà đào M = 44.000đ)
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

1. **`LoyaltyService` đã nối vào State Machine** qua `backend/src/orders/loyalty-hooks.service.ts` (hook `onPaid` → `award`, `onCancelled` → `revoke`). Phụ thuộc `OrderStatusService` của M2 — nếu hook chưa được gọi từ luồng thanh toán/hủy, cần kiểm tra `OrderStatusService.transition`.
2. **Chưa có endpoint hủy đơn** → `PromotionsService.releaseUsage` (hoàn lượt mã) hiện chưa được gọi từ API. Khi PB-25 làm, gắn lời gọi này vào hook `onCancelled`.
3. **Idempotency-Key không lưu hash payload**: cùng key + payload khác vẫn trả đơn cũ (khóa là key). Contract v3 chỉ bắt buộc 422 cho `POST /payments` (10.2a của M3), không bắt buộc cho `POST /orders`.
4. **Không đổi điểm lấy giảm giá** trong v1.0.0 (ngoài phạm vi, Mục 4.2 Sprint 3).

---

## 6. Tài liệu liên quan

- `docs/api-contract.md` (v3) · Swagger `/api-docs`
- `docs/architecture.md` (v3) — ADR-003 về State Machine/idempotency (M2)
- `docs/deployment.md` — biến môi trường, Adminer (M5)
- `docs/demo-script.md` — kịch bản demo cuối
- `docs/erd/erd_v2.md` — ERD

---

# BrewLite — Release Notes v1.1.0 (post-Sprint 3)

> **Người viết:** M1 (Thanh Tùng) — sub-task T5.4-a. **Ngày lập:** 2026-11-07. **Trạng thái:** dự thảo, cập nhật lần cuối 14/11.

## A. Highlights

Tiếp nối v1.0.0, đợt post-Sprint-3 bổ sung các cải tiến hướng tới bàn giao Assignment 2 (deadline 14/11):

| Nhóm           | Thay đổi mới so với v1.0.0                                                                                           |
| -------------- | -------------------------------------------------------------------------------------------------------------------- |
| UI quầy        | **Thêm `/barista`** — Kanban 3 cột Chờ pha / Đang pha / Sẵn sàng, polling 10 s, nút chuyển trạng thái                |
| API quầy       | **Thêm `GET /orders/queue`** — trả đơn PAID/PREPARING/READY FIFO, RolesGuard BARISTA/ADMIN                           |
| Auth response  | `/auth/login` + `/auth/register` trả thêm `user.role` để FE route guard                                              |
| FE Header      | Hiện nút **"Quầy pha chế"** khi user là BARISTA/ADMIN; dropdown profile hiện role tiếng Việt                         |
| Dev setup      | **Script `npm run dev:barista`** chạy FE instance thứ 2 trên port `3002` (tách localStorage với khách `:3000`)       |
| Fix hooks      | **`OrderStatusService.registerHooks`** đổi sang mảng handler — sửa lỗi silent khi nhiều hook cùng slot `onCancelled` |
| Fix DTO        | **`MAX_QTY` khôi phục 20** (JSDoc + test đã khớp lại)                                                                |
| Fix middleware | Gỡ bỏ chặn `/login` khi đã login — cho phép switch customer ↔ barista account                                        |

## B. Bug fixes quan trọng

| Commit    | Mô tả                                                                                                 |
| --------- | ----------------------------------------------------------------------------------------------------- |
| `d24fd82` | fix(test): đồng bộ unit/e2e specs với thay đổi Sprint3 M5 (inStock, orders/queue, loyalty.db guard)   |
| `e85f59a` | fix: compose hooks + thêm `inStock` vào payload add-to-cart (root cause CI loyalty.db PAID→CANCELLED) |
| `9225c0d` | fix(orders): khôi phục `MAX_QTY = 20`                                                                 |
| `70461ed` | feat(dev): dev:barista chạy FE riêng port 3002                                                        |
| `31a28ab` | fix(barista): dùng returnUrl thay vì next để khớp login page                                          |
| `9fabc4e` | fix(login): fallback returnUrl /checkout → /menu                                                      |
| `f31d9fb` | fix(middleware): cho phép user đã login vẫn vào /login                                                |
| `817a12e` | feat(ui): thêm nút chuyển giữa /barista và /menu cho nhân viên                                        |
| `a195818` | docs(readme): cập nhật UI quầy, dev:barista, tài khoản test, endpoint                                 |

## C. Tài liệu Task 1 mới (T1.1–T1.3, T-Trace, T5.4-a)

| File                                            | Nội dung                                                                 |
| ----------------------------------------------- | ------------------------------------------------------------------------ |
| `docs/requirements/context-and-scope.md`        | 7 stakeholder, in/out-scope, 8 giả định, 8 ràng buộc, 8 rủi ro           |
| `docs/requirements/srs.md`                      | 28 FR + 17 NFR, MoSCoW, tiêu chí test được, trích file:line thực tế      |
| `docs/requirements/uc-checkout.md`              | UC-06 chi tiết: 13 bước main + 4 nhánh alt + 11 exception                |
| `docs/diagrams/use-case-overview.puml` + `.svg` | Use-case diagram tổng quát (16 UC, 3 actor + external gateway)           |
| `docs/diagrams/uc-checkout.puml` + `.svg`       | Zoom UC-06 (include/extend)                                              |
| `docs/traceability-matrix.md`                   | FR/NFR ↔ UC ↔ Diagram ↔ Code/API ↔ Test — 303 backend + 59 frontend test |
| `docs/sprint-review.md`                         | Biên bản review Sprint 3 (02-05/11)                                      |
| `docs/sprint-retro.md`                          | Retrospective Sprint 3 với 8 action items                                |

## D. Test & benchmark (không đổi so với v1.0.0)

- **303/303 backend tests pass** (27 suite) tại commit `a195818`
- **59/59 frontend tests pass** (5 integration skip vì cần `API_E2E_URL`)
- Benchmark p95: `GET /products` 7.2 ms (10 conn), `POST /orders` 16.0 ms (10 conn)

## E. Known limitations trong v1.1.0

- `docs/deployment.md` (31.2) chưa tồn tại — chờ M5
- Migration drift `backend/prisma/migrations/20261107035437_init/` chưa được clean up
- CD pipeline + deploy production (T5.3, T5.4-b) chưa hoàn thành — kế hoạch 12-13/11
- Playwright E2E (T5.2-d) chưa có — kế hoạch 12/11
- UI nhập mã giảm giá ở checkout (PB-27) chưa có — chuyển "Sau MVP"

## F. Upgrade guide

Chạy sau khi pull:

```bash
# Cập nhật backend/.env (gitignored) thêm CORS_ORIGIN cho port 3002 nếu chưa có
# Dòng mới:
CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:3000,http://localhost:3002,http://127.0.0.1:3002

# Chạy 3 terminal:
npm run dev:db        # Postgres :5433 + Adminer :8080
npm run dev           # BE :3001 + FE khách :3000
npm run dev:barista   # FE quầy :3002

# Login barista@brewlite.vn / matkhau123 để test /barista
```
