import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Prisma Client with connection pooling configuration for Vercel serverless
 * 
 * Connection Pool Settings:
 * - connection_limit: Maximum number of connections in pool (10 for serverless)
 * - pool_timeout: Maximum time to wait for connection (20 seconds)
 * 
 * These settings are optimized for Vercel's serverless environment where:
 * - Each function instance should use a small connection pool
 * - Connections are shared across requests in the same instance
 * - Pool timeout prevents hanging on connection acquisition
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // Connection pool configuration is set via DATABASE_URL query parameters:
    // ?connection_limit=10&pool_timeout=20
    // Prisma will use these automatically if present in the connection string
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Add Prisma middleware to track query metrics
prisma.$use(async (params, next) => {
  const start = Date.now()
  try {
    const result = await next(params)
    const duration = Date.now() - start
    const { recordDBQuery } = await import('@/lib/metrics')
    recordDBQuery(`${params.model}.${params.action}`, duration, true)
    return result
  } catch (error) {
    const duration = Date.now() - start
    const { recordDBQuery } = await import('@/lib/metrics')
    recordDBQuery(`${params.model}.${params.action}`, duration, false)
    throw error
  }
})

// Log connection pool info in development
if (process.env.NODE_ENV === 'development') {
  const dbUrl = process.env.DATABASE_URL || process.env.PRISMA_DATABASE_URL
  if (dbUrl) {
    const hasPoolParams = dbUrl.includes('connection_limit') || dbUrl.includes('pool_timeout')
    if (!hasPoolParams) {
      console.warn('⚠️  DATABASE_URL does not include connection pool parameters.')
      console.warn('   Recommended: Add ?connection_limit=10&pool_timeout=20 to DATABASE_URL')
      console.warn('   This helps manage connections efficiently in serverless environments.')
    } else {
      console.log('✅ Connection pool parameters detected in DATABASE_URL')
    }
  }
}

// Legacy SQLite support removed - app now uses Prisma with PostgreSQL
// If you need SQLite functionality, migrate to Prisma models instead
export function getDatabase(): never {
  throw new Error('getDatabase() is no longer supported. Please use Prisma client instead.')
}
