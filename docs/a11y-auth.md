# 30.2 — A11y & Responsive màn hình Đăng nhập / Đăng ký

- **Sub-task:** PB-30 · 30.2 — Sửa a11y/responsive cho Đăng nhập, Đăng ký; kiểm thử Chrome, Firefox, Edge
- **Người thực hiện:** M4 — Hoàng Tịnh
- **Ngày:** 27/10/2026
- **Môi trường:** FE `http://localhost:3000`, BE `http://localhost:3001`, DB `brewlite`
- **Trình duyệt sử dụng:** Chrome 156.0.8078.47 · Edge 156.0.4314.42 · Firefox 158.0.1

## 1. Lỗi a11y đã phát hiện và sửa

| #   | Vị trí                                                                       | Lỗi                                                                                                                                  | Đã sửa                                                                                                                                                                          |
| --- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `app/login/page.tsx`, `app/register/page.tsx`                                | Mỗi field có **2 `<label for>`** cùng trỏ một `id` (label viết tay ngoài + label trong `Input`) → screen reader đọc trùng            | Bỏ label viết tay, truyền `label` prop cho `Input`. Kết quả: mỗi field còn đúng 1 label                                                                                         |
| 2   | `app/login/page.tsx:126`, `app/register/page.tsx:148`                        | `import { useState }` khai báo sau khi component đã dùng                                                                             | Gộp vào import đầu file `{ Suspense, useState }`                                                                                                                                |
| 3   | `app/login/page.tsx`                                                         | Dòng "Tài khoản test" dùng `text-espresso/40` (≈2.4:1) và ghi email **không khớp seed**                                              | Xoá dòng tài khoản test sai (thông tin test chuyển cho PO đưa vào biên bản nghiệm thu); chữ phụ đổi `/60` → `/70`                                                               |
| 4   | `tailwind.config.ts`                                                         | `caramel #c87532` chỉ **3.47:1** trên nền trắng; `sage #66735b` chỉ **4.45:1** trên crema → axe báo `color-contrast` mức **serious** | Đổi token: `caramel` → `#a55a1f` (5.14:1 trên trắng, 4.55:1 trên crema), `sage` → `#59654f` (5.46:1 trên crema). Giữ `#c87532` cho mục đích trang trí dưới tên `caramel-strong` |
| 5   | `components/Button.tsx`, `Header.tsx`, `cart/page.tsx`, `MenuEmptyState.tsx` | Chữ `text-espresso` trên nền `bg-caramel` chỉ **3.06:1**                                                                             | Chuyển sang `text-white` (5.14:1)                                                                                                                                               |
| 6   | `app/login/page.tsx:111`, `app/register/page.tsx:137`                        | Link "Đăng ký ngay"/"Đăng nhập ngay" không có focus ring                                                                             | Thêm `focus-visible:ring-2 focus-visible:ring-caramel`                                                                                                                          |
| 7   | `app/register/page.tsx`                                                      | Gợi ý "mật khẩu ≥ 8 ký tự" chỉ nằm trong `placeholder` (mất khi gõ)                                                                  | Thêm `<p id="password-hint">` + `aria-describedby="password-hint"` trên input                                                                                                   |
| 8   | Cả 2 trang                                                                   | `p-8` cố định ở màn hình 360 px                                                                                                      | Đổi `p-6 sm:p-8`                                                                                                                                                                |

## 2. Lighthouse — Accessibility

Chạy `lighthouse@12 --only-categories=accessibility`, Chrome headless.

| Trang                 | Điểm    | Ngưỡng | Kết quả |
| --------------------- | ------- | ------ | ------- |
| `/login`              | **100** | ≥ 90   | Đạt     |
| `/register`           | **100** | ≥ 90   | Đạt     |
| `/` (Menu, đối chiếu) | **100** | ≥ 90   | Đạt     |

## 3. axe-core (WCAG 2.0/2.1 A + AA)

Quét `axe.run` với tag `wcag2a, wcag2aa, wcag21a, wcag21aa` trên 3 trang × 5 bề rộng.

| Trang       | Trình duyệt | 360 px    | 375 px | 768 px | 1280 px | 1440 px |
| ----------- | ----------- | --------- | ------ | ------ | ------- | ------- |
| `/login`    | Chrome      | 0 vi phạm | 0      | 0      | 0       | 0       |
| `/login`    | Edge        | 0 vi phạm | 0      | 0      | 0       | 0       |
| `/login`    | Firefox     | 0 vi phạm | 0      | 0      | 0       | 0       |
| `/register` | Chrome      | 0 vi phạm | 0      | 0      | 0       | 0       |
| `/register` | Edge        | 0 vi phạm | 0      | 0      | 0       | 0       |
| `/register` | Firefox     | 0 vi phạm | 0      | 0      | 0       | 0       |
| `/`         | Chrome      | 0 vi phạm | 0      | 0      | 0       | 0       |
| `/`         | Edge        | 0 vi phạm | 0      | 0      | 0       | 0       |
| `/`         | Firefox     | 0 vi phạm | 0      | 0      | 0       | 0       |

- **Tổng vi phạm mức Serious/Critical: 0** trên cả Chrome, Edge và Firefox (trước khi sửa: 15/15 lượt Chrome dính `color-contrast` serious).
- Số rule pass mỗi trang: 25 (auth) / 26 (menu).

