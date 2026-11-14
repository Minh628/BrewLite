# Video demo end-to-end BrewLite (T5.4)

- **Video Desktop (`1280×720`)**: [`docs/evidence/brewlite-demo-desktop.mp4`](./evidence/brewlite-demo-desktop.mp4)
- **Video Mobile (`375×667`)**: [`docs/evidence/brewlite-demo-mobile.mp4`](./evidence/brewlite-demo-mobile.mp4)
- **Thời lượng khuyến nghị:** 5–8 phút
- **Kịch bản chi tiết:** [`docs/demo-script.md`](./demo-script.md)

## Luồng cần quay

1. Mở production URL (HTTPS) hoặc `docker compose up` ở local; hiển thị `GET /health` → 200.
2. **Menu** (viewport mobile 375 × 667) → tìm kiếm / lọc theo danh mục.
3. **Chi tiết sản phẩm** → chọn size, topping, số lượng; giá cập nhật theo lựa chọn.
4. **Giỏ hàng** → sửa số lượng, xóa món, tổng tiền.
5. **Đăng ký / đăng nhập** (`customer@brewlite.vn` / `Password123`).
6. **Thanh toán VNPay** → nhánh bị hủy/thất bại (`vnp_ResponseCode=24` → `PAYMENT_FAILED`, thử thanh toán lại) và nhánh thành công (`vnp_ResponseCode=00` → `PAID`).
7. **Xác nhận đơn + lịch sử đơn**; trạng thái `PAID`.
8. Quầy (barista) đổi trạng thái đơn theo state machine.
9. Chạy test: `npm test`, E2E Playwright (`npm run test:e2e --workspace @brewlite/frontend`).
10. Hiển thị pipeline CI/CD xanh trên GitHub Actions.

## Bằng chứng kèm theo

- E2E: ảnh chụp và video Playwright trong `frontend/test-results/` và `frontend/playwright-report/` (CI lưu thành artifact `playwright-checkout-<run_id>`).
- Screenshot CI xanh / CI đỏ chặn merge: lưu vào `docs/evidence/` (TODO — chụp từ tab Actions / Pull request).
