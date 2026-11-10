# Pull Request

> Đặt tiêu đề theo mẫu: **`[T<x.y>] <mô tả ngắn>`** (ví dụ `[T5.3] Thêm CD pipeline GHCR`)
> hoặc **`<type>(<scope>): <mô tả>`** cho thay đổi không gắn Task (Conventional Commits).

## 1. Liên kết

- Task / Sub-task: <!-- T3.1 / T5.3 / PB-24 … -->
- Issue: <!-- #12 hoặc "—" -->
- Link tạo phẩm: <!-- docs/…, URL prod, screenshot … -->

## 2. Mô tả thay đổi

<!-- Ngắn gọn: làm gì, vì sao. Nêu rõ phạm vi ảnh hưởng nếu là thay đổi kiến trúc/schema/API. -->

## 3. Loại thay đổi

- [ ] `feat` — tính năng mới
- [ ] `fix` — sửa lỗi
- [ ] `docs` — tài liệu / sơ đồ
- [ ] `refactor` — tái cấu trúc, không đổi hành vi
- [ ] `test` — chỉ thêm/sửa test
- [ ] `chore` / `ci` / `build` — hạ tầng, CI, dependency
- [ ] **Breaking change** — cần ghi rõ ở mục 6

## 4. Checklist tác giả

- [ ] `npm run lint` pass (cả workspace liên quan)
- [ ] `npm run build` pass
- [ ] `npm test` pass; có test mới cho hành vi mới
- [ ] Đã cập nhật tài liệu liên quan (`docs/`, `README.md`, Swagger nếu đổi API)
- [ ] Không commit secret/`.env` thật, không log dữ liệu nhạy cảm
- [ ] Không có `console.log` / `debugger` còn sót
- [ ] Commit message theo Conventional Commits

> Nếu thay đổi **schema Prisma**: đính kèm tên migration mới và xác nhận `npx prisma migrate status` báo _up to date_.
> Nếu thay đổi **API**: cập nhật `docs/api-contract.md` và ghi mã lỗi mới (nếu có).

## 5. Kiểm chứng

<!-- Lệnh/khác chứng minh thay đổi hoạt động. Ví dụ: -->

```
npm test --workspace @brewlite/backend
# → Test Suites: 23 passed, Tests: 275 passed

curl -X POST http://localhost:3001/orders ...
# → 201 { orderId: 1001, total: 165600 }
```

<!-- Dán screenshot/ảnh nếu là UI hoặc là sơ đồ. -->

## 6. Breaking change & ghi chú cho reviewer

<!-- Ví dụ: "Đổi layout apps/* → frontend/backend" hoặc "—" -->

- Ảnh hưởng đến Task khác: <!-- ví dụ: cần M1 hoàn thành stock trước khi merge -->
- Reviewer chính: <!-- @username -->

---

<details>
<summary>Gợi ý chọn reviewer</summary>

| Loại thay đổi                 | Reviewer gợi ý |
| ----------------------------- | -------------- |
| Requirements / Traceability   | Thanh Tùng     |
| Diagram / Backend đơn-payment | Kiện Minh      |
| Frontend / E2E                | Hải Lý         |
| Architecture / CI-CD / Deploy | Hoàng Tịnh     |
| Backend / QA / coverage       | Trung Hiếu     |

</details>
