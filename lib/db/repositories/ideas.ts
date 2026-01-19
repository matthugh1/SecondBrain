import { prisma } from '../index'
import type { Idea } from '@/types'

export async function createIdea(tenantId: string, idea: Idea): Promise<number> {
  const result = await prisma.idea.create({
    data: {
      tenantId,
      name: idea.name,
      oneLiner: idea.one_liner || null,
      notes: idea.notes || null,
      lastTouched: idea.last_touched || null,
      tags: idea.tags || null,
    },
  })
  return result.id
}

export async function getIdeaById(tenantId: string, id: number): Promise<Idea | null> {
  const result = await prisma.idea.findFirst({
    where: {
      id,
      tenantId,
    },
  })
  if (!result) return null
  return {
    id: result.id,
    name: result.name,
    one_liner: result.oneLiner || undefined,
    notes: result.notes || undefined,
    last_touched: result.lastTouched || undefined,
    tags: result.tags || undefined,
  }
}

export async function getIdeaByName(tenantId: string, name: string): Promise<Idea | null> {
  const result = await prisma.idea.findFirst({
    where: {
      name,
      tenantId,
    },
  })
  if (!result) return null
  return {
    id: result.id,
    name: result.name,
    one_liner: result.oneLiner || undefined,
    notes: result.notes || undefined,
    last_touched: result.lastTouched || undefined,
    tags: result.tags || undefined,
  }
}

export async function getAllIdeas(tenantId: string, includeArchived: boolean = false): Promise<Idea[]> {
  const results = await prisma.idea.findMany({
    where: {
      tenantId,
      ...(includeArchived ? {} : { archived: 0 }),
    },
    orderBy: { createdAt: 'desc' },
  })
  return results.map(result => ({
    id: result.id,
    name: result.name,
    one_liner: result.oneLiner || undefined,
    notes: result.notes || undefined,
    last_touched: result.lastTouched || undefined,
    tags: result.tags || undefined,
  }))
}

export async function archiveIdea(tenantId: string, id: number): Promise<void> {
  await prisma.idea.updateMany({
    where: {
      id,
      tenantId,
    },
    data: {
      archived: 1,
      archivedAt: new Date(),
      updatedAt: new Date(),
    },
  })
}

export async function unarchiveIdea(tenantId: string, id: number): Promise<void> {
  await prisma.idea.updateMany({
    where: {
      id,
      tenantId,
    },
    data: {
      archived: 0,
      archivedAt: null,
      updatedAt: new Date(),
    },
  })
}

export async function updateIdea(tenantId: string, id: number, updates: Partial<Idea>): Promise<void> {
  const data: any = {
    updatedAt: new Date(),
  }
  
  if (updates.name !== undefined) data.name = updates.name
  if (updates.one_liner !== undefined) data.oneLiner = updates.one_liner || null
  if (updates.notes !== undefined) data.notes = updates.notes || null
  if (updates.last_touched !== undefined) data.lastTouched = updates.last_touched || null
  if (updates.tags !== undefined) data.tags = updates.tags || null
  
  await prisma.idea.updateMany({
    where: {
      id,
      tenantId,
    },
    data,
  })
}

export async function deleteIdea(tenantId: string, id: number): Promise<void> {
  await prisma.idea.deleteMany({
    where: {
      id,
      tenantId,
    },
  })
}
