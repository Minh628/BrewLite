# ADR 001: Monorepo npm workspaces với hai workspace `frontend` và `backend`

- **Mã định danh:** ADR-001
- **Trạng thái:** Accepted
- **Ngày quyết định:** 2026-11-05
- **Người đề xuất:** Hoàng Tịnh (DevOps / Architect)
- **Phạm vi ảnh hưởng:** Toàn repo (`package.json`, `frontend/`, `backend/`, `docs/`, `.github/workflows/`)

---

## 1. Bối cảnh (Context)

BrewLite gồm một PWA Next.js và một API NestJS, cùng chia sẻ: phiên bản Node, biến môi trường, quy ước commit, Prettier và các script CI. Nhóm có 5 người, deadline ngắn, phải chạy được toàn hệ thống bằng **một lệnh** (`docker compose up`) theo yêu cầu Assignment 2.

Các phương án cần cân nhắc:

1. **Hai repo riêng** (`brewlite-web`, `brewlite-api`).
2. **Monorepo nhiều package con** (`apps/web`, `apps/api`, `packages/shared`).
3. **Monorepo npm workspaces phẳng** (`frontend/`, `backend/`) — phương án hiện tại.

Ràng buộc thực tế:

- Chủ yếu là TypeScript ở cả hai phía, có chung khái niệm miền (`Product`, `Order`, `Promotion`) và một số quy tắc giá.
- Repo đã có `package.json` gốc dùng `workspaces: ["frontend", "backend"]` và script `dev`, `build`, `test`, `lint` chạy song song/tuần tự cho cả hai.
- CI đang chạy theo `working-directory: backend` và `frontend`, không dùng Turborepo/Nx.

---

## 2. Quyết định (Decision)

**Giữ monorepo npm workspaces phẳng với hai workspace `@brewlite/frontend` và `@brewlite/backend`.**

Cụ thể:

| Hạng mục         | Quyết định                                                                           |
| ---------------- | ------------------------------------------------------------------------------------ |
| Package manager  | npm (đi kèm Node 20+), dùng `workspaces` gốc                                         |
| Cấu trúc         | `frontend/` (Next.js), `backend/` (NestJS + Prisma), `docs/`, `scripts/`, `.github/` |
| Lockfile         | Một `package-lock.json` duy nhất ở gốc                                               |
| Script điều phối | `npm run dev`, `build`, `test`, `lint` ở gốc gọi `--workspace`                       |
| CI               | Một workflow `.github/workflows/ci.yml`, mỗi job đặt `working-directory` riêng       |
| Không dùng       | Turborepo, Nx, pnpm, Yarn PnP                                                        |

Lý do **không** đổi sang `apps/web` + `apps/api`:

- Assignment 2 §4.1 mô tả layout `apps/*`, nhưng code, CI, Dockerfile và tài liệu hiện có đều tham chiếu `backend/` và `frontend/` ở hàng chục chỗ.
- Việc đổi tên lúc này chỉ mang tính hình thức, phá vỡ lịch sử commit và CI đang xanh — rủi ro cao, lợi ích bằng 0 trong 10 ngày còn lại.
- Quy ước `feature/<task-code>-<slug>` và PR `[T<x.y>]` vẫn được giữ nguyên; chỉ khác tên thư mục.

---

## 3. Hệ quả (Consequences)

### 3.1. Điểm tích cực (Pros)

- **Một lệnh cho toàn hệ thống:** `npm run build`, `npm run test`, `npm run lint` chạy đúng cả hai phía — giảm lỗi "quên chạy phía kia".
- **Chia sẻ phiên bản:** một `node_modules` gốc nhờ hoisting; tránh lệch phiên bản TypeScript/ESLint giữa web và api.
- **Đồng bộ thay đổi xuyên tầng:** một PR có thể sửa cả API contract và client trong cùng commit, review được toàn cảnh.
- **CI đơn giản:** một file workflow, không cần tổng hợp nhiều repo; cache `npm` theo `package-lock.json` gốc.
- **Docker:** `docker-compose.yml` build được hai image từ cùng ngữ cảnh build.

### 3.2. Đánh đổi (Cons & Mitigations)

| Đánh đổi                                                         | Giảm thiểu                                                                                |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Job CI chạy dư khi chỉ sửa docs (path không đổi)                 | Thêm `paths-ignore: ['docs/**', '**/*.md']` khi cần tối ưu                                |
| `npm install` gốc cài cả hai bộ dependency → chậm hơn repo riêng | Bật cache `actions/setup-node` với `cache: npm`; chỉ cài `--workspace` khi job độc lập    |
| Không có ranh giới import cứng giữa FE và BE                     | Quy ước: FE không import thẳng `backend/src`; dùng hợp đồng HTTP (`docs/api-contract.md`) |
| Hoisting có thể che giấu dependency "mồ côi"                     | Bật `no-extraneous-dependencies` (ESLint) nếu cần siết                                    |
| Phiên bản dependency cần thống nhất giữa hai workspace           | Chấp nhận song song phiên bản chính (Nest 11 dùng TS 5.x, Next 15 dùng TS 5.x)            |

### 3.3. Việc cần làm khi thay đổi

- Thêm workspace mới → khai báo trong `workspaces` gốc + thêm job CI.
- Đổi tên thư mục → phải sửa đồng thời `docker-compose.yml`, Dockerfile, `ci.yml`, tất cả `npm run ... --workspace`, và tài liệu; **shipper phải làm vào đầu Sprint**, không làm sát deadline.

---

## 4. Tham chiếu

- `package.json` (gốc) — định nghĩa `workspaces` và script điều phối.
- `.github/workflows/ci.yml` — hai job `backend` và `frontend`, mỗi job đặt `working-directory`.
- ADR-002 — chọn PostgreSQL; ADR-003 — state machine/idempotency; ADR-004 — JWT stateless.
