import { prisma } from '../index'

export interface QueryHistoryEntry {
  id: number
  tenantId: string
  query: string
  resultCount: number
  createdAt: Date
}

/**
 * Save a query to history
 */
export async function saveQueryHistory(
  tenantId: string,
  query: string,
  resultCount: number
): Promise<void> {
  // Keep only last 50 queries per tenant
  const existingCount = await prisma.queryHistory.count({
    where: { tenantId },
  })

  if (existingCount >= 50) {
    // Delete oldest entries
    const oldestEntries = await prisma.queryHistory.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
      take: existingCount - 49, // Keep 49, add 1 new = 50 total
    })

    await prisma.queryHistory.deleteMany({
      where: {
        id: { in: oldestEntries.map(e => e.id) },
      },
    })
  }

  await prisma.queryHistory.create({
    data: {
      tenantId,
      query,
      resultCount,
    },
  })
}

/**
 * Get recent query history
 */
export async function getQueryHistory(
  tenantId: string,
  limit: number = 10
): Promise<QueryHistoryEntry[]> {
  const entries = await prisma.queryHistory.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  return entries.map(entry => ({
    id: entry.id,
    tenantId: entry.tenantId,
    query: entry.query,
    resultCount: entry.resultCount,
    createdAt: entry.createdAt,
  }))
}

/**
 * Clear query history for a tenant
 */
export async function clearQueryHistory(tenantId: string): Promise<void> {
  await prisma.queryHistory.deleteMany({
    where: { tenantId },
  })
}
