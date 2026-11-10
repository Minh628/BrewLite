# Triển khai BrewLite (Task 3.2)

- **Mã:** T3.2
- **Phiên bản:** 1.0
- **Ngày:** 2026-11-10
- **Người viết:** Hoàng Tịnh (DevOps / Architect)
- **Sơ đồ:** [`docs/diagrams/deployment.puml`](./diagrams/deployment.puml) · [`docs/diagrams/deployment.svg`](./diagrams/deployment.svg)
- **Tài liệu liên quan:** [`docs/architecture/overview.md`](./architecture/overview.md) · [`docs/architecture/adr/001-monorepo.md`](./architecture/adr/001-monorepo.md) · [`docs/api-contract.md`](./api-contract.md) · [`docs/CONTRIBUTING.md`](./CONTRIBUTING.md)

> ⚠️ **Trạng thái phương án:** Đây là **phương án nền tảng đề xuất** (Vercel + Render + Neon + GHCR) để không chặn tiến độ Task 3. Khi nhóm chốt platform khác (Railway/VPS/Fly.io), chỉ cần sửa nhãn node trong `.puml` và bảng §2 — cấu trúc luồng deploy không đổi.

---

## 1. Bản đồ môi trường

| Môi trường     | Dùng khi nào         | Thành phần                                                                                                 | Nguồn cấu hình                                                        |
| -------------- | -------------------- | ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| **Local**      | Phát triển hằng ngày | `postgres` + `adminer` + `backend` + `frontend` qua `docker-compose.yml`; hoặc `npm run dev` với DB Docker | `.env.example` (gốc), `backend/.env.example`, `frontend/.env.example` |
| **CI**         | Mỗi push/PR          | GitHub Actions runner + service container `postgres:16-alpine`                                             | `env:` trong `.github/workflows/ci.yml`                               |
| **Production** | Bàn giao, chấm điểm  | Web (Vercel) · API (Render Docker) · DB (Neon Postgres)                                                    | Secret của từng platform                                              |

Ranh giới: **chỉ Production** mới truy cập Internet công khai. DB không có IP công khai; API không mở 5432.

---

## 2. Thành phần & nền tảng đề xuất

| Thành phần        | Nền tảng                        | Vai trò                                                            | Artifact                                                   | Cổng                       |
| ----------------- | ------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------- | -------------------------- |
| **Web (PWA)**     | **Vercel**                      | Phục vụ Next.js 15 (App Router), CDN + HTTPS tự động               | `frontend/` (Next standalone, hoặc Vercel build trực tiếp) | 443                        |
| **API**           | **Render Web Service (Docker)** | Chạy `backend/Dockerfile`, tự chạy migration khi start             | `ghcr.io/<org>/brewlite-api:<commit-sha>`                  | 3001 nội bộ, 443 qua proxy |
| **Database**      | **Neon PostgreSQL 16**          | Lưu trữ bền vững, SSL bắt buộc, connection pooling                 | `prisma/migrations/`                                       | 5432 (TLS, chỉ API)        |
| **Registry**      | **GHCR**                        | Lưu image API (và web nếu deploy Docker), tag theo commit SHA      | `ghcr.io/<org>/brewlite-*`                                 | —                          |
| **Secrets**       | Env của từng platform           | `JWT_SECRET`, `DATABASE_URL`, `CORS_ORIGIN`, `NEXT_PUBLIC_API_URL` | —                                                          | —                          |
| **Local tooling** | Docker Compose                  | `postgres`, `adminer`, `backend`, `frontend` + healthcheck         | `docker-compose.yml`                                       | 5432/8080/3001/3000        |

### 2.1. Truy vết về mã nguồn

| Node trên sơ đồ                | Tệp nguồn                                                                   |
| ------------------------------ | --------------------------------------------------------------------------- |
| API container                  | `backend/Dockerfile`, `backend/docker-entrypoint.sh`, `backend/src/main.ts` |
| Health endpoint                | `backend/src/app.controller.ts` (`GET /health`)                             |
| Migration + seed khi khởi động | `backend/docker-entrypoint.sh` → `prisma migrate deploy` + `prisma db seed` |
| Web container                  | `frontend/Dockerfile` (Next.js standalone), `frontend/next.config.ts`       |
| Local stack                    | `docker-compose.yml`, `docker-compose.dev.yml`                              |
| CI                             | `.github/workflows/ci.yml`                                                  |
| CD                             | `.github/workflows/cd.yml` (T5.3)                                           |

