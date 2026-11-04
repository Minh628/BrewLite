# BrewLite — Assignment 2: Phân công Task cho 5 thành viên

> **Nguồn:** `Assignment2-BrewLite.pdf` (VER 1.0) — Môn Công nghệ Phần mềm, HK I 2026–2027
> **Công nghệ bắt buộc:** Next.js (PWA) · NestJS · PostgreSQL · Docker
> **Nhóm:** Thanh Tùng · Kiện Minh · Hải Lý · Hoàng Tịnh · Trung Hiếu
> **Ngày lập:** 2026-11-04
> **Hạn nộp cuối:** **2026-11-14 (14/11)** — còn **10 ngày** kể từ ngày lập
> **Phiên bản:** 1.1 (nén lịch về deadline 14/11)

---

## 1. Tóm tắt Assignment 2

Assignment 2 nối tiếp đề tài BrewLite (Assignment 1) và yêu cầu nhóm đi trọn một chu trình **Requirements → Deployment** gồm **5 Task lớn**, mỗi Task 2 điểm, tổng **10 điểm**. Quy tắc bắt buộc:

- **Thực hiện tuần tự:** Task sau chỉ được nghiệm thu khi tạo phẩm bắt buộc của Task trước đã có trên repo với lịch sử commit rõ ràng.
- **Luồng nghiệp vụ MVP:** Xem menu → Chọn tùy chọn → Giỏ hàng → Đặt đơn → Thanh toán → Theo dõi đơn.
- **Truy vết bắt buộc:** `docs/traceability-matrix.md` liên kết yêu cầu ↔ use-case ↔ sơ đồ ↔ code ↔ test.
- **Không có URL production chạy tại thời điểm chấm → Task 5 không được tính.**

### 1.1 Bản đồ 5 Task × điểm × tạo phẩm chính

| Task | Giai đoạn                   | Tạo phẩm chính                                         | Điểm |
| :--: | --------------------------- | ------------------------------------------------------ | :--: |
|  1   | Khai thác & đặc tả yêu cầu  | Stakeholder, phạm vi, SRS, use-case tổng quát + đặc tả |  2   |
|  2   | Mô hình hóa hệ thống        | Activity, Sequence, Class diagram                      |  2   |
|  3   | Thiết kế kiến trúc          | Mô tả kiến trúc, ADR, Deployment diagram               |  2   |
|  4   | Triển khai Sprint 1         | Repo, tài liệu, CI cơ bản, MVP đầu tiên (menu)         |  2   |
|  5   | Sprint 2, CI/CD và Delivery | MVP hoàn chỉnh, CD, production URL, test, bàn giao     |  2   |

### 1.2 Nguyên tắc phân công

- Mỗi thành viên nhận **một "trụ cột" chính** (Owner) và **ít nhất một vai trò hỗ trợ** (Support) ở Task khác.
- Task 4 và Task 5 là khối lượng code lớn nhất → chia theo lớp (Frontend / Backend / DevOps / Test) thay vì gán cho một người.
- Mọi tạo phẩm phải đi qua **Pull Request** có review của ít nhất 1 thành viên khác và CI pass (xem Task 4.4).
- Mỗi người **tự cập nhật checklist** (phần 7) khi hoàn thành một hạng mục.

---

## 2. Timeline nén về deadline 14/11 (10 ngày)

