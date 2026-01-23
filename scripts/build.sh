#!/bin/bash
set -e

echo "Generating Prisma Client..."
npx prisma generate

echo "Pushing database schema..."
npx prisma db push --skip-generate --accept-data-loss || {
  echo "Warning: Database push failed, continuing with build..."
}

echo "Building Next.js application..."
next build
