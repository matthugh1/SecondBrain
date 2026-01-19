import { getDatabase } from '../index'
import type { Category } from '@/types'

export interface SearchResult {
  item_type: Category
  item_id: number
  title: string
  content: string
  tags: string
  updated_at: string
}

export interface SearchFilters {
  itemTypes?: Category[]
  tags?: string[]
  dateFrom?: string
  dateTo?: string
  status?: string
  archived?: boolean
}

export function syncSearchIndex(tenantId: string, itemType: Category, itemId: number): void {
  const db = getDatabase()
  
  // Get tags for the item
  const tagsResult = db.prepare(`
    SELECT GROUP_CONCAT(t.name, ' ') as tags
    FROM item_tags it
    JOIN tags t ON it.tag_id = t.id
    WHERE it.tenant_id = ? AND it.item_type = ? AND it.item_id = ?
  `).get(tenantId, itemType, itemId) as any
  const tags = tagsResult?.tags || ''
  
  // Get item data based on type
  let title = ''
  let content = ''
  let updatedAt = ''
  
  switch (itemType) {
    case 'people': {
      const item = db.prepare('SELECT id, name, context, follow_ups, updated_at, created_at FROM people WHERE tenant_id = ? AND id = ?').get(tenantId, itemId) as any
      if (item) {
        title = item.name || ''
        content = [item.context, item.follow_ups].filter(Boolean).join(' ')
        updatedAt = item.updated_at || item.created_at || ''
      }
      break
    }
    case 'projects': {
      const item = db.prepare('SELECT id, name, status, next_action, notes, updated_at, created_at FROM projects WHERE tenant_id = ? AND id = ?').get(tenantId, itemId) as any
      if (item) {
        title = item.name || ''
        content = [item.status, item.next_action, item.notes].filter(Boolean).join(' ')
        updatedAt = item.updated_at || item.created_at || ''
      }
      break
    }
    case 'ideas': {
      const item = db.prepare('SELECT id, name, one_liner, notes, updated_at, created_at FROM ideas WHERE tenant_id = ? AND id = ?').get(tenantId, itemId) as any
      if (item) {
        title = item.name || ''
        content = [item.one_liner, item.notes].filter(Boolean).join(' ')
        updatedAt = item.updated_at || item.created_at || ''
      }
      break
    }
    case 'admin': {
      const item = db.prepare('SELECT id, name, due_date, status, notes, updated_at, created FROM admin WHERE tenant_id = ? AND id = ?').get(tenantId, itemId) as any
      if (item) {
        title = item.name || ''
        content = [item.due_date, item.status, item.notes].filter(Boolean).join(' ')
        updatedAt = item.updated_at || item.created || ''
      }
      break
    }
  }
  
  // Delete existing entry
  db.prepare('DELETE FROM search_index WHERE tenant_id = ? AND item_type = ? AND item_id = ?')
    .run(tenantId, itemType, itemId)
  
  // Insert new entry
  if (title || content || tags) {
    db.prepare(`
      INSERT INTO search_index (tenant_id, item_type, item_id, title, content, tags, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(tenantId, itemType, itemId, title, content, tags, updatedAt)
  }
}

export function removeFromSearchIndex(tenantId: string, itemType: Category, itemId: number): void {
  const db = getDatabase()
  db.prepare('DELETE FROM search_index WHERE tenant_id = ? AND item_type = ? AND item_id = ?')
    .run(tenantId, itemType, itemId)
}

export function search(tenantId: string, query: string, filters?: SearchFilters): SearchResult[] {
  const db = getDatabase()
  
  if (!query || query.trim().length === 0) {
    return []
  }
  
  // Build FTS5 query
  const searchTerms = query.trim().split(/\s+/).map(term => `"${term}"*`).join(' ')
  let ftsQuery = `title:${searchTerms} OR content:${searchTerms} OR tags:${searchTerms}`
  
  // Build WHERE clause for filters
  const conditions: string[] = ['tenant_id = ?']
  const params: any[] = [tenantId]
  
  if (filters?.itemTypes && filters.itemTypes.length > 0) {
    const placeholders = filters.itemTypes.map(() => '?').join(',')
    conditions.push(`item_type IN (${placeholders})`)
    params.push(...filters.itemTypes)
  }
  
  if (filters?.dateFrom) {
    conditions.push(`updated_at >= ?`)
    params.push(filters.dateFrom)
  }
  
  if (filters?.dateTo) {
    conditions.push(`updated_at <= ?`)
    params.push(filters.dateTo)
  }
  
  const whereClause = conditions.length > 0 ? `AND ${conditions.join(' AND ')}` : ''
  
  // Execute search
  const sql = `
    SELECT 
      item_type,
      item_id,
      title,
      content,
      tags,
      updated_at
    FROM search_index
    WHERE search_index MATCH ?
    ${whereClause}
    ORDER BY updated_at DESC
    LIMIT 100
  `
  
  const stmt = db.prepare(sql)
  const results = stmt.all(ftsQuery, ...params) as any[]
  
  // Filter by tags if specified
  let filteredResults = results
  if (filters?.tags && filters.tags.length > 0) {
    filteredResults = results.filter(result => {
      const resultTags = (result.tags || '').split(' ').map((t: string) => t.toLowerCase())
      return filters.tags!.some(tag => resultTags.includes(tag.toLowerCase()))
    })
  }
  
  return filteredResults.map(row => ({
    item_type: row.item_type as Category,
    item_id: row.item_id,
    title: row.title || '',
    content: row.content || '',
    tags: row.tags || '',
    updated_at: row.updated_at || '',
  }))
}

export function getTimeline(tenantId: string, filters?: SearchFilters): SearchResult[] {
  const db = getDatabase()
  
  const conditions: string[] = ['tenant_id = ?']
  const params: any[] = [tenantId]
  
  if (filters?.itemTypes && filters.itemTypes.length > 0) {
    const placeholders = filters.itemTypes.map(() => '?').join(',')
    conditions.push(`item_type IN (${placeholders})`)
    params.push(...filters.itemTypes)
  }
  
  if (filters?.dateFrom) {
    conditions.push(`updated_at >= ?`)
    params.push(filters.dateFrom)
  }
  
  if (filters?.dateTo) {
    conditions.push(`updated_at <= ?`)
    params.push(filters.dateTo)
  }
  
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  
  const sql = `
    SELECT 
      item_type,
      item_id,
      title,
      content,
      tags,
      updated_at
    FROM search_index
    ${whereClause}
    ORDER BY updated_at DESC
    LIMIT 500
  `
  
  const stmt = db.prepare(sql)
  const results = stmt.all(...params) as any[]
  
  // Filter by tags if specified
  let filteredResults = results
  if (filters?.tags && filters.tags.length > 0) {
    filteredResults = results.filter(result => {
      const resultTags = (result.tags || '').split(' ').map((t: string) => t.toLowerCase())
      return filters.tags!.some(tag => resultTags.includes(tag.toLowerCase()))
    })
  }
  
  return filteredResults.map(row => ({
    item_type: row.item_type as Category,
    item_id: row.item_id,
    title: row.title || '',
    content: row.content || '',
    tags: row.tags || '',
    updated_at: row.updated_at || '',
  }))
}
