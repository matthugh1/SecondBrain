import { prisma } from '../index'

export interface AuditLogQuery {
  tenantId: string
  userId?: string
  actionType?: string
  resource?: string
  resourceId?: number
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}

export interface AuditLogResult {
  id: number
  tenantId: string
  userId: string | null
  actionType: string
  resource: string
  resourceId: number | null
  oldData: any | null
  newData: any | null
  timestamp: Date
  requestId: string | null
  ipAddress: string | null
  userAgent: string | null
  details: any | null
}

/**
 * Search audit logs with filters
 */
export async function searchAuditLogs(query: AuditLogQuery): Promise<AuditLogResult[]> {
  const where: any = {
    tenantId: query.tenantId,
  }

  if (query.userId) {
    where.userId = query.userId
  }

  if (query.actionType) {
    where.actionType = query.actionType
  }

  if (query.resource) {
    where.itemType = query.resource
  }

  if (query.resourceId !== undefined) {
    where.itemId = query.resourceId
  }

  if (query.startDate || query.endDate) {
    where.timestamp = {}
    if (query.startDate) {
      where.timestamp.gte = query.startDate
    }
    if (query.endDate) {
      where.timestamp.lte = query.endDate
    }
  }

  const logs = await prisma.actionHistory.findMany({
    where,
    orderBy: { timestamp: 'desc' },
    take: query.limit || 100,
    skip: query.offset || 0,
  })

  return logs.map(log => ({
    id: log.id,
    tenantId: log.tenantId,
    userId: log.userId,
    actionType: log.actionType,
    resource: log.itemType,
    resourceId: log.itemId,
    oldData: log.oldData ? JSON.parse(log.oldData) : null,
    newData: log.newData ? JSON.parse(log.newData) : null,
    timestamp: log.timestamp,
    requestId: log.requestId,
    ipAddress: log.ipAddress,
    userAgent: log.userAgent,
    details: log.details ? JSON.parse(log.details) : null,
  }))
}

/**
 * Get audit log by ID
 */
export async function getAuditLogById(tenantId: string, id: number): Promise<AuditLogResult | null> {
  const log = await prisma.actionHistory.findFirst({
    where: {
      id,
      tenantId,
    },
  })

  if (!log) return null

  return {
    id: log.id,
    tenantId: log.tenantId,
    userId: log.userId,
    actionType: log.actionType,
    resource: log.itemType,
    resourceId: log.itemId,
    oldData: log.oldData ? JSON.parse(log.oldData) : null,
    newData: log.newData ? JSON.parse(log.newData) : null,
    timestamp: log.timestamp,
    requestId: log.requestId,
    ipAddress: log.ipAddress,
    userAgent: log.userAgent,
    details: log.details ? JSON.parse(log.details) : null,
  }
}

/**
 * Export audit logs (for compliance - 7 year retention)
 */
export async function exportAuditLogs(
  tenantId: string,
  startDate: Date,
  endDate: Date
): Promise<AuditLogResult[]> {
  return searchAuditLogs({
    tenantId,
    startDate,
    endDate,
    limit: 10000, // Large limit for export
  })
}

/**
 * Get audit log statistics
 */
export async function getAuditLogStats(
  tenantId: string,
  startDate?: Date,
  endDate?: Date
): Promise<{
  total: number
  byAction: Record<string, number>
  byResource: Record<string, number>
  byUser: Record<string, number>
}> {
  const where: any = {
    tenantId,
  }

  if (startDate || endDate) {
    where.timestamp = {}
    if (startDate) where.timestamp.gte = startDate
    if (endDate) where.timestamp.lte = endDate
  }

  const logs = await prisma.actionHistory.findMany({
    where,
    select: {
      actionType: true,
      itemType: true,
      userId: true,
    },
  })

  const stats = {
    total: logs.length,
    byAction: {} as Record<string, number>,
    byResource: {} as Record<string, number>,
    byUser: {} as Record<string, number>,
  }

  for (const log of logs) {
    stats.byAction[log.actionType] = (stats.byAction[log.actionType] || 0) + 1
    stats.byResource[log.itemType] = (stats.byResource[log.itemType] || 0) + 1
    if (log.userId) {
      stats.byUser[log.userId] = (stats.byUser[log.userId] || 0) + 1
    }
  }

  return stats
}
