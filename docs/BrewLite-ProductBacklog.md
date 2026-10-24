# BrewLite — Product Backlog v1.0

> Danh mục hạng mục sản phẩm theo Agile Scrum
> Dự án: **BrewLite — Ứng dụng đặt cà phê không dùng tiền mặt**

| Hạng mục      | Nội dung                                           |
| ------------- | -------------------------------------------------- |
| Dự án         | BrewLite — ứng dụng đặt cà phê không dùng tiền mặt |
| Nguồn yêu cầu | BrewLite-CongNghePhanMem.pdf (VER 1.0)             |
| Môn học       | Công nghệ Phần mềm — Học kỳ I, 2026–2027           |
| Công nghệ     | NestJS (Backend) + Next.js (Frontend)              |
| Người lập     | Product Owner của nhóm                             |
| Ngày lập      | 26/09/2026                                         |
| Phiên bản     | 1.0 — Baseline trước Sprint 1                      |

---

## Mục lục

1. [Giới thiệu tài liệu](#1-giới-thiệu-tài-liệu)
2. [Product Vision và phạm vi MVP](#2-product-vision-và-phạm-vi-mvp)
3. [Epic](#3-epic)
4. [Product Backlog gốc (nguyên văn đề bài)](#4-product-backlog-gốc-nguyên-văn-đề-bài)
5. [Chi tiết hóa 10 task gốc](#5-chi-tiết-hóa-10-task-gốc)
6. [Quyết định của PO và quy ước nghiệp vụ](#6-quyết-định-của-po-và-quy-ước-nghiệp-vụ)
7. [Hạng mục bổ sung [BS]](#7-hạng-mục-bổ-sung-bs)
8. [Product Backlog tổng hợp theo thứ tự ưu tiên](#8-product-backlog-tổng-hợp-theo-thứ-tự-ưu-tiên)
9. [Kế hoạch Sprint và Roadmap](#9-kế-hoạch-sprint-và-roadmap)
10. [Truy vết yêu cầu](#10-truy-vết-yêu-cầu)
11. [Ước lượng và ưu tiên](#11-ước-lượng-và-ưu-tiên)
12. [Definition of Ready và Definition of Done](#12-definition-of-ready-và-definition-of-done)
13. [Rủi ro và giả định](#13-rủi-ro-và-giả-định)
14. [Quản lý thay đổi Backlog](#14-quản-lý-thay-đổi-backlog)

---

## 1. Giới thiệu tài liệu

Tài liệu này là **Product Backlog** của dự án BrewLite — artifact Scrum liệt kê mọi hạng mục cần làm, được Product Owner (PO) sắp xếp theo thứ tự ưu tiên. Nội dung được xây dựng từ đề bài _BrewLite-CongNghePhanMem.pdf_ và là đầu vào cho Sprint Planning của Sprint 1.

### 1.1 Nguyên tắc lập backlog

- **10 task gốc của đề bài được giữ nguyên** (tên, tiêu chí chấp nhận, điểm chấm, thứ tự và Sprint gợi ý). Tài liệu chỉ _chi tiết hóa_ thêm, không sửa hay xóa nội dung gốc (Mục 4–5).
- **27 hạng mục bổ sung** (ký hiệu **BS**) được thêm để dự án chuyên nghiệp hơn: nền tảng kỹ thuật, bảo mật, kiểm thử, tài liệu và các mở rộng tương lai (Mục 7). Hạng mục bổ sung **không** thay thế và **không** làm thay đổi điểm chấm của task gốc.
- Phân biệt hai loại "điểm": **Điểm chấm** (mỗi task gốc 1 điểm, tổng 10 — theo đề) và **Story Points (SP)** — đơn vị ước lượng công sức của nhóm, dùng cho Sprint Planning và Burndown chart.
- Task gốc đạt điểm khi thỏa Definition of Done của đề (Mục 12.2). Hạng mục bổ sung phục vụ chất lượng và là căn cứ chứng minh quy trình Scrum chuyên nghiệp.

### 1.2 Chú giải các cột

| Ký hiệu    | Ý nghĩa                                                                                                                     |
| ---------- | --------------------------------------------------------------------------------------------------------------------------- |
| **PB-xx**  | Mã hạng mục Product Backlog. PB-01…PB-10 = 10 task gốc (PB-xx ứng với Task xx); PB-11 trở đi = hạng mục bổ sung.            |
| **Loại**   | Gốc: nguyên văn từ đề bài. BS: bổ sung.                                                                                     |
| **Epic**   | Nhóm hạng mục lớn (E1–E8, xem Mục 3).                                                                                       |
| **MoSCoW** | **Must** bắt buộc cho MVP · **Should** quan trọng, nên có · **Could** có thì tốt · **Won't** không làm trong phiên bản này. |
| **SP**     | Story Points theo dãy Fibonacci (1, 2, 3, 5, 8, 13); 1 SP ≈ 3 giờ làm việc lý tưởng của một dev.                            |
| **Sprint** | S1/S2/S3 = Sprint dự kiến thực hiện; **S1*** = stretch (chỉ làm nếu còn năng lực); "Sau MVP" = backlog tương lai.           |

---

## 2. Product Vision và phạm vi MVP

> _"BrewLite giúp khách hàng đặt và thanh toán đồ uống không dùng tiền mặt chỉ trong vài chạm, giảm thời gian xếp hàng và nhận đơn nhanh tại quầy."_

### 2.1 Mục tiêu sản phẩm

- Khách hàng đi trọn luồng: **chọn đồ uống → tùy chọn size/topping → giỏ hàng → đăng nhập → thanh toán không tiền mặt → xác nhận đơn**.
- Nhóm vận hành đúng quy trình Agile Scrum: 3 Sprint, có Sprint Planning, Daily Scrum, Sprint Review, Retrospective chạy được sau mỗi Sprint.
- Bàn giao mã nguồn, docker-compose, README và demo end-to-end cho "khách hàng" (giảng viên).

### 2.2 Trong và ngoài phạm vi MVP

| Trong phạm vi MVP                                                                          | Ngoài phạm vi (backlog tương lai)                              |
| ------------------------------------------------------------------------------------------ | -------------------------------------------------------------- |
| Menu, chi tiết sản phẩm, size/topping                                                      | Giao diện Barista/nhân viên quầy (đề xác định là phần mở rộng) |
| Giỏ hàng; tạo đơn; đăng ký/đăng nhập JWT                                                   | Trang quản trị Admin                                           |
| Thanh toán giả lập (Ví/Thẻ), xác nhận & lịch sử đơn                                        | Tích hợp cổng thanh toán thật                                  |
| Nghiệp vụ backend: State Machine, idempotency, tồn kho đồng thời, khuyến mãi & điểm thưởng | Thông báo thời gian thực, đa ngôn ngữ, yêu thích/đặt lại       |
| Docker Compose, README, demo                                                               |                                                                |

### 2.3 Các bên liên quan

| Bên liên quan                    | Vai trò / kỳ vọng                                                                             |
| -------------------------------- | --------------------------------------------------------------------------------------------- |
| Khách hàng                       | Đặt đồ uống, chọn size/topping, thanh toán không tiền mặt, theo dõi trạng thái đơn.           |
| Nhân viên quầy/Barista           | Tiếp nhận đơn, cập nhật trạng thái pha chế — ngoài phạm vi MVP (PB-32).                       |
| Quản lý cửa hàng / Product Owner | Xác định yêu cầu, ưu tiên Product Backlog, nghiệm thu Increment sau mỗi Sprint.               |
| Giảng viên nghiệm thu            | Đánh giá quy trình, sản phẩm và mức độ đáp ứng tiêu chí chấp nhận.                            |
| Nhóm phát triển (5 người)        | 1 người kiêm PO + Scrum Master + Dev; 1 người kiêm Software Architect/Tech Lead + Dev; 3 Dev. |
| Đơn vị thanh toán                | Được mô phỏng qua Mock Payment Service (Ví/Thẻ).                                              |

---

## 3. Epic

Backlog được nhóm thành 8 Epic. Epic E1 và E8 chủ yếu chứa hạng mục bổ sung; E2–E7 chứa cả task gốc lẫn hạng mục bổ sung.

| Epic   | Tên                        | Mô tả                                                                                | Hạng mục                   | SP  |
| ------ | -------------------------- | ------------------------------------------------------------------------------------ | -------------------------- | --- |
| **E1** | Nền tảng & DevOps          | Khởi tạo dự án, môi trường dev, quy ước Git/code, CI, khung API/UI.                  | 01, 12, 13, 14, 15, 16, 17 | 14  |
| **E2** | Menu & Sản phẩm            | CSDL sản phẩm, API menu, trang Menu, chi tiết và tùy chọn size/topping.              | 02, 03, 04, 11, 18         | 17  |
| **E3** | Giỏ hàng & Đặt đơn         | Giỏ hàng phía client, API tạo đơn, tính giá phía server.                             | 05, 06, 19, 21             | 14  |
| **E4** | Xác thực & Tài khoản       | Đăng ký/đăng nhập JWT, bảo vệ route, bảo mật API.                                    | 07, 20, 22                 | 15  |
| **E5** | Thanh toán                 | Mock payment gateway, giao diện thanh toán, xử lý lỗi/thử lại.                       | 08, 24                     | 13  |
| **E6** | Nghiệp vụ backend nâng cao | State Machine, idempotency, tồn kho đồng thời, khuyến mãi & điểm thưởng.             | 10, 25, 27                 | 19  |
| **E7** | Chất lượng & Bàn giao      | Xác nhận/lịch sử đơn, kiểm thử E2E/hiệu năng, tài liệu, docker-compose, demo.        | 09, 23, 26, 28, 29, 30, 31 | 25  |
| **E8** | Mở rộng (ngoài MVP)        | Barista, Admin, real-time, cổng thanh toán thật, đa ngôn ngữ… cho các phiên bản sau. | 32, 33, 34, 35, 36, 37     | 35  |

> Cột "Hạng mục" liệt kê số hiệu PB-xx (bỏ tiền tố PB-).

---

## 4. Product Backlog gốc (nguyên văn đề bài)

Bảng dưới đây sao chép nguyên văn 10 task ở Mục 8 của đề bài. Không có nội dung nào bị sửa hoặc xóa. Cột "PB" chỉ là mã tham chiếu bổ sung.

| #   | PB    | Task (Story)                     | Yêu cầu / Tiêu chí chấp nhận chính                                                                                                                 | Điểm   |
| --- | ----- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1   | PB-01 | Khởi tạo dự án và cấu trúc       | Tạo monorepo/2 thư mục frontend (Next.js) + backend (NestJS), chạy được "Hello", có README, Git, .env.example.                                     | 1      |
| 2   | PB-02 | API danh sách sản phẩm           | NestJS GET /products trả về JSON menu (id, tên, giá, ảnh) từ dữ liệu mẫu/CSDL.                                                                     | 1      |
| 3   | PB-03 | Trang Menu (Frontend)            | Next.js gọi /products, render lưới sản phẩm, có loading/empty state.                                                                               | 1      |
| 4   | PB-04 | Chi tiết và tùy chọn sản phẩm    | Màn hình chi tiết: chọn size (S/M/L) và topping; tính giá theo tùy chọn.                                                                           | 1      |
| 5   | PB-05 | Giỏ hàng (Cart)                  | Thêm/sửa số lượng/xóa; lưu state (Zustand/Context); tự tính tổng tiền; badge số lượng.                                                             | 1      |
| 6   | PB-06 | API tạo đơn hàng                 | NestJS POST /orders nhận giỏ hàng, validate (class-validator), lưu đơn trạng thái PENDING, trả mã đơn.                                             | 1      |
| 7   | PB-07 | Đăng ký / Đăng nhập (JWT)        | POST /auth/register, /auth/login; băm mật khẩu (bcrypt); phát JWT; guard bảo vệ route đặt đơn.                                                     | 1      |
| 8   | PB-08 | Thanh toán không tiền mặt        | Tích hợp mock payment: chọn Ví/Thẻ, gọi POST /payments; đơn chuyển PAID khi thành công, PAYMENT_FAILED khi lỗi.                                    | 1      |
| 9   | PB-09 | Xác nhận, lịch sử đơn & bàn giao | Màn hình xác nhận (mã đơn, trạng thái) và GET /orders/me (lịch sử đơn); docker-compose chạy cả 3 (frontend, backend, DB); README; demo end-to-end. | 1      |
| 10  | PB-10 | Nghiệp vụ backend                | State Machine đơn hàng, thanh toán idempotent, kiểm soát tồn kho khi đặt đồng thời, khuyến mãi/điểm thưởng (chi tiết ở Mục 9).                     | 1      |
|     |       | **Tổng**                         |                                                                                                                                                    | **10** |

> **Sprint gợi ý của đề (Mục 2.3):** Sprint 1 — Nền tảng & hiển thị menu (Task 1, 2, 3, 4) · Sprint 2 — Giỏ hàng & đặt đơn & đăng nhập (Task 5, 6, 7) · Sprint 3 — Thanh toán, bàn giao & nghiệp vụ nâng cao (Task 8, 9, 10). Backlog này giữ nguyên cách phân chia đó.

---

## 5. Chi tiết hóa 10 task gốc

Mỗi task gốc được viết lại dưới dạng **User Story** và bổ sung **tiêu chí chi tiết** để nhóm hiểu chung một cách. Các tiêu chí chi tiết chỉ _làm rõ_ tiêu chí gốc, không thay thế nó. Số SP là ước lượng của nhóm, sẽ được chốt lại bằng Planning Poker ở Sprint Planning.

### PB-01 · Task 1 — Khởi tạo dự án và cấu trúc

|                               |                                                                                                                                                                                                                                                                                                                                                                                             |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**                | Là một thành viên nhóm phát triển, tôi muốn có sẵn một monorepo chuẩn hóa với frontend và backend chạy được, để cả nhóm code song song ngay từ ngày đầu tiên.                                                                                                                                                                                                                               |
| **Tiêu chí gốc (nguyên văn)** | _Tạo monorepo/2 thư mục frontend (Next.js) + backend (NestJS), chạy được "Hello", có README, Git, .env.example._                                                                                                                                                                                                                                                                            |
| **Chi tiết hóa**              | • Cấu trúc thư mục: `/frontend` (Next.js), `/backend` (NestJS), `/docs`, README gốc.<br>• Backend `npm run start:dev`: GET / trả "Hello BrewLite"; frontend `npm run dev`: trang chủ hiển thị "Hello BrewLite".<br>• `.env.example` cho cả 2 phần; `.env` nằm trong `.gitignore`.<br>• README nêu yêu cầu môi trường (Node LTS, Docker), cách cài và chạy; clone mới chạy được theo README. |
| **Thông tin**                 | Epic **E1** · SP **3** · Sprint **S1** · **Must** · Phụ thuộc: —                                                                                                                                                                                                                                                                                                                            |

### PB-02 · Task 2 — API danh sách sản phẩm

|                               |                                                                                                                                                                                                                                                                                                                                                                        |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**                | Là một khách hàng, tôi muốn hệ thống cung cấp danh sách đồ uống, để tôi xem menu và chọn món.                                                                                                                                                                                                                                                                          |
| **Tiêu chí gốc (nguyên văn)** | _NestJS GET /products trả về JSON menu (id, tên, giá, ảnh) từ dữ liệu mẫu/CSDL._                                                                                                                                                                                                                                                                                       |
| **Chi tiết hóa**              | • Trả 200 + mảng JSON gồm `id`, `name`, `price`, `imageUrl` (kèm `category`, `isAvailable`).<br>• Dữ liệu lấy từ CSDL (seed ≥ 8 món, ≥ 3 danh mục); chỉ trả sản phẩm đang bán.<br>• Bổ sung GET `/products/:id` (Mục 12.1 của đề) — 404 nếu không tồn tại; GET `/toppings` phục vụ Task 4.<br>• Thời gian phản hồi < 500 ms với dữ liệu mẫu; có unit test cho service. |
| **Thông tin**                 | Epic **E2** · SP **3** · Sprint **S1** · **Must** · Phụ thuộc: PB-01, PB-11                                                                                                                                                                                                                                                                                            |

### PB-03 · Task 3 — Trang Menu (Frontend)

|                               |                                                                                                                                                                                                                                                                                                    |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**                | Là một khách hàng, tôi muốn thấy menu dạng lưới có hình, tên, giá, để chọn đồ uống nhanh chỉ vài chạm.                                                                                                                                                                                             |
| **Tiêu chí gốc (nguyên văn)** | _Next.js gọi /products, render lưới sản phẩm, có loading/empty state._                                                                                                                                                                                                                             |
| **Chi tiết hóa**              | • Lưới responsive 1/2/3–4 cột; thẻ sản phẩm hiển thị ảnh, tên, giá định dạng "35.000đ".<br>• Loading: skeleton; Empty: thông báo "Chưa có sản phẩm"; Error: thông báo + nút "Thử lại".<br>• Bấm vào thẻ sản phẩm điều hướng tới `/products/[id]`.<br>• URL API cấu hình qua `NEXT_PUBLIC_API_URL`. |
| **Thông tin**                 | Epic **E2** · SP **3** · Sprint **S1** · **Must** · Phụ thuộc: PB-02 (contract), PB-15                                                                                                                                                                                                             |

### PB-04 · Task 4 — Chi tiết và tùy chọn sản phẩm

|                               |                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **User Story**                | Là một khách hàng, tôi muốn chọn size và topping cho đồ uống và thấy giá thay đổi ngay, để biết chính xác số tiền phải trả.                                                                                                                                                                                                                                                                                        |
| **Tiêu chí gốc (nguyên văn)** | _Màn hình chi tiết: chọn size (S/M/L) và topping; tính giá theo tùy chọn._                                                                                                                                                                                                                                                                                                                                         |
| **Chi tiết hóa**              | • Trang `/products/[id]` hiển thị ảnh, tên, mô tả, giá; 404 thân thiện khi id sai.<br>• Chọn 1 size (S/M/L, mặc định S) và nhiều topping; giá đơn vị = giá gốc + phụ thu size + Σ giá topping (quy tắc ở Mục 6.1).<br>• Giá cập nhật tức thì khi đổi lựa chọn; có unit test hàm tính giá.<br>• Nút "Thêm vào giỏ" trả về đối tượng lựa chọn `{productId, size, toppings, unitPrice}` để nối vào Giỏ hàng ở Task 5. |
| **Thông tin**                 | Epic **E2** · SP **5** · Sprint **S1** · **Must** · Phụ thuộc: PB-02, PB-03                                                                                                                                                                                                                                                                                                                                        |

### PB-05 · Task 5 — Giỏ hàng (Cart)

|                               |                                                                                                                                                                                                                                                 |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**                | Là một khách hàng, tôi muốn thêm, sửa số lượng và xóa món trong giỏ, để chuẩn bị đơn trước khi thanh toán.                                                                                                                                      |
| **Tiêu chí gốc (nguyên văn)** | _Thêm/sửa số lượng/xóa; lưu state (Zustand/Context); tự tính tổng tiền; badge số lượng._                                                                                                                                                        |
| **Chi tiết hóa**              | • Mỗi dòng giỏ = sản phẩm + size + tập topping; cùng cấu hình thì gộp số lượng.<br>• Số lượng tối thiểu 1 (giảm về 0 → hỏi xóa); tổng tiền tính lại tức thì; badge số lượng trên Header.<br>• Giỏ trống hiển thị empty state kèm nút "Về menu". |
| **Thông tin**                 | Epic **E3** · SP **5** · Sprint **S2** · **Must** · Phụ thuộc: PB-04                                                                                                                                                                            |

### PB-06 · Task 6 — API tạo đơn hàng

|                               |                                                                                                                                                                                                                                                                       |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**                | Là một khách hàng, tôi muốn gửi giỏ hàng lên hệ thống để tạo đơn hàng, để sau đó thanh toán.                                                                                                                                                                          |
| **Tiêu chí gốc (nguyên văn)** | _NestJS POST /orders nhận giỏ hàng, validate (class-validator), lưu đơn trạng thái PENDING, trả mã đơn._                                                                                                                                                              |
| **Chi tiết hóa**              | • DTO validate: items ≥ 1, số lượng 1–20, size ∈ {S,M,L}, productId phải tồn tại; sai → 400 với thông báo rõ ràng.<br>• Lưu Order + OrderItem trong một transaction; trả 201 `{orderId, status: PENDING, total}`.<br>• Endpoint yêu cầu JWT sau khi PB-07 hoàn thành. |
| **Thông tin**                 | Epic **E3** · SP **5** · Sprint **S2** · **Must** · Phụ thuộc: PB-05, PB-11, PB-21                                                                                                                                                                                    |

### PB-07 · Task 7 — Đăng ký / Đăng nhập (JWT)

|                               |                                                                                                                                                                                                                                                                       |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**                | Là một khách hàng, tôi muốn tạo tài khoản và đăng nhập, để đơn hàng và lịch sử của tôi được lưu và bảo vệ.                                                                                                                                                            |
| **Tiêu chí gốc (nguyên văn)** | _POST /auth/register, /auth/login; băm mật khẩu (bcrypt); phát JWT; guard bảo vệ route đặt đơn._                                                                                                                                                                      |
| **Chi tiết hóa**              | • Email duy nhất (trùng → 409); mật khẩu ≥ 8 ký tự; bcrypt cost ≥ 10; không bao giờ trả về `passwordHash`.<br>• Đăng nhập đúng → 200 + accessToken (JWT, có thời hạn); sai → 401.<br>• `JwtAuthGuard` (Passport) bảo vệ POST /orders, POST /payments, GET /orders/me. |
| **Thông tin**                 | Epic **E4** · SP **8** · Sprint **S2** · **Must** · Phụ thuộc: PB-01, PB-11                                                                                                                                                                                           |

### PB-08 · Task 8 — Thanh toán không tiền mặt

|                               |                                                                                                                                                                                                                                                                                                                                                             |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**                | Là một khách hàng, tôi muốn thanh toán đơn bằng ví điện tử/thẻ, để tôi không cần mang tiền mặt (US-05 của đề).                                                                                                                                                                                                                                              |
| **Tiêu chí gốc (nguyên văn)** | _Tích hợp mock payment: chọn Ví/Thẻ, gọi POST /payments; đơn chuyển PAID khi thành công, PAYMENT_FAILED khi lỗi._                                                                                                                                                                                                                                           |
| **Chi tiết hóa**              | • Mock Payment Service mô phỏng Momo/VNPay/Stripe; kết quả thành công/thất bại có thể điều khiển (ví dụ số thẻ/cờ cấu hình) để demo cả 2 nhánh.<br>• Thành công → đơn PAID; lỗi → PAYMENT_FAILED và giỏ hàng được giữ nguyên (đúng US-05).<br>• Nhận header `Idempotency-Key` (hoàn thiện ở Task 10); lưu Payment(orderId, idempotencyKey, amount, method). |
| **Thông tin**                 | Epic **E5** · SP **8** · Sprint **S3** · **Must** · Phụ thuộc: PB-06, PB-07                                                                                                                                                                                                                                                                                 |

### PB-09 · Task 9 — Xác nhận, lịch sử đơn & bàn giao

|                               |                                                                                                                                                                                                                                                                                                |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**                | Là một khách hàng, tôi muốn thấy màn hình xác nhận và xem lại lịch sử đơn, để theo dõi những gì đã đặt; là nhóm, chúng tôi muốn bàn giao sản phẩm chạy được bằng một lệnh.                                                                                                                     |
| **Tiêu chí gốc (nguyên văn)** | _Màn hình xác nhận (mã đơn, trạng thái) và GET /orders/me (lịch sử đơn); docker-compose chạy cả 3 (frontend, backend, DB); README; demo end-to-end._                                                                                                                                           |
| **Chi tiết hóa**              | • Màn hình xác nhận hiển thị mã đơn, trạng thái, tổng tiền, nút "Về trang chủ".<br>• GET /orders/me trả lịch sử đơn của user, mới nhất trước, có phân trang; trang "Đơn của tôi".<br>• `docker compose up` chạy đủ frontend + backend + PostgreSQL; README bàn giao; kịch bản demo end-to-end. |
| **Thông tin**                 | Epic **E7** · SP **8** · Sprint **S3** · **Must** · Phụ thuộc: PB-08                                                                                                                                                                                                                           |

### PB-10 · Task 10 — Nghiệp vụ backend

|                               |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **User Story**                | Là chủ cửa hàng, tôi muốn hệ thống xử lý đặt hàng và thanh toán đúng nghiệp vụ, để không bán quá tồn kho, không trừ tiền hai lần và trạng thái đơn luôn hợp lệ.                                                                                                                                                                                                                                                                                                                                           |
| **Tiêu chí gốc (nguyên văn)** | _State Machine đơn hàng, thanh toán idempotent, kiểm soát tồn kho khi đặt đồng thời, khuyến mãi/điểm thưởng (chi tiết ở Mục 9)._                                                                                                                                                                                                                                                                                                                                                                          |
| **Chi tiết hóa**              | • 10.1 Order State Machine: PENDING → PAID → PREPARING → READY → COMPLETED; hàm `assertTransition` chặn chuyển trạng thái sai (SP 3).<br>• 10.2 Thanh toán idempotent bằng `Idempotency-Key` (SP 3).<br>• 10.3 Tồn kho đồng thời: transaction + optimistic locking (SP 4).<br>• 10.4 Khuyến mãi & điểm thưởng: áp mã hợp lệ, cộng điểm sau khi đơn PAID (SP 3).<br>• Test chứng minh: (a) chặn chuyển trạng thái sai; (b) 2 lần cùng Idempotency-Key chỉ tạo 1 đơn; (c) đặt đồng thời không vượt tồn kho. |
| **Thông tin**                 | Epic **E6** · SP **13** · Sprint **S3** · **Must** · Phụ thuộc: PB-08                                                                                                                                                                                                                                                                                                                                                                                                                                     |

---

## 6. Quyết định của PO và quy ước nghiệp vụ

Đề bài để ngỏ một số chi tiết. PO chốt các quy ước dưới đây để nhóm không phải hỏi lại trong Sprint; mọi thay đổi phải qua PO và ghi vào Mục 14.

### 6.1 Quy tắc tính giá

| Thành phần           | Quy tắc                                                           | Ví dụ                                                      |
| -------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------- |
| Giá niêm yết         | Là giá của **size S**; menu hiển thị giá này.                     | Cappuccino: 45.000đ                                        |
| Phụ thu size         | S: +0đ · M: +5.000đ · L: +10.000đ                                 | Cappuccino M = 50.000đ                                     |
| Topping              | Cộng theo từng topping đã chọn (xem 6.2).                         | Trân châu +5.000đ                                          |
| Đơn giá (unit price) | giá niêm yết + phụ thu size + Σ giá topping                       | Cappuccino L + Trân châu + Kem = 45 + 10 + 5 + 7 = 67.000đ |
| Thành tiền dòng      | đơn giá × số lượng (đơn vị VND, số nguyên, không có số thập phân) | 67.000 × 2 = 134.000đ                                      |
| Tổng đơn             | Σ thành tiền các dòng − giảm giá (Task 10.4)                      | —                                                          |

> Số tiền trong wireframe của đề (ví dụ tổng 123.000đ) chỉ mang tính minh họa bố cục; số liệu thật lấy theo quy tắc trên.

### 6.2 Dữ liệu mẫu (seed) cho menu

| Danh mục | Sản phẩm (giá size S)                                                       | Tồn kho ban đầu |
| -------- | --------------------------------------------------------------------------- | --------------- |
| Cà phê   | Cà phê sữa 35.000đ · Americano 40.000đ · Cappuccino 45.000đ · Latte 45.000đ | 50 / món        |
| Trà      | Trà đào 39.000đ · Trà vải 39.000đ · Trà đào cam sả 42.000đ                  | 50 / món        |
| Đá xay   | Matcha đá xay 49.000đ · Cookie đá xay 52.000đ                               | 30 / món        |
| Topping  | Trân châu +5.000đ · Kem cheese +7.000đ · Thạch trái cây +5.000đ             | —               |

### 6.3 Quy ước khác

- Tiền tệ: VND, hiển thị dạng `35.000đ`; lưu số nguyên trong CSDL.
- Số lượng mỗi dòng giỏ: 1–20. Mật khẩu tối thiểu 8 ký tự. JWT có thời hạn 1 giờ.
- Mã đơn hiển thị dạng `#1042` (số tăng dần); ID nội bộ là khóa chính.
- Trạng thái đơn theo đề: PENDING, PAID, PAYMENT_FAILED, PREPARING, READY, COMPLETED, CANCELLED.
- Chưa đăng nhập vẫn xem menu và thêm giỏ hàng; chỉ yêu cầu đăng nhập ở bước đặt đơn/thanh toán (đúng luồng nghiệp vụ trong đề).

---

## 7. Hạng mục bổ sung [BS]

Các hạng mục dưới đây do PO bổ sung nhằm nâng chất lượng sản phẩm và quy trình. Chúng hỗ trợ trực tiếp các task gốc (cột "Hỗ trợ") hoặc mở rộng sản phẩm sau MVP.

### Sprint 1 — Nền tảng & hiển thị menu

| PB    | Epic | Hạng mục và giá trị                                                                                                                                                                                 | Tiêu chí chấp nhận                                                                                                                                                        | MoSCoW     | SP  |
| ----- | ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | --- |
| PB-11 | E2   | **Thiết kế CSDL, Prisma schema, migration & seed data**<br>Task 2 cần dữ liệu thật; tách riêng để mô hình dữ liệu được review sớm và tái dùng cho Task 6–10.<br>_Hỗ trợ: PB-02_                     | ERD có Category/Product/Topping (+ User, Order… ở sprint sau); migration chạy sạch từ CSDL rỗng; seed ≥ 8 sản phẩm, ≥ 3 danh mục, 3 topping; seed chạy lặp lại không lỗi. | **Must**   | 3   |
| PB-12 | E1   | **Docker Compose môi trường dev (PostgreSQL)**<br>Mọi thành viên dùng cùng một CSDL, tránh lỗi "máy tôi chạy được"; là bước đệm cho docker-compose bàn giao (Task 9).<br>_Hỗ trợ: PB-01_            | `docker compose up -d db` chạy PostgreSQL 16 có healthcheck và volume; thông tin kết nối khớp .env.example; hướng dẫn trong README.                                       | **Must**   | 2   |
| PB-13 | E1   | **Quy ước Git & code (CONTRIBUTING, lint, format)**<br>Nhóm 5 người code song song cần quy tắc nhánh, commit, review thống nhất để đạt DoD "commit rõ ràng, được review".<br>_Hỗ trợ: PB-01_        | CONTRIBUTING.md (đặt tên nhánh, Conventional Commits, quy trình PR); PR template; ESLint + Prettier chạy được cho cả FE/BE; nhánh main/develop được bảo vệ.               | **Must**   | 1   |
| PB-14 | E1   | **Nền tảng API: ValidationPipe, exception filter, CORS, health check**<br>Yêu cầu phi chức năng "validate dữ liệu đầu vào"; chuẩn hóa định dạng lỗi để FE xử lý thống nhất.<br>_Hỗ trợ: PB-02_      | ValidationPipe toàn cục (whitelist, transform); lỗi trả cùng một cấu trúc JSON; CORS cấu hình theo env; GET /health trả 200.                                              | **Must**   | 2   |
| PB-15 | E1   | **Nền tảng UI: TailwindCSS theme, layout, component dùng chung**<br>Các màn hình Menu, Chi tiết, Giỏ hàng… cần giao diện đồng nhất; giúp 2 dev FE làm song song không trùng lặp.<br>_Hỗ trợ: PB-03_ | Theme (màu, font); Header/Footer; Button, Card, Skeleton, EmptyState, ErrorState, PriceText; hàm formatVND; API client dùng chung.                                        | **Must**   | 3   |
| PB-16 | E1   | **Tài liệu API bằng Swagger/OpenAPI**<br>FE và tester tra cứu API không cần hỏi trực tiếp; là phần của tài liệu bàn giao.<br>_Hỗ trợ: PB-02 · stretch_                                              | Truy cập `/api-docs` xem và gọi thử GET /products, /products/:id, /toppings.                                                                                              | **Should** | 1   |
| PB-17 | E1   | **CI: GitHub Actions (lint + build + test)**<br>Phát hiện lỗi build sớm, hỗ trợ tiêu chí DoD "không lỗi build".<br>_Hỗ trợ: PB-01 · stretch_                                                        | Mỗi PR tự chạy lint + build + test cho FE và BE; PR fail thì không được merge.                                                                                            | **Should** | 2   |

### Sprint 2 — Giỏ hàng, đặt đơn & đăng nhập

| PB    | Epic | Hạng mục và giá trị                                                                                                                                                               | Tiêu chí chấp nhận                                                                                                                        | MoSCoW     | SP  |
| ----- | ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ---------- | --- |
| PB-19 | E3   | **Lưu giỏ hàng vào localStorage**<br>Khách tải lại trang không mất giỏ hàng; trải nghiệm giống ứng dụng thật.<br>_Hỗ trợ: PB-05_                                                  | Giỏ hàng khôi phục sau khi F5; dữ liệu hỏng/hết hạn được bỏ qua an toàn.                                                                  | **Should** | 2   |
| PB-21 | E3   | **Server tính lại giá đơn hàng (không tin giá từ client)**<br>Bảo mật nghiệp vụ: client có thể sửa giá; server phải là nguồn sự thật cho lineTotal/total.<br>_Hỗ trợ: PB-06_      | POST /orders bỏ qua giá do client gửi; tính lại từ Product + size + topping; test gửi giá giả vẫn ra tổng đúng.                           | **Must**   | 2   |
| PB-20 | E4   | **Trang Đăng ký / Đăng nhập (Frontend) & route guard**<br>Task 7 chỉ nêu API; người dùng cần giao diện và chuyển hướng "nếu chưa đăng nhập" ở luồng nghiệp vụ.<br>_Hỗ trợ: PB-07_ | Form đăng ký/đăng nhập có validate và thông báo lỗi; lưu token an toàn; middleware chuyển hướng /login khi chưa đăng nhập; nút Đăng xuất. | **Must**   | 5   |
| PB-22 | E4   | **Tăng cường bảo mật API (helmet, rate-limit, CORS whitelist)**<br>Yêu cầu phi chức năng về bảo mật; chống brute-force đăng nhập.<br>_Hỗ trợ: PB-07_                              | Helmet bật; giới hạn tần suất /auth/login; CORS chỉ cho origin của FE; không lộ stack trace ở production.                                 | **Should** | 2   |
| PB-18 | E2   | **Lọc menu theo danh mục & tìm kiếm theo tên**<br>Menu dài cần lọc nhanh; nâng chất lượng trải nghiệm so với bản tối thiểu.<br>_Hỗ trợ: PB-03_                                    | GET /products?category=&q= hoạt động; UI có tab danh mục và ô tìm kiếm (debounce); empty state khi không có kết quả.                      | **Should** | 3   |
| PB-23 | E7   | **Ghi log request & mã tương quan (Nest Logger)**<br>Hỗ trợ debug tích hợp FE–BE và truy vết đơn hàng khi demo.<br>_Hỗ trợ: PB-14_                                                | Mỗi request có log method/url/status/thời gian; lỗi có log kèm requestId.                                                                 | **Could**  | 2   |

### Sprint 3 — Thanh toán, bàn giao & nghiệp vụ nâng cao

| PB    | Epic | Hạng mục và giá trị                                                                                                                                                                                       | Tiêu chí chấp nhận                                                                                                                               | MoSCoW     | SP  |
| ----- | ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- | --- |
| PB-24 | E5   | **Giao diện thanh toán (chọn Ví/Thẻ, loading, lỗi, thử lại)**<br>Task 8 nêu tích hợp mock; cần màn hình (4) trong wireframe với đầy đủ trạng thái.<br>_Hỗ trợ: PB-08_                                     | Hiển thị tổng tiền; chọn Ví/Thẻ; nút Thanh toán có loading, chống bấm đúp; khi PAYMENT_FAILED có thông báo + nút "Thử lại", giỏ hàng giữ nguyên. | **Must**   | 5   |
| PB-25 | E6   | **Hủy đơn (API + UI) theo State Machine**<br>Sơ đồ state machine có nhánh CANCELLED nhưng 10 task gốc chưa có chức năng hủy.<br>_Hỗ trợ: PB-10_                                                           | Hủy được đơn ở trạng thái cho phép (PENDING/PAID); trạng thái khác trả 409; UI có xác nhận hủy.                                                  | **Should** | 3   |
| PB-26 | E7   | **Theo dõi trạng thái đơn (polling)**<br>Khách cần biết khi nào đồ uống sẵn sàng (READY) mà không phải F5.<br>_Hỗ trợ: PB-09_                                                                             | Trang chi tiết đơn tự cập nhật trạng thái mỗi 5 giây; dừng khi COMPLETED/CANCELLED.                                                              | **Should** | 3   |
| PB-27 | E6   | **Giao diện mã giảm giá & điểm thưởng**<br>Task 10.4 chỉ mô tả backend; khách cần nhập mã và xem điểm tích lũy.<br>_Hỗ trợ: PB-10_                                                                        | Ô nhập mã ở màn hình thanh toán, hiển thị số tiền giảm; hiển thị điểm tích lũy ở "Đơn của tôi".                                                  | **Should** | 3   |
| PB-29 | E7   | **Kiểm thử hiệu năng API (< 500 ms)**<br>Chứng minh yêu cầu phi chức năng về thời gian phản hồi bằng số liệu.<br>_Hỗ trợ: PB-02_                                                                          | Đo bằng autocannon/k6 trên GET /products, POST /orders; báo cáo p95 < 500 ms với dữ liệu mẫu.                                                    | **Must**   | 2   |
| PB-31 | E7   | **Tài liệu bàn giao (kiến trúc, API, deploy, release notes, kịch bản demo)**<br>Mục 11 của đề yêu cầu bàn giao mã nguồn + README + demo; bổ sung tài liệu để khách hàng vận hành được.<br>_Hỗ trợ: PB-09_ | Có docs/architecture, api, deployment, release-notes, demo-script; người ngoài nhóm chạy được theo tài liệu.                                     | **Must**   | 3   |
| PB-28 | E7   | **Kiểm thử E2E luồng chính (Playwright)**<br>Bảo vệ luồng chọn món → thanh toán → xác nhận khỏi bị hỏng khi sửa code.<br>_Hỗ trợ: PB-09_                                                                  | Kịch bản E2E happy path + PAYMENT_FAILED chạy tự động trong CI.                                                                                  | **Should** | 5   |
| PB-30 | E7   | **Tương thích trình duyệt, responsive & a11y cơ bản**<br>Yêu cầu phi chức năng "phù hợp trên các trình duyệt web".<br>_Hỗ trợ: PB-03_                                                                     | Chạy đúng trên Chrome, Firefox, Edge (Safari nếu có); hiển thị tốt ở 360 px–1440 px; ảnh có alt, nút thao tác được bằng bàn phím.                | **Should** | 2   |

### Backlog tương lai (sau MVP)

| PB    | Epic | Hạng mục và giá trị                                                                                                                                                                     | Tiêu chí chấp nhận                                                                    | MoSCoW    | SP  |
| ----- | ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | --------- | --- |
| PB-32 | E8   | **Barista dashboard: tiếp nhận & cập nhật trạng thái đơn**<br>Đề nêu Barista ngoài phạm vi MVP; đây là phần mở rộng tự nhiên (PAID → PREPARING → READY → COMPLETED).<br>_Hỗ trợ: PB-10_ | Barista đăng nhập, thấy hàng đợi đơn PAID và chuyển trạng thái theo State Machine.    | **Could** | 8   |
| PB-33 | E8   | **Admin: quản lý sản phẩm, topping, tồn kho, mã khuyến mãi**<br>Cửa hàng tự cập nhật menu thay vì sửa seed.<br>_Hỗ trợ: PB-07_                                                          | CRUD sản phẩm/topping/mã giảm giá có phân quyền ADMIN.                                | **Could** | 8   |
| PB-34 | E8   | **Thông báo thời gian thực (SSE/WebSocket) khi đơn READY**<br>Thay polling, giảm tải và tăng trải nghiệm.<br>_Hỗ trợ: PB-26_                                                            | Khách nhận thông báo tức thì khi đổi trạng thái đơn.                                  | **Could** | 5   |
| PB-35 | E8   | **Tích hợp cổng thanh toán sandbox thật (VNPay/Momo/Stripe)**<br>Chuyển từ mock sang tích hợp thật.<br>_Hỗ trợ: PB-08_                                                                  | Thanh toán thành công trên môi trường sandbox; xử lý callback/IPN an toàn.            | **Won't** | 8   |
| PB-36 | E8   | **Đặt lại đơn cũ & danh sách yêu thích**<br>Khách quen đặt nhanh hơn, phù hợp mục tiêu "vài chạm".<br>_Hỗ trợ: PB-09_                                                                   | Nút "Đặt lại" trong lịch sử đơn thêm nguyên cấu hình vào giỏ; đánh dấu món yêu thích. | **Could** | 3   |
| PB-37 | E8   | **Đa ngôn ngữ (vi/en) & giao diện tối**<br>Mở rộng đối tượng người dùng.<br>_Hỗ trợ: PB-15_                                                                                             | Chuyển ngôn ngữ và theme không cần tải lại trang.                                     | **Won't** | 3   |

---

## 8. Product Backlog tổng hợp theo thứ tự ưu tiên

Đây là **Product Backlog chính thức**: toàn bộ hạng mục gốc và bổ sung, sắp theo thứ tự PO muốn thực hiện (cao → thấp), có xét phụ thuộc kỹ thuật. Hàng tô nền kem là task gốc.

| #   | PB    | Hạng mục                                                                 | Loại | Epic | MoSCoW | SP  | Sprint  | Phụ thuộc               |
| --- | ----- | ------------------------------------------------------------------------ | ---- | ---- | ------ | --- | ------- | ----------------------- |
| 1   | PB-01 | Task 1 — Khởi tạo dự án và cấu trúc                                      | Gốc  | E1   | Must   | 3   | S1      | —                       |
| 2   | PB-13 | Quy ước Git & code (CONTRIBUTING, lint, format)                          | BS   | E1   | Must   | 1   | S1      | PB-01                   |
| 3   | PB-12 | Docker Compose môi trường dev (PostgreSQL)                               | BS   | E1   | Must   | 2   | S1      | PB-01                   |
| 4   | PB-11 | Thiết kế CSDL, Prisma schema, migration & seed data                      | BS   | E2   | Must   | 3   | S1      | PB-02                   |
| 5   | PB-14 | Nền tảng API: ValidationPipe, exception filter, CORS, health check       | BS   | E1   | Must   | 2   | S1      | PB-02                   |
| 6   | PB-02 | Task 2 — API danh sách sản phẩm                                          | Gốc  | E2   | Must   | 3   | S1      | PB-01, PB-11            |
| 7   | PB-15 | Nền tảng UI: TailwindCSS theme, layout, component dùng chung             | BS   | E1   | Must   | 3   | S1      | PB-03                   |
| 8   | PB-03 | Task 3 — Trang Menu (Frontend)                                           | Gốc  | E2   | Must   | 3   | S1      | PB-02 (contract), PB-15 |
| 9   | PB-04 | Task 4 — Chi tiết và tùy chọn sản phẩm                                   | Gốc  | E2   | Must   | 5   | S1      | PB-02, PB-03            |
| 10  | PB-16 | Tài liệu API bằng Swagger/OpenAPI                                        | BS   | E1   | Should | 1   | S1*     | PB-02                   |
| 11  | PB-17 | CI: GitHub Actions (lint + build + test)                                 | BS   | E1   | Should | 2   | S1*     | PB-01                   |
| 12  | PB-05 | Task 5 — Giỏ hàng (Cart)                                                 | Gốc  | E3   | Must   | 5   | S2      | PB-04                   |
| 13  | PB-19 | Lưu giỏ hàng vào localStorage                                            | BS   | E3   | Should | 2   | S2      | PB-05                   |
| 14  | PB-21 | Server tính lại giá đơn hàng (không tin giá từ client)                   | BS   | E3   | Must   | 2   | S2      | PB-06                   |
| 15  | PB-06 | Task 6 — API tạo đơn hàng                                                | Gốc  | E3   | Must   | 5   | S2      | PB-05, PB-11, PB-21     |
| 16  | PB-07 | Task 7 — Đăng ký / Đăng nhập (JWT)                                       | Gốc  | E4   | Must   | 8   | S2      | PB-01, PB-11            |
| 17  | PB-20 | Trang Đăng ký / Đăng nhập (Frontend) & route guard                       | BS   | E4   | Must   | 5   | S2      | PB-07                   |
| 18  | PB-22 | Tăng cường bảo mật API (helmet, rate-limit, CORS whitelist)              | BS   | E4   | Should | 2   | S2      | PB-07                   |
| 19  | PB-18 | Lọc menu theo danh mục & tìm kiếm theo tên                               | BS   | E2   | Should | 3   | S2      | PB-03                   |
| 20  | PB-23 | Ghi log request & mã tương quan (Nest Logger)                            | BS   | E7   | Could  | 2   | S2      | PB-14                   |
| 21  | PB-08 | Task 8 — Thanh toán không tiền mặt                                       | Gốc  | E5   | Must   | 8   | S3      | PB-06, PB-07            |
| 22  | PB-24 | Giao diện thanh toán (chọn Ví/Thẻ, loading, lỗi, thử lại)                | BS   | E5   | Must   | 5   | S3      | PB-08                   |
| 23  | PB-10 | Task 10 — Nghiệp vụ backend                                              | Gốc  | E6   | Must   | 13  | S3      | PB-08                   |
| 24  | PB-25 | Hủy đơn (API + UI) theo State Machine                                    | BS   | E6   | Should | 3   | S3      | PB-10                   |
| 25  | PB-09 | Task 9 — Xác nhận, lịch sử đơn & bàn giao                                | Gốc  | E7   | Must   | 8   | S3      | PB-08                   |
| 26  | PB-26 | Theo dõi trạng thái đơn (polling)                                        | BS   | E7   | Should | 3   | S3      | PB-09                   |
| 27  | PB-27 | Giao diện mã giảm giá & điểm thưởng                                      | BS   | E6   | Should | 3   | S3      | PB-10                   |
| 28  | PB-29 | Kiểm thử hiệu năng API (< 500 ms)                                        | BS   | E7   | Must   | 2   | S3      | PB-02                   |
| 29  | PB-31 | Tài liệu bàn giao (kiến trúc, API, deploy, release notes, kịch bản demo) | BS   | E7   | Must   | 3   | S3      | PB-09                   |
| 30  | PB-30 | Tương thích trình duyệt, responsive & a11y cơ bản                        | BS   | E7   | Should | 2   | S3      | PB-03                   |
| 31  | PB-28 | Kiểm thử E2E luồng chính (Playwright)                                    | BS   | E7   | Should | 5   | S3      | PB-09                   |
| 32  | PB-32 | Barista dashboard: tiếp nhận & cập nhật trạng thái đơn                   | BS   | E8   | Could  | 8   | Sau MVP | PB-10                   |
| 33  | PB-33 | Admin: quản lý sản phẩm, topping, tồn kho, mã khuyến mãi                 | BS   | E8   | Could  | 8   | Sau MVP | PB-07                   |
| 34  | PB-34 | Thông báo thời gian thực (SSE/WebSocket) khi đơn READY                   | BS   | E8   | Could  | 5   | Sau MVP | PB-26                   |
| 35  | PB-36 | Đặt lại đơn cũ & danh sách yêu thích                                     | BS   | E8   | Could  | 3   | Sau MVP | PB-09                   |
| 36  | PB-35 | Tích hợp cổng thanh toán sandbox thật (VNPay/Momo/Stripe)                | BS   | E8   | Won't  | 8   | Sau MVP | PB-08                   |
| 37  | PB-37 | Đa ngôn ngữ (vi/en) & giao diện tối                                      | BS   | E8   | Won't  | 3   | Sau MVP | PB-15                   |

> Ghi chú: **S1*** = stretch của Sprint 1. Tổng: 37 hạng mục (10 gốc + 27 bổ sung), 152 SP.

---

## 9. Kế hoạch Sprint và Roadmap

Roadmap giữ đúng 3 Sprint gợi ý của đề. Độ dài Sprint 1 là 1 tuần; Sprint 2 và 3 dự kiến 2 tuần vì khối lượng lớn hơn (tối đa 2 tuần/Sprint theo Mục 2.2 của đề). Velocity thực tế của Sprint 1 sẽ dùng để điều chỉnh lại Sprint 2–3.

| Sprint | Thời gian dự kiến           | Sprint Goal                                                                                                                                         | Hạng mục                                          | SP            |
| ------ | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ------------- |
| **S1** | 28/09 – 02/10/2026 (1 tuần) | Nền tảng & hiển thị menu: khách xem được menu lấy từ API/CSDL, chọn size/topping và thấy giá cập nhật; nhóm có nền tảng dự án clone là chạy.        | Task 1–4; PB-11…15 (cam kết); PB-16, 17 (stretch) | 25 +3 stretch |
| **S2** | 05/10 – 16/10/2026 (2 tuần) | Giỏ hàng, đặt đơn & đăng nhập: khách thêm món vào giỏ, đăng ký/đăng nhập và tạo được đơn PENDING với giá do server tính.                            | Task 5–7; PB-18…23                                | 34            |
| **S3** | 19/10 – 30/10/2026 (2 tuần) | Thanh toán, bàn giao & nghiệp vụ nâng cao: thanh toán mock, xác nhận/lịch sử đơn, State Machine, idempotency, tồn kho, khuyến mãi; bàn giao + demo. | Task 8–10; PB-24…31                               | 55            |

**Phân bổ Story Points theo Sprint:**

- Sprint 1: 28 SP (14 task gốc + 11 bổ sung + 3 stretch)
- Sprint 2: 34 SP (18 task gốc + 16 bổ sung)
- Sprint 3: 55 SP (29 task gốc + 26 bổ sung)
- Backlog tương lai: 35 SP

> **Quy tắc giảm phạm vi khi trễ:** hạng mục Could/Should và stretch bị loại trước; Must và mọi task gốc luôn được bảo vệ. Sprint 3 có nhiều SP nhất nên các hạng mục Should (PB-25…28, 30) chỉ làm khi Task 8–10 đã đạt DoD.

---

## 10. Truy vết yêu cầu

Ma trận dưới đây chứng minh mọi yêu cầu chức năng (Mục 4.1 của đề) và phi chức năng (Mục 4.2) đều được phủ bởi ít nhất một hạng mục backlog.

| Yêu cầu của đề    | Nội dung                                                    | Task gốc            | Hạng mục bổ sung                  |
| ----------------- | ----------------------------------------------------------- | ------------------- | --------------------------------- |
| FR-1              | Hiển thị menu đồ uống kèm hình, tên, giá                    | PB-02, PB-03        | PB-11, PB-15, PB-18               |
| FR-2              | Xem chi tiết, chọn size và topping                          | PB-04               | PB-15                             |
| FR-3              | Thêm/sửa/xóa giỏ hàng; tự tính tổng tiền                    | PB-05               | PB-19                             |
| FR-4              | Đăng ký / đăng nhập (JWT)                                   | PB-07               | PB-20, PB-22                      |
| FR-5              | Tạo đơn hàng và thanh toán không tiền mặt                   | PB-06, PB-08, PB-10 | PB-21, PB-24, PB-25, PB-27        |
| FR-6              | Xác nhận đơn (mã đơn, trạng thái) và lịch sử đơn            | PB-09               | PB-26                             |
| NFR-1             | API phản hồi < 500 ms với dữ liệu mẫu                       | PB-02               | PB-23, PB-29                      |
| NFR-2             | Bảo mật: băm mật khẩu, JWT, validate đầu vào                | PB-07, PB-06        | PB-14, PB-21, PB-22               |
| NFR-3             | Phù hợp trên các trình duyệt web                            | PB-03               | PB-15, PB-30                      |
| Bàn giao (Mục 11) | Demo end-to-end, Git, docker-compose, README, Retrospective | PB-09               | PB-12, PB-13, PB-17, PB-28, PB-31 |

---

## 11. Ước lượng và ưu tiên

- **Ước lượng:** Planning Poker với dãy 1, 2, 3, 5, 8, 13. Quy ước 1 SP ≈ 3 giờ lý tưởng; hạng mục > 13 SP phải được tách nhỏ. Task 10 (13 SP) được tách thành 4 việc con 10.1–10.4.
- **Ưu tiên:** theo thứ tự (1) giá trị cho luồng chính "chọn món → thanh toán", (2) phụ thuộc kỹ thuật, (3) rủi ro (việc rủi ro cao làm sớm), (4) MoSCoW. PO là người duy nhất thay đổi thứ tự.
- **Refinement:** mỗi Sprint dành tối đa 10% thời gian (buổi ~30 phút giữa Sprint) để làm rõ, ước lượng và sắp xếp lại các hạng mục của Sprint kế tiếp.
- **Velocity:** Sprint 1 dùng năng lực dự kiến ≈ 25–28 SP cho 5 người trong 1 tuần (mỗi người ~20 giờ). Từ Sprint 2, dùng velocity thực tế của Sprint trước.

---

## 12. Definition of Ready và Definition of Done

### 12.1 Definition of Ready (bổ sung)

Một hạng mục chỉ được đưa vào Sprint Backlog khi:

- Có User Story và tiêu chí chấp nhận rõ, kiểm chứng được.
- Đã được ước lượng SP và không lớn hơn 8 SP (trừ khi đã có kế hoạch tách nhỏ).
- Phụ thuộc đã được xác định và không bị chặn (hoặc có phương án mock).
- Nhóm cùng hiểu cách demo/nghiệm thu.

### 12.2 Definition of Done (nguyên văn từ đề bài — Mục 10)

Một task được tính điểm khi thỏa Definition of Done (DoD):

- Code chạy được, không lỗi build; tuân theo tiêu chí chấp nhận của task.
- Có commit trên Git với mô tả rõ ràng; được review trong nhóm.
- API có validate đầu vào; UI xử lý trạng thái loading/lỗi cơ bản.
- Có hướng dẫn chạy trong README.

### 12.3 DoD mở rộng của nhóm (bổ sung, áp dụng cho mọi hạng mục)

- ESLint/Prettier không lỗi; PR có ít nhất 1 reviewer duyệt và đã merge vào develop.
- Logic quan trọng có unit test; API mới có ví dụ trong tài liệu (Swagger hoặc docs/api-contract.md).
- PO đã nghiệm thu trên nhánh develop theo tiêu chí chấp nhận; không còn bug mức nghiêm trọng mở.
- Board và Burndown được cập nhật; không để lại secret/.env trong Git.

---

## 13. Rủi ro và giả định

| Rủi ro / giả định                                     | Ảnh hưởng  | Ứng phó                                                                                                          |
| ----------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------- |
| Task 10 (13 SP) khó, dễ trễ ở Sprint 3                | Cao        | Tách 10.1–10.4; làm State Machine và idempotency trước; viết test (a)(b)(c) song song.                           |
| Sprint 3 quá tải (55 SP)                              | Cao        | Nới Sprint 3 lên 2 tuần; giảm phạm vi theo quy tắc Mục 9; chuẩn bị trước nền (Docker, CI, API docs) từ Sprint 1. |
| Lệch hợp đồng API giữa FE và BE                       | Trung bình | Chốt API contract trước khi code (PB-02); FE dùng mock; Swagger.                                                 |
| Thành viên vắng/thi cử                                | Trung bình | Mỗi hạng mục có người review thứ hai; kiến thức chia sẻ qua PR và tài liệu.                                      |
| Xung đột Git khi 5 người code song song               | Trung bình | Quy ước nhánh/PR (PB-13); PR nhỏ; rebase develop hàng ngày.                                                      |
| Giả định: mỗi người ~4 giờ/ngày, 5 ngày/tuần          | —          | Nếu thực tế thấp hơn, PO giảm cam kết ở Sprint Planning.                                                         |
| Giả định: dùng Mock Payment, không tích hợp cổng thật | —          | Cổng thật nằm ở backlog tương lai (PB-35).                                                                       |

---

## 14. Quản lý thay đổi Backlog

- PO sở hữu Product Backlog; mọi thành viên có thể đề xuất hạng mục mới qua PO.
- 10 task gốc là bất biến; chỉ được _làm rõ_ tiêu chí chi tiết, không sửa/xóa nội dung gốc.
- Thay đổi hạng mục bổ sung hoặc thứ tự ưu tiên phải ghi vào bảng lịch sử bên dưới và thông báo trong Daily Scrum kế tiếp.
- Trong Sprint đang chạy, PO không thêm việc mới; việc khẩn cấp đi vào Product Backlog và xử lý ở Sprint sau.

| Phiên bản | Ngày       | Người thay đổi | Nội dung                                                                                           |
| --------- | ---------- | -------------- | -------------------------------------------------------------------------------------------------- |
| 1.0       | 26/09/2026 | Product Owner  | Lập baseline: 10 task gốc + 27 hạng mục bổ sung; chốt quy ước nghiệp vụ (Mục 6); xếp hạng ưu tiên. |
| 1.1       | …          | …              | (Cập nhật sau Sprint 1 Review/Retrospective)                                                       |

---

> **BrewLite — Product Backlog v1.0** · Môn Công nghệ Phần mềm · ĐH Sài Gòn