| Ngày                 | Giai đoạn                           | Task chính      | Milestone kết thúc ngày                                                                       |
| -------------------- | ----------------------------------- | --------------- | --------------------------------------------------------------------------------------------- |
| **04–05/11** (T4–T5) | Khởi động + Yêu cầu                 | Task 1          | SRS + use-case diagram + context-and-scope merged vào `main`                                  |
| **05–07/11** (T5–T7) | Mô hình hóa + Kiến trúc (song song) | Task 2 + Task 3 | 3 diagram (Activity/Sequence/Class) + ADR + Deployment diagram merged                         |
| **07–09/11** (T7–CN) | Sprint 1 — MVP menu                 | Task 4          | Repo chuẩn + MVP `/menu` chạy local + CI xanh trên PR                                         |
| **09–12/11** (CN–T4) | Sprint 2 — code & test              | Task 5.1 + 5.2  | Luồng end-to-end (auth, cart, order, payment mock) chạy local qua `docker-compose`, test xanh |
| **12–13/11** (T4–T5) | CI/CD + Deploy production           | Task 5.3 + 5.4a | URL production HTTPS truy cập được + `GET /health` 200 + smoke test pass                      |
| **13–14/11** (T5–T6) | Bàn giao & demo                     | Task 5.4b       | Release notes, video demo end-to-end, Sprint Review, Retrospective, submit                    |

> **Buffer còn lại:** ~½ ngày cuối 14/11 để xử lý sự cố cuối, cập nhật traceability matrix, nộp link.
> **Quy ước nhánh:** `feature/<task-code>-<slug>` (ví dụ `feature/t1.2-srs`, `feature/t5.3-cicd`). PR phải đặt tiêu đề `[T<x.y>] <mô tả ngắn>`.
> **Nhịp làm việc:** Daily stand-up 15 phút lúc **09:00** mỗi ngày trên nhóm chat; cập nhật checklist mục 7 vào cuối ngày.

---

## 3. Bảng phân công tổng quan

| Thành viên     | Vai trò chính                | Task sở hữu (Owner)                                                                        | Hỗ trợ (Support)                                      |
| -------------- | ---------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| **Thanh Tùng** | Business Analyst / PM        | **Task 1** (Requirements) + Traceability matrix                                            | Task 2.3 (Class), Task 5.4 (Release notes, Retro)     |
| **Kiện Minh**  | System Modeler / Backend Dev | **Task 2** (Diagrams) + Backend Sprint 2 (Order/Payment API)                               | Task 1.3 (Use-case), Task 5.2 (Integration test)      |
| **Hải Lý**     | Frontend Lead                | **Task 4.3 Frontend MVP** + Task 5.1 Frontend (giỏ hàng, chi tiết, lịch sử đơn)            | Task 2.1 (Activity), Task 5.2 (E2E test)              |
| **Hoàng Tịnh** | DevOps / Architect           | **Task 3** (Architecture + Deployment) + **Task 5.3** (CI/CD) + Task 5.4 Deploy            | Task 4.1 (Repo setup), Task 4.4 (CI)                  |
| **Trung Hiếu** | Backend Lead / QA            | **Task 4.3 Backend MVP** (Products API) + Task 5.1 Backend (Auth JWT, Order, Payment mock) | Task 5.2 (Unit/Integration test), Task 2.2 (Sequence) |

---

## 4. Phân công chi tiết theo thành viên

### 4.1 Thanh Tùng — Owner **Task 1: Khai thác và đặc tả yêu cầu** + Traceability

#### Nhiệm vụ

| Mã      | Nội dung                                                                                                                                           | Deadline                       | Deliverable                                                                  |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ---------------------------------------------------------------------------- |
| T1.1    | Mô tả vấn đề nghiệp vụ, danh sách stakeholder, mục tiêu/kỳ vọng, in-scope, out-of-scope, giả định, ràng buộc, rủi ro ban đầu                       | **05/11**                      | `docs/requirements/context-and-scope.md` (bắt buộc)                          |
| T1.2    | SRS rút gọn: FR-01…, NFR-01…, mức ưu tiên MoSCoW, tiêu chí chấp nhận kiểm chứng được, use-case diagram tổng quát                                   | **05/11**                      | `docs/requirements/srs.md` + `docs/diagrams/use-case-overview.puml` + `.svg` |
| T1.3    | Đặc tả use-case trọng tâm **"Đặt và thanh toán đơn hàng"**: actor, trigger, pre/post-condition, luồng chính/thay thế/ngoại lệ, liên kết tới FR/NFR | **06/11**                      | `docs/requirements/uc-checkout.md` + diagram                                 |
| T-Trace | Dựng và duy trì `docs/traceability-matrix.md` (FR ↔ UC ↔ Diagram ↔ API ↔ Test), cập nhật hằng ngày                                                 | **06/11 (v1) → 14/11 (final)** | `docs/traceability-matrix.md`                                                |
| T5.4-a  | Soạn release notes, biên bản Sprint Review & Retrospective                                                                                         | **14/11**                      | `docs/release-notes.md`, `docs/sprint-review.md`, `docs/sprint-retro.md`     |