---

## 3. Biến môi trường

### 3.1. API (Render)

| Biến             | Bắt buộc | Ví dụ production                                                                 | Ghi chú                                                                 |
| ---------------- | :------: | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `DATABASE_URL`   |    ✔     | `postgresql://user:pass@ep-xxx.neon.tech/brewlite?sslmode=require&schema=public` | **Bắt buộc** `sslmode=require` với Neon                                 |
| `JWT_SECRET`     |    ✔     | chuỗi ngẫu nhiên ≥ 32 ký tự                                                      | Sinh bằng `openssl rand -base64 48`; **không tái sử dụng** secret local |
| `PORT`           |    ✔     | `3001`                                                                           | Render tự inject; giữ 3001 cho khớp healthcheck                         |
| `CORS_ORIGIN`    |    ✔     | `https://brewlite.vercel.app`                                                    | Nhiều domain cách dấu phẩy; **không** dùng `*`                          |
| `THROTTLE_TTL`   |    ○     | `60`                                                                             | Giây                                                                    |
| `THROTTLE_LIMIT` |    ○     | `100`                                                                            | Request/phút                                                            |
| `NODE_ENV`       |    ✔     | `production`                                                                     | Ẩn stack trace trong body lỗi 500                                       |

### 3.2. Web (Vercel)

| Biến                  | Bắt buộc | Ví dụ                               | Ghi chú                                                     |
| --------------------- | :------: | ----------------------------------- | ----------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` |    ✔     | `https://brewlite-api.onrender.com` | **Nhúng vào bundle lúc build** — đổi giá trị phải build lại |

> `NEXT_PUBLIC_*` xuất hiện trong JavaScript phía client. **Không** đặt secret vào biến này.

### 3.3. Kiểm tra không lộ secret

- Pre-commit: `.husky/pre-commit` chạy `gitleaks protect --staged --config .gitleaks.toml`.
- Quét toàn repo trước khi nộp:
  ```bash
  gitleaks detect --config .gitleaks.toml --redact
  # → no leaks found
  ```
- Chỉ commit `.env.example` (placeholder), `.gitignore` chặn `.env` và `.env.*` trừ `.env.example`.

---

## 4. Thứ tự triển khai (lần đầu)

```
1. Neon: tạo project → copy DATABASE_URL (có sslmode=require)
2. GHCR: tạo package (tự tạo khi push image lần đầu)
3. Render: tạo Web Service (Docker) trỏ image ghcr.io/<org>/brewlite-api:<sha>
     - env: DATABASE_URL, JWT_SECRET, PORT, CORS_ORIGIN, NODE_ENV
     - health check path: /health
4. Chờ Render build + khởi động → docker-entrypoint.sh tự chạy migrate + seed
5. Kiểm tra GET https://<api>/health → 200
6. Vercel: import repo, root = frontend/
     - env: NEXT_PUBLIC_API_URL = https://<api>
7. Cập nhật CORS_ORIGIN của API = domain Vercel vừa cấp
8. Kiểm tra end-to-end trên domain Vercel (menu → đặt đơn → thanh toán)
9. Ghi URL vào README.md và docs/release-notes.md
```

**Vì sao API trước Web:** `NEXT_PUBLIC_API_URL` phải có giá trị đúng tại thời điểm build web; và `CORS_ORIGIN` cần domain web thật — nên tạo web sau API rồi quay lại cập nhật CORS.

---

## 5. Quy trình CD (T5.3)

```
git tag v1.0.0  (hoặc push main)
   │
   ├─ CI: lint → test → build            (ci.yml)
   │
   └─ CD: build image → push GHCR (tag = commit SHA)
          → trigger deploy Render
          → smoke test GET /health
          → (prod) promote
```

Nguyên tắc:

1. **Image bất biến:** không dùng tag `latest` cho production; luôn gắn `<commit-sha>` (+ `v1.0.0` nếu là release).
2. **Migration an toàn:** `docker-entrypoint.sh` chạy `prisma migrate deploy` trước khi start — idempotent, không sinh migration mới.
3. **Smoke test bắt buộc:** `GET /health` phải trả 200 trong 60 giây, nếu không → pipeline đỏ, giữ bản cũ.
4. **Không deploy trực tiếp bằng tay** lên production ngoài pipeline (trừ khi rollback khẩn cấp có ghi chép).

