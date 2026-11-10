# Đóng góp & Quy ước làm việc — BrewLite

> Tài liệu này là **Definition of Done + quy ước Git** cho cả nhóm (Assignment 2 — T4.1).
> Mọi PR gửi vào `main` phải tuân thủ tài liệu này.

---

## 1. Cấu trúc repo

```
BrewLite/
├─ frontend/        Next.js 15 (PWA) — workspace @brewlite/frontend
├─ backend/         NestJS 11 + Prisma   — workspace @brewlite/backend
│  ├─ prisma/       schema.prisma, migrations/, seed.ts
│  └─ src/          các module: auth, products, pricing, orders,
│                   promotions, loyalty, stock, payments, common
├─ docs/            tài liệu, sơ đồ, ADR, tài liệu nộp
├─ scripts/         đo hiệu năng (autocannon)
└─ .github/         CI workflow + PR template
```

Quản lý bằng **npm workspaces**: một `package-lock.json` ở gốc. Lý do chọn monorepo (và vì sao không dùng `apps/*`) xem [ADR-001](docs/architecture/adr/001-monorepo.md).

---

## 2. Chiến lược nhánh

| Nhánh                        | Mục đích                       | Được push trực tiếp?                 |
| ---------------------------- | ------------------------------ | ------------------------------------ |
| `main`                       | Nhánh phát hành, luôn xanh CI  | ❌ **Không** — chỉ nhận PR đã review |
| `feature/<task-code>-<slug>` | Tính năng / tài liệu theo Task | ✔                                    |
| `fix/<slug>`                 | Sửa lỗi nhỏ                    | ✔                                    |
| `hotfix/<slug>`              | Sửa gấp trên nhánh phát hành   | ✔ (báo PM ngay)                      |

Ví dụ hợp lệ: `feature/t3.2-deployment-diagram`, `feature/PB-24-checkout-error-states`, `fix/ci-postgres-healthcheck`.

**Đặt tên slug:** chữ thường, dùng dấu gạch ngang, ngắn gọn (≤ 5 từ).

### 2.1. Quy trình một thay đổi

```
1. git switch main && git pull
2. git switch -c feature/t5.3-cd-pipeline
3. ... code + test ...
4. git add . && git commit -m "ci(cd): thêm pipeline GHCR và smoke test (T5.3)"
5. git push -u origin feature/t5.3-cd-pipeline
6. Mở PR theo template; gán reviewer; chờ CI xanh
7. Reviewer Approve → Squash & Merge → xoá nhánh
```

**Không** merge khi CI đỏ. **Không** tự merge PR của mình khi chưa có ít nhất 1 Approve (trừ hotfix đã báo PM).

### 2.2. Giải quyết xung đột

Pull `main` thường xuyên (`git pull --rebase origin main`). Nếu sửa migration Prisma hoặc `schema.prisma`, **luôn** báo nhóm trên chat trước khi tạo migration mới để tránh hai người sinh migration trùng thời điểm.

---

## 3. Quy ước commit (Conventional Commits)

```
<type>(<scope>): <mô tả ngắn, tiếng Việt không dấu hoặc có dấu đều được>

[body tuỳ chọn]
[footer: Closes #12 / T5.3]
```

| Type       | Dùng khi                          |
| ---------- | --------------------------------- |
| `feat`     | Thêm tính năng                    |
| `fix`      | Sửa lỗi                           |
| `docs`     | Chỉ tài liệu / sơ đồ              |
| `refactor` | Đổi cấu trúc, không đổi hành vi   |
| `test`     | Chỉ test                          |
| `style`    | Format, dấu chấm phẩy, xuống dòng |
| `chore`    | Việc vặt, dependency              |
| `ci`       | Workflow, pipeline                |
| `build`    | Dockerfile, cấu hình build        |
| `perf`     | Cải thiện hiệu năng               |

`scope` gợi ý: `auth`, `orders`, `payments`, `promotions`, `loyalty`, `stock`, `products`, `prisma`, `ci`, `cd`, `ui`, `docs`, `diagrams`.

PR gắn Task đặt tiêu đề `[T<x.y>] <mô tả>`; ví dụ `[T5.3] CD pipeline GHCR + smoke test`.

**Git hook tự động:**

- `pre-commit` → `lint-staged` (ESLint + Prettier trên file đã stage) **và** `gitleaks` (chặn secret).
- Cài hook: `npm install` ở gốc (script `prepare` chạy `husky`).

---

## 4. Definition of Done (DoD)

Một hạng mục chỉ được coi là **xong** khi đạt **tất cả** mục sau:

### 4.1. Code

- [ ] Chạy được trên máy khác theo `README.md`, không cần sửa tay.
- [ ] `npm run lint` pass (workspace liên quan).
- [ ] `npm run build` pass.
- [ ] `npm test` pass; **hành vi mới có test mới**.
- [ ] Không có `console.log`, `debugger`, code chết còn sót.

### 4.2. Bảo mật & dữ liệu

- [ ] Không commit secret/`.env` thật (chỉ `.env.example` với placeholder).
- [ ] Không log dữ liệu nhạy cảm (token, mật khẩu, `passwordHash`).
- [ ] Endpoint mới có DTO + validation; quyền đúng (`JwtAuthGuard`/`RolesGuard`).

### 4.3. Tài liệu

- [ ] Đổi API → cập nhật `docs/api-contract.md`.
- [ ] Đổi schema → có migration mới; **không sửa migration đã apply**.
- [ ] Đổi kiến trúc → cập nhật `docs/architecture/overview.md` và/hoặc thêm ADR.
- [ ] Màn hình mới / thay đổi UI → cập nhật `docs/ui/` hoặc ảnh trong PR.

### 4.4. Quy trình

- [ ] Commit theo Conventional Commits.
- [ ] PR có mô tả, checklist và bằng chứng kiểm chứng.
- [ ] CI xanh + ít nhất **1 Approve**.
- [ ] Không xoá/format lại file không liên quan (giảm nhiễu review).

---

## 5. Chạy dự án

```bash
# Cài đặt
npm install

# Khởi động DB (Docker)
npm run dev:db

# Áp migration + dữ liệu mẫu
npm run db:migrate
npm run db:seed

# Chạy dev (backend :3001 + frontend :3000)
npm run dev

# Kiểm tra tổng thể
npm run lint && npm run build && npm test

# Toàn bộ stack bằng Docker
npm run docker:up
```

Tài khoản test và dữ liệu demo: xem `README.md` và `docs/demo-script.md`.

---

## 6. Kiểm tra an toàn (secret scanning)

`.husky/pre-commit` chạy `gitleaks` nếu công cụ có sẵn:

```bash
# macOS
brew install gitleaks
# Windows
winget install gitleaks      # hoặc: scoop install gitleaks
# Docker (không cần cài)
docker run --rm -v "$PWD:/repo" zricethezav/gitleaks:latest detect --source /repo
```

Nếu máy chưa cài `gitleaks`, hook **bỏ qua có cảnh báo** (không chặn commit) — nhưng CI và reviewer vẫn phải duyệt không có secret.

---

## 7. Báo cáo tiến độ

- Daily stand-up 15 phút lúc **09:00** trên nhóm chat: hôm qua làm gì / hôm nay làm gì / vướng gì.
- Cập nhật checklist Assignment 2 (mục 7) kèm hash commit hoặc link PR.
- Mỗi thứ Sáu: rà `docs/traceability-matrix.md`.
