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
├─ frontend/              # Next.js UI
├─ backend/               # NestJS REST API
│  ├─ prisma/              # schema và seed
│  └─ src/
├─ docker-compose.yml      # PostgreSQL + backend + frontend
├─ package.json            # scripts dùng chung
└─ .env.example
```

## Chạy local

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

## Chạy toàn bộ bằng Docker

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
