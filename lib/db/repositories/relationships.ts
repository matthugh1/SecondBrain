import { prisma } from '../index'
import type { Category } from '@/types'

export interface Relationship {
  id: number
  tenantId: string
  sourceType: Category
  sourceId: number
  targetType: Category
  targetId: number
  relationshipType: string
  strength: number
  mentionCount: number
  lastMentioned: Date
  createdAt: Date
  updatedAt: Date
}

export interface RelatedItem {
  itemType: Category
  itemId: number
  name: string
  relationshipType: string
  strength: number
  mentionCount: number
}

/**
 * Create or update a relationship
 */
export async function upsertRelationship(
  tenantId: string,
  sourceType: Category,
  sourceId: number,
  targetType: Category,
  targetId: number,
  relationshipType: string = 'mentioned_in',
  strength: number = 0.5
): Promise<Relationship> {
  const relationship = await prisma.relationship.upsert({
    where: {
      tenantId_sourceType_sourceId_targetType_targetId: {
        tenantId,
        sourceType,
        sourceId,
        targetType,
        targetId,
      },
    },
    create: {
      tenantId,
      sourceType,
      sourceId,
      targetType,
      targetId,
      relationshipType,
      strength,
      mentionCount: 1,
      lastMentioned: new Date(),
    },
    update: {
      mentionCount: { increment: 1 },
      lastMentioned: new Date(),
      updatedAt: new Date(),
    },
  })

  return {
    id: relationship.id,
    tenantId: relationship.tenantId,
    sourceType: relationship.sourceType as Category,
    sourceId: relationship.sourceId,
    targetType: relationship.targetType as Category,
    targetId: relationship.targetId,
    relationshipType: relationship.relationshipType,
    strength: relationship.strength,
    mentionCount: relationship.mentionCount,
    lastMentioned: relationship.lastMentioned,
    createdAt: relationship.createdAt,
    updatedAt: relationship.updatedAt,
  }
}

/**
 * Get all relationships for a source item
 */
export async function getRelationshipsForSource(
  tenantId: string,
  sourceType: Category,
  sourceId: number
): Promise<Relationship[]> {
  const relationships = await prisma.relationship.findMany({
    where: {
      tenantId,
      sourceType,
      sourceId,
    },
    orderBy: { strength: 'desc' },
  })

  return relationships.map(rel => ({
    id: rel.id,
    tenantId: rel.tenantId,
    sourceType: rel.sourceType as Category,
    sourceId: rel.sourceId,
    targetType: rel.targetType as Category,
    targetId: rel.targetId,
    relationshipType: rel.relationshipType,
    strength: rel.strength,
    mentionCount: rel.mentionCount,
    lastMentioned: rel.lastMentioned,
    createdAt: rel.createdAt,
    updatedAt: rel.updatedAt,
  }))
}

/**
 * Get all relationships for a target item
 */
export async function getRelationshipsForTarget(
  tenantId: string,
  targetType: Category,
  targetId: number
): Promise<Relationship[]> {
  const relationships = await prisma.relationship.findMany({
    where: {
      tenantId,
      targetType,
      targetId,
    },
    orderBy: { strength: 'desc' },
  })

  return relationships.map(rel => ({
    id: rel.id,
    tenantId: rel.tenantId,
    sourceType: rel.sourceType as Category,
    sourceId: rel.sourceId,
    targetType: rel.targetType as Category,
    targetId: rel.targetId,
    relationshipType: rel.relationshipType,
    strength: rel.strength,
    mentionCount: rel.mentionCount,
    lastMentioned: rel.lastMentioned,
    createdAt: rel.createdAt,
    updatedAt: rel.updatedAt,
  }))
}

/**
 * Get related items for an entity (both as source and target)
 */
