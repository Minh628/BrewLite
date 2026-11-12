# BrewLite — Sprint Retrospective Sprint 3 (T5.4-a)

> **Owner:** Thanh Tùng (M1 — PO/SM/Dev) · **Ngày lập:** 2026-11-07
> **Phiên bản:** 1.0 — retrospective Sprint 3. Có **Phụ lục A** cập nhật Assignment 2 wrap-up ngày 14/11.
> **Format:** Start / Stop / Continue + Action items có owner.

---

## 1. Thông tin Sprint

| Mục             | Giá trị                                                                        |
| --------------- | ------------------------------------------------------------------------------ |
| Sprint          | Sprint 3                                                                       |
| Kế hoạch        | 02-03/11/2026 (2 ngày intensive, 37 SP cam kết)                                |
| Thực tế         | 02-05/11/2026 (chốt commit `e85f59a` ngày 05/11)                               |
| Thành viên      | Thanh Tùng (M1), Kiện Minh (M2), Hải Lý (M3), Hoàng Tịnh (M4), Trung Hiếu (M5) |
| Người điều phối | Thanh Tùng (SM)                                                                |

---

## 2. What went well (Continue)

| Mục                                                                                         | Dẫn chứng                                                                                             |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **ADR-003 viết trước code** giúp nhóm đồng ý về State Machine trước khi implement.          | `docs/architecture/adr/003-state-machine-idempotency.md` (M2 viết sớm).                               |
| **Checklist sub-task trong `BrewLite-Sprint3.md`** rõ ràng — mọi người biết dependencies.   | Mục 8 có 10.1a/b/c, 10.2a/b/c, 10.3a-d, 10.4a-c với giờ ước lượng cụ thể.                             |
| **Idempotency-Key** được thiết kế ngay từ đầu, không bolt-on sau.                           | `orders.service.ts` + `payments.service.ts` + unique constraint `@@unique([userId, idempotencyKey])`. |
| **Test (c) stock concurrent 20 request** chạy stable trong CI (DB thật).                    | `stock-concurrent.e2e-spec.ts` xanh 5 lần liên tiếp.                                                  |
| **Daily stand-up 09:00** giữ nhịp, không ai bị stuck quá 2 giờ.                             | Note họp trong group chat (ngoài phạm vi doc).                                                        |
| **Pair debug** khi gặp bug hook composer (`e85f59a`) — M1 + M5 cùng truy vết trong 15 phút. | Commit message detail giải thích root cause.                                                          |
| **Branch naming convention** `Feature/<SubtaskRange>_Sprint3` giúp dễ tra khi merge.        | `Feature/9.1-9.2-10.1-9.5-9.4_Sprint3`, `Feature/Stockservice-10.3-10.3d`.                            |

---

## 3. What didn't go well (Stop)

| Vấn đề                                                                                                     | Tác động                                                                                     | Dẫn chứng                                                               |
| ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Spread-merge trong `registerHooks`** là silent bug: đăng ký hook sau ghi đè hook trước mà không warning. | `loyalty.db.spec.ts > PAID → CANCELLED` fail trên CI, lãng phí ~2 giờ debug sau khi push.    | Fix ở commit `e85f59a`. Root cause: thiết kế registry quá "friendly".   |
| **Thay đổi hằng số (`MAX_QTY = 20 → 999`)** không kèm update test.                                         | CI đỏ sau 1 commit "khởi tạo".                                                               | Commit `9cb4930` (Raymond, ngoài Sprint), fix `9225c0d`.                |
| **Dev `.env` không được tự sync** với `.env.example` khi có biến mới (`CORS_ORIGIN` cho :3002).            | Dev khác máy pull xong chạy `/barista` bị CORS fail.                                         | Phải nhắc miệng + README note. Chưa có script auto-check.               |
| **Migration drift** khi `prisma:migrate` script dùng `prisma migrate dev --name init` cố định tên.         | Mỗi lần có drift lại sinh migration mới cùng tên — xung đột khi cần `migrate deploy` ở prod. | `backend/prisma/migrations/20261107035437_init/` untracked, chờ review. |
| **Docker frontend build ra `.next/` thuộc root** vì container chạy root, không có `.dockerignore`.         | Dev gặp EACCES khi `npm run dev` sau một lần Docker build.                                   | Fix tạm bằng `docker rm` + Alpine `rm -rf`. Chưa thêm `.dockerignore`.  |
| **UI quầy không trong cam kết Sprint 3** nhưng nhiều người tưởng có → kỳ vọng sai.                         | Demo ngày 05/11 phải dùng Swagger thay vì UI → trông thiếu chuyên nghiệp hơn.                | Scope rõ trong `BrewLite-Sprint3.md` mục 3.1 nhưng không được nhắc đủ.  |

---

## 4. What to try (Start)

