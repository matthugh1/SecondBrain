import { getDatabase } from '../index'

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

export function createActionHistory(tenantId: string, action: ActionHistory): number {
  const db = getDatabase()
  const stmt = db.prepare(`
    INSERT INTO action_history (tenant_id, action_type, item_type, item_id, old_data, new_data, undone)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  const result = stmt.run(
    tenantId,
    action.action_type,
    action.item_type,
    action.item_id || null,
    action.old_data || null,
    action.new_data || null,
    action.undone || 0
  )
  return Number(result.lastInsertRowid)
}

export function getActionHistoryById(tenantId: string, id: number): ActionHistory | null {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM action_history WHERE tenant_id = ? AND id = ?')
  const row = stmt.get(tenantId, id) as any
  if (!row) return null
  return {
    id: row.id,
    tenant_id: row.tenant_id,
    action_type: row.action_type,
    item_type: row.item_type,
    item_id: row.item_id,
    old_data: row.old_data,
    new_data: row.new_data,
    timestamp: row.timestamp,
    undone: row.undone,
  }
}

export function getRecentActions(tenantId: string, limit: number = 50): ActionHistory[] {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT * FROM action_history 
    WHERE tenant_id = ? AND undone = 0
    ORDER BY timestamp DESC 
    LIMIT ?
  `)
  const rows = stmt.all(tenantId, limit) as any[]
  return rows.map(row => ({
    id: row.id,
    tenant_id: row.tenant_id,
    action_type: row.action_type,
    item_type: row.item_type,
    item_id: row.item_id,
    old_data: row.old_data,
    new_data: row.new_data,
    timestamp: row.timestamp,
    undone: row.undone,
  }))
}

export function getLastUndoneAction(tenantId: string): ActionHistory | null {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT * FROM action_history 
    WHERE tenant_id = ? AND undone = 0
    ORDER BY timestamp DESC 
    LIMIT 1
  `)
  const row = stmt.get(tenantId) as any
  if (!row) return null
  return {
    id: row.id,
    tenant_id: row.tenant_id,
    action_type: row.action_type,
    item_type: row.item_type,
    item_id: row.item_id,
    old_data: row.old_data,
    new_data: row.new_data,
    timestamp: row.timestamp,
    undone: row.undone,
  }
}

export function markActionAsUndone(tenantId: string, id: number): void {
  const db = getDatabase()
  const stmt = db.prepare('UPDATE action_history SET undone = 1 WHERE tenant_id = ? AND id = ?')
  stmt.run(tenantId, id)
}

export function getUndoneActions(tenantId: string): ActionHistory[] {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT * FROM action_history 
    WHERE tenant_id = ? AND undone = 1
    ORDER BY timestamp DESC
  `)
  const rows = stmt.all(tenantId) as any[]
  return rows.map(row => ({
    id: row.id,
    tenant_id: row.tenant_id,
    action_type: row.action_type,
    item_type: row.item_type,
    item_id: row.item_id,
    old_data: row.old_data,
    new_data: row.new_data,
    timestamp: row.timestamp,
    undone: row.undone,
  }))
}

export function markActionAsRedone(tenantId: string, id: number): void {
  const db = getDatabase()
  const stmt = db.prepare('UPDATE action_history SET undone = 0 WHERE tenant_id = ? AND id = ?')
  stmt.run(tenantId, id)
}

export function getLastRedoneAction(tenantId: string): ActionHistory | null {
  const db = getDatabase()
  const stmt = db.prepare(`
    SELECT * FROM action_history 
    WHERE tenant_id = ? AND undone = 1
    ORDER BY timestamp DESC 
    LIMIT 1
  `)
  const row = stmt.get(tenantId) as any
  if (!row) return null
  return {
    id: row.id,
    tenant_id: row.tenant_id,
    action_type: row.action_type,
    item_type: row.item_type,
    item_id: row.item_id,
    old_data: row.old_data,
    new_data: row.new_data,
    timestamp: row.timestamp,
    undone: row.undone,
  }
}

export function clearOldHistory(tenantId: string, keepLast: number = 100): void {
  const db = getDatabase()
  const stmt = db.prepare(`
    DELETE FROM action_history 
    WHERE tenant_id = ? AND id NOT IN (
      SELECT id FROM action_history 
      WHERE tenant_id = ?
      ORDER BY timestamp DESC 
      LIMIT ?
    )
  `)
  stmt.run(tenantId, tenantId, keepLast)
}
