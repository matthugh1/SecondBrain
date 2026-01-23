import * as relationshipsRepo from '@/lib/db/repositories/relationships'
import * as projectsRepo from '@/lib/db/repositories/projects'
import type { Category } from '@/types'

export interface RelationshipInsight {
  type: 'high_connections' | 'missing_links' | 'active_collaborator' | 'isolated_item'
  message: string
  itemType: Category
  itemId: number
  itemName: string
  priority: 'high' | 'medium' | 'low'
}

/**
 * Generate relationship-based insights for a tenant
 */
export async function generateRelationshipInsights(tenantId: string): Promise<RelationshipInsight[]> {
  const insights: RelationshipInsight[] = []

  // Get all relationships
  const relationships = await relationshipsRepo.getAllRelationshipsForGraph(tenantId, undefined, 0)

  // Count relationships per item
  const itemRelationshipCounts = new Map<string, { type: Category; id: number; count: number }>()

  for (const rel of relationships) {
    const sourceKey = `${rel.sourceType}-${rel.sourceId}`
    const targetKey = `${rel.targetType}-${rel.targetId}`

    const sourceCount = itemRelationshipCounts.get(sourceKey) || { type: rel.sourceType, id: rel.sourceId, count: 0 }
    sourceCount.count++
    itemRelationshipCounts.set(sourceKey, sourceCount)

    const targetCount = itemRelationshipCounts.get(targetKey) || { type: rel.targetType, id: rel.targetId, count: 0 }
    targetCount.count++
    itemRelationshipCounts.set(targetKey, targetCount)
  }

  // Find items with many relationships (high connections)
  for (const [key, data] of itemRelationshipCounts.entries()) {
    if (data.count >= 5) {
      const itemName = await getItemName(tenantId, data.type, data.id)
      if (itemName) {
        insights.push({
          type: 'high_connections',
          message: `"${itemName}" is connected to ${data.count} other items`,
          itemType: data.type,
          itemId: data.id,
          itemName,
          priority: 'medium',
        })
      }
    }
  }

  // Find items with no relationships (isolated items)
  // This would require getting all items and checking which ones aren't in the map
  // For now, we'll focus on projects as they're most likely to need relationships

  // Find people mentioned in many active projects (active collaborators)
  const peopleRelationships = relationships.filter(rel => rel.sourceType === 'people' || rel.targetType === 'people')
  const peopleProjectCounts = new Map<number, number>()

  for (const rel of peopleRelationships) {
    if (rel.sourceType === 'people' && rel.targetType === 'projects') {
      const count = peopleProjectCounts.get(rel.sourceId) || 0
      peopleProjectCounts.set(rel.sourceId, count + 1)
    } else if (rel.targetType === 'people' && rel.sourceType === 'projects') {
      const count = peopleProjectCounts.get(rel.targetId) || 0
      peopleProjectCounts.set(rel.targetId, count + 1)
    }
  }

  for (const [personId, projectCount] of peopleProjectCounts.entries()) {
    if (projectCount >= 3) {
      // Check if projects are active
      const personRelationships = relationships.filter(
        rel => (rel.sourceType === 'people' && rel.sourceId === personId && rel.targetType === 'projects') ||
               (rel.targetType === 'people' && rel.targetId === personId && rel.sourceType === 'projects')
      )

      const activeProjects = await Promise.all(
        personRelationships.map(async (rel) => {
          const projectId = rel.sourceType === 'projects' ? rel.sourceId : rel.targetId
          const project = await projectsRepo.getProjectById(tenantId, projectId)
          return project?.status === 'Active'
        })
      )

      const activeCount = activeProjects.filter(Boolean).length

      if (activeCount >= 3) {
        const personName = await getItemName(tenantId, 'people', personId)
        if (personName) {
          insights.push({
            type: 'active_collaborator',
            message: `"${personName}" is mentioned in ${activeCount} active projects`,
            itemType: 'people',
            itemId: personId,
            itemName: personName,
            priority: 'high',
          })
        }
      }
    }
  }

  return insights.slice(0, 10) // Limit to top 10 insights
}

/**
 * Get insights for a specific item
 */
export async function getItemInsights(
  tenantId: string,
  itemType: Category,
  itemId: number
): Promise<RelationshipInsight[]> {
  const insights: RelationshipInsight[] = []
  const relatedItems = await relationshipsRepo.getRelatedItems(tenantId, itemType, itemId)

  if (relatedItems.length === 0) {
    const itemName = await getItemName(tenantId, itemType, itemId)
    if (itemName) {
      insights.push({
        type: 'isolated_item',
        message: `"${itemName}" has no relationships. Consider linking it to related items.`,
        itemType,
        itemId,
        itemName,
        priority: 'low',
      })
    }
  } else if (relatedItems.length >= 5) {
    const itemName = await getItemName(tenantId, itemType, itemId)
    if (itemName) {
      insights.push({
        type: 'high_connections',
        message: `"${itemName}" is connected to ${relatedItems.length} other items`,
        itemType,
        itemId,
        itemName,
        priority: 'medium',
      })
    }
  }

  return insights
}

/**
 * Helper to get item name
 */
async function getItemName(tenantId: string, itemType: Category, itemId: number): Promise<string | null> {
  const { prisma } = await import('@/lib/db/index')
  
  try {
    switch (itemType) {
      case 'people': {
        const item = await prisma.person.findFirst({
          where: { tenantId, id: itemId },
          select: { name: true },
        })
        return item?.name || null
      }
      case 'projects': {
        const item = await prisma.project.findFirst({
          where: { tenantId, id: itemId },
          select: { name: true },
        })
        return item?.name || null
      }
      case 'ideas': {
        const item = await prisma.idea.findFirst({
          where: { tenantId, id: itemId },
          select: { name: true },
        })
        return item?.name || null
      }
      case 'admin': {
        const item = await prisma.admin.findFirst({
          where: { tenantId, id: itemId },
          select: { name: true },
        })
        return item?.name || null
      }
      default:
        return null
    }
  } catch (error) {
    console.error(`Error getting item name for ${itemType}:${itemId}:`, error)
    return null
  }
}
