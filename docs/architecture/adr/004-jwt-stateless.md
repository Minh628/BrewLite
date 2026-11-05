# ADR 004: Xác thực JWT stateless với Passport, phân quyền theo `role` trong payload

- **Mã định danh:** ADR-004
- **Trạng thái:** Accepted
- **Ngày quyết định:** 2026-11-05
- **Người đề xuất:** Hoàng Tịnh (DevOps / Architect)
- **Phạm vi ảnh hưởng:** Backend (`auth`), Frontend (`store/auth`, `middleware.ts`, `lib/api.ts`), API contract

> Ghi chú: Assignment 2 gợi ý tên `003-jwt-stateless.md`. ADR-003 **đã được dùng** cho State Machine & Idempotency (do M2 viết trước), nên JWT mang mã **ADR-004** để không trùng định danh và không phá tham chiếu trong `docs/release-notes.md`.

---

## 1. Bối cảnh (Context)

BrewLite có ba nhóm người dùng — `CUSTOMER`, `BARISTA`, `ADMIN` — với quyền khác nhau:

| Endpoint                                            |       CUSTOMER       | BARISTA | ADMIN |
| --------------------------------------------------- | :------------------: | :-----: | :---: |
| `GET /products`, `GET /toppings`                    |          ✔           |    ✔    |   ✔   |
| `POST /orders`, `GET /orders/me`, `GET /orders/:id` | ✔ (chỉ đơn của mình) |    —    |   ✔   |
| `PATCH /orders/:id/status`                          |          ✘           |    ✔    |   ✔   |
| `POST /promotions/validate`                         |          ✔           |    ✔    |   ✔   |

Các lựa chọn xác thực:

1. **Session server-side** (cookie + bảng `Session`).
2. **JWT stateless** (Bearer token, không lưu phiên server).
3. **OAuth2/OIDC qua bên thứ ba** (Auth0/Keycloak).

Ràng buộc:

- Frontend là SPA/PWA (Next.js), gọi API cross-origin (`http://localhost:3000` → `:3001`), nên cookie session gặp vấn đề CORS/SameSite khi deploy.
- Dự án có hai đơn vị triển khai (FE và API riêng) — không muốn shared session store.
- Đề bài chỉ yêu cầu mức MVP: đăng ký, đăng nhập, bảo vệ endpoint theo vai trò; **không** yêu cầu SSO.

---

## 2. Quyết định (Decision)

**Dùng JWT stateless, ký HS256, mang `sub`, `email`, `role`; xác thực bằng Passport và guard NestJS.**

| Hạng mục          | Quyết định                                                                                                    |
| ----------------- | ------------------------------------------------------------------------------------------------------------- |
| Thuật toán        | `HS256` với `JWT_SECRET` (biến môi trường; không commit)                                                      |
| Thời hạn          | `expiresIn: 3600` (1 giờ), đổi refresh token ngoài phạm vi MVP                                                |
| Claims            | `sub` (userId dạng chuỗi), `email`, `role` (`CUSTOMER`/`BARISTA`/`ADMIN`)                                     |
| Cấp token         | `POST /auth/register` (201) và `POST /auth/login` (200) trả `accessToken`                                     |
| Bảo vệ endpoint   | `JwtAuthGuard` (kiểm tra Bearer + chữ ký + hạn)                                                               |
| Phân quyền        | `RolesGuard` + `@Roles(Role.BARISTA, Role.ADMIN)`                                                             |
| Lấy user hiện tại | `@CurrentUser()` đọc `req.user` do `JwtStrategy.validate` gắn                                                 |
| FE lưu token      | Zustand persist (`localStorage`) + **mirror sang cookie `brewlite-auth`** để `middleware.ts` chặn `/checkout` |
| FE gọi API        | `lib/api.ts` gắn `Authorization: Bearer <token>`; gặp **401** → xóa store + chuyển `/login?returnUrl=...`     |
| Mật khẩu          | `bcrypt` (10 rounds), không bao giờ trả `passwordHash` ra response                                            |

