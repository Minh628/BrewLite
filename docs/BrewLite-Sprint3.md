# BrewLite — Sprint 3: Kế hoạch chi tiết & Theo dõi tiến độ

> Thanh toán, nghiệp vụ nâng cao & bàn giao · **02/11 – 03/11/2026 (2 ngày làm việc)** · Sprint cuối cùng

| Hạng mục         | Nội dung                                                                |
| ---------------- | ----------------------------------------------------------------------- |
| Dự án            | BrewLite — ứng dụng đặt cà phê không dùng tiền mặt                      |
| Nguồn            | Product Backlog v1.0 · Sprint 2 Plan v1.0 · Task 8, 9, 10               |
| Thời gian Sprint | T2 02/11/2026 – T3 03/11/2026 (**2 ngày làm việc, toàn thời gian**)     |
| Cam kết          | 37 Story Points — chỉ hạng mục **Must** (+ stretch theo thứ tự ưu tiên) |
| Increment        | **v1.0.0** — sản phẩm bàn giao cuối cùng                                |
| Người lập        | Product Owner / Scrum Master                                            |
| Ngày lập         | 30/10/2026                                                              |

---

## Danh sách thành viên

| Mã     | Thành viên     | Vai trò chính         | Slice phụ trách trong Sprint 3 (BE + FE)                                        |
| ------ | -------------- | --------------------- | ------------------------------------------------------------------------------- |
| **M1** | **Thanh Tùng** | PO + SM + Dev         | Tồn kho đồng thời (BE) · "Hết hàng" ở Menu/Checkout (FE) · nghiệm thu, release  |
| **M2** | **Kiện Minh**  | Architect / Tech Lead | Contract, migration, State Machine (BE) · Trang xác nhận đơn (FE) · kiến trúc   |
| **M3** | **Hải Lý**     | Dev — trở lại         | Thanh toán mock + idempotency thanh toán (BE) · Màn hình thanh toán (FE)        |
| **M4** | **Hoàng Tịnh** | Dev                   | Khuyến mãi, điểm thưởng, idempotency tạo đơn (BE) · Trạng thái lỗi/thử lại (FE) |
| **M5** | **Trung Hiếu** | Dev                   | Lịch sử đơn, phân quyền, docker-compose (BE) · Trang "Đơn của tôi" (FE)         |

> ✅ Nhóm đủ **5 người**. Mỗi thành viên nhận một **lát cắt dọc** gồm cả API và màn hình của chính tính năng đó, nên ai cũng code cả backend lẫn frontend.

> ⚠️ **Sprint chỉ 2 ngày.** Kế hoạch giả định **cả nhóm làm toàn thời gian (~8 giờ/ngày)**. Nếu mỗi người chỉ có ~4 giờ/ngày như Sprint 2 thì năng lực chỉ còn ~30 giờ, **không đủ** cho riêng Task 8–10. Khi đó PO phải xin thêm ngày hoặc cắt theo Mục 15.2 ngay trong Planning.

---

## Mục lục

