import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/auth/utils'
import * as relationshipsRepo from '@/lib/db/repositories/relationships'
import type { Category } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }
    const { tenantId } = tenantCheck

    const searchParams = request.nextUrl.searchParams
    const itemTypes = searchParams.get('types')?.split(',') as Category[] | undefined
    const minStrength = parseFloat(searchParams.get('minStrength') || '0.3')

    const relationships = await relationshipsRepo.getAllRelationshipsForGraph(
      tenantId,
      itemTypes,
      minStrength
    )

    // Get unique nodes
    const nodeMap = new Map<string, { id: string; type: Category; name: string }>()
    const edges: Array<{
      id: string
      source: string
      target: string
      type: string
      strength: number
    }> = []

    // Helper to get node key
    const getNodeKey = (type: Category, id: number) => `${type}-${id}`

    // Process relationships to create nodes and edges
    for (const rel of relationships) {
      const sourceKey = getNodeKey(rel.sourceType, rel.sourceId)
      const targetKey = getNodeKey(rel.targetType, rel.targetId)

      // Add nodes if not already added
      if (!nodeMap.has(sourceKey)) {
        nodeMap.set(sourceKey, {
          id: sourceKey,
          type: rel.sourceType,
          name: '', // Will be fetched separately
        })
      }
      if (!nodeMap.has(targetKey)) {
        nodeMap.set(targetKey, {
          id: targetKey,
          type: rel.targetType,
          name: '', // Will be fetched separately
        })
      }

      // Add edge
      edges.push({
        id: `edge-${rel.id}`,
        source: sourceKey,
        target: targetKey,
        type: rel.relationshipType,
        strength: rel.strength,
      })
    }

    // Fetch names for all nodes
    const { prisma } = await import('@/lib/db/index')
    for (const [key, node] of nodeMap.entries()) {
      const [type, idStr] = key.split('-')
      const id = parseInt(idStr, 10)

      try {
        switch (type as Category) {
          case 'people': {
            const item = await prisma.person.findFirst({
              where: { tenantId, id },
              select: { name: true },
            })
            if (item) node.name = item.name
            break
          }
          case 'projects': {
            const item = await prisma.project.findFirst({
              where: { tenantId, id },
              select: { name: true },
            })
            if (item) node.name = item.name
            break
          }
          case 'ideas': {
            const item = await prisma.idea.findFirst({
              where: { tenantId, id },
              select: { name: true },
            })
            if (item) node.name = item.name
            break
          }
          case 'admin': {
            const item = await prisma.admin.findFirst({
              where: { tenantId, id },
              select: { name: true },
            })
            if (item) node.name = item.name
            break
          }
        }
      } catch (error) {
        console.error(`Error fetching name for ${key}:`, error)
      }
    }

    return NextResponse.json({
      nodes: Array.from(nodeMap.values()),
      edges,
    })
  } catch (error) {
    console.error('Error fetching graph data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
