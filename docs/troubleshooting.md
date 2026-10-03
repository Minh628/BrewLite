# BrewLite - Hướng Dẫn Kết Nối Database & Xử Lý Sự Cố (ST-18)

## 1. Cấu trúc Chuỗi Kết Nối (`DATABASE_URL`)
File `.env` ở thư mục `backend/` cần cấu hình đúng định dạng:
`DATABASE_URL="postgresql://postgres:postgres@localhost:5432/brewlite_db?schema=public"`

## 2. Bảng Xử Lý Sự Cố Thường Gặp
| Hiện tượng / Báo lỗi | Nguyên nhân | Cách khắc phục |
| :--- | :--- | :--- |
| **`Error: P1001: Can't reach database`** | Server CSDL chưa bật hoặc sai Port | Chạy `docker compose up -d` |
| **`Error: P1000: Authentication failed`** | Sai Username hoặc Password | Kiểm tra lại thông tin trong file `.env` |
| **Xung đột Port 5432 trên Windows** | Máy đã cài sẵn PostgreSQL local | Tắt service Postgres local hoặc đổi port thành 5433 |
