import { prisma } from '../index'
import type { Category } from '@/types'

export type SyncDirection = 'to_calendar' | 'from_calendar' | 'bidirectional'

export interface CalendarSync {
  id: number
  tenantId: string
  integrationId: number
  itemType: Category
  itemId: number
  calendarEventId: string
  syncDirection: SyncDirection
  lastSyncedAt: Date
  createdAt: Date
  updatedAt: Date
}

/**
 * Create or update calendar sync record
 */
export async function upsertCalendarSync(
  tenantId: string,
  integrationId: number,
  itemType: Category,
  itemId: number,
  calendarEventId: string,
  syncDirection: SyncDirection = 'bidirectional'
): Promise<number> {
  const result = await prisma.calendarSync.upsert({
    where: {
      tenantId_integrationId_itemType_itemId: {
        tenantId,
        integrationId,
        itemType,
        itemId,
      },
    },
    create: {
      tenantId,
      integrationId,
      itemType,
      itemId,
      calendarEventId,
      syncDirection,
    },
    update: {
      calendarEventId,
      syncDirection,
      lastSyncedAt: new Date(),
      updatedAt: new Date(),
    },
  })
  return result.id
}

/**
 * Get sync record by item
 */
export async function getSyncByItem(
  tenantId: string,
  integrationId: number,
  itemType: Category,
  itemId: number
): Promise<CalendarSync | null> {
  const sync = await prisma.calendarSync.findUnique({
    where: {
      tenantId_integrationId_itemType_itemId: {
        tenantId,
        integrationId,
        itemType,
        itemId,
      },
    },
  })

  if (!sync) return null

  return {
    id: sync.id,
    tenantId: sync.tenantId,
    integrationId: sync.integrationId,
    itemType: sync.itemType as Category,
    itemId: sync.itemId,
    calendarEventId: sync.calendarEventId,
    syncDirection: sync.syncDirection as SyncDirection,
    lastSyncedAt: sync.lastSyncedAt,
    createdAt: sync.createdAt,
    updatedAt: sync.updatedAt,
  }
}

/**
 * Get sync record by calendar event ID
 */
export async function getSyncByCalendarEventId(
  tenantId: string,
  integrationId: number,
  calendarEventId: string
): Promise<CalendarSync | null> {
  const sync = await prisma.calendarSync.findFirst({
    where: {
      tenantId,
      integrationId,
      calendarEventId,
    },
  })

  if (!sync) return null

  return {
    id: sync.id,
    tenantId: sync.tenantId,
    integrationId: sync.integrationId,
    itemType: sync.itemType as Category,
    itemId: sync.itemId,
    calendarEventId: sync.calendarEventId,
    syncDirection: sync.syncDirection as SyncDirection,
    lastSyncedAt: sync.lastSyncedAt,
    createdAt: sync.createdAt,
    updatedAt: sync.updatedAt,
  }
}

/**
 * Delete sync record
 */
export async function deleteCalendarSync(
  tenantId: string,
  integrationId: number,
  itemType: Category,
  itemId: number
): Promise<void> {
  await prisma.calendarSync.deleteMany({
    where: {
      tenantId,
      integrationId,
      itemType,
      itemId,
    },
  })
}