#### Tiêu chí nghiệm thu (Owner-level)

- Nhóm yêu cầu tối thiểu phải phủ: menu, chi tiết sản phẩm, giỏ hàng, xác thực, đặt đơn, thanh toán, lịch sử đơn, quản lý trạng thái đơn, hiệu năng, bảo mật, tính khả dụng, khả năng triển khai.
- Mỗi FR/NFR có **mã**, **MoSCoW** và **tiêu chí chấp nhận có thể viết thành test**.
- Người đọc ngoài nhóm có thể dùng SRS + đặc tả use-case để viết test cho Task 4–5.
- Traceability matrix đầy đủ cột **Mã yêu cầu | Use-case/User Story | Thiết kế/Sơ đồ | Code/API | Test**.

---

### 4.2 Kiện Minh — Owner **Task 2: Mô hình hóa hệ thống** + Backend Sprint 2

#### Nhiệm vụ

| Mã     | Nội dung                                                                                                                                                                                              | Deadline  | Deliverable                                                         |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------------------------------------------------------------------- |
| T2.1   | Activity diagram end-to-end: start/end, hành động user/system, decision/merge, swimlane đa actor, nhánh hết hàng / chưa đăng nhập / thanh toán fail                                                   | **07/11** | `docs/diagrams/activity-e2e.puml` + `.svg`                          |
| T2.2   | Sequence diagram cho UC Checkout: lifelines `Customer → Next.js UI → NestJS API → DB → Payment`, JWT check, validate, transaction đơn+tồn kho, `alt` success/fail, **idempotency**, thông báo kết quả | **07/11** | `docs/diagrams/sequence-checkout.puml` + `.svg` (bắt buộc giữ cả 2) |
| T2.3   | Class diagram domain tối thiểu: `User`, `Product`, `Order`, `OrderItem`, `Payment`, `Promotion`, `LoyaltyTransaction` — thuộc tính, quan hệ, multiplicity, enum trạng thái                            | **07/11** | `docs/diagrams/class-domain.puml` + `.svg`                          |
| T5.1-b | Hoàn thiện backend Sprint 2: `POST /orders`, `POST /payments` (mock Ví/Thẻ), State machine đơn hàng, idempotency key                                                                                  | **11/11** | PR vào `apps/api` (`orders`, `payments` modules)                    |
| T5.2-b | Integration test cho API tạo đơn + thanh toán (ít nhất 1 happy path + 1 fail path)                                                                                                                    | **12/11** | `tests/integration/*.spec.ts`                                       |

#### Tiêu chí nghiệm thu

- 3 sơ đồ **không mâu thuẫn** với SRS, use-case, ERD hiện có.
- Mỗi sơ đồ lưu **cả tệp nguồn (.puml/.drawio/.mmd) và ảnh/PDF kết xuất**.
- API `POST /orders` phải có transaction + idempotency (`Idempotency-Key` header).

---

### 4.3 Hoàng Tịnh — Owner **Task 3: Kiến trúc** + **Task 5.3 CI/CD** + Deploy

#### Nhiệm vụ

