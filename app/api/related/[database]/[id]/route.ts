import { NextRequest, NextResponse } from 'next/server'
import * as tagsRepo from '@/lib/db/repositories/tags'
import * as peopleRepo from '@/lib/db/repositories/people'
import * as projectsRepo from '@/lib/db/repositories/projects'
import * as ideasRepo from '@/lib/db/repositories/ideas'
import * as adminRepo from '@/lib/db/repositories/admin'
import { requireTenant } from '@/lib/auth/utils'
import type { Category } from '@/types'

export async function GET(
  request: NextRequest,
  { params }: { params: { database: string; id: string } }
) {
  const tenantCheck = await requireTenant()
  if (tenantCheck instanceof NextResponse) {
    return tenantCheck
  }
  
  const { tenantId } = tenantCheck

  try {
    const { database, id } = params
    const itemId = parseInt(id, 10)

    if (!['people', 'projects', 'ideas', 'admin'].includes(database)) {
      return NextResponse.json(
        { error: 'Invalid database' },
        { status: 400 }
      )
    }

    // Get tags for the current item
    const itemTags = await tagsRepo.getTagsForItem(tenantId, database as Category, itemId)
    const tagIds = itemTags.map(t => t.id)

    if (tagIds.length === 0) {
      return NextResponse.json({ related: [] })
    }

    // Find items with shared tags
    const related: any[] = []
    
    // Search in each database type
    const databases: Category[] = ['people', 'projects', 'ideas', 'admin']
    
    for (const dbType of databases) {
      if (dbType === database) continue // Skip current database
      
      // Get all items from this database
      let items: any[] = []
      switch (dbType) {
        case 'people':
          items = await peopleRepo.getAllPeople(tenantId)
          break
        case 'projects':
          items = await projectsRepo.getAllProjects(tenantId)
          break
        case 'ideas':
          items = await ideasRepo.getAllIdeas(tenantId)
          break
        case 'admin':
          items = await adminRepo.getAllAdmin(tenantId)
          break
      }
      
      // Check each item for shared tags
      for (const item of items) {
        const itemItemTags = await tagsRepo.getTagsForItem(tenantId, dbType, item.id!)
        const itemTagIds = itemItemTags.map(t => t.id)
        
        // Count shared tags
        const sharedTags = tagIds.filter(tid => itemTagIds.includes(tid))
        if (sharedTags.length > 0) {
          related.push({
            item_type: dbType,
            item_id: item.id,
            name: item.name,
            shared_tags: itemItemTags.filter(t => sharedTags.includes(t.id)).map(t => t.name),
            shared_count: sharedTags.length,
          })
        }
      }
    }
    
    // Also check same database for items with shared tags (excluding current item)
    let sameDbItems: any[] = []
    switch (database) {
      case 'people':
        sameDbItems = await peopleRepo.getAllPeople(tenantId)
        break
      case 'projects':
        sameDbItems = await projectsRepo.getAllProjects(tenantId)
        break
      case 'ideas':
        sameDbItems = await ideasRepo.getAllIdeas(tenantId)
        break
      case 'admin':
        sameDbItems = await adminRepo.getAllAdmin(tenantId)
        break
    }
    
    for (const item of sameDbItems) {
      if (item.id === itemId) continue
      
      const itemItemTags = await tagsRepo.getTagsForItem(tenantId, database as Category, item.id!)
      const itemTagIds = itemItemTags.map(t => t.id)
      
      const sharedTags = tagIds.filter(tid => itemTagIds.includes(tid))
      if (sharedTags.length > 0) {
        related.push({
          item_type: database,
          item_id: item.id,
          name: item.name,
          shared_tags: itemItemTags.filter(t => sharedTags.includes(t.id)).map(t => t.name),
          shared_count: sharedTags.length,
        })
      }
    }
    
    // Sort by number of shared tags (descending)
    related.sort((a, b) => b.shared_count - a.shared_count)
    
    // Limit to top 10
    return NextResponse.json({ related: related.slice(0, 10) })
  } catch (error) {
    console.error('Error fetching related items:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
