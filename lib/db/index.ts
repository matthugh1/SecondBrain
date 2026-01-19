import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Legacy SQLite support removed - app now uses Prisma with PostgreSQL
// If you need SQLite functionality, migrate to Prisma models instead
export function getDatabase(): never {
  throw new Error('getDatabase() is no longer supported. Please use Prisma client instead.')
}
