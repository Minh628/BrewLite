# BrewLite

Ứng dụng đặt cà phê không tiền mặt theo đề bài môn Công nghệ Phần mềm.

## Stack

- Frontend: Next.js App Router, React, TypeScript, Tailwind CSS, TanStack Query, Zustand
- Backend: NestJS REST, Prisma ORM, PostgreSQL, class-validator, Passport JWT, bcrypt
- Thanh toán: Mock Payment Service (ví/thẻ)
- DevOps: Docker Compose, npm workspaces

## Cấu trúc

```text
BrewLite/
├─ frontend/                  # Next.js UI
├─ backend/                   # NestJS REST API
│  ├─ prisma/                  # schema và seed
│  └─ src/
├─ docker-compose.yml          # production: PostgreSQL + backend + frontend
├─ docker-compose.dev.yml      # dev: PostgreSQL 16 với credentials từ Neon.tech
├─ .env.dev                    # credentials dev (git-ignored)
├─ package.json                # scripts dùng chung
└─ .env.example
```

## Chạy local (không Docker)

Yêu cầu: Node.js 20+, npm 10+, Docker Desktop.

```powershell
Copy-Item .env.example .env
npm install
npm run dev:db
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Health check: http://localhost:3001/health
- Menu: http://localhost:3001/products

## Chạy bằng Docker (dev)

Yêu cầu: Docker Desktop, file `.env.dev` (tạo từ `.env.example`).

```bash
# Lần đầu: tạo file env
cp .env.example .env.dev
# Điền credentials vào .env.dev

docker compose --env-file .env.dev -f docker-compose.dev.yml up --build
```

PostgreSQL dev chạy trên `localhost:5433` (tránh xung đột với port 5432 local).

## Chạy bằng Docker (production)

```powershell
Copy-Item .env.example .env
docker compose up --build
```


## Lộ trình API MVP

- `GET /health`
- `GET /products`
- `GET /products/:id`
- `POST /auth/register`
- `POST /auth/login`
- `POST /orders`
- `POST /payments` với header `Idempotency-Key`
- `GET /orders/me`

## Lệnh hữu ích

```powershell
npm run build
npm run lint
npm run db:migrate
npm run db:seed
npm run docker:down
```
