# BrewLite — Sprint 2: Kế hoạch chi tiết & Theo dõi tiến độ

> Giỏ hàng, đặt đơn & đăng nhập · **12/10 – 23/10/2026**

| Hạng mục         | Nội dung                                                 |
| ---------------- | -------------------------------------------------------- |
| Dự án            | BrewLite — ứng dụng đặt cà phê không dùng tiền mặt       |
| Nguồn            | Product Backlog v1.1 · Sprint 1 Plan v1.0 · Task 5, 6, 7 |
| Thời gian Sprint | 12/10/2026 – 23/10/2026 (2 tuần, 10 ngày làm việc)       |
| Cam kết          | 41 Story Points (+3 SP stretch)                          |
| Người lập        | Product Owner / Scrum Master                             |
| Ngày lập         | 07/10/2026                                               |

---

## Danh sách thành viên

| Mã     | Thành viên     | Vai trò chính                                                      |
| ------ | -------------- | ------------------------------------------------------------------ |
| **M1** | **Thanh Tùng** | PO + SM + Dev (**kiêm toàn bộ task Backend trước đây của M3**)     |
| **M2** | **Kiện Minh**  | Software Architect / Tech Lead + Dev                               |
| ~~M3~~ | ~~Hải Lý~~     | ~~Dev Backend~~ — **Tất cả task M3 trong Sprint 2 chuyển sang M1** |
| **M4** | **Hoàng Tịnh** | Dev Frontend                                                       |
| **M5** | **Trung Hiếu** | Dev Frontend                                                       |

> ⚠️ **Thay đổi phân công Sprint 2:** M3 (Hải Lý) tạm vắng. Toàn bộ sub-task Backend thuộc M3 được chuyển sang **M1 (Thanh Tùng)**. M1 vừa giữ vai trò PO + SM, vừa đảm nhận Backend chính của Sprint. M2 (Kiện Minh) hỗ trợ review và pair-programming nhiều hơn để giảm tải cho M1.

---

## Mục lục