export async function getRelatedItems(
  tenantId: string,
  itemType: Category,
  itemId: number
): Promise<RelatedItem[]> {
  // Get relationships where this item is the source
  const sourceRelationships = await getRelationshipsForSource(tenantId, itemType, itemId)
  
  // Get relationships where this item is the target
  const targetRelationships = await getRelationshipsForTarget(tenantId, itemType, itemId)

  // Combine and fetch item names
  const relatedMap = new Map<string, RelatedItem>()

  // Process source relationships (this item mentions others)
  for (const rel of sourceRelationships) {
    const key = `${rel.targetType}-${rel.targetId}`
    const item = await getItemName(tenantId, rel.targetType, rel.targetId)
    if (item) {
      relatedMap.set(key, {
        itemType: rel.targetType,
        itemId: rel.targetId,
        name: item.name,
        relationshipType: rel.relationshipType,
        strength: rel.strength,
        mentionCount: rel.mentionCount,
      })
    }
  }

  // Process target relationships (others mention this item)
  for (const rel of targetRelationships) {
    const key = `${rel.sourceType}-${rel.sourceId}`
    const item = await getItemName(tenantId, rel.sourceType, rel.sourceId)
    if (item) {
      const existing = relatedMap.get(key)
      if (existing) {
        // Combine strengths if already exists
        existing.strength = Math.max(existing.strength, rel.strength)
        existing.mentionCount += rel.mentionCount
      } else {
        relatedMap.set(key, {
          itemType: rel.sourceType,
          itemId: rel.sourceId,
          name: item.name,
          relationshipType: rel.relationshipType,
          strength: rel.strength,
          mentionCount: rel.mentionCount,
        })
      }
    }
  }

  return Array.from(relatedMap.values()).sort((a, b) => b.strength - a.strength)
}

/**
 * Helper to get item name by type and ID
 */
async function getItemName(tenantId: string, itemType: Category, itemId: number): Promise<{ name: string } | null> {
  switch (itemType) {
    case 'people': {
      const item = await prisma.person.findFirst({
        where: { tenantId, id: itemId },
        select: { name: true },
      })
      return item ? { name: item.name } : null
    }
    case 'projects': {
      const item = await prisma.project.findFirst({
        where: { tenantId, id: itemId },
        select: { name: true },
      })
      return item ? { name: item.name } : null
    }
    case 'ideas': {
      const item = await prisma.idea.findFirst({
        where: { tenantId, id: itemId },
        select: { name: true },
      })
      return item ? { name: item.name } : null
    }
    case 'admin': {
      const item = await prisma.admin.findFirst({
        where: { tenantId, id: itemId },
        select: { name: true },
      })
      return item ? { name: item.name } : null
    }
    default:
      return null
  }
}

/**
 * Delete a relationship
 */
export async function deleteRelationship(
  tenantId: string,
  sourceType: Category,
  sourceId: number,
  targetType: Category,
  targetId: number
): Promise<void> {
  await prisma.relationship.deleteMany({
    where: {
      tenantId,
      sourceType,
      sourceId,
      targetType,
      targetId,
    },
  })
}

/**
 * Update relationship strength
 */
export async function updateRelationshipStrength(
  tenantId: string,
  sourceType: Category,
  sourceId: number,
  targetType: Category,
  targetId: number,
  strength: number
): Promise<void> {
  await prisma.relationship.updateMany({
    where: {
      tenantId,
      sourceType,
      sourceId,
      targetType,
      targetId,
    },
    data: {
      strength,
      updatedAt: new Date(),
    },
  })
}

/**
 * Get all relationships for graph visualization
 */
export async function getAllRelationshipsForGraph(
  tenantId: string,
  itemTypes?: Category[],
  minStrength: number = 0.3
): Promise<Relationship[]> {
  const relationships = await prisma.relationship.findMany({
    where: {
      tenantId,
      strength: { gte: minStrength },
      ...(itemTypes && itemTypes.length > 0
        ? {
            OR: [
              { sourceType: { in: itemTypes } },
              { targetType: { in: itemTypes } },
            ],
          }
        : {}),
    },
    orderBy: { strength: 'desc' },
    take: 500, // Limit for performance
  })

  return relationships.map(rel => ({
    id: rel.id,
    tenantId: rel.tenantId,
    sourceType: rel.sourceType as Category,
    sourceId: rel.sourceId,
    targetType: rel.targetType as Category,
    targetId: rel.targetId,
    relationshipType: rel.relationshipType,
    strength: rel.strength,
    mentionCount: rel.mentionCount,
    lastMentioned: rel.lastMentioned,
    createdAt: rel.createdAt,
    updatedAt: rel.updatedAt,
  }))
}