| Mã     | Nội dung                                                                                                                                                                                                                                               | Deadline                  | Deliverable                                                     |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------- | --------------------------------------------------------------- |
| T3.1   | Mô tả kiến trúc (C4 hoặc phân lớp): FE Next.js/PWA, BE NestJS theo module, PostgreSQL + migration, payment mock, logging, health check, config; ưu/nhược/trade-off                                                                                     | **07/11**                 | `docs/architecture/overview.md`                                 |
| T3.1-b | ADR (mỗi quyết định lớn 1 file): ví dụ `001-monorepo.md`, `002-postgres-vs-sqlite.md`, `003-jwt-stateless.md`, `004-idempotency.md`                                                                                                                    | **07/11**                 | `docs/architecture/adr/00X-*.md`                                |
| T3.2   | UML Deployment diagram **phản ánh đúng nền tảng thật sẽ deploy** (Render/Railway/Fly.io/VPS…): PWA client, CDN, NestJS container, PostgreSQL + persistent storage, registry, HTTPS/port nội bộ, secret/env, health check, log, ranh giới local/CI/prod | **07/11**                 | `docs/diagrams/deployment.puml` + `.svg` + `docs/deployment.md` |
| T4.1   | Khởi tạo repo chuẩn: `apps/web`, `apps/api`, `docs`, chiến lược branch, PR template, `.gitignore`, `.env.example`, Definition of Done, commit convention (Conventional Commits)                                                                        | **08/11**                 | Repo settings + `README.md` + `.github/`                        |
| T4.4   | CI pipeline GitHub Actions: `Install → Lint → Unit Test → Build`. Branch protection chặn merge khi CI đỏ                                                                                                                                               | **09/11**                 | `.github/workflows/ci.yml` + screenshot CI xanh + CI đỏ         |
| T5.3   | CD pipeline đầy đủ: `Push/Tag → Lint+Test → Build → Docker Image → Push Registry → Deploy → Smoke Test`. Tag bằng commit SHA hoặc semver, chạy migration an toàn, health check sau deploy, cơ chế rollback                                             | **13/11**                 | `.github/workflows/cd.yml` + tài liệu rollback                  |
| T5.4-b | Deploy production: FE HTTPS, API + `GET /health`, DB không public, secret qua env của platform, URL công khai được. **Staging sớm ngày 12/11, promote prod 13/11.**                                                                                    | **13/11 (staging 12/11)** | URL prod ghi vào `README.md` + `docs/release-notes.md`          |

#### Tiêu chí nghiệm thu

- Mỗi container/service trong deployment diagram **truy vết được** tới mô tả kiến trúc và mã nguồn.
- PR không thể merge khi lint/test/build fail.
- URL production chạy HTTPS tại thời điểm chấm, có `GET /health` trả 200.
- Secret **không xuất hiện** trong repo hoặc log CI.

---

### 4.4 Trung Hiếu — Owner **Backend MVP (Task 4.3 + 5.1)** + QA

#### Nhiệm vụ

| Mã     | Nội dung                                                                                                                                                  | Deadline  | Deliverable                                                       |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ----------------------------------------------------------------- |
| T4.3-a | NestJS: module `products`, `GET /products`, `GET /products/:id`, DTO + validation (`class-validator`), error handling chuẩn, seed data, migration ban đầu | **09/11** | `apps/api/src/products/*` + `apps/api/prisma/migrations/*` + seed |
| T4.3-b | Unit test cho service `products` (coverage ≥ 70% module này)                                                                                              | **09/11** | `apps/api/src/products/*.spec.ts`                                 |
| T5.1-a | Auth: đăng ký, đăng nhập, JWT (access + refresh nếu cần), guard cho endpoint cần auth                                                                     | **10/11** | `apps/api/src/auth/*`                                             |
| T5.1-c | Order flow: `POST /orders`, `GET /orders/:id`, cập nhật trạng thái; validate stock; emit event cho payment                                                | **11/11** | `apps/api/src/orders/*`                                           |
| T5.1-d | Payment mock Ví/Thẻ: `POST /payments`, kết quả ngẫu nhiên có kiểm soát để test fail path; idempotency                                                     | **11/11** | `apps/api/src/payments/*`                                         |
| T5.2-a | Unit test nghiệp vụ quan trọng (auth, order total, state transition) + 1 integration test chạy đơn                                                        | **12/11** | `apps/api/**/*.spec.ts` + coverage report                         |
| T5.2-c | `GET /health` trả trạng thái DB + build version                                                                                                           | **10/11** | `apps/api/src/health/*`                                           |
| T-Supp | Hỗ trợ Kiện Minh review Sequence diagram để đảm bảo khớp với thực tế code                                                                                 | **07/11** | Review comment trên PR                                            |

