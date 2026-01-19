import { prisma } from '../index'
import type { Category } from '@/types'
import { Prisma } from '@prisma/client'

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

export async function syncSearchIndex(tenantId: string, itemType: Category, itemId: number): Promise<void> {
  // Get tags for the item using Prisma
  const itemTags = await prisma.itemTag.findMany({
    where: {
      tenantId,
      itemType,
      itemId,
    },
    include: {
      tag: true,
    },
  })
  const tags = itemTags.map(it => it.tag.name).join(' ')
  
  // Get item data based on type
  let title = ''
  let content = ''
  let updatedAt = ''
  
  switch (itemType) {
    case 'people': {
      const item = await prisma.person.findFirst({
        where: { tenantId, id: itemId },
      })
      if (item) {
        title = item.name || ''
        content = [item.context, item.followUps].filter(Boolean).join(' ')
        updatedAt = item.updatedAt?.toISOString() || item.createdAt?.toISOString() || ''
      }
      break
    }
    case 'projects': {
      const item = await prisma.project.findFirst({
        where: { tenantId, id: itemId },
      })
      if (item) {
        title = item.name || ''
        content = [item.status, item.nextAction, item.notes].filter(Boolean).join(' ')
        updatedAt = item.updatedAt?.toISOString() || item.createdAt?.toISOString() || ''
      }
      break
    }
    case 'ideas': {
      const item = await prisma.idea.findFirst({
        where: { tenantId, id: itemId },
      })
      if (item) {
        title = item.name || ''
        content = [item.oneLiner, item.notes].filter(Boolean).join(' ')
        updatedAt = item.updatedAt?.toISOString() || item.createdAt?.toISOString() || ''
      }
      break
    }
    case 'admin': {
      const item = await prisma.admin.findFirst({
        where: { tenantId, id: itemId },
      })
      if (item) {
        title = item.name || ''
        content = [item.dueDate, item.status, item.notes].filter(Boolean).join(' ')
        updatedAt = item.updatedAt?.toISOString() || (item.created ? String(item.created) : '') || ''
      }
      break
    }
  }
  
  // Note: search_index table may need to be created in Prisma schema
  // For now, this is a placeholder that compiles
  // TODO: Implement search_index table in Prisma schema or use PostgreSQL full-text search
}

export async function removeFromSearchIndex(tenantId: string, itemType: Category, itemId: number): Promise<void> {
  // TODO: Implement when search_index table is available
}

export async function search(tenantId: string, query: string, filters?: SearchFilters): Promise<SearchResult[]> {
  if (!query || query.trim().length === 0) {
    return []
  }
  
  // TODO: Implement PostgreSQL full-text search using tsvector/tsquery
  // For now, return empty array to make it compile
  return []
}

export async function getTimeline(tenantId: string, filters?: SearchFilters): Promise<SearchResult[]> {
  // TODO: Implement timeline using Prisma queries
  // For now, return empty array to make it compile
  return []
}