### 2.1. Vì sao stateless (không session server)

- API không cần bảng `Session`, không cần sticky session khi scale ngang.
- Hợp với Next.js: client giữ token, gọi API kèm `Authorization`.
- Trade-off chấp nhận được cho MVP: **không revoke được token trước hạn** (đã ghi ở mục 3.2).

### 2.2. Vì sao vẫn dùng cookie `brewlite-auth` ở FE

Đây **không phải** xác thực cookie phía server — chỉ là bản sao token để `middleware.ts` (chạy ở Edge, không đọc được `localStorage`) quyết định redirect `/checkout` → `/login` trước khi tải trang. Nguồn sự thật khi gọi API vẫn là Bearer token.

---

## 3. Hệ quả (Consequences)

### 3.1. Điểm tích cực (Pros)

- **Đơn giản & chuẩn:** Passport + `@nestjs/jwt` là mặc định của NestJS, đội quen thuộc.
- **Phân quyền khai báo:** `@Roles(...)` gắn ở controller, dễ đọc và dễ test.
- **Không phụ thuộc store phiên:** deploy API nhiều instance không cần đồng bộ.
- **Chặn sớm ở FE:** middleware chặn `/checkout` khi chưa đăng nhập, giảm request 401 vô ích.
- **Tự đăng xuất khi token hỏng/hết hạn:** API client bắt 401 chung một chỗ.

### 3.2. Đánh đổi (Cons & Mitigations)

| Đánh đổi                                                                     | Giảm thiểu                                                                                              |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **Không revoke token trước hạn** (đăng xuất không vô hiệu hóa token đã phát) | Hạn 1 giờ; đăng xuất xóa token ở client. Khi cần: thêm bảng `TokenDenylist` hoặc refresh token ngắn hạn |
| **Token trong `localStorage` dễ bị XSS đọc**                                 | Escape output của React (mặc định), dùng `helmet()` + CSP ở API; không render HTML thô từ người dùng    |
| **`JWT_SECRET` lộ = giả mạo token**                                          | Bắt buộc đặt qua env của platform, **không commit**; `.env.example` chỉ chứa placeholder                |
| **Không có refresh token → người dùng bị đăng xuất sau 1 giờ**               | Chấp nhận MVP; lỗi 401 tự đưa về `/login` kèm `returnUrl`                                               |
| **Role nằm trong token nên đổi quyền chưa có hiệu lực ngay**                 | Với MVP, đổi role hiếm; nếu cần, guard đọc lại role từ DB                                               |
| **Cookie mirror không `httpOnly`**                                           | Chỉ dùng cho routing; không chứa quyền quyết định ở server; xóa cả cookie + store khi logout            |

### 3.3. Yêu cầu bắt buộc khi triển khai production

1. `JWT_SECRET` là chuỗi ngẫu nhiên ≥ 32 ký tự, nạp từ secret manager của platform.
2. `CORS_ORIGIN` đúng domain FE (HTTPS); không dùng `*` ở prod.
3. Bật `helmet()`, giới hạn request (`ThrottlerModule`) cho `/auth/login` và `/auth/register`.
4. HTTPS bắt buộc ở cả FE và API.
5. Không log `Authorization` header hay `passwordHash`.

---

## 4. Tham chiếu

- `backend/src/auth/` — `auth.module.ts`, `auth.service.ts`, `strategies/jwt.strategy.ts`, `guards/jwt-auth.guard.ts`, `guards/roles.guard.ts`, `decorators/current-user.decorator.ts`
- `frontend/src/store/auth.ts`, `frontend/src/middleware.ts`, `frontend/src/lib/api.ts`
- `docs/api-contract.md` — `/auth/register`, `/auth/login`, mã lỗi 401/403
- ADR-001 (monorepo), ADR-002 (PostgreSQL), ADR-003 (state machine & idempotency)