#### Tiêu chí nghiệm thu

- Mọi endpoint có DTO + validation; lỗi trả **mã HTTP đúng** + body theo schema thống nhất.
- `POST /orders` và `POST /payments` **idempotent** theo header `Idempotency-Key`.
- Coverage tổng của `apps/api` ≥ **70%** vào cuối Sprint 2.

---

### 4.5 Hải Lý — Owner **Frontend MVP (Task 4.3 + 5.1)** + E2E

#### Nhiệm vụ

| Mã     | Nội dung                                                                                                                                    | Deadline  | Deliverable                                               |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------- | --------- | --------------------------------------------------------- |
| T4.3-c | Next.js mobile-first/PWA: trang `/menu` gọi `GET /products`, danh sách responsive, trạng thái **loading / empty / error**                   | **09/11** | `apps/web/src/app/menu/*` + PWA manifest + service worker |
| T4.3-d | Component test (Vitest/Jest + Testing Library) cho `MenuList`, `ProductCard`                                                                | **09/11** | `apps/web/**/*.test.tsx`                                  |
| T5.1-e | Trang chi tiết sản phẩm: chọn size, topping, số lượng, tính giá client-side (đồng bộ với server)                                            | **10/11** | `apps/web/src/app/products/[id]/*`                        |
| T5.1-f | Giỏ hàng: thêm/sửa/xóa item, tính tổng, lưu `localStorage`, UI trống + đầy                                                                  | **10/11** | `apps/web/src/app/cart/*`                                 |
| T5.1-g | Luồng auth + checkout: đăng ký, đăng nhập, lưu token an toàn (httpOnly nếu dùng cookie), form thanh toán mock, trang xác nhận + lịch sử đơn | **11/11** | `apps/web/src/app/(auth)/*`, `apps/web/src/app/orders/*`  |
| T5.1-h | Validate & xử lý lỗi FE: hiện lỗi API, timeout, mất mạng, retry tay                                                                         | **12/11** | PR cập nhật `apps/web`                                    |
| T5.2-d | **Ít nhất 1 test end-to-end (Playwright/Cypress)** cho luồng Menu → Chi tiết → Giỏ hàng → Đặt đơn → Xác nhận                                | **12/11** | `tests/e2e/checkout.spec.ts` + screenshot/video           |
| T-Supp | Vẽ nháp Activity diagram theo luồng FE để Kiện Minh tinh chỉnh T2.1                                                                         | **06/11** | Nháp trong PR của Task 2.1                                |

#### Tiêu chí nghiệm thu

- UI responsive tốt ở viewport **375 × 667** (mobile-first).
- Lighthouse PWA ≥ **80**, Performance ≥ **70** trên build production.
- E2E test chạy được trong CI (headless) và pass.

---

## 5. Trách nhiệm chéo (RACI rút gọn)