---

## 6. Health check

```
GET /health  →  200
{
  "status": "ok",
  "timestamp": "2026-11-10T10:00:00.000Z",
  "uptime": 123.45,
  "service": "brewlite-backend"
}
```

| Nơi dùng                     | Tần suất       | Hành động khi fail                                   |
| ---------------------------- | -------------- | ---------------------------------------------------- |
| Docker Compose `healthcheck` | 10s, 10 lần    | `frontend` không start cho tới khi `backend` healthy |
| Render health check          | 30s            | Platform restart container                           |
| CD smoke test                | sau mỗi deploy | Pipeline đỏ, cảnh báo rollback                       |

> `GET /health` hiện **không** kiểm tra kết nối DB. Nếu cần phát hiện DB chết sớm, bổ sung `SELECT 1` qua Prisma (Task 5.2-c) — nhưng giữ endpoint phản hồi nhanh, không chặn khi DB chậm.

---

## 7. Rollback

| Kịch bản                 | Cách xử lý                                                                                                               | Thời gian  |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------ | ---------- |
| API mới lỗi (crash, 500) | Render → _Deploys_ → chọn bản trước → **Redeploy** (hoặc deploy lại image SHA cũ qua pipeline)                           | < 5 phút   |
| Migration gây lỗi        | Dừng deploy; **không** sửa migration đã apply; viết migration mới đảo ngược (`migrate dev --name revert_xxx`) rồi deploy | 15–30 phút |
| DB hỏng dữ liệu          | Neon → _Restore_ từ point-in-time (PITR) gói trả phí; free tier dùng `pg_dump` định kỳ                                   | 10–60 phút |
| Web lỗi                  | Vercel → _Deployments_ → chọn bản trước → **Promote to Production**                                                      | < 2 phút   |
| Secret lộ                | Xoay `JWT_SECRET` (mọi token cũ mất hiệu lực — chấp nhận được), cập nhật env, deploy lại                                 | 10 phút    |

**Nguyên tắc rollback:** luôn ưu tiên _deploy lại bản trước_ thay vì sửa nóng code trên production.

---

## 8. Checklist trước khi nộp (Task 5.4-b)

- [ ] URL Vercel truy cập được qua **HTTPS**, mở trên điện thoại (375×667) không vỡ layout
- [ ] `GET https://<api>/health` trả **200**
- [ ] Đăng ký → đăng nhập → đặt đơn → thanh toán chạy trên domain production
- [ ] DB Neon **không** public IP; kết nối chỉ từ API (kiểm tra `pg_stat_activity`)
- [ ] Secret nằm trong env platform, không có trong repo (`gitleaks detect` sạch)
- [ ] `CORS_ORIGIN` chỉ chứa domain production (không `localhost`, không `*`)
- [ ] Swagger `/api-docs` truy cập được (mở công khai cho giảng viên chấm)
- [ ] URL ghi vào `README.md` và `docs/release-notes.md`

---

## 9. Rủi ro & dự phòng

| Rủi ro                                                                        | Mức | Dự phòng                                                                                                      |
| ----------------------------------------------------------------------------- | --- | ------------------------------------------------------------------------------------------------------------- |
| Render free tier "ngủ" sau 15 phút không dùng → request đầu chậm 30s          | Cao | Health check ping định kỳ bằng GitHub Actions cron, hoặc ghi chú trong demo script; nâng tier trước buổi chấm |
| Neon free tier giới hạn connection                                            | Vừa | Bật pgbouncer, `?pgbouncer=true`, giảm pool Prisma                                                            |
| Đổi platform sát deadline                                                     | Cao | Sơ đồ tách rời cấu trúc khỏi thương hiệu — đổi nhãn node, không vẽ lại                                        |
| Vercel build lỗi do `NEXT_PUBLIC_API_URL` chưa có                             | Vừa | Tạo env trước lần build đầu (xem §4 bước 6)                                                                   |
| Migration chạy khi khởi động làm container khởi động chậm → health check fail | Vừa | Tăng `start_period` / `healthCheckGracePeriod`; seed idempotent nên chỉ nặng lần đầu                          |
