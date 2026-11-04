#!/bin/sh
set -e

echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Running database seed (idempotent)..."
npx prisma db seed

echo "Starting application..."
exec node dist/main.js