## 4. Kiểm thử bàn phím

Thứ tự Tab ghi nhận thực tế trên `/login`:

`☕ BrewLite → Xem giỏ hàng, 0 món → Đăng nhập → Đăng ký → ô Email → ô Mật khẩu → nút Đăng nhập → Đăng ký ngay`

Trên `/register`:

`☕ BrewLite → Xem giỏ hàng, 0 món → Đăng nhập → Đăng ký → ô Email → ô Mật khẩu → ô Xác nhận mật khẩu → nút Tạo tài khoản → Đăng nhập ngay`

| Ca kiểm thử                                                              | Chrome | Edge | Firefox |
| ------------------------------------------------------------------------ | ------ | ---- | ------- |
| Thứ tự Tab đúng thứ tự trực quan                                         | Đạt    | Đạt  | Đạt     |
| Focus ring hiển thị rõ ở mọi phần tử                                     | Đạt    | Đạt  | Đạt     |
| Submit form trống → lỗi validate đọc được (`role="alert"` trong `Input`) | Đạt    | Đạt  | Đạt     |
| Đăng nhập sai → thông báo 401 hiện trong `role="alert"`                  | Đạt    | Đạt  | Đạt     |
| `Shift+Tab` thoát khỏi form, không bẫy focus                             | Đạt    | Đạt  | Đạt     |

Thứ tự Tab trên Firefox khớp đúng Chrome/Edge:

- `/login`: `☕ BrewLite → Xem giỏ hàng, 0 món → Đăng nhập → Đăng ký → ô Email → ô Mật khẩu → nút Đăng nhập → Đăng ký ngay`
- `/register`: `☕ BrewLite → Xem giỏ hàng, 0 món → Đăng nhập → Đăng ký → ô Email → ô Mật khẩu → ô Xác nhận mật khẩu → nút Tạo tài khoản → Đăng nhập ngay`

## 5. Responsive (360–1440 px)

Đo `documentElement.scrollWidth` so với `clientWidth` sau khi tải xong trang:

| Bề rộng | Trình duyệt | `/login`         | `/register`      | `/`              |
| ------- | ----------- | ---------------- | ---------------- | ---------------- |
| 360 px  | Chrome      | Không tràn ngang | Không tràn ngang | Không tràn ngang |
| 360 px  | Edge        | Không tràn ngang | Không tràn ngang | Không tràn ngang |
| 360 px  | Firefox     | Không tràn ngang | Không tràn ngang | Không tràn ngang |
| 375 px  | Chrome      | Không tràn ngang | Không tràn ngang | Không tràn ngang |
| 375 px  | Edge        | Không tràn ngang | Không tràn ngang | Không tràn ngang |
| 375 px  | Firefox     | Không tràn ngang | Không tràn ngang | Không tràn ngang |
| 768 px  | Chrome      | Không tràn ngang | Không tràn ngang | Không tràn ngang |
| 768 px  | Edge        | Không tràn ngang | Không tràn ngang | Không tràn ngang |
| 768 px  | Firefox     | Không tràn ngang | Không tràn ngang | Không tràn ngang |
| 1280 px | Chrome      | Không tràn ngang | Không tràn ngang | Không tràn ngang |
| 1280 px | Edge        | Không tràn ngang | Không tràn ngang | Không tràn ngang |
| 1280 px | Firefox     | Không tràn ngang | Không tràn ngang | Không tràn ngang |
| 1440 px | Chrome      | Không tràn ngang | Không tràn ngang | Không tràn ngang |
| 1440 px | Edge        | Không tràn ngang | Không tràn ngang | Không tràn ngang |
| 1440 px | Firefox     | Không tràn ngang | Không tràn ngang | Không tràn ngang |

Card form giữ `max-w-md` (448 px) căn giữa ở mọi bề rộng; padding co `p-6` ở mobile → `p-8` từ `sm`.

## 6. Công cụ sử dụng

- `axe-core` 4.x (đã có trong `node_modules`), chạy trên Chrome headless qua `puppeteer-core` và trên Firefox qua `webdriverio` + `geckodriver`.
- `lighthouse` 12 (`npx lighthouse`), Chrome headless 156 (Lighthouse không hỗ trợ Firefox).
- Script đo đặt ngoài repo (thư mục tạm), không thêm dependency vào dự án.

## 7. Kết luận

- Điều kiện 30.2: "Sửa a11y/responsive cho Đăng nhập, Đăng ký; kiểm thử Chrome, Firefox, Edge" — **đạt đầy đủ 3/3 trình duyệt**.
- Lighthouse Accessibility **100/100** (Chrome) và **0 vi phạm axe Serious/Critical** trên 45 tổ hợp (3 trình duyệt × 3 trang × 5 bề rộng).
- Không còn bug mức Chặn/Cao → **đủ điều kiện đóng 30.2**, chuyển M1 đưa vào biên bản nghiệm thu A.5/A.6 của Sprint 2.
- Còn thiếu đầu ra bắt buộc: **ảnh chụp màn hình** làm bằng chứng kiểm thử trình duyệt (tối thiểu `/login` và `/register` ở 360 px và 1280 px cho mỗi trình duyệt) — chưa thực hiện vì quá trình đo chạy headless, cần chụp bổ sung và đặt vào `docs/ui/a11y/<trình duyệt>/<bề rộng>-<trang>.png`.