1. [Tổng quan Sprint 3](#1-tổng-quan-sprint-3)
2. [Đầu vào từ Sprint 2](#2-đầu-vào-từ-sprint-2)
3. [Quyết định phạm vi: Admin và Quầy pha chế](#3-quyết-định-phạm-vi-admin-và-quầy-pha-chế)
4. [Sprint Goal và tiêu chí thành công](#4-sprint-goal-và-tiêu-chí-thành-công)
5. [Sprint Backlog](#5-sprint-backlog)
6. [Luồng nghiệp vụ của sản phẩm cuối](#6-luồng-nghiệp-vụ-của-sản-phẩm-cuối)
7. [Phân công và năng lực](#7-phân-công-và-năng-lực)
8. [Chi tiết từng hạng mục và sub-task (checklist)](#8-chi-tiết-từng-hạng-mục-và-sub-task-checklist)
9. [Lịch theo giờ và bàn giao nội bộ](#9-lịch-theo-giờ-và-bàn-giao-nội-bộ)
10. [Các sự kiện Scrum và kịch bản demo](#10-các-sự-kiện-scrum-và-kịch-bản-demo)
11. [Đặc tả kỹ thuật dùng chung](#11-đặc-tả-kỹ-thuật-dùng-chung)
12. [Kế hoạch nghiệm thu (Acceptance Test)](#12-kế-hoạch-nghiệm-thu-acceptance-test)
13. [Definition of Done và Definition of Ready](#13-definition-of-done-và-definition-of-ready)
14. [Theo dõi tiến độ: Burndown](#14-theo-dõi-tiến-độ-burndown)
15. [Rủi ro và quy tắc cắt phạm vi](#15-rủi-ro-và-quy-tắc-cắt-phạm-vi)
16. [Checklist điều hành và bàn giao](#16-checklist-điều-hành-và-bàn-giao)

---

## 1. Tổng quan Sprint 3

Sprint 3 là Sprint **cuối cùng** của BrewLite, thực hiện **Task 8, 9, 10** theo đề bài: thanh toán không tiền mặt, xác nhận/lịch sử đơn và bàn giao, nghiệp vụ backend nâng cao. Sprint được rút từ 2 tuần xuống **2 ngày làm việc**, nên kế hoạch chỉ giữ những gì cần để **mọi task gốc đạt tiêu chí chấp nhận và Definition of Done**.

| Hạng mục                | Nội dung                                                                                                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Sprint**              | Sprint 3 / 3 (cuối)                                                                                                                                                      |
| **Thời gian**           | T2 02/11/2026 08:00 → T3 03/11/2026 19:00. Sprint Planning: CN 01/11/2026, 20:00.                                                                                        |
| **Sprint Goal**         | Khách thanh toán được đơn bằng Ví/Thẻ, thấy xác nhận và lịch sử đơn; backend đúng nghiệp vụ Task 10; `docker compose up` chạy toàn bộ sản phẩm (Mục 4).                  |
| **Cam kết**             | **37 SP** = PB-10 (13) + PB-08 (8) + PB-09 (8) + PB-24 (5) + PB-31 (3). Toàn bộ là **Must**.                                                                             |
| **Đưa ra khỏi cam kết** | 20 SP hạng mục Should (PB-25, 26, 27, 32a, PB-S2, PB-28) → **stretch** theo thứ tự ở Mục 5.2; không làm thì trả về backlog tương lai.                                    |
| **Task gốc**            | Task 8 — Thanh toán (8 SP) · Task 9 — Xác nhận, lịch sử đơn & bàn giao (8 SP) · Task 10 — Nghiệp vụ backend (13 SP)                                                      |
| **Increment kỳ vọng**   | **v1.0.0**: thanh toán Ví/Thẻ (mock) có idempotency, State Machine, tồn kho đồng thời, mã giảm giá & điểm thưởng (API), xác nhận + lịch sử đơn, docker-compose bàn giao. |

### Giả định khi lập kế hoạch

1. **Toàn thời gian 2 ngày:** mỗi người ~8 giờ/ngày; trừ Daily, đồng bộ trưa, review, còn **~6,5 giờ dev/ngày** (M1 ~4,5 giờ vì kiêm PO/SM, M2 ~5,5 giờ vì là reviewer chính).
2. Sprint 2 đã nghiệm thu v0.2.0: giỏ hàng, đăng ký/đăng nhập, POST /orders (PENDING), lọc/tìm, Swagger, CI, log requestId.
3. **SP giữ nguyên theo Product Backlog** để truy vết, nhưng sub-task được cắt về **mức tối thiểu đạt tiêu chí gốc + 3 test bắt buộc của Task 10**. Vì vậy số giờ (~58 giờ cho 37 SP) thấp hơn mức ~3 giờ/SP của Sprint 2.
4. Không có thời gian dự phòng thực sự (cam kết ≈ 96% năng lực). Mọi trễ hẹn phải xử lý bằng quy tắc cắt phạm vi Mục 15.2 tại **checkpoint 17:00 Ngày 1**.

---

## 2. Đầu vào từ Sprint 2

| Đầu vào      | Hiện trạng                                                                                               | Ý nghĩa cho Sprint 3                                                                      |
| ------------ | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Schema       | Đã có `Payment`, `PaymentMethod`, `Role {CUSTOMER, BARISTA, ADMIN}`, `Product.stock`, đủ 7 `OrderStatus` | Migration Sprint 3 chỉ **bổ sung** cột/bảng (Mục 11.1), làm xong trong 2 giờ đầu.         |
| API          | /auth/\*, POST /orders, /products?category&q, /categories, /toppings, /health                            | POST /orders được 2 người mở rộng (tồn kho, mã giảm giá + idempotency), thứ tự ở Mục 9.3. |
| UI           | Menu, chi tiết, giỏ, /login, /register, /checkout (tạo đơn PENDING)                                      | /checkout viết lại thành màn hình thanh toán; **chỉ xóa giỏ khi PAID** (US-05).           |
| Hạ tầng      | CI GitHub Actions, Swagger `/api-docs`, docker-compose dev có Adminer                                    | docker-compose bàn giao dựa trên bản dev; Adminer thay cho trang Admin khi demo.          |
| Còn mở từ S2 | Theo checklist Sprint 2: test 5.2, 19.2, 21.2; a11y 30.1                                                 | **Không đủ giờ** trong 2 ngày → stretch (PB-S2), ghi vào release notes nếu không làm.     |

---

## 3. Quyết định phạm vi: Admin và Quầy pha chế

Product Backlog xếp **PB-32 Barista** và **PB-33 Admin** vào "Sau MVP". PO xem lại theo câu hỏi: **thiếu nó thì các task gốc có đạt và demo được không?**

### 3.1 Quầy pha chế — **phần API: CÓ (bắt buộc) · phần giao diện: stretch ưu tiên số 1**

- **Task 10.1** yêu cầu State Machine `PENDING → PAID → PREPARING → READY → COMPLETED`. Thanh toán chỉ đưa đơn tới PAID; **ba bước sau cần người ở quầy thao tác**. Vì vậy API quầy là **bắt buộc**: `PATCH /orders/:id/status` + `RolesGuard` (role BARISTA/ADMIN) + tài khoản seed `barista@brewlite.vn`. Phần này nằm trong cam kết (10.1c, M5).
- **Giao diện `/barista`** (3 cột Chờ pha / Đang pha / Sẵn sàng, nút chuyển trạng thái) cần thêm ~4–5 giờ. Với Sprint 2 ngày, nó là **stretch ưu tiên số 1 (PB-32a)**. Nếu không kịp, khi demo dùng **Swagger đăng nhập bằng tài khoản quầy** để chuyển trạng thái. State Machine vẫn được chứng minh đầy đủ bằng test (a) và Swagger.

### 3.2 Trang quản trị (Admin) — **KHÔNG làm**

- **Không task gốc nào cần Admin.** Menu, topping, tồn kho, mã giảm giá đều đến từ seed và đủ cho mọi tiêu chí của Task 1–10.
- PB-33 là 8 SP (≈ 24 giờ). Sprint chỉ có ~60 giờ cho cả nhóm, phải dành hết cho Task 8–10, là các task được chấm điểm.
- **Cách thay thế:** role `ADMIN` dùng được API quầy; dữ liệu xem/sửa qua **Adminer** (`http://localhost:8080`) hoặc `npx prisma studio`; dữ liệu chuẩn nạp lại bằng seed.

### 3.3 Cập nhật Product Backlog

| Hạng mục                 | Thay đổi                                                                                                            |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| Sprint 3                 | 2 tuần → **2 ngày làm việc** (02/11 – 03/11/2026); chỉ cam kết Must.                                                |
| PB-32 (8 SP)             | Tách **PB-32a** UI quầy tối giản (3 SP, stretch S3) + **PB-32b** phần còn lại (5 SP, Sau MVP). API quầy thuộc 10.1. |
| PB-25, 26, 27, 28, PB-S2 | Sprint 3 (cam kết) → **stretch**; không làm thì về backlog tương lai.                                               |
| PB-33 Admin              | Giữ nguyên: Could, Sau MVP.                                                                                         |

---

## 4. Sprint Goal và tiêu chí thành công

> **Sprint Goal:** Đến 19:00 T3 03/11, khách hàng **thanh toán đơn bằng Ví hoặc Thẻ** (mock), thấy **màn hình xác nhận** và **lịch sử đơn**; backend bảo đảm **State Machine**, **thanh toán idempotent**, **không bán quá tồn kho khi đặt đồng thời** và **áp mã giảm giá, cộng điểm thưởng**; người ngoài nhóm chạy **`docker compose up`** là dùng được sản phẩm.

### 4.1 Tiêu chí thành công (đo được)

- [ ] **TC-1** Thanh toán: thành công → PAID; lỗi → PAYMENT_FAILED, giỏ giữ nguyên, thử lại được (AT-30, AT-35, AT-36)
- [ ] **TC-2** Task 10 có đủ 3 test bắt buộc xanh trong CI: (a) chặn chuyển trạng thái sai, (b) cùng Idempotency-Key chỉ tạo 1 đơn/1 lần trừ tiền, (c) đặt đồng thời không vượt tồn kho (AT-29, AT-31, AT-32)
- [ ] **TC-3** Mã giảm giá và điểm thưởng đúng quy tắc Mục 11.4 (AT-33)
- [ ] **TC-4** Màn hình xác nhận và "Đơn của tôi" chạy với API thật (AT-34, AT-37)
- [ ] **TC-5** `docker compose up --build` từ clone sạch chạy đủ 3 dịch vụ; README + tài liệu bàn giao (AT-39, AT-40)
- [ ] **TC-6** Task 8, 9, 10 đạt DoD; PO ký nghiệm thu; tag **v1.0.0**

### 4.2 Ngoài phạm vi

Trang Admin (PB-33), UI quầy mở rộng (PB-32b), realtime (PB-34), cổng thanh toán thật (PB-35), đặt lại đơn (PB-36), đa ngôn ngữ (PB-37), đổi điểm lấy giảm giá, refresh token. Các hạng mục stretch ở Mục 5.2 chỉ làm khi còn giờ.

---

## 5. Sprint Backlog

### 5.1 Cam kết (Must)

| #   | PB    | Hạng mục                                                        | Loại | MoSCoW   | SP     | Chịu TN | Người tham gia        |
| --- | ----- | --------------------------------------------------------------- | ---- | -------- | ------ | ------- | --------------------- |
| 1   | PB-10 | Task 10 — Nghiệp vụ backend (10.1–10.4)                         | Gốc  | **Must** | 13     | **M2**  | M1, M4, M5            |
| 2   | PB-08 | Task 8 — Thanh toán không tiền mặt                              | Gốc  | **Must** | 8      | **M3**  | M4 (test idempotency) |
| 3   | PB-24 | Giao diện thanh toán (chọn Ví/Thẻ, loading, lỗi, thử lại)       | BS   | **Must** | 5      | **M3**  | M4, M1                |
| 4   | PB-09 | Task 9 — Xác nhận, lịch sử đơn & bàn giao                       | Gốc  | **Must** | 8      | **M5**  | M2                    |
| 5   | PB-31 | Tài liệu bàn giao (kiến trúc, API, deploy, release notes, demo) | BS   | **Must** | 3      | **M2**  | M4, M5                |
|     |       | **Tổng cam kết**                                                |      |          | **37** |         |                       |

> PB-10 do M2 chịu trách nhiệm tổng, nhưng 4 việc con chia theo slice: **10.1 M2 (+ API quầy M5) · 10.2 M3 (thanh toán) + M4 (tạo đơn, test b) · 10.3 M1 · 10.4 M4**.

### 5.2 Stretch — chỉ làm khi đã qua nghiệm thu đợt 1 (theo đúng thứ tự)

| Ưu tiên | PB     | Hạng mục                                           | SP  | Người nhận nếu làm | Lý do thứ tự                                                |
| ------- | ------ | -------------------------------------------------- | --- | ------------------ | ----------------------------------------------------------- |
| 1       | PB-32a | UI quầy pha chế tối giản `/barista`                | 3   | M2                 | Giúp demo State Machine trên UI thay cho Swagger (Mục 3.1). |
| 2       | PB-27  | Ô nhập mã giảm giá ở /checkout, hiển thị điểm      | 3   | M4                 | Backend 10.4 đã có; chỉ thiếu UI để khách tự áp mã.         |
| 3       | PB-26  | Polling trạng thái đơn 5 s                         | 3   | M5                 | Có ý nghĩa khi đã có UI quầy (ưu tiên 1).                   |
| 4       | PB-25  | Hủy đơn (API + UI)                                 | 3   | M4                 | State Machine đã cho phép CANCELLED; thiếu endpoint + nút.  |
| 5       | PB-S2  | Test 5.2, 19.2, 21.2; a11y 30.1 còn mở từ Sprint 2 | 3   | M5, M1             | Chất lượng, không ảnh hưởng tiêu chí gốc.                   |
| 6       | PB-28  | E2E Playwright                                     | 5   | M3                 | Tốn giờ nhất, giá trị demo thấp nhất trong 2 ngày.          |

---

## 6. Luồng nghiệp vụ của sản phẩm cuối

```
 KHÁCH HÀNG                                  HỆ THỐNG (NestJS + PostgreSQL)
 ──────────                                  ──────────────────────────────
 Menu → Chi tiết → Giỏ (S1, S2 — đã có)
        │ món hết hàng hiện "Hết hàng" ......... GET /products trả inStock               (M1)
        ▼
 /checkout                                                                               (FE: M3, M4)
   • chọn Ví / Thẻ, bấm "Thanh toán" (khóa nút)
        │ 1) POST /orders + Idempotency-Key ... 1 transaction: giữ tồn kho (M1),
        │    (+ promoCode qua API)              áp mã (M4), chống tạo trùng (M4) → PENDING
        │ 2) POST /payments + Idempotency-Key . khóa dòng Order, MockGateway             (M3)
        │                                       ├─ thành công → PAID (+ điểm thưởng, M4)
        │                                       └─ thất bại   → PAYMENT_FAILED
        ├─ PAYMENT_FAILED: báo lỗi + "Thử lại", giỏ giữ nguyên ──┐ (lặp lại bước 2)     (FE: M4)
        ▼                                                         │
 /orders/[id] — xác nhận đơn .................. GET /orders/:id                         (BE: M5, FE: M2)
 /orders — "Đơn của tôi" ...................... GET /orders/me (phân trang)             (BE + FE: M5)

 QUẦY PHA CHẾ (Swagger hoặc /barista nếu làm stretch)
   PAID → PREPARING → READY → COMPLETED ....... PATCH /orders/:id/status (BARISTA)      (M5, qua State Machine của M2)
```

### 6.1 Bảng chuyển trạng thái (State Machine — 10.1)

| Từ \ Sang          | PAID        | PAYMENT_FAILED | PREPARING | READY   | COMPLETED | CANCELLED  |
| ------------------ | ----------- | -------------- | --------- | ------- | --------- | ---------- |
| **PENDING**        | ✅ Hệ thống | ✅ Hệ thống    | —         | —       | —         | ✅ Khách\* |
| **PAYMENT_FAILED** | ✅ Hệ thống | ✅ Hệ thống    | —         | —       | —         | ✅ Khách\* |
| **PAID**           | —           | —              | ✅ Quầy   | —       | —         | ✅ Khách\* |
| **PREPARING**      | —           | —              | —         | ✅ Quầy | —         | —          |
| **READY**          | —           | —              | —         | —       | ✅ Quầy   | —          |
| **COMPLETED**      | —           | —              | —         | —       | —         | —          |
| **CANCELLED**      | —           | —              | —         | —       | —         | —          |

- Ô "—" bị cấm: `assertTransition` ném `409 INVALID_TRANSITION`. COMPLETED, CANCELLED là trạng thái kết thúc.
- "Hệ thống" = chỉ `PaymentsService` gọi. `PAYMENT_FAILED → PAYMENT_FAILED` hợp lệ (thử lại vẫn lỗi).
- \* CANCELLED có trong bảng và trong test (a); endpoint hủy cho khách thuộc stretch PB-25.
- `OrderStatusService` chạy tác vụ đi kèm **trong cùng transaction**: vào **PAID** → cộng điểm (M4); vào **CANCELLED** → hoàn kho (M1), trừ điểm (M4).

---

## 7. Phân công và năng lực

### 7.1 Trách nhiệm (mỗi người cả BE và FE)

| Thành viên          | Backend                                                                                                                        | Frontend                                                                               | Khác                                               |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- | -------------------------------------------------- |
| **M1 — Thanh Tùng** | **10.3** `StockService` optimistic locking, gắn vào POST /orders, **test (c)**                                                 | **10.3d** nhãn "Hết hàng", tắt "Thêm vào giỏ", lỗi hết hàng ở checkout                 | **PO/SM:** 2 đợt nghiệm thu, PR → main, tag v1.0.0 |
| **M2 — Kiện Minh**  | **C.3** contract v3 · **E.3** migration + seed · **10.1** `assertTransition`, `OrderStatusService`, **test (a)**               | **9.3** trang xác nhận `/orders/[id]` + `StatusBadge`                                  | Kiến trúc v3 + ADR-003; **reviewer chính** BE      |
| **M3 — Hải Lý**     | **8.1–8.3** `MockPaymentGateway`, `POST /payments`, e2e · **10.2a** idempotency thanh toán                                     | **24.1** viết lại `/checkout`: chọn Ví/Thẻ, gọi tạo đơn → thanh toán, xóa giỏ khi PAID | —                                                  |
| **M4 — Hoàng Tịnh** | **10.4** khuyến mãi + điểm thưởng · **10.2b** idempotency tạo đơn · **10.2c test (b)**                                         | **24.2** trạng thái loading/khóa nút, PAYMENT_FAILED + "Thử lại", lỗi mạng             | Release notes + kịch bản demo                      |
| **M5 — Trung Hiếu** | **9.1–9.2** `GET /orders/me`, `GET /orders/:id` · **10.1c** `RolesGuard` + `PATCH /orders/:id/status` · **9.5** docker-compose | **9.4** trang "Đơn của tôi" `/orders`                                                  | README bàn giao + `docs/deployment.md`             |

> **Vì sao chia như vậy:** M2 làm contract, migration và State Machine trước tiên, vì mọi người khác phụ thuộc vào đó. M1 đã viết `OrdersService.create` ở Sprint 2 nên làm tồn kho. M3 là dev BE nên nhận thanh toán. Test (b) do **M4 viết cho code idempotency của M3**, để có người thứ hai kiểm chứng. M4 và M5 vốn mạnh FE nên nhận phần BE có quy tắc rõ (khuyến mãi, truy vấn lịch sử, guard), và M2 review.

### 7.2 Năng lực và mức phân bổ (2 ngày toàn thời gian)

| Thành viên       | Giờ dev / ngày | Khả dụng   | BE      | FE      | Tài liệu / PO | **Cam kết**  | Tỷ lệ   |
| ---------------- | -------------- | ---------- | ------- | ------- | ------------- | ------------ | ------- |
| **M1** PO/SM/Dev | 4,5            | 9 giờ      | 5 giờ   | 1,5 giờ | 2 giờ         | **8,5 giờ**  | 94%     |
| **M2** SW/Dev    | 5,5            | 11 giờ     | 7 giờ   | 3 giờ   | 1 giờ         | **11 giờ**   | 100%    |
| **M3** Dev       | 6,5            | 13 giờ     | 9,5 giờ | 3,5 giờ | —             | **13 giờ**   | 100%    |
| **M4** Dev       | 6,5            | 13 giờ     | 9,5 giờ | 2,5 giờ | 1 giờ         | **13 giờ**   | 100%    |
| **M5** Dev       | 6,5            | 13 giờ     | 9 giờ   | 2,5 giờ | 1,5 giờ       | **13 giờ**   | 100%    |
| **Cả nhóm**      | —              | **59 giờ** | **40**  | **13**  | **5,5**       | **58,5 giờ** | **99%** |

- Cả 5 người đều code **cả BE và FE**. Phần BE nhiều hơn vì Task 10 (13 SP) là backend thuần.
- **Không có giờ dự phòng.** Khung 17:00–19:00 Ngày 2 dành cho sửa bug sau nghiệm thu. Thêm việc phải bỏ việc khác theo Mục 15.2.
- **M3 trở lại sau Sprint 2:** M2 hướng dẫn 15 phút lúc 08:15 Ngày 1 (cấu trúc OrdersService, PricingService). M3 bắt đầu bằng `MockPaymentGateway`, phần không phụ thuộc code cũ.

---

## 8. Chi tiết từng hạng mục và sub-task (checklist)

Sub-task chỉ được coi là xong khi PR đã merge vào develop và CI xanh.
Ký hiệu: **N1** = T2 02/11, **N2** = T3 03/11 · **[BE]** / **[FE]**.

---

### 🔸 Nền tảng chung (2 giờ đầu Ngày 1, mọi người phụ thuộc)

- [ ] **C.3** · [BE] Chốt API contract v3 (Mục 11.2): POST /payments, POST /promotions/validate, GET /orders/me, GET /orders/:id, PATCH /orders/:id/status; header Idempotency-Key; mã lỗi mới · **M2** · 1h · N1 08:15–09:15 · ⇒ `docs/api-contract.md` v3 được cả nhóm duyệt **trước 09:30**
- [ ] **E.3** · [BE] **Một** migration Sprint 3 + seed: `Product.version`, cột mới của `Order`, bảng `Promotion`, enum `PaymentStatus`, tài khoản `barista@brewlite.vn` và `admin@brewlite.vn`, mã BREW10/GIAM15K/HETHAN, sản phẩm "Bạc xỉu" tồn kho 0 · **M2** · 2h · N1 09:30–11:15 · ⇒ **Merge trước 11:15**; `prisma migrate dev` sạch

---

### 🔹 PB-10 · Task 10 — Nghiệp vụ backend

**13 SP · Task gốc · Chịu TN tổng: M2**

**Tiêu chí gốc (nguyên văn đề):** State Machine đơn hàng, thanh toán idempotent, kiểm soát tồn kho khi đặt đồng thời, khuyến mãi/điểm thưởng.

**Test bắt buộc:** (a) chặn chuyển trạng thái sai; (b) 2 lần cùng Idempotency-Key chỉ tạo 1 đơn; (c) đặt đồng thời không vượt tồn kho.

#### 10.1 Order State Machine — M2 (+ M5)

- [ ] **10.1a** · [BE] `orders/order-state-machine.ts`: bảng `TRANSITIONS` (Mục 6.1), `assertTransition(from, to)` ném 409 `INVALID_TRANSITION`; **test (a)** đủ 49 cặp · **M2** · 2,5h · N1 chiều + N2 sáng · ⇒ Test xanh
- [ ] **10.1b** · [BE] `OrderStatusService.transition(tx, orderId, to)`: khóa dòng Order, gọi `assertTransition`, cập nhật trạng thái, chạy tác vụ đi kèm (PAID → `LoyaltyService.award`; CANCELLED → `StockService.release`, `LoyaltyService.revoke`). **Nơi duy nhất đổi `Order.status`** · **M2** · 1,5h · N1 · ⇒ **Merge trước 16:30 N1**
- [ ] **10.1c** · [BE] `RolesGuard` + `@Roles()`; thêm `role` vào JWT, `/auth/login`, `/auth/me`; `PATCH /orders/:id/status` (BARISTA/ADMIN; chỉ PREPARING/READY/COMPLETED); e2e: khách → 403, sai thứ tự → 409 · **M5** · 2h · N1 (guard) + N2 sáng (endpoint) · phụ thuộc 10.1b · ⇒ Quầy đổi trạng thái được qua Swagger

#### 10.2 Thanh toán idempotent — M3 + M4

- [ ] **10.2a** · [BE] POST /payments: `Idempotency-Key` bắt buộc (thiếu → 400); trong transaction `SELECT … FOR UPDATE` dòng Order; key đã có + cùng payload → trả lại kết quả cũ (200, `Idempotent-Replayed: true`); key đã có + payload khác → 422; đơn đã PAID → 409 · **M3** · 2,5h · N2 08:15–10:45 · phụ thuộc 8.2 · ⇒ **Merge trước 11:00 N2**
- [ ] **10.2b** · [BE] POST /orders nhận `Idempotency-Key`: `@@unique([userId, idempotencyKey])`, gặp P2002 → trả đơn đã tạo (200) · **M4** · 1,5h · N2 08:15–09:45 · phụ thuộc 10.4b · ⇒ **Merge trước 10:00 N2**
- [ ] **10.2c** · [BE] **Test (b):** 2 request song song cùng key → 1 Payment, 1 lần PAID, response giống nhau; điểm thưởng chỉ cộng 1 lần; POST /orders cùng key 2 lần → 1 đơn · **M4** · 2h · N2 09:45–11:45 · phụ thuộc 10.2a, 10.2b · ⇒ Test xanh trong CI

#### 10.3 Tồn kho khi đặt đồng thời — M1

- [ ] **10.3a** · [BE] `StockService.reserve(tx, items)`: gộp qty theo productId; `updateMany({ where: { id, version, stock: { gte: qty } }, data: { stock: { decrement: qty }, version: { increment: 1 } } })`; 0 dòng → đọc lại: hết hàng → 409 `OUT_OF_STOCK` kèm `productId`, xung đột phiên bản → thử lại tối đa 3 lần; `release(tx, orderId)` · **M1** · 2,5h · N1 sáng (viết với mock, rebase lên migration 11:15) · ⇒ `src/stock/stock.service.ts`
- [ ] **10.3b** · [BE] Gọi `reserve` trong transaction của `OrdersService.create`; nối `release` vào tác vụ CANCELLED · **M1** · 1h · N1 13:10–14:10 · ⇒ **Merge trước 15:00 N1** (người đầu tiên sửa `OrdersService.create`)
- [ ] **10.3c** · [BE] **Test (c):** 20 request POST /orders đồng thời (20 user test) mua 1 ly món tồn kho 5 → đúng 5 × 201, 15 × 409, tồn kho = 0, không âm; PostgreSQL thật trong CI · **M1** · 1,5h · N2 08:15–09:45 · ⇒ Test xanh 5 lần liên tiếp
- [ ] **10.3d** · [FE] GET /products trả `inStock`; ProductCard + trang chi tiết hiện "Hết hàng", tắt nút thêm giỏ; `mapOrderError()` hiện "Món X vừa hết hàng" ở checkout · **M1** · 1,5h · N2 09:45–11:15 · ⇒ Không thêm được món hết hàng

#### 10.4 Khuyến mãi & điểm thưởng — M4

- [ ] **10.4a** · [BE] `PromotionsService.validate(code, subtotal)`: tồn tại, `isActive`, trong hạn, `subtotal ≥ minOrder`, còn lượt; giảm PERCENT (trần `maxDiscount`) / FIXED, không vượt subtotal; `POST /promotions/validate`; unit test ≥ 6 ca · **M4** · 2,5h · N1 08:15–10:45 · ⇒ `src/promotions/`
- [ ] **10.4b** · [BE] POST /orders nhận `promoCode`: lưu `subtotal`, `discount`, `promoCode`, `total = subtotal − discount`; tăng `usedCount` có điều kiện trong cùng transaction · **M4** · 1,5h · N1 15:00–16:30 · phụ thuộc 10.3b · ⇒ **Merge trước 17:00 N1**
- [ ] **10.4c** · [BE] `LoyaltyService.award(tx, order)`: `pointsEarned = floor(total / 10.000)`, cộng `User.loyaltyPoints`; `revoke` khi hủy; gắn vào 10.1b; test: vào PAID 2 lần không cộng đôi · **M4** · 2h · N1 (viết 10:45–12:00 + 13:10–14:00, gắn 16:30–17:00) · ⇒ Điểm cộng đúng 1 lần

---

### 🔹 PB-08 · Task 8 — Thanh toán không tiền mặt

**8 SP · Task gốc · Chịu TN: M3**

**Tiêu chí gốc (nguyên văn đề):** Tích hợp mock payment: chọn Ví/Thẻ, gọi POST /payments; đơn chuyển PAID khi thành công, PAYMENT_FAILED khi lỗi.

- [ ] **8.1** · [BE] `PaymentGateway` + `MockPaymentGateway`: thẻ `4242 4242 4242 4242` thành công, `4000 0000 0000 0002` thất bại "Thẻ bị từ chối", sai định dạng → 400; Ví thành công trừ khi `MOCK_WALLET_FAIL=true`; trễ 800–1500 ms; unit test · **M3** · 2h · N1 08:30–10:30 · ⇒ `src/payments/mock-payment.gateway.ts`
- [ ] **8.2** · [BE] `POST /payments` (JWT) `{orderId, method, cardNumber?}`: đơn của người khác → 404; chỉ PENDING/PAYMENT_FAILED (khác → 409 `ORDER_NOT_PAYABLE`); `amount = order.total`; lưu Payment (chỉ 4 số cuối thẻ); đổi trạng thái qua `OrderStatusService` · **M3** · 3h · N1 13:10–17:00 · phụ thuộc E.3, 10.1b (dùng interface trong contract, nối thật lúc 16:30) · ⇒ **Merge cuối N1**
- [ ] **8.3** · [BE] e2e /payments: thành công → PAID; thất bại → PAYMENT_FAILED; thử lại → PAID; 401; 404; 409 đơn đã PAID; Payment không có số thẻ đầy đủ · **M3** · 2h · N2 13:10–15:10 · ⇒ Test xanh trong CI

---

### 🔹 PB-24 · Giao diện thanh toán

**5 SP · Bổ sung (Must) · Chịu TN: M3 (24.1) + M4 (24.2)**

**Tiêu chí chấp nhận:** Hiển thị tổng tiền; chọn Ví/Thẻ; nút Thanh toán có loading, chống bấm đúp; khi PAYMENT_FAILED có thông báo + nút "Thử lại", giỏ hàng giữ nguyên.

- [ ] **24.1** · [FE] Viết lại `/checkout`: tóm tắt giỏ + tổng; chọn Ví/Thẻ (ô số thẻ + gợi ý thẻ test); luồng `POST /orders` (key theo phiên checkout, lưu `orderId` để không tạo lại) → `POST /payments` (key mỗi lần thử) → PAID thì **xóa giỏ** và chuyển `/orders/[id]`. **Bỏ việc xóa giỏ ngay khi tạo đơn** của Sprint 2 · **M3** · 3,5h · N1 10:30–12:00 (mock) + N2 10:45–13:00 (API thật) · ⇒ Thanh toán thành công trên UI
- [ ] **24.2** · [FE] Trạng thái: nút loading + khóa (chống bấm đúp); PAYMENT_FAILED → lý do + "Thử lại" (key mới), đổi được phương thức; lỗi mạng/timeout → thử lại **cùng key**; giỏ giữ nguyên ở mọi nhánh lỗi; `aria-live` cho thông báo · **M4** · 2,5h · N2 13:10–15:30 · phụ thuộc 24.1 · ⇒ Đủ 4 trạng thái: sẵn sàng, đang xử lý, thất bại, thành công

---

### 🔹 PB-09 · Task 9 — Xác nhận, lịch sử đơn & bàn giao

**8 SP · Task gốc · Chịu TN: M5**

**Tiêu chí gốc (nguyên văn đề):** Màn hình xác nhận (mã đơn, trạng thái) và GET /orders/me (lịch sử đơn); docker-compose chạy cả 3 (frontend, backend, DB); README; demo end-to-end.

- [ ] **9.1** · [BE] `GET /orders/me?page=1&limit=10` (limit ≤ 50, mới nhất trước, chỉ đơn của user, trả `totalItems`, `totalPages`); `GET /orders/:id` (món, topping, subtotal, discount, promoCode, pointsEarned, lần thanh toán gần nhất); đơn của người khác → 404 · **M5** · 3h · N1 11:15–15:30 · phụ thuộc E.3 · ⇒ Merge trước 15:30 N1
- [ ] **9.2** · [BE] Test: phân trang, thứ tự, không thấy đơn người khác, 401, 404 · **M5** · 1h · N2 08:15–09:15 · ⇒ Test xanh
- [ ] **9.3** · [FE] Trang `/orders/[id]`: mã `#1001`, `StatusBadge` (7 trạng thái, nhãn tiếng Việt), danh sách món, tạm tính / giảm giá / tổng, điểm nhận được, nút "Về trang chủ"; loading/lỗi/404 · **M2** · 3h · N2 08:45–11:45 · phụ thuộc 9.1 · ⇒ Màn hình xác nhận đúng tiêu chí gốc
- [ ] **9.4** · [FE] Trang `/orders` "Đơn của tôi": danh sách phân trang (mã, ngày, tổng, trạng thái), empty state "Chưa có đơn"; link từ Header · **M5** · 2,5h · N2 10:45–14:30 · phụ thuộc 9.1 · ⇒ Lịch sử đơn chạy với API thật
- [ ] **9.5** · [BE] docker-compose bàn giao: Dockerfile production FE (Next standalone) + BE (multi-stage); backend chạy `prisma migrate deploy` + seed (idempotent) trước khi start; healthcheck 3 dịch vụ; `depends_on: service_healthy`; chạy được từ clone sạch + `.env.example` · **M5** · 3h · N1 08:15–09:30 + 15:30–17:00, N2 09:45–10:45 thử clone sạch · M2 review · ⇒ 3 container healthy

---

### 🔹 PB-31 · Tài liệu bàn giao

**3 SP · Bổ sung (Must) · Chịu TN: M2 · mỗi người viết phần của slice mình**

- [ ] **31.1** · `docs/architecture.md` v3: module Payments, Promotions, Stock, OrderStatus; sơ đồ State Machine; **ADR-003** (State Machine tập trung, idempotency bằng khóa dòng + key, optimistic locking) · **M2** · 1h · N2 13:10–14:10
- [ ] **31.2** · README bàn giao (chạy bằng 1 lệnh, tài khoản test khách/quầy/admin, thẻ test, mã giảm giá test) + `docs/deployment.md` (biến môi trường, Adminer, sự cố thường gặp) · **M5** · 1,5h · N2 14:30–16:00
- [ ] **31.3** · `docs/release-notes.md` v1.0.0 (tính năng, hạng mục stretch chưa làm, giới hạn đã biết) + `docs/demo-script.md` (Mục 10.1) · **M4** · 1h · N2 16:00–17:00
- [ ] **31.4** · `docs/api-contract.md` v3 khớp Swagger: người viết API cập nhật ngay trong PR của mình (DoD Mục 13.2)

---

### 🔸 Hoạt động chung (PO/SM)

- [ ] **A.1** · Planning CN 01/11: tạo sub-task trên Board, Burndown = 37 · **M1**
- [ ] **A.2** · Nghiệm thu đợt 1 — API nghiệp vụ (AT-29…AT-34) · **M1** · 0,5h · N2 13:30
- [ ] **A.3** · Nghiệm thu đợt 2 — UI + bàn giao + hồi quy (AT-35…AT-41) · **M1** · 0,75h · N2 16:00
- [ ] **A.4** · PR develop → main, tag `v1.0.0`, cập nhật Product Backlog (Done, stretch chưa làm về backlog) · **M1** · 0,75h · N2 18:00–19:00

---

## 9. Lịch theo giờ và bàn giao nội bộ

### 9.1 Khung giờ mỗi ngày

| Giờ         | Ngày 1 — T2 02/11                  | Ngày 2 — T3 03/11                                                               |
| ----------- | ---------------------------------- | ------------------------------------------------------------------------------- |
| 08:00–08:15 | Daily Scrum                        | Daily Scrum                                                                     |
| 08:15–12:00 | Làm việc (sáng)                    | Làm việc (sáng)                                                                 |
| 13:00–13:10 | Đồng bộ trưa: PR nào đang chặn ai? | Đồng bộ trưa                                                                    |
| 13:10–17:00 | Làm việc (chiều)                   | 13:30 **nghiệm thu đợt 1** · **15:30 code freeze** · 16:00 **nghiệm thu đợt 2** |
| 17:00–17:20 | **Checkpoint** (Mục 15.2)          | 17:00–19:00 sửa bug từ nghiệm thu, tag v1.0.0                                   |
| Tối         | —                                  | 19:30 **Sprint Review (demo cuối)** · 20:15 **Retrospective**                   |

### 9.2 Lịch theo thành viên

**Ngày 1 — T2 02/11:**

| Thành viên | 08:15–12:00 (sáng)                                                    | 13:10–17:00 (chiều)                                                    |
| ---------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| **M1**     | 10.3a `StockService` (mock) · 11:15 rebase lên migration              | **10.3b merge trước 15:00** · PO: trả lời câu hỏi, chuẩn bị AT         |
| **M2**     | **C.3 (duyệt 09:30)** · **E.3 (merge 11:15)** · 10.1a                 | 10.1a · **10.1b (merge 16:30)** · review 10.3b, 10.4b                  |
| **M3**     | 8.1 `MockPaymentGateway` · 24.1 `/checkout` với mock                  | 8.2 `POST /payments` · 16:30 nối `OrderStatusService`                  |
| **M4**     | 10.4a `PromotionsService` · 10.4c `LoyaltyService` (chưa gắn)         | 10.4c · **10.4b (sau 10.3b, merge 17:00)** · 16:30 gắn 10.4c vào 10.1b |
| **M5**     | 9.5 Dockerfile · 10.1c `RolesGuard` + role trong JWT · 9.1 (từ 11:15) | **9.1 (merge 15:30)** · 9.5 docker-compose                             |

**Ngày 2 — T3 03/11:**

| Thành viên | 08:15–12:00 (sáng)                                              | 13:10–17:00 (chiều)                                                                |
| ---------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **M1**     | 10.3c **test (c)** · 10.3d "Hết hàng" (FE) · chuẩn bị AT        | **13:30 nghiệm thu đợt 1** · **16:00 đợt 2** · điều phối sửa bug                   |
| **M2**     | 10.1a bổ sung test (a) · **9.3** trang xác nhận (FE)            | 31.1 kiến trúc v3 · review, hỗ trợ tích hợp · _stretch PB-32a_                     |
| **M3**     | **10.2a (merge 11:00)** · 24.1 nối API thật                     | 24.1 hoàn tất · 8.3 e2e · _stretch PB-28_                                          |
| **M4**     | **10.2b (merge 10:00)** · 10.2c **test (b)**                    | **24.2** trạng thái lỗi/thử lại (FE) · 31.3 release notes + demo · _stretch PB-27_ |
| **M5**     | 9.2 test · 10.1c `PATCH status` · 9.5 thử clone sạch · 9.4 (FE) | 9.4 hoàn tất · 31.2 README + deployment · _stretch PB-26_                          |

> Ô _stretch_ chỉ làm khi nghiệm thu đợt 1 (13:30 N2) đạt và PBI của chính người đó đã xong. Sau 15:30 (code freeze), chỉ merge stretch nếu M1 đồng ý và CI xanh.

### 9.3 Luồng bàn giao giữa các thành viên

Đường găng: **Contract (09:30 N1) → Migration (11:15 N1) → `OrderStatusService` (16:30 N1) → POST /payments (17:00 N1) → Idempotency (11:00 N2) → UI thanh toán (15:30 N2) → Nghiệm thu đợt 2 (16:00 N2)**.

| Điểm bàn giao                             | Từ → Đến            | Hạn                         | Quy tắc                                                                                                 |
| ----------------------------------------- | ------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------- |
| API contract v3                           | M2 → tất cả         | 09:30 N1                    | FE (M3, M5) dựng UI bằng mock theo contract ngay sau đó.                                                |
| Migration + seed                          | M2 → tất cả         | 11:15 N1                    | Chỉ M2 tạo migration. Trước 11:15 mọi người viết logic thuần/mock, không đụng DB thật.                  |
| `OrderStatusService`                      | M2 → M1, M3, M4, M5 | 16:30 N1                    | Merge với hàm tác vụ rỗng; M1 (release kho), M4 (cộng/trừ điểm) điền vào; M3, M5 gọi `transition()`.    |
| **`OrdersService.create`: 3 PR nối tiếp** | M1 → M4 → M4        | 15:00 → 17:00 N1 → 10:00 N2 | Thứ tự cố định: **10.3b (M1)** → **10.4b (M4)** → **10.2b (M4)**. Người sau rebase lên bản trước.       |
| POST /payments → `/checkout`              | M3 → M3             | 17:00 N1                    | Cùng người viết. Nối API thật sáng N2.                                                                  |
| `/checkout` → trạng thái lỗi              | M3 → M4             | 13:00 N2                    | M3 sở hữu file trang; M4 làm component `PaymentStatusPanel` từ 13:10, gắn vào trang sau khi 24.1 merge. |
| GET /orders/:id, /orders/me               | M5 → M2, M5         | 15:30 N1                    | M2 làm trang xác nhận sáng N2; M5 làm "Đơn của tôi".                                                    |
| docker-compose                            | M5 → M1             | 10:45 N2                    | M1 dùng bản này cho nghiệm thu đợt 2 từ clone sạch.                                                     |

### 9.4 Quy trình Git và Pull Request

- Giữ quy ước Sprint 1–2 (main / develop / feature, Conventional Commits, squash merge, **chỉ merge khi CI xanh**).
- **PR nhỏ, review trong 30 phút.** Sprint 2 ngày không cho phép PR chờ nửa ngày. Ai có PR chờ quá 30 phút thì nhắc ở kênh chat.
- Reviewer: mọi PR BE nghiệp vụ → **M2** (bắt buộc); PR của M2 → M3. FE: M3 ↔ M5, M4 ↔ M1, M2 → M4.
- Migration nằm trong PR riêng `feature/PB-10-migration-s3` của M2.
- Sau **code freeze 15:30 N2**: chỉ merge PR có nhãn `bug` được M1 đồng ý.

---

## 10. Các sự kiện Scrum và kịch bản demo

- [ ] **Sprint Planning** · CN 01/11, 20:00 · 90 phút · PO trình bày Sprint Goal 2 ngày, quyết định Admin/Quầy (Mục 3), phạm vi Must + stretch; nhóm xác nhận cam kết toàn thời gian 2 ngày, chia sub-task, duyệt bản nháp contract v3
- [ ] **Daily Scrum** · T2 02/11 và T3 03/11, 08:00 · 15 phút
- [ ] **Đồng bộ trưa** · 13:00 mỗi ngày · 10 phút · Chỉ nói PR đang chặn ai và mốc merge có giữ được không
- [ ] **Checkpoint** · T2 02/11, 17:00 · 20 phút · Kiểm tra 5 mốc merge của Ngày 1 (migration, 10.1b, 10.3b, 10.4b, 8.2); áp dụng Mục 15.2 nếu thiếu
- [ ] **Nghiệm thu đợt 1** · T3 03/11, 13:30 · 30 phút
- [ ] **Nghiệm thu đợt 2** · T3 03/11, 16:00 · 45 phút (gồm chạy thử demo)
- [ ] **Sprint Review (demo cuối với khách hàng)** · T3 03/11, 19:30 · 40 phút
- [ ] **Sprint Retrospective tổng kết dự án** · T3 03/11, 20:15 · 40 phút · Start / Stop / Continue cho Sprint 3 và nhìn lại cả 3 Sprint

### 10.1 Kịch bản Sprint Review — demo cuối (≤ 15 phút)

- [ ] 1. **M1** nhắc mục tiêu sản phẩm, 3 Sprint, quyết định phạm vi Admin/Quầy
- [ ] 2. **M5** cho xem `docker compose up --build` từ clone sạch đã chạy sẵn: 3 dịch vụ healthy
- [ ] 3. **M1** (vai khách) thêm Cappuccino L + Trân châu + Kem cheese ×2 và Trà đào M (tạm tính 178.000đ); "Bạc xỉu" hiện "Hết hàng", không thêm được (10.3)
- [ ] 4. **M3** thanh toán bằng thẻ **4000 0000 0000 0002** → PAYMENT_FAILED, giỏ còn nguyên; **M4** cho thấy nút "Thử lại", chọn **Ví** → PAID → trang xác nhận (Task 8, PB-24)
- [ ] 5. **M4** trên Swagger tạo đơn với `promoCode: "BREW10"` → giảm 17.800đ, tổng 160.200đ; thanh toán → `/auth/me` +16 điểm (10.4). _Nếu đã làm stretch PB-27 thì làm trên UI._
- [ ] 6. **M5** (vai quầy) trên Swagger đăng nhập `barista@brewlite.vn`, chuyển PAID → PREPARING → READY → COMPLETED; thử READY → PREPARING → 409 (10.1). _Nếu đã làm stretch PB-32a thì dùng trang `/barista`._
- [ ] 7. **M2** mở trang xác nhận và **M5** mở "Đơn của tôi": trạng thái COMPLETED, lịch sử phân trang (Task 9)
- [ ] 8. **M2** chạy 3 test bắt buộc trong CI/terminal: (a) 49 cặp chuyển trạng thái, (b) idempotency, (c) 20 request đồng thời với tồn kho 5 → đúng 5 đơn
- [ ] 9. **M1** trình bày tài liệu bàn giao, Burndown 3 Sprint, biên bản nghiệm thu, stretch chưa làm

> **Chú giá demo:** Cappuccino L + Trân châu + Kem cheese = 67.000đ × 2 = 134.000đ; Trà đào M = 44.000đ; tạm tính 178.000đ; BREW10 giảm 10% = 17.800đ (dưới trần 20.000đ); tổng **160.200đ**; điểm = floor(160.200 / 10.000) = **16 điểm**.

---

## 11. Đặc tả kỹ thuật dùng chung

### 11.1 Mô hình dữ liệu bổ sung (migration Sprint 3 — E.3)

Chỉ **thêm** vào schema hiện có.

```prisma
enum PaymentStatus { SUCCEEDED FAILED REFUNDED }
enum DiscountType  { PERCENT FIXED }

model Product {
  // ... các trường hiện có (stock đã có)
  version Int @default(0)                       // optimistic locking (10.3)
}

model Order {
  // ... các trường hiện có (total = số tiền phải trả)
  subtotal       Int                           // Σ lineTotal; migration gán subtotal = total cho đơn cũ
  discount       Int      @default(0)
  promoCode      String?
  pointsEarned   Int      @default(0)
  idempotencyKey String?
  updatedAt      DateTime @updatedAt

  @@unique([userId, idempotencyKey])            // 10.2b
}

model Promotion {
  id          Int          @id @default(autoincrement())
  code        String       @unique               // lưu IN HOA
  type        DiscountType
  value       Int                                // PERCENT: 1–100; FIXED: VND
  minOrder    Int          @default(0)
  maxDiscount Int?
  startsAt    DateTime
  endsAt      DateTime
  usageLimit  Int?
  usedCount   Int          @default(0)
  isActive    Boolean      @default(true)
}

model Payment {
  idempotencyKey String        @id               // đã có
  // ... orderId, amount, method, createdAt đã có
  status         PaymentStatus                   // đổi từ String sang enum
  requestHash    String                          // sha256(orderId|method|last4): phát hiện key dùng lại với payload khác
  cardLast4      String?
  failureReason  String?
}
```

**Seed bổ sung:** `barista@brewlite.vn` (BARISTA), `admin@brewlite.vn` (ADMIN) · **BREW10** (10%, trần 20.000đ) · **GIAM15K** (15.000đ, đơn tối thiểu 100.000đ) · **HETHAN** (đã hết hạn) · "Bạc xỉu" tồn kho 0.

### 11.2 API contract v3 (task C.3)

```
POST /orders               Authorization: Bearer · Idempotency-Key: <uuid> (tùy chọn)
   { "items": [...như v2...], "promoCode": "BREW10" }
                           -> 201 { "orderId": 1001, "code": "#1001", "status": "PENDING",
                                    "subtotal": 178000, "discount": 17800, "total": 160200, "items": [...] }
                           -> 200 (cùng key: trả lại đơn đã tạo)
                           -> 400 PROMO_* | 409 OUT_OF_STOCK { "productId": 9 }

POST /promotions/validate  Authorization: Bearer
   { "code": "brew10", "subtotal": 178000 }
                           -> 200 { "code": "BREW10", "discount": 17800 }
                           -> 400 PROMO_NOT_FOUND | PROMO_EXPIRED | PROMO_MIN_ORDER | PROMO_EXHAUSTED

POST /payments             Authorization: Bearer · Idempotency-Key: <uuid> (bắt buộc)
   { "orderId": 1001, "method": "CARD", "cardNumber": "4242424242424242" }
                           -> 201 { "orderId": 1001, "status": "PAID", "amount": 160200,
                                    "method": "CARD", "cardLast4": "4242", "pointsEarned": 16 }
                           -> 201 { "orderId": 1001, "status": "PAYMENT_FAILED", "reason": "Thẻ bị từ chối" }
                           -> 200 + Idempotent-Replayed: true   (cùng key, cùng payload)
                           -> 400 thiếu key/DTO sai | 404 không phải đơn của bạn
                           -> 409 ORDER_NOT_PAYABLE | 422 IDEMPOTENCY_KEY_REUSED

GET  /orders/me?page=1&limit=10
                           -> 200 { "items": [ { "orderId": 1001, "code": "#1001", "status": "PAID",
                                    "total": 160200, "itemCount": 3, "createdAt": "..." } ],
                                    "page": 1, "limit": 10, "totalItems": 1, "totalPages": 1 }
GET  /orders/:id           -> 200 { ...chi tiết, "items": [...], "payment": {...} } | 404

PATCH /orders/:id/status   Authorization: Bearer (BARISTA | ADMIN)
   { "status": "PREPARING" }  -> 200 | 403 | 409 INVALID_TRANSITION

GET  /auth/me              -> 200 { "id": 3, "email": "...", "role": "CUSTOMER", "loyaltyPoints": 16 }
GET  /products             -> mỗi sản phẩm thêm "inStock": true|false
```

### 11.3 Mã lỗi mới

| HTTP    | `code`                     | Khi nào                                                        |
| ------- | -------------------------- | -------------------------------------------------------------- |
| **400** | `IDEMPOTENCY_KEY_REQUIRED` | POST /payments thiếu header                                    |
| **400** | `PROMO_*`                  | Mã không tồn tại, hết hạn, chưa đủ giá trị tối thiểu, hết lượt |
| **403** | `FORBIDDEN_ROLE`           | Khách gọi API của quầy                                         |
| **404** | —                          | Đơn không tồn tại **hoặc không phải của bạn**                  |
| **409** | `INVALID_TRANSITION`       | Chuyển trạng thái bị cấm (Mục 6.1)                             |
| **409** | `ORDER_NOT_PAYABLE`        | Thanh toán đơn không ở PENDING/PAYMENT_FAILED                  |
| **409** | `OUT_OF_STOCK`             | Không đủ tồn kho (kèm `productId`)                             |
| **422** | `IDEMPOTENCY_KEY_REUSED`   | Cùng key nhưng payload khác                                    |

### 11.4 Quy tắc nghiệp vụ Sprint 3

| Chủ đề               | Quy tắc                                                                                                                                          |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Tổng tiền**        | `subtotal = Σ lineTotal` (quy tắc giá Product Backlog Mục 6.1); `total = subtotal − discount`, không âm. Server luôn tính lại.                   |
| **Giảm giá**         | PERCENT: `floor(subtotal × value / 100)`, không vượt `maxDiscount`. FIXED: `min(value, subtotal)`. Mỗi đơn 1 mã; không phân biệt hoa thường.     |
| **Lượt dùng mã**     | Trừ lượt khi tạo đơn (có điều kiện `usedCount < usageLimit`, cùng transaction); hoàn lượt khi CANCELLED.                                         |
| **Điểm thưởng**      | Cộng `floor(total / 10.000)` **một lần** khi đơn vào PAID; trừ lại nếu đơn PAID bị hủy. Không đổi điểm trong v1.0.0.                             |
| **Tồn kho**          | Giữ kho khi **tạo đơn**; hoàn kho khi CANCELLED. PAYMENT_FAILED vẫn giữ kho để khách thử lại.                                                    |
| **Idempotency (FE)** | `crypto.randomUUID()` cho mỗi **lần thử thanh toán**. Lỗi mạng/timeout → gửi lại **cùng key**. PAYMENT_FAILED rõ ràng + "Thử lại" → **key mới**. |
| **Giỏ hàng**         | Chỉ xóa khi đơn **PAID** (US-05).                                                                                                                |
| **Mock thanh toán**  | `4242…4242` thành công, `4000…0002` thất bại; Ví thành công trừ khi `MOCK_WALLET_FAIL=true`; trễ 800–1500 ms; chỉ lưu 4 số cuối thẻ.             |
| **Phân quyền**       | `role` trong JWT. CUSTOMER: API khách. BARISTA và ADMIN: API quầy. Không có trang Admin (Mục 3.2).                                               |

---

## 12. Kế hoạch nghiệm thu (Acceptance Test)

Đánh số tiếp từ Sprint 2 (AT-11…AT-28). PO chạy trên develop.

**Đợt 1 — API nghiệp vụ (T3 03/11, 13:30; Swagger + test tự động):**

- [ ] **AT-29** (10.1) · PATCH PENDING → READY; COMPLETED → PREPARING; PAID → PREPARING → READY → COMPLETED bằng token quầy; PATCH bằng token khách · ⇒ 409; 409; 3 × 200; 403. Test (a) 49 cặp xanh
- [ ] **AT-30** (PB-08) · Thẻ 4242; thẻ 4000…0002; thử lại bằng Ví; đơn của người khác; đơn đã PAID · ⇒ PAID; PAYMENT_FAILED; PAID; 404; 409. Payment chỉ có 4 số cuối thẻ
- [ ] **AT-31** (10.2) · POST /payments 2 lần (và song song) cùng key; cùng key khác payload; thiếu key; POST /orders 2 lần cùng key · ⇒ 1 Payment, response giống nhau, header `Idempotent-Replayed`; 422; 400; 1 đơn
- [ ] **AT-32** (10.3) · Chạy test 20 request đồng thời với món tồn kho 5 · ⇒ 5 × 201, 15 × 409 `OUT_OF_STOCK`, tồn kho = 0
- [ ] **AT-33** (10.4) · BREW10 trên 178.000đ; HETHAN; GIAM15K với đơn 44.000đ; thanh toán đơn 160.200đ · ⇒ Giảm 17.800đ; 400; 400; user +16 điểm
- [ ] **AT-34** (PB-09) · GET /orders/me với 12 đơn, limit 10; GET /orders/:id của user khác · ⇒ Trang 1: 10 đơn mới nhất, trang 2: 2 đơn; 404

**Đợt 2 — UI, bàn giao, hồi quy (T3 03/11, 16:00):**

- [ ] **AT-35** (PB-24) · Checkout chọn Thẻ 4242, bấm đúp "Thanh toán" · ⇒ Có loading, chỉ 1 request POST /payments; chuyển trang xác nhận; giỏ được xóa
- [ ] **AT-36** (PB-24, US-05) · Thẻ 4000…0002; "Thử lại" với Ví · ⇒ Báo "Thẻ bị từ chối" + "Thử lại", giỏ còn nguyên; lần 2 PAID, không tạo đơn thứ hai
- [ ] **AT-37** (PB-09) · Trang xác nhận; "Đơn của tôi" với user có đơn và user mới · ⇒ Có mã, trạng thái, tổng, "Về trang chủ"; danh sách phân trang; empty state
- [ ] **AT-38** (10.3) · Mở "Bạc xỉu"; đặt món vừa bị mua hết · ⇒ Nhãn "Hết hàng", nút thêm giỏ tắt; thông báo hết hàng đúng dòng
- [ ] **AT-39** (PB-09) · Máy chưa có dự án: clone, `cp .env.example .env`, `docker compose up --build` · ⇒ 3 dịch vụ healthy; đặt và thanh toán được; không thao tác thủ công với DB
- [ ] **AT-40** (PB-31) · Đọc README, architecture v3, deployment, release-notes, demo-script · ⇒ Đủ và khớp sản phẩm; người ngoài nhóm chạy được
- [ ] **AT-41** (hồi quy) · Chạy nhanh luồng Sprint 1–2: menu, lọc/tìm, chi tiết, giỏ, đăng ký/đăng nhập (AT-01…AT-28 chọn lọc) · ⇒ Không hồi quy

---

## 13. Definition of Done và Definition of Ready

### 13.1 Definition of Done (nguyên văn từ đề — Mục 10)

- [ ] Code chạy được, không lỗi build; tuân theo tiêu chí chấp nhận của task
- [ ] Có commit trên Git với mô tả rõ ràng; được review trong nhóm
- [ ] API có validate đầu vào; UI xử lý trạng thái loading/lỗi cơ bản
- [ ] Có hướng dẫn chạy trong README

### 13.2 DoD bổ sung cho Sprint 3

- [ ] CI xanh trước khi merge; PR có ít nhất 1 reviewer (BE nghiệp vụ: M2)
- [ ] Mọi thay đổi `Order.status` đi qua `OrderStatusService`
- [ ] API ghi tiền/kho chạy trong transaction; không lưu số thẻ đầy đủ, không log token/mật khẩu
- [ ] API mới có trong Swagger và `docs/api-contract.md` v3; biến môi trường mới có trong `.env.example`
- [ ] Chạy được bằng `docker compose up`, không chỉ `npm run dev`

### 13.3 Definition of Ready

- [ ] Cả nhóm xác nhận làm **toàn thời gian 2 ngày** trong Planning (nếu không, cắt phạm vi trước khi bắt đầu)
- [ ] Mọi PBI có tiêu chí (Mục 8), SP, người nhận và **giờ merge cụ thể** (Mục 9.3)
- [ ] Bản nháp contract v3 và bảng chuyển trạng thái (Mục 6.1) được xem trước trong Planning
- [ ] Increment v0.2.0 đã merge vào main

---

## 14. Theo dõi tiến độ: Burndown

Sprint 2 ngày nên Burndown theo **nửa ngày**. SP chỉ trừ khi PBI đạt DoD **và** PO đã nghiệm thu, nên đường thực tế giảm theo bậc ở 13:30 và 16:00 Ngày 2. Cột "Dự kiến theo lịch" quy đổi giờ đã làm sang SP để SM so tiến độ.

| Mốc                   | Ideal (SP còn lại) | Dự kiến theo lịch | Thực tế (SM điền) | Ghi chú                                             |
| --------------------- | ------------------ | ----------------- | ----------------- | --------------------------------------------------- |
| Planning — CN 01/11   | 37                 | 37,0              |                   |                                                     |
| N1 12:00              | 27,8               | 27,0              |                   | Contract + migration merge                          |
| N1 17:00 (checkpoint) | 18,5               | 18,7              |                   | 10.1b, 10.3b, 10.4b, 8.2 phải merge                 |
| N2 12:00              | 9,3                | 7,9               |                   | Idempotency + test (a)(b)(c) xanh                   |
| N2 17:00              | 0                  | 0,0               |                   | Sau đợt 2: PB-10, 08, 24, 09 nghiệm thu; PB-31 xong |

> **Ngưỡng cảnh báo:** ở checkpoint 17:00 N1, thiếu **bất kỳ** mốc merge nào của đường găng (migration, 10.1b, 8.2) ⇒ áp dụng Mục 15.2 ngay tối N1, không chờ sáng N2.

### Mốc "Xong" dự kiến của từng PBI

- [ ] **PB-10** — Task 10 · 13 SP · xong 12:00 N2 · nghiệm thu 13:30 N2
- [ ] **PB-08** — Task 8 · 8 SP · xong 15:10 N2 · nghiệm thu 16:00 N2 (8.3 xong chiều)
- [ ] **PB-24** — Giao diện thanh toán · 5 SP · xong 15:30 N2 · nghiệm thu 16:00 N2
- [ ] **PB-09** — Task 9 · 8 SP · xong 16:00 N2 · nghiệm thu 16:00 N2
- [ ] **PB-31** — Tài liệu bàn giao · 3 SP · xong 17:00 N2 · nghiệm thu trước Review

---

## 15. Rủi ro và quy tắc cắt phạm vi

### 15.1 Rủi ro và cách ứng phó

| #      | Rủi ro                                                       | Mức            | Ứng phó / người chịu trách nhiệm                                                                                                                 |
| ------ | ------------------------------------------------------------ | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **R1** | Sprint chỉ 2 ngày, cam kết ≈ 99% năng lực, không có dự phòng | **Rất cao** 🔴 | Chỉ cam kết Must; Should thành stretch; checkpoint 17:00 N1 với quy tắc cắt rõ ràng (15.2). — M1                                                 |
| **R2** | Thành viên không làm được toàn thời gian 2 ngày              | **Rất cao** 🔴 | Xác nhận trong Planning. Ai vắng nửa ngày thì cắt ngay mục tương ứng ở 15.2 và chuyển việc trên đường găng cho M2/M3. — M1                       |
| **R3** | Migration hoặc `OrderStatusService` trễ → cả nhóm bị chặn    | **Cao**        | M2 không nhận việc nào khác trước 16:30 N1; mọi người viết logic thuần/mock tới khi merge. — M2                                                  |
| R4     | 3 PR nối tiếp trên `OrdersService.create` xung đột           | Cao            | Thứ tự và giờ merge cố định (Mục 9.3); 2 trong 3 PR do cùng M4 làm; M2 review ngay khi PR mở. — M2                                               |
| R5     | Test đồng thời (c) chập chờn trong CI                        | Trung bình     | PostgreSQL thật; chạy 5 lần liên tiếp trước khi merge. — M1                                                                                      |
| R6     | Idempotency sai: trừ tiền 2 lần hoặc cộng điểm 2 lần         | Trung bình     | Khóa dòng Order + key là khóa chính; điểm chỉ cộng khi vào PAID (chỉ xảy ra 1 lần nhờ State Machine); M4 viết test (b) cho code của M3. — M3, M4 |
| R7     | docker-compose chạy trên máy nhóm nhưng hỏng trên máy sạch   | Trung bình     | M5 thử clone sạch 10:45 N2; seed idempotent; M1 chạy lại ở đợt 2. — M5                                                                           |
| R8     | Demo hỏng vì dữ liệu bẩn (tồn kho hết, mã hết lượt)          | Trung bình     | Seed lại DB lúc 19:00 trước Review; chạy thử demo trong đợt 2. — M1                                                                              |
| R9     | Yêu cầu thêm trang Admin/UI quầy giữa Sprint                 | Thấp           | Quyết định đã ghi ở Mục 3; UI quầy chỉ làm theo thứ tự stretch. — M1                                                                             |

### 15.2 Quy tắc cắt phạm vi

Sprint cuối, **không gia hạn**. Stretch (Mục 5.2) tự động không làm. Nếu vẫn trễ, PO cắt **bên trong** các PBI Must theo thứ tự dưới đây. Mỗi bước cắt vẫn giữ đủ tiêu chí gốc của đề.

| Thứ tự cắt | Phần bị cắt                                                                              | Vẫn giữ                                        |
| ---------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------- |
| 1          | 10.3d nhãn "Hết hàng" trên UI                                                            | 409 `OUT_OF_STOCK` ở API + test (c)            |
| 2          | Phân trang trên UI "Đơn của tôi" (9.4 hiện 10 đơn mới nhất)                              | API GET /orders/me vẫn có phân trang           |
| 3          | 8.3 rút còn 3 ca (thành công, thất bại, đơn đã PAID)                                     | Test (b) của 10.2c                             |
| 4          | Tài liệu rút còn README + release notes + demo script                                    | README bàn giao (DoD của đề)                   |
| 5          | `POST /promotions/validate` (chỉ áp mã khi tạo đơn)                                      | 10.4 khuyến mãi + điểm thưởng qua POST /orders |
| Không cắt  | Tiêu chí gốc Task 8, 9, 10; **3 test bắt buộc (a)(b)(c)**; PB-24; docker-compose; README | Là phần được chấm điểm và điều kiện bàn giao.  |

| Thời điểm           | Điều kiện                              | Hành động                                                                                 |
| ------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------- |
| Planning CN 01/11   | Có người không làm được toàn thời gian | Cắt trước mục 1–2; giao lại việc của người đó trên đường găng cho M2/M3.                  |
| Checkpoint 17:00 N1 | Đủ 5 mốc merge của Ngày 1              | Tiếp tục theo lịch.                                                                       |
| Checkpoint 17:00 N1 | Thiếu migration, 10.1b hoặc 8.2        | Cắt mục 1–3; người chậm làm thêm tối N1 cùng M2 (pair) để đường găng xong trước 08:15 N2. |
| 13:30 N2 (đợt 1)    | Task 10 chưa đủ test (a)(b)(c)         | Cắt thêm mục 4–5; M1, M5 dừng việc FE để hỗ trợ viết test.                                |
| 17:00 N2            | PBI chưa đạt DoD                       | Không tính SP; ghi vào release notes "chưa hoàn thành" và backlog tương lai.              |

---

## 16. Checklist điều hành và bàn giao

### 16.1 Dành cho M1 — SM

- [ ] **Trước Planning (CN 01/11)** · Xác nhận với từng người: làm toàn thời gian T2–T3; chốt kết quả Sprint 2
- [ ] **Planning** · Chốt Sprint Goal, Mục 3, cam kết 37 SP; tạo sub-task trên Board kèm giờ merge
- [ ] **N1 08:00** · Daily; nhắc mốc 09:30 (contract), 11:15 (migration)
- [ ] **N1 17:00** · Checkpoint; áp dụng 15.2 nếu cần; cập nhật Burndown
- [ ] **N2 08:00** · Daily; nhắc mốc 10:00, 11:00
- [ ] **N2 13:30** · Nghiệm thu đợt 1; quyết định ai được làm stretch
- [ ] **N2 15:30** · Code freeze
- [ ] **N2 16:00** · Nghiệm thu đợt 2 + chạy thử demo
- [ ] **N2 17:00–19:00** · Sửa bug; seed lại DB demo; PR develop → main; tag `v1.0.0`
- [ ] **N2 19:30** · Review + Retro; cập nhật Product Backlog (Done, stretch chưa làm, PB-32b, PB-33…37)

### 16.2 Checklist bàn giao cho khách hàng (Mục 11 của đề)

- [ ] Mã nguồn trên Git, nhánh `main` có tag `v1.0.0`
- [ ] `docker compose up --build` chạy đủ frontend + backend + PostgreSQL từ clone sạch
- [ ] README: môi trường, cách chạy, tài khoản test (khách/quầy/admin), thẻ test, mã giảm giá test
- [ ] `docs/`: architecture v3 + ADR, api-contract v3 + Swagger `/api-docs`, deployment, release-notes, demo-script, perf-report
- [ ] Demo end-to-end theo Mục 10.1
- [ ] Biên bản nghiệm thu, Burndown 3 Sprint, biên bản Retrospective

---

> **BrewLite — Sprint 3 Plan v1.1 (2 ngày làm việc)** · Môn Công nghệ Phần mềm · ĐH Sài Gòn
>
> **Ghi chú về phân công Sprint 3:** Nhóm đủ 5 người, làm toàn thời gian 2 ngày. Mỗi thành viên phụ trách một lát cắt dọc gồm cả backend và frontend: M1 tồn kho + "Hết hàng", M2 State Machine + trang xác nhận, M3 thanh toán + màn hình thanh toán, M4 khuyến mãi + điểm thưởng + idempotency tạo đơn + trạng thái lỗi/thử lại, M5 lịch sử đơn + phân quyền quầy + docker-compose + "Đơn của tôi". Chỉ cam kết hạng mục Must (37 SP). Trang Admin không làm; API quầy pha chế là bắt buộc (Task 10.1), UI quầy là stretch ưu tiên số 1.