| Hạng mục                            | Owner (R)                                | Approve (A) | Consulted (C)         | Informed (I) |
| ----------------------------------- | ---------------------------------------- | ----------- | --------------------- | ------------ |
| SRS + Traceability                  | Thanh Tùng                               | Hoàng Tịnh  | Kiện Minh, Trung Hiếu | Hải Lý       |
| 3 Diagram (Activity/Sequence/Class) | Kiện Minh                                | Thanh Tùng  | Trung Hiếu, Hải Lý    | Hoàng Tịnh   |
| Architecture + ADR + Deployment     | Hoàng Tịnh                               | Thanh Tùng  | Kiện Minh, Trung Hiếu | Hải Lý       |
| Repo & CI                           | Hoàng Tịnh                               | Thanh Tùng  | cả nhóm               | —            |
| MVP Sprint 1 (menu)                 | Trung Hiếu (BE), Hải Lý (FE)             | Hoàng Tịnh  | Kiện Minh             | Thanh Tùng   |
| MVP Sprint 2 (end-to-end)           | Trung Hiếu + Kiện Minh (BE), Hải Lý (FE) | Hoàng Tịnh  | Thanh Tùng            | —            |
| CI/CD + Deploy                      | Hoàng Tịnh                               | Thanh Tùng  | Trung Hiếu            | cả nhóm      |
| Release notes + Retro               | Thanh Tùng                               | cả nhóm     | —                     | —            |

---

## 6. Danh sách tạo phẩm bắt buộc nộp (map với Checklist trong PDF)

| Checklist PDF                                 | Tạo phẩm cụ thể                                                  | Người phụ trách                 |
| --------------------------------------------- | ---------------------------------------------------------------- | ------------------------------- |
| Link repo + quyền truy cập cho giảng viên     | GitHub repo public hoặc share với email giảng viên               | Hoàng Tịnh                      |
| SRS, đặc tả use-case, ma trận truy vết        | `docs/requirements/*.md` + `docs/traceability-matrix.md`         | Thanh Tùng                      |
| Activity, Sequence, Class, Deployment diagram | `docs/diagrams/*.puml` + `.svg`                                  | Kiện Minh (3) + Hoàng Tịnh (1)  |
| Source code FE/BE/migration                   | `apps/web`, `apps/api`, `apps/api/prisma/migrations`             | Hải Lý + Trung Hiếu             |
| Unit / Integration / E2E test                 | `apps/*/**/*.spec.ts`, `tests/integration/*`, `tests/e2e/*`      | Trung Hiếu + Kiện Minh + Hải Lý |
| Pipeline CI/CD chạy thành công                | `.github/workflows/ci.yml`, `cd.yml` + screenshot                | Hoàng Tịnh                      |
| URL production + API + health check           | Ghi trong `README.md` và `docs/release-notes.md`                 | Hoàng Tịnh                      |
| Release notes, README, rollback guide         | `README.md`, `docs/release-notes.md`, `docs/runbook-rollback.md` | Thanh Tùng + Hoàng Tịnh         |
| Video demo + Sprint Retrospective             | `docs/demo.md` (link video), `docs/sprint-retro.md`              | Thanh Tùng (chủ trì) + cả nhóm  |

---

## 7. Checklist tiến độ (self-tracking)

> **Cách dùng:** Khi hoàn thành một mục, thay `[ ]` thành `[x]` kèm commit SHA hoặc link PR trong dấu ngoặc.

### Task 1 — Thanh Tùng

- [ ] T1.1 `docs/requirements/context-and-scope.md` (PR: ___)
- [ ] T1.2 SRS + use-case overview (PR: ___)
- [ ] T1.3 Đặc tả UC-Checkout (PR: ___)
- [ ] Traceability matrix v1 (PR: ___)

### Task 2 — Kiện Minh

- [ ] T2.1 Activity diagram (PR: ___)
- [ ] T2.2 Sequence diagram Checkout (PR: ___)
- [ ] T2.3 Class diagram domain (PR: ___)

### Task 3 — Hoàng Tịnh

- [ ] T3.1 Architecture overview (PR: ___)
- [ ] T3.1-b ADR ≥ 3 file (PR: ___)
- [ ] T3.2 Deployment diagram + `docs/deployment.md` (PR: ___)

### Task 4 — Hoàng Tịnh + Trung Hiếu + Hải Lý

