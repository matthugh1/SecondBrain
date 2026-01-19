import { prisma } from '../index'
import type { InboxLog, InboxLogStatus, InboxLogFiledTo } from '@/types'

export async function createInboxLog(tenantId: string, log: InboxLog): Promise<number> {
  const result = await prisma.inboxLog.create({
    data: {
      tenantId,
      originalText: log.original_text,
      filedTo: log.filed_to,
      destinationName: log.destination_name || null,
      destinationUrl: log.destination_url || null,
      confidence: log.confidence || null,
      status: log.status || 'Filed',
      created: log.created ? new Date(log.created) : new Date(),
      notionRecordId: log.notion_record_id || null,
    },
  })
  return result.id
}

export async function getInboxLogById(tenantId: string, id: number): Promise<InboxLog | null> {
  const result = await prisma.inboxLog.findFirst({
    where: {
      id,
      tenantId,
    },
  })
  if (!result) return null
  return {
    id: result.id,
    original_text: result.originalText,
    filed_to: result.filedTo as InboxLogFiledTo,
    destination_name: result.destinationName || undefined,
    destination_url: result.destinationUrl || undefined,
    confidence: result.confidence || undefined,
    status: result.status as InboxLogStatus,
    created: result.created.toISOString(),
    notion_record_id: result.notionRecordId || undefined,
  }
}

export async function getAllInboxLogs(tenantId: string): Promise<InboxLog[]> {
  const results = await prisma.inboxLog.findMany({
    where: { tenantId },
    orderBy: { created: 'desc' },
  })
  return results.map(result => ({
    id: result.id,
    original_text: result.originalText,
    filed_to: result.filedTo as InboxLogFiledTo,
    destination_name: result.destinationName || undefined,
    destination_url: result.destinationUrl || undefined,
    confidence: result.confidence || undefined,
    status: result.status as InboxLogStatus,
    created: result.created.toISOString(),
    notion_record_id: result.notionRecordId || undefined,
  }))
}

export async function getInboxLogsByDateRange(tenantId: string, startDate: string, endDate: string): Promise<InboxLog[]> {
  const results = await prisma.inboxLog.findMany({
    where: {
      tenantId,
      created: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    },
    orderBy: { created: 'desc' },
  })
  return results.map(result => ({
    id: result.id,
    original_text: result.originalText,
    filed_to: result.filedTo as InboxLogFiledTo,
    destination_name: result.destinationName || undefined,
    destination_url: result.destinationUrl || undefined,
    confidence: result.confidence || undefined,
    status: result.status as InboxLogStatus,
    created: result.created.toISOString(),
    notion_record_id: result.notionRecordId || undefined,
  }))
}

export async function getInboxLogsByStatus(tenantId: string, status: InboxLogStatus): Promise<InboxLog[]> {
  const results = await prisma.inboxLog.findMany({
    where: {
      tenantId,
      status,
    },
    orderBy: { created: 'desc' },
  })
  return results.map(result => ({
    id: result.id,
    original_text: result.originalText,
    filed_to: result.filedTo as InboxLogFiledTo,
    destination_name: result.destinationName || undefined,
    destination_url: result.destinationUrl || undefined,
    confidence: result.confidence || undefined,
    status: result.status as InboxLogStatus,
    created: result.created.toISOString(),
    notion_record_id: result.notionRecordId || undefined,
  }))
}

export async function updateInboxLog(tenantId: string, id: number, updates: Partial<InboxLog>): Promise<void> {
  const data: any = {}
  
  if (updates.filed_to !== undefined) data.filedTo = updates.filed_to
  if (updates.destination_name !== undefined) data.destinationName = updates.destination_name || null
  if (updates.destination_url !== undefined) data.destinationUrl = updates.destination_url || null
  if (updates.confidence !== undefined) data.confidence = updates.confidence || null
  if (updates.status !== undefined) data.status = updates.status
  if (updates.notion_record_id !== undefined) data.notionRecordId = updates.notion_record_id || null
  
  await prisma.inboxLog.updateMany({
    where: {
      id,
      tenantId,
    },
    data,
  })
}

export async function deleteInboxLog(tenantId: string, id: number): Promise<void> {
  await prisma.inboxLog.deleteMany({
    where: {
      id,
      tenantId,
    },
  })
}

export async function deleteInboxLogsByStatus(tenantId: string, status: InboxLogStatus): Promise<number> {
  const result = await prisma.inboxLog.deleteMany({
    where: {
      tenantId,
      status,
    },
  })
  return result.count
}

/**
 * Get logIds for multiple items in a database
 * Returns a map of itemId -> logId
 */
export async function getLogIdsForItems(
  tenantId: string,
  database: string,
  itemIds: number[]
): Promise<Record<number, number>> {
  if (itemIds.length === 0) {
    return {}
  }

  const results = await prisma.inboxLog.findMany({
    where: {
      tenantId,
      filedTo: database,
      notionRecordId: {
        in: itemIds.map(id => id.toString()),
      },
    },
    select: {
      id: true,
      notionRecordId: true,
    },
  })

  const logIdMap: Record<number, number> = {}
  for (const log of results) {
    if (log.notionRecordId) {
      const itemId = parseInt(log.notionRecordId)
      if (!isNaN(itemId)) {
        logIdMap[itemId] = log.id
      }
    }
  }

  return logIdMap
}
