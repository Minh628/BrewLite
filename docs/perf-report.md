# Báo cáo hiệu năng API — Sprint 2 (PB-29)

**Ngày đo:** 24/10/2026 · **Người đo:** M1 · **Kịch bản:** `scripts/perf/products.js`, `scripts/perf/orders.js` (autocannon 8)

## Kết luận

| Endpoint                            | Tải        | p95         | Ngưỡng   | Kết quả |
| :---------------------------------- | :--------- | :---------- | :------- | :------ |
| `GET /products`                     | 10 kết nối | **7,2 ms**  | < 500 ms | ✅ Đạt  |
| `GET /products?category=1&q=ca phe` | 10 kết nối | **11,9 ms** | < 500 ms | ✅ Đạt  |
| `POST /orders` (có Bearer token)    | 10 kết nối | **16,0 ms** | < 500 ms | ✅ Đạt  |
| `GET /products`                     | 50 kết nối | **62,4 ms** | < 500 ms | ✅ Đạt  |
| `GET /products?category=1&q=ca phe` | 50 kết nối | **72,1 ms** | < 500 ms | ✅ Đạt  |
| `POST /orders` (có Bearer token)    | 50 kết nối | **71,9 ms** | < 500 ms | ✅ Đạt  |

p95 của cả GET /products và POST /orders thấp hơn ngưỡng 500 ms hơn 6 lần ngay ở tải 50 kết nối đồng thời. Không có request lỗi, timeout hay mã khác 2xx. **Chưa cần tối ưu trong Sprint 2.**

## Môi trường đo

- **Máy:** laptop dev, Intel Core i7-13620H (16 luồng), RAM 16 GB, Linux. Backend, PostgreSQL và autocannon chạy cùng một máy, nên số liệu không gồm độ trễ mạng.
- **Backend:** bản build (`tsc`) chạy `node`, `NODE_ENV=production`, một tiến trình; helmet, CORS, ValidationPipe, JwtAuthGuard và log mỗi request (PB-23) đều bật như khi chạy thật. `THROTTLE_LIMIT=1000000` để rate-limit không chặn tải đo.
- **Database:** PostgreSQL 16 (Docker `postgres:16-alpine`), database riêng tạo cho lần đo, áp đủ migration và `prisma/seed.ts`: 3 danh mục, 4 món, 5 topping, 2 tài khoản test.
- **Dữ liệu gửi `POST /orders`:** 2 dòng — Cappuccino L × 2 kèm 2 topping, Trà đào M × 1 — tổng do server tính 178.000đ. Mỗi request tạo một đơn thật (Order + 2 OrderItem + 2 OrderItemTopping trong một transaction); sau lần đo, DB có 17.152 đơn, tất cả đúng 178.000đ.
- **Cách tính p95:** script ghi thời gian phản hồi của từng request rồi lấy phân vị 95 theo nearest-rank, vì autocannon chỉ báo sẵn p90/p97,5/p99.

## Số liệu chi tiết

### Tải 10 kết nối, 20 giây mỗi kịch bản

| Endpoint                            | Số request | req/s | p50     | p95     | p99     | max     | Mã trạng thái |
| :---------------------------------- | ---------: | ----: | :------ | :------ | :------ | :------ | :------------ |
| `GET /products`                     |     45.175 | 2.259 | 4,1 ms  | 7,2 ms  | 10,6 ms | 28,9 ms | 200 × 45.175  |
| `GET /products?category=1&q=ca phe` |     22.885 | 1.144 | 8,8 ms  | 11,9 ms | 16,6 ms | 26,6 ms | 200 × 22.885  |
| `POST /orders`                      |     17.142 |   857 | 11,3 ms | 16,0 ms | 18,8 ms | 35,5 ms | 201 × 17.142  |

### Tải 50 kết nối, 15 giây mỗi kịch bản

| Endpoint                            | Số request | req/s | p50     | p95     | p99     | max      | Mã trạng thái |
| :---------------------------------- | ---------: | ----: | :------ | :------ | :------ | :------- | :------------ |
| `GET /products`                     |     14.648 |   977 | 49,6 ms | 62,4 ms | 70,9 ms | 131,7 ms | 200 × 14.648  |
| `GET /products?category=1&q=ca phe` |     12.543 |   836 | 58,3 ms | 72,1 ms | 83,5 ms | 876,3 ms | 200 × 12.543  |
| `POST /orders`                      |     14.381 |   959 | 49,6 ms | 71,9 ms | 89,7 ms | 132,6 ms | 201 × 14.381  |

Ở 50 kết nối, thông lượng không tăng so với 10 kết nối mà độ trễ tăng: một tiến trình Node đã bão hòa, request phải xếp hàng. p95 vẫn chỉ ~70 ms.

### Ghi chú khi đọc số liệu

- **Chênh lệch giữa các lần chạy lớn hơn chênh lệch giữa các endpoint.** Đo riêng lại 8 giây mỗi biến thể ngay sau đó: `/products` 12,8 ms, `?category=1` 10,8 ms, `?q=ca phe` 12,0 ms, `?category=1&q=ca phe` 13,2 ms (p95). Nghĩa là lọc danh mục và tìm không dấu (PB-18) không làm chậm đáng kể; chênh lệch 7,2 ms / 11,9 ms ở bảng trên nằm trong dao động giữa các lần chạy trên máy dev.
- **max 876 ms** ở kịch bản lọc 50 kết nối là một request đơn lẻ (p99 vẫn 83 ms); chưa xác định nguyên nhân, không lặp lại ở các lần đo khác.
- **Rate-limit:** khi chạy với cấu hình mặc định (`THROTTLE_LIMIT=100`), chỉ 100 request đầu trả 200, phần còn lại trả 429; script báo "không đạt" và in hướng dẫn tăng `THROTTLE_LIMIT`. Đây là hành vi đúng của PB-22, không phải lỗi hiệu năng.

## Cách chạy lại

```bash
# 1. Database riêng cho lần đo (POST /orders tạo đơn thật)
export DATABASE_URL=postgresql://brewlite:brewlite@localhost:5432/brewlite_perf?schema=public
npx prisma migrate deploy --schema backend/prisma/schema.prisma
npm run db:seed

# 2. Backend production, tắt chặn rate-limit cho lần đo
#    Lưu ý: backend/tsconfig.tsbuildinfo đang được commit nên `nest build` có thể bỏ qua file mới và
#    dist/ thiếu module (lỗi "Cannot find module"); khi đó xóa file đó rồi build lại.
npm run build --workspace @brewlite/backend
THROTTLE_LIMIT=1000000 NODE_ENV=production npm run start --workspace @brewlite/backend

# 3. Đo (terminal khác)
npm run perf:products
npm run perf:orders
PERF_CONNECTIONS=50 PERF_DURATION=15 npm run perf:orders   # tải cao hơn
```

## Đề xuất khi dữ liệu lớn hơn (chưa cần làm)

- **Tìm không dấu:** hiện bỏ dấu trong Node trên các món đã lọc danh mục — phù hợp menu vài chục món. Nếu menu lên hàng nghìn món, chuyển sang extension `unaccent` + chỉ mục trigram (`pg_trgm`) để lọc trong PostgreSQL.
- **GET /products:** menu ít thay đổi, có thể cache trong bộ nhớ vài giây hoặc thêm `Cache-Control` nếu cần thêm thông lượng.
- **Thông lượng:** khi cần vượt ~1.000 req/s, chạy nhiều tiến trình (cluster/PM2 hoặc nhiều container) thay vì tối ưu từng query.
