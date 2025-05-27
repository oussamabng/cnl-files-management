#!/bin/sh

echo "⏳ Waiting for the database to be ready..."
until nc -z db 5432; do
  sleep 1
done

echo "✅ Database is ready. Running Prisma migration..."
pnpm prisma migrate deploy

echo "🚀 Starting the Next.js server..."
pnpm start
