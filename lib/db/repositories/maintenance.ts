import { getDatabase } from '../index'

const tablesToClear = [
  'inbox_log',
  'digests',
  'people',
  'projects',
  'ideas',
  'admin',
]

export function clearAllData(tenantId: string): { totalRemoved: number; removedByTable: Record<string, number> } {
  const db = getDatabase()
  const removedByTable: Record<string, number> = {}

  const clearTx = db.transaction(() => {
    let totalRemoved = 0
    const tablesToReset: string[] = []

    tablesToClear.forEach((table) => {
      const countRow = db
        .prepare(`SELECT COUNT(*) as count FROM ${table} WHERE tenant_id = ?`)
        .get(tenantId) as { count: number }
      const count = countRow?.count ?? 0
      removedByTable[table] = count
      totalRemoved += count

      db.prepare(`DELETE FROM ${table} WHERE tenant_id = ?`).run(tenantId)

      const remainingRow = db
        .prepare(`SELECT COUNT(*) as count FROM ${table}`)
        .get() as { count: number }
      if ((remainingRow?.count ?? 0) === 0) {
        tablesToReset.push(table)
      }
    })

    if (tablesToReset.length > 0) {
      const placeholders = tablesToReset.map(() => '?').join(', ')
      db.prepare(`DELETE FROM sqlite_sequence WHERE name IN (${placeholders})`).run(
        ...tablesToReset
      )
    }

    return totalRemoved
  })

  const totalRemoved = clearTx()
  return { totalRemoved, removedByTable }
}