- [ ] T4.1 Repo chuẩn + README + `.env.example` (PR: ___)
- [ ] T4.2 Toàn bộ docs Task 1–3 đã trong `docs/` qua PR (PR: ___)
- [ ] T4.3-a BE `GET /products` + seed (PR: ___)
- [ ] T4.3-b Unit test BE products (PR: ___)
- [ ] T4.3-c FE `/menu` + loading/empty/error (PR: ___)
- [ ] T4.3-d Component test FE (PR: ___)
- [ ] T4.4 CI xanh + screenshot CI đỏ chặn merge (PR: ___)

### Task 5 — cả nhóm

- [ ] T5.1-a Auth JWT (PR: ___)
- [ ] T5.1-b Payment mock (PR: ___)
- [ ] T5.1-c Order flow (PR: ___)
- [ ] T5.1-e Product detail (size/topping) (PR: ___)
- [ ] T5.1-f Cart (PR: ___)
- [ ] T5.1-g Auth + checkout + order history FE (PR: ___)
- [ ] T5.2-a Unit + integration test BE (PR: ___)
- [ ] T5.2-c `GET /health` (PR: ___)
- [ ] T5.2-d E2E test checkout (PR: ___)
- [ ] T5.2 `docker-compose.yml` chạy web + api + db (PR: ___)
- [ ] T5.3 CD pipeline đầy đủ (PR: ___)
- [ ] T5.4 Deploy production + URL HTTPS + release notes (PR: ___)
- [ ] T5.4 Video demo end-to-end (link: ___)
- [ ] T5.4 Sprint Review + Retrospective (PR: ___)

---

## 8. Rủi ro & phương án dự phòng

| Rủi ro                                                      | Mức     | Người chịu trách nhiệm  | Phương án giảm thiểu                                                                 |
| ----------------------------------------------------------- | ------- | ----------------------- | ------------------------------------------------------------------------------------ |
| Thanh toán mock không idempotent → double charge trong test | Cao     | Kiện Minh + Trung Hiếu  | Thiết kế `Idempotency-Key` ngay từ Task 2.2, test trong Task 5.2                     |
| Deploy production fail sát deadline 14/11                   | Rất cao | Hoàng Tịnh              | Bắt buộc có **staging URL ngày 12/11**; ngày 13/11 chỉ promote; 14/11 là buffer      |
| Task 1–3 trễ kéo theo Task 4–5 không kịp 14/11              | Rất cao | Thanh Tùng + Hoàng Tịnh | Đóng cứng Task 1 hạn **06/11**, Task 2+3 hạn **07/11**; sau 07/11 không mở lại scope |
| CI chậm → chặn PR merge                                     | Vừa     | Hoàng Tịnh              | Cache dependencies; chạy unit + build song song                                      |
| E2E test flaky                                              | Vừa     | Hải Lý                  | Dùng data-testid cố định, chạy retry 2 lần trong CI                                  |
| Thiếu tạo phẩm Task trước → Task sau không chấm điểm        | Rất cao | Thanh Tùng (PM)         | Review checklist mỗi cuối tuần, chặn merge Sprint 2 khi Task 1–3 chưa đủ             |
| Secret bị commit                                            | Rất cao | Hoàng Tịnh              | Pre-commit hook `gitleaks` + review `.env.example` kỹ                                |

---

## 9. Liên kết tham khảo

- `Assignment2-BrewLite.pdf` — đề bài gốc
- `docs/BrewLite-ProductBacklog.md` — backlog đã dựng ở Assignment 1
- `docs/BrewLite-Sprint2.md`, `docs/BrewLite-Sprint3.md` — kế hoạch sprint hiện có (reuse làm nền cho Task 4–5)
- `docs/architecture/`, `docs/erd/`, `docs/ui/` — tạo phẩm nền sẵn có

---

**Ghi chú cuối:** Khi bắt đầu một Task, Owner mở **GitHub Issue** cùng mã (ví dụ `[T2.2] Sequence diagram Checkout`), gán label `task-1…task-5`, link PR vào issue. Mỗi Thứ Sáu nhóm họp **15 phút** cập nhật checklist ở mục 7 và cập nhật traceability matrix.