| Thử nghiệm                                                                                                              | Kỳ vọng kết quả                                        | Owner                  |
| ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ---------------------- |
| **Thêm pre-commit hook `gitleaks`** scan secret trước khi commit.                                                       | Không còn rủi ro lộ `.env` cho repo public.            | Hoàng Tịnh             |
| **Thêm script `scripts/check-env.sh`** so sánh `.env.example` với `.env` → cảnh báo biến thiếu.                         | Dev mới pull không gặp lỗi env silent.                 | Hoàng Tịnh             |
| **Đổi `prisma:migrate` script** thành `prisma migrate dev` (không `--name init`) để prompt tên migration.               | Không còn drift sinh lặp.                              | Trung Hiếu             |
| **Thêm `.dockerignore`** vào `frontend/` liệt kê `.next`, `node_modules`, `.env*`.                                      | Không còn root-owned `.next` khi dev + Docker đan xen. | Hoàng Tịnh             |
| **Playwright E2E luồng checkout** trong CI (có thể dùng docker-compose).                                                | Bắt sớm regression khi FE/BE thay đổi contract.        | Hải Lý                 |
| **Review design pattern chung** sau khi gặp bug `registerHooks` — xem đâu còn spread-merge nguy hiểm.                   | Phát hiện lặp mẫu sớm.                                 | Kiện Minh + Thanh Tùng |
| **Nhật ký thay đổi hằng số** trong `CHANGELOG.md` hoặc commit message: nếu đổi `MAX_QTY`, bắt buộc list test liên quan. | Giảm chance CI đỏ vì thay giá trị không đồng bộ.       | Toàn nhóm              |

---

## 5. Action items đã chốt

| #   | Hành động                                                           | Owner      | Hạn   | Tiêu chí hoàn thành                                                     |
| --- | ------------------------------------------------------------------- | ---------- | ----- | ----------------------------------------------------------------------- |
| 1   | Viết `docs/deployment.md` (31.2)                                    | Trung Hiếu | 12/11 | File tồn tại, mô tả biến env + Adminer + troubleshooting                |
| 2   | Playwright E2E checkout flow                                        | Hải Lý     | 12/11 | `tests/e2e/checkout.spec.ts` chạy xanh local + CI                       |
| 3   | Sửa `backend/package.json` script `prisma:migrate` bỏ `--name init` | Trung Hiếu | 10/11 | Chạy `npm run db:migrate` không sinh file drift mới                     |
| 4   | Thêm `frontend/.dockerignore`                                       | Hoàng Tịnh | 10/11 | File tồn tại; Docker build frontend không mang `.next` host vào context |
| 5   | Pre-commit `gitleaks`                                               | Hoàng Tịnh | 11/11 | Commit thử với `.env` mock → bị block                                   |
| 6   | Dọn migration drift `20261107035437_init`                           | Trung Hiếu | 10/11 | Branch sạch, không còn untracked trong `backend/prisma/migrations/`     |
| 7   | Cập nhật `traceability-matrix.md` v1.1 sau khi có Playwright test   | Thanh Tùng | 12/11 | Cột Test có `tests/e2e/checkout.spec.ts`                                |
| 8   | CD pipeline đầy đủ + deploy staging                                 | Hoàng Tịnh | 12/11 | URL staging HTTPS truy cập được, smoke test pass                        |

---

## 6. Nhật ký cảm xúc / tinh thần nhóm

> **Tự đánh giá ngắn gọn (tùy chọn, mỗi người 1 câu):**

- M1 (Thanh Tùng): "2 ngày intensive mệt nhưng rõ mục tiêu; mong Assignment 2 wrap-up không có bất ngờ."
- M2 (Kiện Minh): "ADR viết trước giúp code review nhanh hơn — nên làm thói quen cho Sprint sau."
- M3 (Hải Lý): "FE polling chạy mượt, nhưng cần test tự động để bớt lo silent regression."
- M4 (Hoàng Tịnh): "CI/CD pipeline cần finish gấp; `.env` sync là vấn đề cần giải."
- M5 (Trung Hiếu): "Migration drift làm mất thời gian; sẽ chuẩn hóa script."

---

## 7. Metric hồi quy (so sánh Sprint 2)

| Chỉ số                          | Sprint 2 | Sprint 3 | Nhận xét                                                  |
| ------------------------------- | -------- | -------- | --------------------------------------------------------- |
| Velocity (SP / ngày)            | ~11      | ~17      | Tăng do familiar workflow + ADR làm sẵn                   |
| Số test backend                 | ~210     | 303      | +45 test (chủ yếu promotion + state machine + stock)      |
| p95 POST /orders (10 conn)      | ~20 ms   | 16 ms    | Giảm nhẹ do tối ưu transaction order                      |
| Số commit `fix(…)` vs `feat(…)` | ~30% fix | ~40% fix | Tăng — do code phức tạp hơn (state machine + idempotency) |
| Số commit liên quan docs        | ~15%     | ~25%     | Tăng — nhờ sub-task 31.1-31.4                             |

---

## Phụ lục A — Assignment 2 wrap-up retrospective (cập nhật 14/11)

> **Trạng thái tại 07/11:** chờ cập nhật.

**Template retro cho ngày 14/11 (sau khi submit bài):**

### A.1 Nhìn lại 10 ngày Assignment 2 (04-14/11)

- Mục tiêu đặt ra: _(xem `docs/Assignment2-TaskAssignment.md`)_
- Mục tiêu đạt được: _(chờ cập nhật)_
- Khó khăn lớn nhất: _(chờ)_

### A.2 Retrospective cho khâu triển khai production (T5.3, T5.4)

- Chọn nền tảng cuối cùng (Render / Railway / Fly.io / VPS): _(chờ)_
- Số lần fail deploy trước khi staging xanh: _(chờ)_
- Rollback có cần dùng không: _(chờ)_

### A.3 Bài học cho Assignment / Sprint tiếp theo

- _(chờ cập nhật sau buổi retro cuối ngày 14/11)_
