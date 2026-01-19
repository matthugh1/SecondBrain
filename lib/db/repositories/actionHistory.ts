import { prisma } from '../index'

export type ActionType = 'create' | 'update' | 'delete' | 'archive' | 'unarchive' | 'bulk_delete' | 'bulk_archive' | 'bulk_update' | 'fix' | 'bulk_unarchive'

export interface ActionHistory {
  id?: number
  tenant_id?: string
  action_type: ActionType
  item_type: string
  item_id?: number | null
  old_data?: string | null
  new_data?: string | null
  timestamp?: string
  undone?: number
}

export async function createActionHistory(tenantId: string, action: ActionHistory): Promise<number> {
  const result = await prisma.actionHistory.create({
    data: {
      tenantId,
      actionType: action.action_type,
      itemType: action.item_type,
      itemId: action.item_id || null,
      oldData: action.old_data || null,
      newData: action.new_data || null,
      undone: action.undone || 0,
    },
  })
  return result.id
}

export async function getActionHistoryById(tenantId: string, id: number): Promise<ActionHistory | null> {
  const row = await prisma.actionHistory.findFirst({
    where: {
      tenantId,
      id,
    },
  })
  if (!row) return null
  return {
    id: row.id,
    tenant_id: row.tenantId,
    action_type: row.actionType as ActionType,
    item_type: row.itemType,
    item_id: row.itemId || null,
    old_data: row.oldData || null,
    new_data: row.newData || null,
    timestamp: row.timestamp.toISOString(),
    undone: row.undone,
  }
}

export async function getRecentActions(tenantId: string, limit: number = 50): Promise<ActionHistory[]> {
  const rows = await prisma.actionHistory.findMany({
    where: {
      tenantId,
      undone: 0,
    },
    orderBy: { timestamp: 'desc' },
    take: limit,
  })
  return rows.map(row => ({
    id: row.id,
    tenant_id: row.tenantId,
    action_type: row.actionType as ActionType,
    item_type: row.itemType,
    item_id: row.itemId || null,
    old_data: row.oldData || null,
    new_data: row.newData || null,
    timestamp: row.timestamp.toISOString(),
    undone: row.undone,
  }))
}

export async function getLastUndoneAction(tenantId: string): Promise<ActionHistory | null> {
  const row = await prisma.actionHistory.findFirst({
    where: {
      tenantId,
      undone: 0,
    },
    orderBy: { timestamp: 'desc' },
  })
  if (!row) return null
  return {
    id: row.id,
    tenant_id: row.tenantId,
    action_type: row.actionType as ActionType,
    item_type: row.itemType,
    item_id: row.itemId || null,
    old_data: row.oldData || null,
    new_data: row.newData || null,
    timestamp: row.timestamp.toISOString(),
    undone: row.undone,
  }
}

export async function markActionAsUndone(tenantId: string, id: number): Promise<void> {
  await prisma.actionHistory.updateMany({
    where: {
      tenantId,
      id,
    },
    data: {
      undone: 1,
    },
  })
}

export async function getUndoneActions(tenantId: string): Promise<ActionHistory[]> {
  const rows = await prisma.actionHistory.findMany({
    where: {
      tenantId,
      undone: 1,
    },
    orderBy: { timestamp: 'desc' },
  })
  return rows.map(row => ({
    id: row.id,
    tenant_id: row.tenantId,
    action_type: row.actionType as ActionType,
    item_type: row.itemType,
    item_id: row.itemId || null,
    old_data: row.oldData || null,
    new_data: row.newData || null,
    timestamp: row.timestamp.toISOString(),
    undone: row.undone,
  }))
}

export async function markActionAsRedone(tenantId: string, id: number): Promise<void> {
  await prisma.actionHistory.updateMany({
    where: {
      tenantId,
      id,
    },
    data: {
      undone: 0,
    },
  })
}

export async function getLastRedoneAction(tenantId: string): Promise<ActionHistory | null> {
  const row = await prisma.actionHistory.findFirst({
    where: {
      tenantId,
      undone: 1,
    },
    orderBy: { timestamp: 'desc' },
  })
  if (!row) return null
  return {
    id: row.id,
    tenant_id: row.tenantId,
    action_type: row.actionType as ActionType,
    item_type: row.itemType,
    item_id: row.itemId || null,
    old_data: row.oldData || null,
    new_data: row.newData || null,
    timestamp: row.timestamp.toISOString(),
    undone: row.undone,
  }
}

export async function clearOldHistory(tenantId: string, keepLast: number = 100): Promise<void> {
  // Get the IDs to keep
  const keepIds = await prisma.actionHistory.findMany({
    where: { tenantId },
    orderBy: { timestamp: 'desc' },
    take: keepLast,
    select: { id: true },
  })
  
  const keepIdSet = new Set(keepIds.map(r => r.id))
  
  // Delete all others
  await prisma.actionHistory.deleteMany({
    where: {
      tenantId,
      id: {
        notIn: Array.from(keepIdSet),
      },
    },
  })
}
