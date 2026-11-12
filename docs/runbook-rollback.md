# Runbook Rollback BrewLite (T5.3 / T5.4)

- **Phiên bản:** 1.0
- **Phạm vi:** quy trình khôi phục production khi bản phát hành mới lỗi.
- **Tài liệu liên quan:** [`docs/deployment.md`](./deployment.md) (§7 Rollback) · [`.github/workflows/cd.yml`](../.github/workflows/cd.yml)

> Nguyên tắc: **deploy lại bản trước**, không sửa nóng code trên production. Ghi lại mọi lần rollback (thời điểm, người làm, lý do, SHA) vào mục "Nhật ký rollback" cuối file.

## 1. Khi nào phải rollback

| Dấu hiệu                                                         | Mức độ       | Hành động                        |
| ---------------------------------------------------------------- | ------------ | -------------------------------- |
| Job `Smoke test GET /health` trong CD đỏ                         | Nghiêm trọng | Rollback ngay (mục 2)            |
| `GET /health` khác 200 hoặc tỷ lệ 5xx tăng sau deploy            | Nghiêm trọng | Rollback ngay (mục 2)            |
| Luồng đăng nhập / đặt đơn / thanh toán mock hỏng trên production | Nghiêm trọng | Rollback ngay (mục 2)            |
| Lỗi giao diện nhỏ, không chặn luồng đặt đơn                      | Thấp         | Sửa tiếp bằng PR, không rollback |

## 2. Rollback API (Render + image GHCR)

Mỗi lần phát hành CD đẩy image gắn tag **commit SHA ngắn** và semver lên `ghcr.io/<org>/brewlite-api`. Do đó luôn có bản trước để quay lại.

1. Xác định SHA/tag bản ổn định gần nhất: tab **Actions → BrewLite CD** (lần chạy xanh trước đó), hoặc **Packages** trên GitHub.
2. Chọn một trong hai cách:
   - **Nhanh nhất:** Render → service API → **Deploys** → chọn bản trước → **Redeploy**.
   - **Qua pipeline:** Actions → **BrewLite CD** → **Run workflow** trên tag/commit ổn định, bật `deploy = true`.
3. Kiểm tra: `curl -fsS https://<api>/health` trả `200`.
4. Chạy lại smoke test thủ công: đăng nhập → xem menu → tạo đơn → thanh toán mock (thẻ `4242 4242 4242 4242`).

## 3. Rollback Web (Vercel)

Vercel → **Deployments** → chọn bản trước → **Promote to Production** (< 2 phút). Xác nhận `NEXT_PUBLIC_API_URL` của bản đó vẫn trỏ đúng API production.

## 4. Rollback migration CSDL

Migration Prisma đã áp dụng **không được sửa hoặc xóa**.

1. Dừng deploy mới; rollback API về image trước (mục 2) nếu schema cũ vẫn tương thích.
2. Nếu schema đã thay đổi không tương thích: tạo migration mới đảo ngược thay đổi
   (`npx prisma migrate dev --name revert_<mô_tả>` ở môi trường dev, review, rồi deploy qua pipeline).
3. Không chạy `prisma migrate reset` trên production (xóa toàn bộ dữ liệu).
4. Nếu dữ liệu hỏng: khôi phục từ bản sao lưu (`pg_dump` định kỳ, hoặc PITR của Neon nếu gói hỗ trợ).

## 5. Lộ secret

1. Xoay `JWT_SECRET` (mọi token cũ mất hiệu lực — chấp nhận được) và mật khẩu DB.
2. Cập nhật biến môi trường trên platform, deploy lại, chạy smoke test.
3. Xóa secret khỏi lịch sử nếu lỡ commit và báo cả nhóm.

## 6. Sau rollback

- Tạo issue mô tả nguyên nhân gốc, gắn SHA lỗi.
- Sửa bằng PR mới, CI xanh mới được phát hành lại.
- Ghi vào nhật ký bên dưới.

## Nhật ký rollback

| Ngày | Người thực hiện | SHA lỗi → SHA khôi phục | Nguyên nhân | Thời gian khôi phục |
| ---- | --------------- | ----------------------- | ----------- | ------------------- |
| —    | —               | —                       | Chưa có     | —                   |