1. [Tổng quan Sprint 2](#1-tổng-quan-sprint-2)
2. [Kết quả Sprint 1 và đầu vào cho Sprint 2](#2-kết-quả-sprint-1-và-đầu-vào-cho-sprint-2)
3. [Sprint Goal và tiêu chí thành công](#3-sprint-goal-và-tiêu-chí-thành-công)
4. [Sprint Backlog](#4-sprint-backlog)
5. [Đội ngũ, vai trò và năng lực](#5-đội-ngũ-vai-trò-và-năng-lực)
6. [Chi tiết từng hạng mục và sub-task (checklist)](#6-chi-tiết-từng-hạng-mục-và-sub-task-checklist)
7. [Luồng hoạt động và cách làm việc](#7-luồng-hoạt-động-và-cách-làm-việc)
8. [Các sự kiện Scrum trong Sprint 2](#8-các-sự-kiện-scrum-trong-sprint-2)
9. [Đặc tả kỹ thuật dùng chung](#9-đặc-tả-kỹ-thuật-dùng-chung)
10. [Kế hoạch nghiệm thu (Acceptance Test)](#10-kế-hoạch-nghiệm-thu-acceptance-test)
11. [Definition of Done và Definition of Ready](#11-definition-of-done-và-definition-of-ready)
12. [Theo dõi tiến độ: Burndown](#12-theo-dõi-tiến-độ-burndown)
13. [Rủi ro và quy tắc cắt phạm vi](#13-rủi-ro-và-quy-tắc-cắt-phạm-vi)
14. [Checklist điều hành Sprint](#14-checklist-điều-hành-sprint)

---

## 1. Tổng quan Sprint 2

Sprint 2 là Sprint thứ hai trong kế hoạch 3 Sprint của BrewLite. Theo đề bài và Product Backlog, Sprint này thực hiện **Task 5, 6, 7** với mục tiêu "Giỏ hàng & đặt đơn & đăng nhập". Sprint kéo dài **2 tuần** — mức tối đa đề bài cho phép (Mục 2.2) — vì khối lượng lớn hơn Sprint 1 và có phần xác thực (JWT) mới với nhóm.

| Hạng mục              | Nội dung                                                                                                                                                                     |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Sprint**            | Sprint 2 / 3                                                                                                                                                                 |
| **Thời gian**         | Thứ 2 12/10/2026 → Thứ 6 23/10/2026 (10 ngày làm việc). Sprint Planning: CN 11/10/2026, 20:00.                                                                               |
| **Sprint Goal**       | Khách thêm món vào giỏ, đăng ký/đăng nhập và tạo được đơn PENDING với giá do server tính (Mục 3).                                                                            |
| **Cam kết**           | **41 SP** = 34 SP theo kế hoạch Sprint 2 của Product Backlog + 3 SP chuyển từ Sprint 1 (PB-16, PB-17) + 4 SP kéo sớm từ Sprint 3 (PB-29, PB-30). **Stretch:** 3 SP (PB-28a). |
| **Task gốc**          | Task 5 — Giỏ hàng (5 SP) · Task 6 — API tạo đơn hàng (5 SP) · Task 7 — Đăng ký / Đăng nhập JWT (8 SP)                                                                        |
| **Đội ngũ**           | M1 (PO + SM + Dev **+ Backend của M3**) · M2 (SW + Dev) · M4, M5 (Dev FE)                                                                                                    |
| **Increment kỳ vọng** | Bản **v0.2.0**: menu có lọc/tìm, giỏ hàng lưu được, đăng ký/đăng nhập, đặt đơn PENDING; có CI và Swagger.                                                                    |

### Giả định khi lập kế hoạch

1. Sprint 1 đã hoàn thành toàn bộ 25 SP cam kết, Increment v0.1.0 đã nghiệm thu.
2. Hai hạng mục stretch của Sprint 1 (PB-16 Swagger, PB-17 CI) **chưa làm** nên được chuyển sang Sprint 2 — nếu đã xong thì bỏ 2 dòng này và giảm cam kết còn 38 SP.
3. Sprint 2 bắt đầu 12/10/2026 thay vì 05/10 như dự kiến trong Product Backlog v1.0, vì kế hoạch được lập ngày 07/10. Sprint 3 dời tương ứng sang 26/10 – 06/11/2026.

---

## 2. Kết quả Sprint 1 và đầu vào cho Sprint 2

| Chỉ số Sprint 1          | Giá trị                | Ý nghĩa cho Sprint 2                                                                                                                              |
| ------------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Velocity                 | 25 SP / 1 tuần         | Năng lực tham chiếu ≈ 50 SP cho 2 tuần. Nhóm chỉ cam kết 41 SP (≈ 82%) vì Sprint 2 có xác thực JWT và tích hợp FE–BE phức tạp hơn.                |
| Increment                | v0.1.0                 | Menu từ API, trang chi tiết chọn size/topping, đối tượng "Thêm vào giỏ" `{productId, size, toppings, unitPrice}` — điểm nối trực tiếp của Task 5. |
| Hạng mục chưa làm        | PB-16, PB-17 (stretch) | Chuyển sang Sprint 2. CI (PB-17) cần có trước khi viết E2E (PB-28a) và trước Sprint 3.                                                            |
| Tỷ lệ giờ thực/ước lượng | Nhóm điền sau Retro    | Nếu lệch > 20%, PO điều chỉnh cam kết ngay trong Sprint Planning.                                                                                 |

### 2.1 Hành động cải tiến từ Retrospective Sprint 1

- [ ] **Hành động 1:** _(nhóm điền sau Retro Sprint 1)_ — Người phụ trách: _____ — Cách đo: _____
- [ ] **Hành động 2:** _(nhóm điền sau Retro Sprint 1)_ — Người phụ trách: _____ — Cách đo: _____

### 2.2 Nguyên tắc làm việc giữ lại và bổ sung cho Sprint 2

- **Contract-first:** API contract v2 (auth, orders, lọc/tìm) chốt trong **Ngày 1** (task C.1); FE dùng mock theo contract cho tới khi API thật sẵn sàng.
- **Server là nguồn sự thật về giá:** FE và BE dùng chung bộ ca kiểm thử của quy tắc giá (Product Backlog Mục 6.1).
- **Chỉ M1 (thay M3) tạo migration Prisma;** mọi thay đổi schema đi qua PR riêng, M2 review.
- **Tích hợp sớm, theo cặp:** mỗi điểm nối FE–BE có một buổi pair ≤ 1,5 giờ (20.6, 6.8) thay vì đợi cuối Sprint.
- **Nghiệm thu 3 đợt** (Ngày 7, 9, 10) để không dồn rủi ro vào ngày cuối của Sprint 2 tuần.

---

## 3. Sprint Goal và tiêu chí thành công

> **Sprint Goal:** Đến hết Sprint 2, khách hàng **thêm đồ uống vào giỏ** (sửa số lượng, xóa, giỏ không mất khi tải lại trang), **đăng ký / đăng nhập** bằng JWT và **tạo được đơn hàng ở trạng thái PENDING** với tổng tiền do server tính lại; menu có lọc theo danh mục và tìm theo tên. Nền tảng chất lượng (CI, Swagger, log, đo hiệu năng) sẵn sàng cho thanh toán ở Sprint 3.

### 3.1 Tiêu chí thành công (đo được)

- [ ] **TC-1** Giỏ hàng: thêm/sửa số lượng/xóa, tự tính tổng, badge số lượng; F5 không mất giỏ (AT-11…AT-14)
- [ ] **TC-2** Đăng ký, đăng nhập, đăng xuất; mật khẩu băm bcrypt; route đặt đơn có guard (AT-15…AT-17)
- [ ] **TC-3** POST /orders validate đầu vào, lưu đơn PENDING, trả mã đơn; giá do server tính (AT-18…AT-21)
- [ ] **TC-4** Rate-limit đăng nhập, CORS whitelist; lọc/tìm menu; log có requestId (AT-22…AT-24)
- [ ] **TC-5** CI chặn PR lỗi; Swagger có route JWT; p95 < 500 ms; a11y ≥ 90 (AT-25…AT-27)
- [ ] **TC-6** Task 5, 6, 7 đạt Definition of Done; PO ký nghiệm thu; tag v0.2.0

### 3.2 Ngoài phạm vi Sprint 2

Thanh toán (Task 8), màn hình xác nhận và lịch sử đơn GET /orders/me (Task 9), State Machine/idempotency/tồn kho/khuyến mãi (Task 10), hủy đơn (PB-25). Sau khi tạo đơn, Sprint 2 chỉ hiển thị một trang đơn giản "Đã tạo đơn #mã – PENDING"; trang xác nhận đầy đủ thuộc Task 9.

---

## 4. Sprint Backlog

Các hạng mục được chọn từ Product Backlog, xếp theo thứ tự thực hiện. Task gốc giữ nguyên tên và tiêu chí như đề bài.

| #   | PB     | Hạng mục                                                             | Loại | Nguồn         | MoSCoW   | SP     | Chịu TN       | Hỗ trợ        |
| --- | ------ | -------------------------------------------------------------------- | ---- | ------------- | -------- | ------ | ------------- | ------------- |
| 1   | PB-07  | Task 7 — Đăng ký / Đăng nhập (JWT)                                   | Gốc  | Kế hoạch S2   | **Must** | 8      | **M2**        | ~~M3~~ **M1** |
| 2   | PB-05  | Task 5 — Giỏ hàng (Cart)                                             | Gốc  | Kế hoạch S2   | **Must** | 5      | **M5**        | —             |
| 3   | PB-19  | Lưu giỏ hàng vào localStorage                                        | BS   | Kế hoạch S2   | Should   | 2      | **M5**        | —             |
| 4   | PB-21  | Server tính lại giá đơn hàng (không tin giá từ client)               | BS   | Kế hoạch S2   | **Must** | 2      | **M2**        | —             |
| 5   | PB-06  | Task 6 — API tạo đơn hàng                                            | Gốc  | Kế hoạch S2   | **Must** | 5      | ~~M3~~ **M1** | M5            |
| 6   | PB-20  | Trang Đăng ký / Đăng nhập (Frontend) & route guard                   | BS   | Kế hoạch S2   | **Must** | 5      | **M4**        | —             |
| 7   | PB-22  | Tăng cường bảo mật API (helmet, rate-limit, CORS whitelist)          | BS   | Kế hoạch S2   | Should   | 2      | **M2**        | —             |
| 8   | PB-18  | Lọc menu theo danh mục & tìm kiếm theo tên                           | BS   | Kế hoạch S2   | Should   | 3      | ~~M3~~ **M1** | M4            |
| 9   | PB-23  | Ghi log request & mã tương quan (Nest Logger)                        | BS   | Kế hoạch S2   | Could    | 2      | **M1**        | —             |
| 10  | PB-16  | Tài liệu API bằng Swagger/OpenAPI                                    | BS   | Chuyển từ S1  | Should   | 1      | ~~M3~~ **M1** | —             |
| 11  | PB-17  | CI: GitHub Actions (lint + build + test)                             | BS   | Chuyển từ S1  | Should   | 2      | **M2**        | —             |
| 12  | PB-29  | Kiểm thử hiệu năng API (< 500 ms)                                    | BS   | Kéo sớm từ S3 | **Must** | 2      | **M1**        | —             |
| 13  | PB-30  | Tương thích trình duyệt, responsive & a11y cơ bản                    | BS   | Kéo sớm từ S3 | Should   | 2      | **M5**        | M4            |
| 14  | PB-28a | Kiểm thử E2E luồng chính — phần 1 (menu → giỏ → đăng nhập → đặt đơn) | BS   | **Stretch**   | Should   | 3      | **M5**        | M4            |
|     |        | **Tổng cam kết (không tính stretch)**                                |      |               |          | **41** |               |               |
|     |        | **Stretch (chỉ làm khi còn năng lực)**                               |      |               |          | **3**  |               |               |

### 4.1 Thay đổi so với Product Backlog v1.0

| Hạng mục                            | Thay đổi                                                                | Lý do                                                                                                |
| ----------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| PB-16 Swagger, PB-17 CI             | Sprint 1 (stretch) → Sprint 2 (cam kết)                                 | Chưa làm ở Sprint 1; CI là điều kiện để chạy E2E và kiểm thử tự động các API có JWT.                 |
| PB-29 Kiểm thử hiệu năng            | Sprint 3 → Sprint 2                                                     | GET /products và POST /orders đã có trong Sprint 2; giảm tải cho Sprint 3 (55 SP — rủi ro cao nhất). |
| PB-30 Tương thích trình duyệt, a11y | Sprint 3 → Sprint 2                                                     | 4 màn hình chính đã có; sửa sớm rẻ hơn sửa cuối dự án.                                               |
| PB-28 E2E (5 SP)                    | Tách thành PB-28a (3 SP, Sprint 2 — stretch) và PB-28b (2 SP, Sprint 3) | Phần luồng tới đặt đơn kiểm thử được ngay; phần thanh toán phải chờ Task 8.                          |
| Ngày Sprint 2, Sprint 3             | S2: 12/10 – 23/10 · S3: 26/10 – 06/11/2026                              | Kế hoạch Sprint 2 được lập ngày 07/10; giữ nguyên độ dài 2 tuần/Sprint.                              |

> Sau thay đổi, Sprint 3 còn 55 − 2 (PB-29) − 2 (PB-30) = **51 SP**; nếu làm được stretch PB-28a thì còn 48 SP.

---

## 5. Đội ngũ, vai trò và năng lực

### 5.1 Trách nhiệm trong Sprint 2

| Thành viên          | Vai trò                               | Trách nhiệm chính trong Sprint 2                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **M1 — Thanh Tùng** | PO + SM + Dev **+ Backend (thay M3)** | **PO:** chốt tiêu chí, nghiệm thu 3 đợt, viết tiêu chí chi tiết cho Sprint 3 (R.1). **SM:** điều hành sự kiện, Burndown, checkpoint cuối tuần 1, gỡ vướng mắc. **Dev:** logging (PB-23), đo hiệu năng (PB-29), README/.env, kiểm thủ công. **Backend (thay M3):** API contract v2 (C.1), migration Prisma, **API tạo đơn (PB-06)** với test unit/e2e, lọc/tìm phía API (PB-18), Swagger (PB-16). |
| **M2 — Kiện Minh**  | SW + Dev (Architect / Tech Lead)      | ERD v2, toàn bộ **Auth API (PB-07)**, PricingService phía server (PB-21), bảo mật (PB-22), CI (PB-17), ADR-002 lưu token; **reviewer chính** của PR backend, PR dụng tới schema và bảo mật. **Hỗ trợ M1** với các task Backend nặng (pair-programming khi cần).                                                                                                                                  |
| ~~M3 — Hải Lý~~     | ~~Dev — Backend~~                     | **Toàn bộ sub-task chuyển sang M1 trong Sprint 2.**                                                                                                                                                                                                                                                                                                                                              |
| **M4 — Hoàng Tịnh** | Dev — Frontend                        | **Đăng nhập/Đăng ký UI** và route guard (PB-20), lọc/tìm phía UI (PB-18), a11y màn hình xác thực (PB-30), E2E kịch bản 2 (stretch).                                                                                                                                                                                                                                                              |
| **M5 — Trung Hiếu** | Dev — Frontend                        | **Giỏ hàng (PB-05)** và lưu localStorage (PB-19), màn hình đặt đơn (PB-06 — phần UI), a11y Menu/Chi tiết/Giỏ (PB-30), E2E kịch bản 1 (stretch).                                                                                                                                                                                                                                                  |

### 5.2 Năng lực và mức phân bổ (10 ngày)

> ⚠️ **Lưu ý quan trọng:** Do M3 vắng mặt, M1 phải gánh thêm **29,5 giờ** sub-task Backend trước đây của M3 (xem Mục 6). Mức khả dụng dev của M1 chỉ 2,5 giờ/ngày = 25 giờ/Sprint, trong khi tổng việc giao là **≈ 46,5 giờ**. **Cần giảm cam kết hoặc M2 phải nhận pair-programming các task trọng điểm.**

Giữ mô hình của Sprint 1: mỗi người ~4 giờ/ngày; trừ Daily, review (và PO/SM với M1) còn lại là giờ dev khả dụng.

| Thành viên                | Giờ dev khả dụng / ngày | Khả dụng / Sprint | Đã phân bổ (cam kết) | Tỷ lệ       | Ghi chú                                                                |
| ------------------------- | ----------------------- | ----------------- | -------------------- | ----------- | ---------------------------------------------------------------------- |
| **M1** PO/SM/Dev **+ BE** | 2,5                     | 25 giờ            | **46,5 giờ**         | **186%** 🔴 | **Quá tải nghiêm trọng** do nhận cả phần của M3. Cần M2 pair/nhận bớt. |
| **M2** SW/Dev             | 3,25                    | 32,5 giờ          | 28,5 giờ             | 88%         | Có thể nhận thêm ~4 giờ để giảm tải cho M1.                            |
| ~~M3~~                    | ~~3,5~~                 | ~~35 giờ~~        | ~~0 giờ~~            | —           | **Vắng mặt — các task đã chuyển sang M1.**                             |
| **M4** Dev FE             | 3,5                     | 35 giờ            | 23,5 giờ             | 67%         | +4 giờ stretch → 79%.                                                  |
| **M5** Dev FE             | 3,5                     | 35 giờ            | 23,5 giờ             | 67%         | +4 giờ stretch → 79%.                                                  |
| **Cả nhóm (4 người)**     | —                       | **127,5 giờ**     | **122 giờ**          | **96%**     | Trung bình OK, nhưng lệch rất lớn vì dồn vào M1.                       |

**Hành động giảm tải cho M1 (bắt buộc trong Sprint Planning):**

- [ ] M2 nhận một trong các sub-task: **6.5 Unit test OrdersService (3h)** hoặc **6.6 e2e POST /orders (3h)**
- [ ] M2 pair với M1 ở **6.3 OrdersService.create (3,5h)** — ghi 1,5h cho M2, 2h cho M1
- [ ] Xem xét bỏ **PB-23 Ghi log request (Could, 4,5h)** nếu Burndown chậm sau Ngày 3
- [ ] Chốt lại cam kết sau Sprint Planning (có thể giảm từ 41 SP xuống 38 SP)

---

## 6. Chi tiết từng hạng mục và sub-task (checklist)

Mỗi hạng mục có checklist clickable để tick khi xong. Sub-task chỉ được coi là xong khi PR đã merge vào develop.

Ký hiệu: **N1** = Thứ 2 12/10 … **N5** = Thứ 6 16/10, **N6** = Thứ 2 19/10 … **N10** = Thứ 6 23/10

---

### 🔹 PB-07 · Task 7 — Đăng ký / Đăng nhập (JWT)

**8 SP · Task gốc · Kế hoạch S2 · Chịu TN: M2 · 19,5 giờ**

**Tiêu chí gốc (nguyên văn đề):** POST /auth/register, /auth/login; băm mật khẩu (bcrypt); phát JWT; guard bảo vệ route đặt đơn.

**Chi tiết hóa:**

- Email duy nhất (trùng → 409); mật khẩu ≥ 8 ký tự; bcrypt cost ≥ 10; không bao giờ trả về `passwordHash`
- Đăng nhập đúng → 200 + accessToken (JWT, có thời hạn); sai → 401
- JwtAuthGuard (Passport) bảo vệ POST /orders, POST /payments, GET /orders/me

**Sub-tasks:**

- [x] **E.1** · ERD v2: User, Order, OrderItem, OrderItemTopping, enum OrderStatus (đủ 7 trạng thái) · **M2** · 2h · N1 · ⇒ ERD v2 trong docs/, cả nhóm review
- [x] **7.1** · Migration Prisma cho User/Order/OrderItem/OrderItemTopping (id đơn bắt đầu từ 1001) + seed 2 tài khoản test · ~~M3~~ **M1** · 3h · N1–N2 · phụ thuộc E.1 · ⇒ `prisma migrate dev` sạch; seed có user test
- [x] **7.2** · AuthModule: POST /auth/register (DTO, email duy nhất → 409, bcrypt cost 10, không trả passwordHash) · **M2** · 4h · N2–N3 · phụ thuộc E.1, 7.1 · ⇒ Đăng ký thành công 201; trùng email 409
- [x] **7.3** · POST /auth/login: LocalStrategy + JwtStrategy (Passport), JWT hạn 1 giờ, sai → 401 · **M2** · 4h · N3–N4 · phụ thuộc 7.2 · ⇒ Trả `{accessToken, user}`
- [x] **7.4** · JwtAuthGuard, decorator @CurrentUser, GET /auth/me · **M2** · 2h · N4–N5 · phụ thuộc 7.3 · ⇒ Route có guard trả 401 khi thiếu/sai token
- [x] **7.5** · Unit test AuthService + e2e /auth (đăng ký, trùng email, đăng nhập đúng/sai, token hết hạn) · **M2** · 3h · N6–N7 · phụ thuộc 7.4 · ⇒ Test xanh, coverage AuthService ≥ 80%
- [x] **7.6** · ADR-002: cách lưu token ở FE, luồng xác thực (sơ đồ tuần tự) trong docs/architecture.md · **M2** · 1,5h · N7–N8 · phụ thuộc 7.3 · ⇒ ADR được nhóm thống nhất

---

### 🔹 PB-05 · Task 5 — Giỏ hàng (Cart)

**5 SP · Task gốc · Kế hoạch S2 · Chịu TN: M5 · 12,5 giờ**

**Tiêu chí gốc (nguyên văn đề):** Thêm/sửa số lượng/xóa; lưu state (Zustand/Context); tự tính tổng tiền; badge số lượng.

**Chi tiết hóa:**

- Mỗi dòng giỏ = sản phẩm + size + tập topping; cùng cấu hình thì gộp số lượng
- Số lượng tối thiểu 1 (giảm về 0 → hỏi xóa); tổng tiền tính lại tức thì; badge số lượng trên Header
- Giỏ trống hiển thị empty state kèm nút "Về menu"

**Sub-tasks:**

- [x] **5.1** · Cart store (Zustand): add (gộp dòng theo productId + size + tập topping), updateQty 1–20, remove, clear, selectors tổng tiền/số lượng · **M5** · 3,5h · N1–N2 · phụ thuộc C.1 · ⇒ `lib/cart-store.ts`
- [ ] **5.2** · Unit test cart store ≥ 8 ca (gộp dòng, khác topping, giới hạn số lượng, xóa, tổng tiền) · **M5** · 2,5h · N2–N3 · phụ thuộc 5.1 · ⇒ Test xanh
- [x] **5.3** · Nối nút "Thêm vào giỏ" (Sprint 1) với store + toast; badge số lượng trên Header · **M5** · 2,5h · N3 · phụ thuộc 5.1 · ⇒ Badge đổi ngay khi thêm
- [x] **5.4** · Trang `/cart`: danh sách dòng (size, topping), bộ tăng/giảm số lượng, giảm về 0 → hỏi xóa, tổng tiền, empty state "Về menu" · **M5** · 4h · N3–N4 · phụ thuộc 5.1, 5.3 · ⇒ Trang giỏ đúng 3 tiêu chí gốc của Task 5

---

### 🔹 PB-19 · Lưu giỏ hàng vào localStorage

**2 SP · Bổ sung · Kế hoạch S2 · Chịu TN: M5 · 4 giờ**

**Giá trị:** Khách tải lại trang không mất giỏ hàng; trải nghiệm giống ứng dụng thật.

**Tiêu chí chấp nhận:** Giỏ hàng khôi phục sau khi F5; dữ liệu hỏng/hết hạn được bỏ qua an toàn.

**Sub-tasks:**

- [x] **19.1** · persist middleware (localStorage) có version, kiểm tra dữ liệu bằng zod; xử lý hydration của Next.js · **M5** · 3h · N5 · phụ thuộc 5.4 · ⇒ F5 không mất giỏ; không lỗi hydration
- [ ] **19.2** · Test dữ liệu hỏng/khác version bị bỏ qua an toàn · **M5** · 1h · N5–N6 · phụ thuộc 19.1 · ⇒ Test xanh

---

### 🔹 PB-21 · Server tính lại giá đơn hàng (không tin giá từ client)

**2 SP · Bổ sung · Kế hoạch S2 · Chịu TN: M2 · 4 giờ**

**Giá trị:** Bảo mật nghiệp vụ: client có thể sửa giá; server phải là nguồn sự thật cho lineTotal/total.

**Tiêu chí chấp nhận:** POST /orders bỏ qua giá do client gửi; tính lại từ Product + size + topping; test gửi giá giả vẫn ra tổng đúng.

**Sub-tasks:**

- [x] **21.1** · PricingService phía server dùng chung quy tắc giá (cùng bộ ca kiểm thử với `calcUnitPrice` của FE) · **M2** · 2,5h · N1–N2 · phụ thuộc E.1 · ⇒ `src/pricing/pricing.service.ts`
- [ ] **21.2** · Test: client gửi giá giả vẫn ra lineTotal/total đúng; topping không hợp lệ bị từ chối · **M2** · 1,5h · N8 · phụ thuộc 21.1, 6.3 · ⇒ Test xanh

---

### 🔹 PB-06 · Task 6 — API tạo đơn hàng

**5 SP · Task gốc · Kế hoạch S2 · Chịu TN: ~~M3~~ M1 · 22,5 giờ**

**Tiêu chí gốc (nguyên văn đề):** NestJS POST /orders nhận giỏ hàng, validate (class-validator), lưu đơn trạng thái PENDING, trả mã đơn.

**Chi tiết hóa:**

- DTO validate: items ≥ 1, số lượng 1–20, size ∈ {S,M,L}, productId phải tồn tại; sai → 400 với thông báo rõ ràng
- Lưu Order + OrderItem trong một transaction; trả 201 `{orderId, status: PENDING, total}`
- Endpoint yêu cầu JWT sau khi PB-07 hoàn thành

**Sub-tasks:**

- [ ] **C.1** · Chốt API contract v2: /auth/\*, POST /orders, GET /products?category&q, GET /categories (JSON mẫu, mã lỗi) · ~~M3~~ **M1** · 1,5h · N1 · ⇒ docs/api-contract.md v2 được M2, M4, M5 duyệt
- [ ] **6.1** · CreateOrderDto: items ≥ 1, ValidateNested, size ∈ {S,M,L}, qty 1–20, toppingIds là mảng số · ~~M3~~ **M1** · 2,5h · N2–N3 · phụ thuộc C.1, 7.1 · ⇒ DTO sai → 400 đúng định dạng lỗi chung
- [ ] **6.2** · Kiểm tra productId/toppingId tồn tại và đang bán; ánh xạ lỗi Prisma (P2002, P2003) sang HTTP · ~~M3~~ **M1** · 2,5h · N3 · phụ thuộc 6.1 · ⇒ Sản phẩm không tồn tại → 400 rõ ràng
- [ ] **6.3** · OrdersService.create: một transaction lưu Order + OrderItem + OrderItemTopping, giá do PricingService tính, trạng thái PENDING · ~~M3~~ **M1** (pair M2) · 3,5h · N4 · phụ thuộc 6.2, 21.1 · ⇒ Đơn lưu đúng trong DB
- [ ] **6.4** · POST /orders gắn JwtAuthGuard, trả 201 `{orderId, code, status: PENDING, total}` · ~~M3~~ **M1** · 1h · N5 · phụ thuộc 6.3, 7.4 · ⇒ Endpoint đúng contract v2
- [ ] **6.5** · Unit test OrdersService (tính tổng, transaction rollback khi lỗi) · ~~M3~~ **M1 hoặc M2** · 3h · N5–N6 · phụ thuộc 6.3 · ⇒ Test xanh
- [ ] **6.6** · e2e POST /orders: 401 khi thiếu token, 400 khi sai DTO, 201 khi giá hợp lệ, giá giả bị bỏ qua · ~~M3~~ **M1 hoặc M2** · 3h · N7–N8 · phụ thuộc 6.4 · ⇒ Test xanh trong CI
- [ ] **6.7** · Màn hình đặt đơn từ giỏ: nút "Đặt hàng" → (chưa đăng nhập thì /login) → POST /orders → trang "Đã tạo đơn #mã – PENDING", xóa giỏ khi thành công · **M5** · 4h · N6–N7 · phụ thuộc 5.4, 6.4, 20.4 · ⇒ Luồng tạo đơn chạy trên UI
- [ ] **6.8** · Tích hợp và sửa lỗi luồng đăng nhập ↔ đặt đơn (pair M1 + M5) · ~~M3~~ **M1** · 1,5h · N8 · phụ thuộc 6.7 · ⇒ Luồng chạy với API thật, không lỗi CORS/401 sai

---

### 🔹 PB-20 · Trang Đăng ký / Đăng nhập (Frontend) & route guard

**5 SP · Bổ sung · Kế hoạch S2 · Chịu TN: M4 · 17 giờ**

**Giá trị:** Task 7 chỉ nêu API; người dùng cần giao diện và chuyển hướng "nếu chưa đăng nhập" ở luồng nghiệp vụ.

**Tiêu chí chấp nhận:** Form đăng ký/đăng nhập có validate và thông báo lỗi; lưu token an toàn; middleware chuyển hướng /login khi chưa đăng nhập; nút Đăng xuất.

**Sub-tasks:**

- [x] **20.1** · Auth store (Zustand) + API client tự gắn Authorization, gặp 401 thì đăng xuất và chuyển /login · **M4** · 3h · N1–N2 · phụ thuộc C.1 · ⇒ `lib/auth-store.ts`, `api.ts` cập nhật
- [x] **20.2** · Trang /login: form react-hook-form + zod, thông báo lỗi 401, loading · **M4** · 3,5h · N2–N3 · phụ thuộc 20.1 · ⇒ Đăng nhập được với tài khoản test
- [x] **20.3** · Trang /register: validate email, mật khẩu ≥ 8 ký tự, xác nhận mật khẩu; lỗi 409 · **M4** · 3h · N3–N4 · phụ thuộc 20.2 · ⇒ Đăng ký rồi tự đăng nhập
- [x] **20.4** · Route guard (middleware) cho /checkout, lưu returnUrl và quay lại sau khi đăng nhập · **M4** · 2,5h · N4 · phụ thuộc 20.2 · ⇒ Chưa đăng nhập bị chuyển `/login?returnUrl=...`
- [x] **20.5** · Header: menu người dùng (email), nút Đăng xuất · **M4** · 1,5h · N4–N5 · phụ thuộc 20.1 · ⇒ Đăng xuất xóa token, về trang chủ
- [ ] **20.6** · Test FE: schema zod của form, auth store; tích hợp với API thật (pair M2 + M4) · **M4** · 3,5h · N5–N6 · phụ thuộc 20.3, 7.4 · ⇒ Test xanh; đăng nhập/đăng ký chạy với API thật

---

### 🔹 PB-22 · Tăng cường bảo mật API (helmet, rate-limit, CORS whitelist)

**2 SP · Bổ sung · Kế hoạch S2 · Chịu TN: M2 · 3 giờ**

**Giá trị:** Yêu cầu phi chức năng về bảo mật; chống brute-force đăng nhập.

**Tiêu chí chấp nhận:** Helmet bật; giới hạn tần suất /auth/login; CORS chỉ cho origin của FE; không lộ stack trace ở production.

**Sub-tasks:**

- [x] **22.1** · helmet; @nestjs/throttler cho /auth/login (5 lần/phút); CORS whitelist theo env; ẩn stack trace ở production · **M2** · 2,5h · N8–N9 · phụ thuộc 7.5 · ⇒ Lần đăng nhập thứ 6 trong 1 phút → 429
- [x] **22.2** · Test và ghi cấu hình bảo mật vào README · **M2** · 0,5h · N9 · phụ thuộc 22.1 · ⇒ README mục Bảo mật

---

### 🔹 PB-18 · Lọc menu theo danh mục & tìm kiếm theo tên

**3 SP · Bổ sung · Kế hoạch S2 · Chịu TN: ~~M3~~ M1 · 9 giờ**

**Giá trị:** Menu dài cần lọc nhanh; nâng chất lượng trải nghiệm so với bản tối thiểu.

**Tiêu chí chấp nhận:** GET /products?category=&q= hoạt động; UI có tab danh mục và ô tìm kiếm (debounce); empty state khi không có kết quả.

**Sub-tasks:**

- [ ] **18.1** · GET /products?category=&q= (tìm không phân biệt dấu: "ca phe" khớp "Cà phê") + GET /categories · ~~M3~~ **M1** · 3,5h · N6–N7 · phụ thuộc C.1 · ⇒ Query đúng contract v2
- [ ] **18.2** · Test truy vấn lọc/tìm (có dấu, không dấu, rỗng, danh mục sai) · ~~M3~~ **M1** · 1,5h · N8–N9 · phụ thuộc 18.1 · ⇒ Test xanh
- [ ] **18.3** · UI: tab danh mục + ô tìm kiếm (debounce 300 ms), đồng bộ query lên URL, empty state khi không có kết quả · **M4** · 4h · N8–N9 · phụ thuộc 18.1 · ⇒ Lọc/tìm trên trang Menu

---

### 🔹 PB-23 · Ghi log request & mã tương quan (Nest Logger)

**2 SP · Bổ sung · Kế hoạch S2 · Chịu TN: M1 · 4,5 giờ**

**Giá trị:** Hỗ trợ debug tích hợp FE–BE và truy vết đơn hàng khi demo.

**Tiêu chí chấp nhận:** Mỗi request có log method/url/status/thời gian; lỗi có log kèm requestId.

**Sub-tasks:**

- [ ] **23.1** · LoggingInterceptor: method, url, status, thời gian; gắn requestId (header X-Request-Id) vào log lỗi · **M1** · 3,5h · N2–N3 · ⇒ Log có requestId
- [ ] **23.2** · Test interceptor + ghi hướng dẫn đọc log vào README · **M1** · 1h · N3 · phụ thuộc 23.1 · ⇒ Test xanh

---

### 🔹 PB-16 · Tài liệu API bằng Swagger/OpenAPI

**1 SP · Bổ sung · Chuyển từ S1 · Chịu TN: ~~M3~~ M1 · 3 giờ**

**Giá trị:** FE và tester tra cứu API không cần hỏi trực tiếp; là phần của tài liệu bàn giao.

**Tiêu chí chấp nhận:** Truy cập `/api-docs` xem và gọi thử GET /products, /products/:id, /toppings.

**Sub-tasks:**

- [ ] **16.1** · Swagger /api-docs cho products, categories, auth, orders; nút Authorize (Bearer) · ~~M3~~ **M1** · 3h · N9–N10 · phụ thuộc 6.4, 18.1 · ⇒ /api-docs gọi thử được cả route có JWT

---

### 🔹 PB-17 · CI: GitHub Actions (lint + build + test)

**2 SP · Bổ sung · Chuyển từ S1 · Chịu TN: M2 · 4 giờ**

**Giá trị:** Phát hiện lỗi build sớm, hỗ trợ tiêu chí DoD "không lỗi build".

**Tiêu chí chấp nhận:** Mỗi PR tự chạy lint + build + test cho FE và BE; PR fail thì không được merge.

**Sub-tasks:**

- [ ] **17.1** · GitHub Actions: cài đặt, lint, build, test cho FE và BE (dịch vụ PostgreSQL cho e2e) · **M2** · 4h · N5–N6 · phụ thuộc 7.1 · ⇒ PR có check xanh/đỏ; bật bắt buộc khi merge

---

### 🔹 PB-29 · Kiểm thử hiệu năng API (< 500 ms)

**2 SP · Bổ sung · Kéo sớm từ S3 · Chịu TN: M1 · 4 giờ**

**Giá trị:** Chứng minh yêu cầu phi chức năng về thời gian phản hồi bằng số liệu.

**Tiêu chí chấp nhận:** Đo bằng autocannon/k6 trên GET /products, POST /orders; báo cáo p95 < 500 ms với dữ liệu mẫu.

**Sub-tasks:**

- [ ] **29.1** · Kịch bản autocannon cho GET /products và POST /orders (có token) với dữ liệu mẫu · **M1** · 3h · N6–N7 · phụ thuộc 6.4 · ⇒ `scripts/perf/*.js`
- [ ] **29.2** · Báo cáo p95 (< 500 ms), đề xuất tối ưu nếu vượt · **M1** · 1h · N8 · phụ thuộc 29.1 · ⇒ `docs/perf-report.md`

---

### 🔹 PB-30 · Tương thích trình duyệt, responsive & a11y cơ bản

**2 SP · Bổ sung · Kéo sớm từ S3 · Chịu TN: M5 · 5,5 giờ**

**Giá trị:** Yêu cầu phi chức năng "phù hợp trên các trình duyệt web".

**Tiêu chí chấp nhận:** Chạy đúng trên Chrome, Firefox, Edge (Safari nếu có); hiển thị tốt ở 360 px–1440 px; ảnh có alt, nút thao tác được bằng bàn phím.

**Sub-tasks:**

- [ ] **30.1** · Kiểm tra axe/Lighthouse và sửa a11y, responsive cho Menu, Chi tiết, Giỏ hàng (360–1440 px) · **M5** · 3h · N7–N8 · phụ thuộc 5.4 · ⇒ Lighthouse Accessibility ≥ 90
- [ ] **30.2** · Sửa a11y/responsive cho Đăng nhập, Đăng ký; kiểm thử Chrome, Firefox, Edge · **M4** · 2,5h · N8 · phụ thuộc 20.3 · ⇒ Bảng kết quả kiểm thử trình duyệt

---

### 🔹 PB-28a · Kiểm thử E2E luồng chính — phần 1 (menu → giỏ → đăng nhập → đặt đơn)

**3 SP · Bổ sung · STRETCH · Chịu TN: M5 · 8 giờ**

**Giá trị:** Tách từ PB-28 (5 SP): phần luồng đã có ở Sprint 2 làm trước; phần thanh toán (PB-28b, 2 SP) làm ở Sprint 3 khi có Task 8.

**Tiêu chí chấp nhận:** Playwright chạy được 2 kịch bản: (1) chọn món → giỏ → đặt đơn khi đã đăng nhập; (2) chưa đăng nhập → bị chuyển /login → quay lại giỏ → đặt đơn. Chạy trong CI.

**Sub-tasks:**

- [ ] **28.1** · Cài Playwright, dữ liệu test, kịch bản 1: chọn món → giỏ → đặt đơn (đã đăng nhập) · **M5** · 4h · N8–N9 · phụ thuộc 6.7, 17.1 · ⇒ Kịch bản 1 xanh
- [ ] **28.2** · Kịch bản 2: chưa đăng nhập → /login → quay lại → đặt đơn; chạy trong CI · **M4** · 4h · N9–N10 · phụ thuộc 28.1 · ⇒ Kịch bản 2 xanh trong CI

---

### 🔸 Hoạt động chung của Sprint (kiến trúc, tài liệu, kiểm thử, nghiệm thu, refinement, demo)

- [x] **A.1** · Cập nhật docs/architecture.md (module Auth, Orders, Pricing) và ERD v2 · **M2** · 1h · N9 · phụ thuộc 6.4, 7.6 · ⇒ Tài liệu kiến trúc v2
- [ ] **A.2** · Cập nhật README + .env.example (JWT_SECRET, JWT_EXPIRES_IN, CORS_ORIGIN, THROTTLE_\*; M2 bổ sung mục Bảo mật ở 22.2) · **M1** · 1,5h · N5–N6 · phụ thuộc 7.3 · ⇒ README khớp thực tế
- [ ] **A.3** · PO kiểm thủ công luồng nghiệp vụ theo kịch bản, ghi bug lên Board · **M1** · 1,5h · N8–N9 · phụ thuộc 6.8 · ⇒ Danh sách bug có mức độ
- [ ] **A.4** · Nghiệm thu đợt 1: Giỏ hàng + Đăng nhập (AT-11…AT-17) · **M1** · 1h · N7 · phụ thuộc 5.4, 19.1, 20.6 · ⇒ Biên bản nghiệm thu phần 1
- [ ] **A.5** · Nghiệm thu đợt 2: Đặt đơn, bảo mật, lọc/tìm (AT-18…AT-24) · **M1** · 1h · N9–N10 · phụ thuộc 6.8, 22.1, 18.3, A.3 · ⇒ Biên bản nghiệm thu phần 2
- [ ] **A.6** · Nghiệm thu đợt 3: chất lượng (AT-25…AT-27), chốt danh sách Done · **M1** · 1h · N10 · phụ thuộc A.5, 29.2, 30.1, 16.1, 17.1 · ⇒ Biên bản nghiệm thu cuối
- [ ] **A.7** · Chuẩn bị kịch bản demo Sprint Review, PR develop → main, tag v0.2.0 · **M1** · 0,5h · N10 · phụ thuộc A.6 · ⇒ Tag v0.2.0
- [ ] **R.1** · PO viết tiêu chí chấp nhận chi tiết cho Task 8, 9, 10 và PB-24…31 trước buổi refinement · **M1** · 2h · N5 · ⇒ Product Backlog sẵn sàng cho Sprint 3

> Ghi chú: C.1 (API contract v2) và E.1 (ERD v2) được tính vào PB-06 và PB-07; chúng là việc đầu tiên của Sprint vì mọi thành viên khác phụ thuộc vào.

---

## 7. Luồng hoạt động và cách làm việc

### 7.1 Vòng đời một task

Giữ nguyên luồng của Sprint 1. Bổ sung cho Sprint 2: PR đụng tới **auth, schema hoặc cấu hình bảo mật** phải có M2 duyệt; PR nối FE–BE phải kèm ảnh chụp hoặc GIF luồng chạy với API thật.

```
Sprint Backlog → To Do → In Progress → In Review → Testing (PO nghiệm thu) → Done
```

- **WIP:** tối đa 2 sub-task In Progress/người; không quá 3 PR chờ review quá 4 giờ.
- **Bị chặn > 30 phút:** báo kênh chat, gắn nhãn `blocked`; SM (M1) gỡ, hoặc ghép cặp với người sở hữu phần phụ thuộc.
- **Done** = đạt DoD ở Mục 11; PR đã merge; Board và Burndown đã cập nhật.

### 7.2 Lịch làm việc theo thành viên (10 ngày)

> M3 vắng mặt — tất cả sub-task của M3 đã chuyển sang M1 (xem Mục 6 và 5.2).

**Tuần 1 (N1–N5):**

| Thành viên            | N1 T2 12/10                               | N2 T3 13/10                                            | N3 T4 14/10                        | N4 T5 15/10                           | N5 T6 16/10                        |
| --------------------- | ----------------------------------------- | ------------------------------------------------------ | ---------------------------------- | ------------------------------------- | ---------------------------------- |
| **M1** PO/SM/Dev + BE | **C.1** (1,5h), **7.1** (1,5h), 23.1 (1h) | 23.1 (2,5h), 23.2 (1h), **7.1** (1,5h), **6.1** (0,5h) | **6.1** (2h), **6.2** (2,5h)       | **6.3** (3,5h — pair M2)              | **6.4** (1h), A.2 (0,5h), R.1 (2h) |
| **M2** SW/Dev         | E.1 (2h), 21.1 (1,2h)                     | 7.2 (1,7h), 21.1 (1,2h)                                | 7.2 (2,3h), 7.3 (1h)               | 7.3 (3h), 7.4 (0,2h)                  | 7.4 (1,8h), 17.1 (1,5h)            |
| **M4** Dev FE         | 20.1 (2h)                                 | 20.1 (1h), 20.2 (2,5h)                                 | 20.2 (1h), 20.3 (2,5h)             | 20.3 (0,5h), 20.4 (2,5h), 20.5 (0,5h) | 20.5 (1h), 20.6 (1,6h)             |
| **M5** Dev FE         | 5.1 (2h)                                  | 5.1 (1,5h), 5.2 (2h)                                   | 5.2 (0,5h), 5.3 (2,5h), 5.4 (0,5h) | 5.4 (3,5h)                            | 19.1 (3h), 19.2 (0,5h)             |

**Tuần 2 (N6–N10):**

| Thành viên            | N6 T2 19/10                            | N7 T3 20/10                          | N8 T4 21/10                              | N9 T5 22/10                           | N10 T6 23/10                                    |
| --------------------- | -------------------------------------- | ------------------------------------ | ---------------------------------------- | ------------------------------------- | ----------------------------------------------- |
| **M1** PO/SM/Dev + BE | 29.1 (1,5h), A.2 (1h), **18.1** (1,5h) | 29.1 (1,5h), A.4 (1h), **18.1** (2h) | 29.2 (1h), **6.6** (1h), **18.2** (0,5h) | A.3 (1,4h), A.5 (0,4h), **18.2** (1h) | A.5 (0,6h), A.6 (1h), A.7 (0,5h), **16.1** (3h) |
| **M2** SW/Dev         | 7.5 (0,7h), 17.1 (2,5h)                | 7.5 (2,3h), 7.6 (1h)                 | 7.6 (0,5h), 21.2 (1,5h), 22.1 (1,2h)     | 22.1 (1,3h), 22.2 (0,5h), A.1 (1h)    | đệm / review                                    |
| **M4** Dev FE         | 20.6 (1,9h)                            | đệm / review                         | 18.3 (1h), 30.2 (2,5h)                   | 18.3 (3h)                             | đệm / review                                    |
| **M5** Dev FE         | **6.7** (2,5h → 4h), 19.2 (0,5h)       | 6.7 (1h), 30.1 (3h)                  | 30.1 (0,5h), **28.1** (3,5h)             | **28.1** (0,5h), đệm / review         | đệm / review                                    |

> Ô "đệm / review" là thời gian dành cho review PR, sửa bug từ nghiệm thu và hỗ trợ tích hợp. Nếu còn dư sau checkpoint tuần 1: M5 làm 28.1, M4 làm 28.2 (stretch).

### 7.3 Luồng bàn giao giữa các thành viên

Đường găng của Sprint: **ERD v2 → Migration → Auth API → POST /orders → Đặt hàng UI → Nghiệm thu**.

| Điểm bàn giao              | Từ → Đến            | Quy tắc                                                                                                                                             |
| -------------------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| API contract v2            | **M1** → M2, M4, M5 | Chốt trong **Ngày 1** (C.1). M4 dựng auth store, M5 dựng cart store theo contract ngay từ Ngày 1–2.                                                 |
| ERD v2 → Migration         | M2 → **M1**         | ERD duyệt trước 12:00 Ngày 1; migration merge trong Ngày 2. Không ai khác tạo migration.                                                            |
| PricingService             | M2 → **M1**         | Xong Ngày 1–2, dùng chung bộ ca kiểm thử với `calcUnitPrice` của Sprint 1; OrdersService chỉ gọi service này.                                       |
| Auth API → Guard           | M2 → **M1**, M4     | Login + JWT xong Ngày 4; guard + /auth/me xong Ngày 5. Trước đó **M1** viết OrdersService không phụ thuộc user (truyền userId), M4 dùng mock token. |
| POST /orders → Đặt hàng UI | **M1** → M5         | **M1** báo "API sẵn sàng" khi 6.4 merge (Ngày 5); M5 làm 6.7 từ Ngày 6; pair tích hợp 6.8 tối đa 1,5 giờ.                                           |
| Route guard → Đặt hàng UI  | M4 → M5             | Guard + returnUrl merge Ngày 4 để M5 dựng cho nút "Đặt hàng".                                                                                       |
| Lọc/tìm API → UI           | **M1** → M4         | API merge Ngày 7; UI làm Ngày 8–9. Trước đó M4 có thể dựng tab danh mục với dữ liệu mock.                                                           |
| CI → E2E (stretch)         | M2 → M5, M4         | CI chạy được e2e với PostgreSQL (17.1) trước khi viết Playwright (28.1).                                                                            |

### 7.4 Kế hoạch theo ngày

- [ ] **Ngày 0 — CN 11/10** · Sprint Planning: chốt Sprint Goal, cam kết 41 SP, phân công, rà soát kết quả Sprint 1, cập nhật Board · ⇒ Mỗi người biết việc N1; Burndown = 41
- [ ] **Ngày 1 — T2 12/10** · Contract v2, ERD v2, PricingService; bắt đầu migration; auth store; cart store · ⇒ Contract v2 và ERD v2 được duyệt
- [ ] **Ngày 2 — T3 13/10** · Migration xong; register API; Orders DTO; trang Login; test cart store; logging · ⇒ Migration merge; đăng ký chạy bằng Postman
- [ ] **Ngày 3 — T4 14/10** · Login + JWT; kiểm tra product/topping; trang Register; trang Giỏ hàng · ⇒ Trang giỏ hiển thị dữ liệu thật từ store
- [ ] **Ngày 4 — T5 15/10** · Guard + /auth/me; OrdersService transaction; route guard + returnUrl; header user menu · ⇒ Đăng nhập UI ↔ API chạy được
- [ ] **Ngày 5 — T6 16/10** · CI; POST /orders + unit test; localStorage; README/.env; R.1 (PO) · ⇒ **Checkpoint cuối tuần 1** (Mục 13.2); Task 5 và Task 7 gần xong
- [ ] **Ngày 6 — T2 19/10** · Test auth; pair tích hợp auth; màn hình đặt đơn; đo hiệu năng; lọc/tìm API · ⇒ Đặt đơn chạy trên UI với API thật
- [ ] **Ngày 7 — T3 20/10** · e2e POST /orders; ADR-002; test giá giả; a11y Menu/Giỏ; **nghiệm thu đợt 1** · ⇒ AT-11…AT-17 đạt
- [ ] **Ngày 8 — T4 21/10** · Bảo mật (helmet, throttler, CORS); test lọc/tìm; Swagger; a11y Login; UI lọc/tìm; báo cáo hiệu năng · ⇒ Refinement Sprint 3 20:20
- [ ] **Ngày 9 — T5 22/10** · Hoàn tất lọc/tìm UI; kiến trúc v2; PO kiểm thủ công; **nghiệm thu đợt 2** · ⇒ **Code freeze 22:00** (chỉ sửa bug)
- [ ] **Ngày 10 — T6 23/10** · **Nghiệm thu đợt 3**; PR develop → main, tag v0.2.0; Sprint Review + Retrospective · ⇒ Review 20:00, Retro 20:45

### 7.5 Quy trình Git và Pull Request

Giữ nguyên quy ước của Sprint 1 (Gitflow rút gọn main / develop / feature, Conventional Commits, PR ≤ 400 dòng, squash merge). Bổ sung:

- Từ **Ngày 5**, khi PB-17 xong, **PR chỉ được merge khi CI xanh** (lint + build + unit + e2e).
- PR có migration đặt tên `feature/PB-07-migration-user-order`, không gộp chung với code nghiệp vụ.
- Không được commit `JWT_SECRET` hay tài khoản thật; tài khoản test chỉ nằm trong seed.
- Reviewer: M2 ↔ **M1** (backend), M4 ↔ M5 (frontend), **M1** ← M2; PR auth/bảo mật luôn có M2.
- Kết thúc Sprint: **M1** mở PR develop → main, gắn tag `v0.2.0`.

---

## 8. Các sự kiện Scrum trong Sprint 2

- [ ] **Sprint Planning** · CN 11/10, 20:00 · 120 phút · Phần 1 (30 phút): xem lại kết quả Sprint 1 và hành động cải tiến. Phần 2: PO trình bày Sprint Goal, thay đổi backlog (Mục 4.1); nhóm rà soát ước lượng, chia sub-task, cam kết 41 SP
- [ ] **Daily Scrum** (ngày 1) · T2 12/10, 20:00 · 15 phút
- [ ] **Daily Scrum** (ngày 2) · T3 13/10, 20:00 · 15 phút
- [ ] **Daily Scrum** (ngày 3) · T4 14/10, 20:00 · 15 phút
- [ ] **Daily Scrum** (ngày 4) · T5 15/10, 20:00 · 15 phút
- [ ] **Checkpoint cuối tuần 1** · T6 16/10, 20:00 · 30 phút (Daily mở rộng) · So Burndown với ideal; kiểm tra hành động cải tiến từ Retro Sprint 1; áp dụng Mục 13.2 nếu cần
- [ ] **Daily Scrum** (ngày 6) · T2 19/10, 20:00 · 15 phút
- [ ] **Daily Scrum** (ngày 7) · T3 20/10, 20:00 · 15 phút
- [ ] **Backlog Refinement** · T4 21/10, 20:20 · 45 phút · Làm rõ, ước lượng lại Task 8, 9, 10 và PB-24…31 dựa trên tiêu chí PO viết ở R.1; tách Task 10 thành 10.1–10.4
- [ ] **Daily Scrum** (ngày 9) · T5 22/10, 20:00 · 15 phút
- [ ] **Sprint Review** · T6 23/10, 20:00 · 45 phút · Demo Increment v0.2.0 theo kịch bản ở Mục 8.1
- [ ] **Sprint Retrospective** · T6 23/10, 20:45 · 40 phút · Start / Stop / Continue; chọn tối đa 2 hành động cho Sprint 3

### 8.1 Kịch bản Sprint Review (demo)

- [ ] 1. M1 nhắc Sprint Goal, các thay đổi backlog và tiêu chí thành công
- [ ] 2. M4 lọc menu theo danh mục "Trà", tìm "ca phe" (không dấu) → ra các món cà phê (PB-18)
- [ ] 3. M5 thêm Cappuccino L + Trân châu + Kem cheese ×2 và một Trà đào M; sửa số lượng, xóa, F5 vẫn còn giỏ (Task 5, PB-19)
- [ ] 4. M5 bấm "Đặt hàng" khi chưa đăng nhập → chuyển /login; M4 đăng ký tài khoản mới → quay lại giỏ (Task 7, PB-20)
- [ ] 5. M5 đặt đơn → trang "Đã tạo đơn #1001 — PENDING"; **M1** mở /api-docs cho thấy đơn trong DB và tổng 134.000đ + 44.000đ do server tính (Task 6, PB-21)
- [ ] 6. **M1** gửi POST /orders với giá giả và DTO sai → 400; M2 thử đăng nhập sai 6 lần → 429 (PB-22)
- [ ] 7. M2 trình bày CI, kiến trúc v2, ADR-002; M1 trình bày báo cáo hiệu năng, biên bản nghiệm thu và Burndown thực tế

> **Chú giá demo:** Cappuccino L + Trân châu + Kem cheese = 67.000đ × 2 = 134.000đ; Trà đào M = 39.000 + 5.000 = 44.000đ; tổng 178.000đ.

---

## 9. Đặc tả kỹ thuật dùng chung cho Sprint 2

### 9.1 Mô hình dữ liệu bổ sung (Prisma)

```prisma
enum OrderStatus { PENDING PAID PAYMENT_FAILED PREPARING READY COMPLETED CANCELLED }
enum Size        { S M L }
enum Role        { CUSTOMER BARISTA ADMIN }       // BARISTA, ADMIN dành cho sau MVP

model User {
  id            Int      @id @default(autoincrement())
  email         String   @unique
  passwordHash  String
  loyaltyPoints Int      @default(0)
  role          Role     @default(CUSTOMER)
  createdAt     DateTime @default(now())
  orders        Order[]
}
model Order {                                   // id bắt đầu từ 1001 -> mã hiển thị #1001
  id        Int         @id @default(autoincrement())
  userId    Int
  user      User        @relation(fields: [userId], references: [id])
  status    OrderStatus @default(PENDING)
  total     Int                                 // VND, do server tính
  createdAt DateTime    @default(now())
  items     OrderItem[]
}
model OrderItem {
  id        Int   @id @default(autoincrement())
  orderId   Int
  order     Order @relation(fields: [orderId], references: [id])
  productId Int
  product   Product @relation(fields: [productId], references: [id])
  size      Size
  qty       Int
  unitPrice Int
  lineTotal Int
  toppings  OrderItemTopping[]
}
model OrderItemTopping {
  orderItemId Int
  toppingId   Int
  price       Int                               // giá topping tại thời điểm đặt
  @@id([orderItemId, toppingId])
}
```

### 9.2 API contract v2 (task C.1)

```
POST /auth/register    { "email": "an@brewlite.vn", "password": "matkhau123" }
                       -> 201 { "user": { "id": 3, "email": "an@brewlite.vn" }, "accessToken": "eyJ..." }
                       -> 400 (email/mật khẩu sai định dạng) | 409 (email đã tồn tại)
POST /auth/login       { "email": "...", "password": "..." }
                       -> 200 { "accessToken": "eyJ...", "expiresIn": 3600,
                                "user": { "id": 3, "email": "..." } }
                       -> 401 (sai thông tin) | 429 (quá 5 lần/phút)
GET  /auth/me          Authorization: Bearer <token>
                       -> 200 { "id": 3, "email": "...", "loyaltyPoints": 0 } | 401

POST /orders           Authorization: Bearer <token>
   { "items": [ { "productId": 3, "size": "L", "qty": 2, "toppingIds": [1, 2] },
                { "productId": 5, "size": "M", "qty": 1, "toppingIds": [] } ] }
                       -> 201 { "orderId": 1001, "code": "#1001", "status": "PENDING", "total": 178000,
                                "items": [ { "productId": 3, "size": "L", "qty": 2,
                                             "unitPrice": 67000, "lineTotal": 134000 }, ... ] }
                       -> 400 (DTO sai, sản phẩm/topping không tồn tại) | 401 (thiếu/sai token)

GET  /products?category=2&q=dao   -> 200 [ ...sản phẩm... ]
GET  /categories                  -> 200 [ { "id": 1, "name": "Cà phê" }, ... ]
```

### 9.3 Mã lỗi và định dạng lỗi

| HTTP    | Khi nào                                                                      | Ví dụ message                                                 |
| ------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **400** | DTO sai (class-validator), sản phẩm/topping không tồn tại hoặc ngừng bán     | items must contain at least 1 elements · Product 99 not found |
| **401** | Thiếu token, token sai/hết hạn, đăng nhập sai                                | Unauthorized                                                  |
| **404** | Tài nguyên không tồn tại (GET /products/:id)                                 | Product not found                                             |
| **409** | Email đã đăng ký                                                             | Email already registered                                      |
| **429** | Vượt giới hạn đăng nhập                                                      | Too Many Requests                                             |
| **500** | Lỗi không lường trước; không lộ stack trace; response có header X-Request-Id | Internal server error                                         |

### 9.4 Quy tắc giỏ hàng và xác thực

| Chủ đề                  | Quy tắc                                                                                                                                        |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Khóa dòng giỏ**       | `productId \| size \| toppingIds đã sắp xếp` — cùng khóa thì cộng dồn số lượng; khác topping là dòng khác.                                     |
| **Số lượng**            | 1–20 mỗi dòng (khớp DTO server). Giảm về 0 → hộp thoại xác nhận xóa.                                                                           |
| **Giá trong giỏ**       | FE tính bằng `calcUnitPrice` để hiển thị; số tiền chính thức là `total` server trả về khi tạo đơn.                                             |
| **Lưu giỏ**             | localStorage, khóa `brewlite-cart`, kèm `version: 1`; dữ liệu sai cấu trúc hoặc khác version bị bỏ qua. Xóa giỏ khi tạo đơn thành công.        |
| **JWT**                 | HS256, `JWT_SECRET` ≥ 32 ký tự trong env, hạn 1 giờ, payload `{sub, email}`; MVP không có refresh token.                                       |
| **Lưu token (ADR-002)** | localStorage + xóa khi 401/đăng xuất; giảm rủi ro XSS bằng hạn ngắn, không render HTML từ người dùng, helmet. Hướng nâng cấp: cookie httpOnly. |
| **Mật khẩu**            | ≥ 8 ký tự; bcrypt cost 10; không bao giờ trả passwordHash; thông báo đăng nhập sai không nói rõ sai email hay mật khẩu.                        |
| **Tìm kiếm**            | So khớp không phân biệt hoa thường và dấu tiếng Việt (bỏ dấu cả từ khóa lẫn tên sản phẩm trước khi so).                                        |

---

## 10. Kế hoạch nghiệm thu (Acceptance Test)

Đánh số tiếp từ Sprint 1 (AT-01…AT-10). PO chạy trên nhánh develop: đợt 1 ở A.4 (Ngày 7), đợt 2 ở A.5 (Ngày 9), đợt 3 ở A.6 (Ngày 10). AT của Sprint 1 được chạy lại nhanh ở đợt 3 để chắc chắn không bị hồi quy.

**Đợt 1 — Giỏ hàng + Đăng nhập (Ngày 7):**

- [ ] **AT-11** (PB-05) · Thêm 2 lần cùng cấu hình (Cappuccino + Trân châu); thêm 1 lần khác topping · ⇒ Cấu hình giống → 1 dòng SL 2; khác topping → dòng riêng; badge = tổng số lượng
- [ ] **AT-12** (PB-05) · Tăng/giảm số lượng, giảm về 0, xóa dòng · ⇒ Tổng tiền cập nhật ngay; về 0 hỏi xác nhận xóa; không vượt 20
- [ ] **AT-13** (PB-05) · Mở /cart khi giỏ trống · ⇒ Empty state + nút "Về menu"
- [ ] **AT-14** (PB-19) · Tải lại trang; sửa localStorage thành dữ liệu hỏng rồi tải lại · ⇒ Giỏ còn nguyên; dữ liệu hỏng → giỏ rỗng, ứng dụng không lỗi
- [ ] **AT-15** (PB-07) · Đăng ký email mới; email trùng; mật khẩu 7 ký tự · ⇒ 201 và có token; 409; 400. Response không chứa passwordHash
- [ ] **AT-16** (PB-07) · Đăng nhập đúng/sai; gọi /auth/me không token và với token hết hạn · ⇒ 200 + JWT; 401; 401; 401
- [ ] **AT-17** (PB-20) · Chưa đăng nhập bấm "Đặt hàng"; đăng nhập; đăng xuất · ⇒ Chuyển `/login?returnUrl=/cart`, đăng nhập xong quay lại giỏ; đăng xuất xóa token

**Đợt 2 — Đặt đơn, bảo mật, lọc/tìm (Ngày 9):**

- [ ] **AT-18** (PB-06) · POST /orders hợp lệ (có token) · ⇒ 201, status PENDING, có mã #1001…; DB có Order, OrderItem, OrderItemTopping
- [ ] **AT-19** (PB-06) · items rỗng; qty 0 và 21; size "XL"; productId 999; topping không tồn tại · ⇒ 400 với message rõ ràng cho từng trường hợp; không tạo đơn
- [ ] **AT-20** (PB-21) · Gửi kèm price = 1 trong order item: Cappuccino L + Trân châu + Kem cheese × 2 · ⇒ lineTotal = 134.000đ do server tính, bỏ qua giá client
- [ ] **AT-21** (PB-06) · Đặt đơn trên UI; giả lập lỗi 400/401 · ⇒ Thành công: trang "Đã tạo đơn #mã — PENDING", giỏ được xóa. Lỗi: báo lỗi, giỏ giữ nguyên
- [ ] **AT-22** (PB-22) · Đăng nhập sai 6 lần trong 1 phút; gọi API từ origin lạ; gây lỗi 500 · ⇒ Lần 6 → 429; CORS chặn; response không có stack trace
- [ ] **AT-23** (PB-18) · Chọn tab "Trà"; tìm "ca phe"; tìm "xyz"; tải lại trang · ⇒ Lọc đúng; ra các món Cà phê; empty state; URL giữ category/q
- [ ] **AT-24** (PB-23) · Gọi vài API, gây 1 lỗi · ⇒ Log có method/url/status/thời gian; lỗi có requestId trùng header X-Request-Id

**Đợt 3 — Chất lượng (Ngày 10):**

- [ ] **AT-25** (PB-16, 17) · Mở /api-docs, Authorize bằng token, gọi POST /orders; mở PR có test lỗi · ⇒ Gọi thành công; PR bị CI chặn merge
- [ ] **AT-26** (PB-29) · Đọc docs/perf-report.md · ⇒ p95 < 500 ms cho GET /products và POST /orders với dữ liệu mẫu
- [ ] **AT-27** (PB-30) · Lighthouse 4 màn hình (Menu, Chi tiết, Giỏ, Đăng nhập); Chrome, Firefox, Edge; 360–1440 px; dùng bàn phím · ⇒ Accessibility ≥ 90; hiển thị và thao tác đúng
- [ ] **AT-28** (PB-28a) · (Stretch) chạy Playwright trong CI · ⇒ 2 kịch bản xanh

---

## 11. Definition of Done và Definition of Ready

### 11.1 Definition of Done (nguyên văn từ đề — Mục 10)

Mỗi task phải thỏa đủ các điều sau mới được coi là Done:

- [ ] Code chạy được, không lỗi build; tuân theo tiêu chí chấp nhận của task
- [ ] Có commit trên Git với mô tả rõ ràng; được review trong nhóm
- [ ] API có validate đầu vào; UI xử lý trạng thái loading/lỗi cơ bản
- [ ] Có hướng dẫn chạy trong README

### 11.2 DoD bổ sung cho Sprint 2

- [ ] Tất cả DoD bổ sung của Sprint 1 (lint, test, review, nghiệm thu, Board/Burndown)
- [ ] Từ khi có CI: PR chỉ merge khi CI xanh
- [ ] Route cần đăng nhập có test 401; DTO mới có test 400; không trả passwordHash hay secret trong response/log
- [ ] Biến môi trường mới có trong .env.example; API mới có trong Swagger và docs/api-contract.md

### 11.3 Definition of Ready của Sprint 2

- [ ] Mọi PBI có tiêu chí chấp nhận (Mục 6) và SP; PB-28 đã được tách thành 28a/28b
- [ ] Increment v0.1.0 đã merge vào main; quy tắc giá và dữ liệu menu không đổi so với Sprint 1
- [ ] Quyết định lưu token (ADR-002) được thảo luận sơ bộ trong Planning; M2 hoàn thiện văn bản trong Sprint

---

## 12. Theo dõi tiến độ: Burndown

SP chỉ được trừ khi PBI đạt DoD và PO đã nghiệm thu. Vì nghiệm thu chia 3 đợt, đường thực tế sẽ có bậc rõ ở Ngày 7, 9 và 10; SM vẫn cập nhật hằng ngày theo số PBI đã đạt DoD.

| Ngày               | Ideal (SP còn lại) | Dự kiến theo lịch | Thực tế (SM điền) | Ghi chú / rủi ro             |
| ------------------ | ------------------ | ----------------- | ----------------- | ---------------------------- |
| Ngày 0 — Planning  | 41                 | 41,0              |                   |                              |
| Ngày 1 — T2 12/10  | 36,9               | 37,6              |                   |                              |
| Ngày 2 — T3 13/10  | 32,8               | 32,2              |                   |                              |
| Ngày 3 — T4 14/10  | 28,7               | 27,1              |                   |                              |
| Ngày 4 — T5 15/10  | 24,6               | 22,4              |                   |                              |
| Ngày 5 — T6 16/10  | 20,5               | 17,9              |                   | **Checkpoint cuối tuần 1**   |
| Ngày 6 — T2 19/10  | 16,4               | 13,0              |                   |                              |
| Ngày 7 — T3 20/10  | 12,3               | 8,7               |                   | Nghiệm thu đợt 1             |
| Ngày 8 — T4 21/10  | 8,2                | 4,8               |                   |                              |
| Ngày 9 — T5 22/10  | 4,1                | 1,0               |                   | Nghiệm thu đợt 2             |
| Ngày 10 — T6 23/10 | 0                  | 0,0               |                   | Nghiệm thu đợt 3, tag v0.2.0 |

> **Ngưỡng cảnh báo:** tại checkpoint Ngày 5, thực tế cao hơn ideal ≥ 6 SP (≈ 15% cam kết) ⇒ áp dụng quy tắc cắt phạm vi Mục 13.2.

### Mốc "Xong" dự kiến của từng PBI

- [x] **PB-07** — Task 7 — Đăng ký / Đăng nhập (JWT) · 8 SP · xong cuối N8
- [x] **PB-05** — Task 5 — Giỏ hàng (Cart) · 5 SP · xong cuối N4
- [x] **PB-19** — Lưu giỏ hàng vào localStorage · 2 SP · xong cuối N6 _(còn thiếu test 19.2)_
- [x] **PB-21** — Server tính lại giá đơn hàng · 2 SP · xong cuối N8 _(còn thiếu test 21.2)_
- [ ] **PB-06** — Task 6 — API tạo đơn hàng · 5 SP · xong cuối N8
- [x] **PB-20** — Trang Đăng ký / Đăng nhập (FE) & route guard · 5 SP · xong cuối N6 _(còn thiếu test 20.6)_
- [x] **PB-22** — Tăng cường bảo mật API · 2 SP · xong cuối N9
- [ ] **PB-18** — Lọc menu theo danh mục & tìm kiếm theo tên · 3 SP · xong cuối N9
- [ ] **PB-23** — Ghi log request & mã tương quan · 2 SP · xong cuối N3
- [ ] **PB-16** — Tài liệu API bằng Swagger/OpenAPI · 1 SP · xong cuối N10
- [ ] **PB-17** — CI: GitHub Actions · 2 SP · xong cuối N6
- [ ] **PB-29** — Kiểm thử hiệu năng API (< 500 ms) · 2 SP · xong cuối N8
- [ ] **PB-30** — Tương thích trình duyệt, responsive & a11y cơ bản · 2 SP · xong cuối N8
- [ ] **PB-28a** — E2E luồng chính phần 1 (stretch) · 3 SP · xong cuối N10

---

## 13. Rủi ro và quy tắc cắt phạm vi

### 13.1 Rủi ro và cách ứng phó

| #      | Rủi ro                                                         | Mức            | Ứng phó / người chịu trách nhiệm                                                                                                                      |
| ------ | -------------------------------------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **R0** | **M3 vắng mặt, M1 phải gánh thêm 29,5 giờ Backend**            | **Rất cao** 🔴 | **M2 pair/nhận bớt sub-task 6.3, 6.5, 6.6; cân nhắc bỏ PB-23 (Could) sau Ngày 3; checkpoint Burndown mỗi 2 ngày thay vì 1 lần giữa Sprint. — M1, M2** |
| R1     | Auth (Passport/JWT) trễ, chặn POST /orders và màn hình đặt đơn | Cao            | M2 làm Auth từ Ngày 1; OrdersService viết độc lập với user (nhận userId) để không bị chặn; pair M2–M1 ở 20.6. — M2                                    |
| R2     | Giá FE và BE lệch nhau                                         | Trung bình     | Một bộ ca kiểm thử dùng chung; server là nguồn sự thật; AT-20. — M2                                                                                   |
| R3     | Lỗi hydration khi đọc giỏ từ localStorage trong Next.js        | Trung bình     | Chỉ đọc localStorage ở client (persist skipHydration / useEffect), hiển thị skeleton tới khi nạp xong. — M5                                           |
| R4     | Token lưu localStorage có rủi ro XSS                           | Trung bình     | JWT 1 giờ, không render HTML người dùng nhập, helmet; ghi rõ hướng cookie httpOnly trong ADR-002. — M2                                                |
| R5     | Migration xung đột khi nhiều người sửa schema                  | Trung bình     | Chỉ M1 (thay M3) tạo migration; PR schema riêng; M2 review. — M1                                                                                      |
| R6     | Sprint 2 tuần dễ mất nhịp, dồn việc sang tuần 2                | Trung bình     | Checkpoint cuối tuần 1; nghiệm thu 3 đợt; Daily nêu rõ PBI đang chờ nghiệm thu. — M1                                                                  |
| R7     | Tìm kiếm tiếng Việt có dấu cho kết quả sai                     | Thấp           | Chuẩn hóa bỏ dấu ở cả từ khóa và tên; test có dấu/không dấu (18.2). — M1                                                                              |
| R8     | M1 quá tải vì kiêm PO + SM + Dev + BE                          | **Cao** 🔴     | Việc dev của M1 chỉ 17 giờ gốc; +29,5h từ M3 → **cần giảm cam kết hoặc M2 nhận thêm**; M2 thay điều hành Daily khi M1 nghiệm thu. — M1, M2            |

### 13.2 Quy tắc cắt phạm vi

Sprint 2 đã dùng mức tối đa 2 tuần, nên **không gia hạn**; nếu trễ thì cắt phạm vi theo thứ tự dưới đây (PO quyết định, báo trong Daily).

| Thứ tự cắt | Hạng mục                                        | Xử lý                                                   |
| ---------- | ----------------------------------------------- | ------------------------------------------------------- |
| 1          | PB-28a E2E (stretch)                            | Không làm; giữ nguyên ở Sprint 3 cùng PB-28b.           |
| 2          | PB-23 Log (Could)                               | Chuyển về đầu Product Backlog.                          |
| 3          | PB-30 a11y, PB-29 hiệu năng (kéo sớm)           | Trả về Sprint 3 như kế hoạch ban đầu.                   |
| 4          | PB-16 Swagger                                   | Chuyển Sprint 3; dùng docs/api-contract.md thay thế.    |
| 5          | PB-18 Lọc/tìm (Should)                          | Giữ phần API nếu đã xong, UI chuyển Sprint 3.           |
| Không cắt  | Task 5, 6, 7; PB-19, PB-20, PB-21, PB-22, PB-17 | Là cốt lõi của Sprint Goal hoặc điều kiện cho Sprint 3. |

| Thời điểm                       | Điều kiện                      | Hành động                                                                     |
| ------------------------------- | ------------------------------ | ----------------------------------------------------------------------------- |
| Checkpoint T6 16/10             | Thực tế cao hơn ideal < 6 SP   | Tiếp tục; giữ stretch nếu Task 5 và Task 7 đã xong.                           |
| Checkpoint T6 16/10             | Cao hơn ideal ≥ 6 SP           | Cắt mục 1–2; dồn M1, M4 hỗ trợ đường găng (Auth → POST /orders → UI đặt đơn). |
| T3 20/10 (sau nghiệm thu đợt 1) | Task 5 hoặc Task 7 chưa đạt AT | Cắt thêm mục 3–4; cả nhóm sửa bug trước khi làm việc mới.                     |
| T6 23/10                        | PBI chưa đạt DoD               | Không tính SP; chuyển về đầu Product Backlog cho Sprint 3.                    |

---

## 14. Checklist điều hành Sprint (dành cho M1 — SM)

- [ ] **Trước Planning** · Chốt kết quả Sprint 1 (velocity, hạng mục chưa xong, hành động Retro); chuẩn bị đề xuất thay đổi backlog (Mục 4.1)
- [ ] **Ngày 0 (11/10)** · Chạy Planning; tạo sub-task trên Board (người nhận, giờ, nhãn PB-xx); Burndown ban đầu = 41
- [ ] **Mỗi ngày (N1–N10)** · Daily 15 phút; cập nhật Burndown; kiểm tra PR chờ > 4 giờ và CI đỏ; gỡ blocker
- [ ] **Ngày 5 (16/10)** · Checkpoint cuối tuần 1; kiểm tra hành động cải tiến; áp dụng Mục 13.2 nếu cần
- [ ] **Ngày 7 (20/10)** · Nghiệm thu đợt 1; ghi biên bản; chuyển bug thành sub-task ưu tiên cao
- [ ] **Ngày 8 (21/10)** · Refinement Sprint 3; xác nhận tiêu chí Task 8–10 đủ DoR
- [ ] **Ngày 9 (22/10)** · Nghiệm thu đợt 2; code freeze 22:00
- [ ] **Ngày 10 (23/10)** · Nghiệm thu đợt 3; tag v0.2.0; Review + Retro; cập nhật Product Backlog v1.2 (đánh dấu Sprint 2 Done, velocity thực tế, phản hồi khách hàng)

---

> **BrewLite — Sprint 2 Plan v1.0** · Môn Công nghệ Phần mềm · ĐH Sài Gòn
>
> **Ghi chú về phân công Sprint 2:** Tất cả sub-task thuộc M3 (Hải Lý) đã chuyển sang M1 (Thanh Tùng). M1 chịu trách nhiệm chính cho PB-06, PB-18, PB-16 và các sub-task kỹ thuật trước đây của M3 (7.1, C.1, 6.1–6.6, 6.8, 18.1, 18.2, 16.1). M2 (Kiện Minh) hỗ trợ pair-programming để cân tải.
