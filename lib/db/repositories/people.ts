import { prisma } from '../index'
import type { Person } from '@/types'

export async function createPerson(tenantId: string, person: Person): Promise<number> {
  const result = await prisma.person.create({
    data: {
      tenantId,
      name: person.name,
      context: person.context || null,
      followUps: person.follow_ups || null,
      lastTouched: person.last_touched || null,
      tags: person.tags || null,
    },
  })
  return result.id
}

export async function getPersonById(tenantId: string, id: number): Promise<Person | null> {
  const result = await prisma.person.findFirst({
    where: {
      id,
      tenantId,
    },
  })
  if (!result) return null
  return {
    id: result.id,
    name: result.name,
    context: result.context || undefined,
    follow_ups: result.followUps || undefined,
    last_touched: result.lastTouched || undefined,
    tags: result.tags || undefined,
  }
}

export async function getPersonByName(tenantId: string, name: string): Promise<Person | null> {
  const result = await prisma.person.findFirst({
    where: {
      name,
      tenantId,
    },
  })
  if (!result) return null
  return {
    id: result.id,
    name: result.name,
    context: result.context || undefined,
    follow_ups: result.followUps || undefined,
    last_touched: result.lastTouched || undefined,
    tags: result.tags || undefined,
  }
}

export async function getAllPeople(tenantId: string, includeArchived: boolean = false): Promise<Person[]> {
  const results = await prisma.person.findMany({
    where: {
      tenantId,
      ...(includeArchived ? {} : { archived: 0 }),
    },
    orderBy: { name: 'asc' },
  })
  return results.map(result => ({
    id: result.id,
    name: result.name,
    context: result.context || undefined,
    follow_ups: result.followUps || undefined,
    last_touched: result.lastTouched || undefined,
    tags: result.tags || undefined,
  }))
}

export async function archivePerson(tenantId: string, id: number): Promise<void> {
  await prisma.person.updateMany({
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

export async function unarchivePerson(tenantId: string, id: number): Promise<void> {
  await prisma.person.updateMany({
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

export async function updatePerson(tenantId: string, id: number, updates: Partial<Person>): Promise<void> {
  const data: any = {
    updatedAt: new Date(),
  }
  
  if (updates.name !== undefined) data.name = updates.name
  if (updates.context !== undefined) data.context = updates.context || null
  if (updates.follow_ups !== undefined) data.followUps = updates.follow_ups || null
  if (updates.last_touched !== undefined) data.lastTouched = updates.last_touched || null
  if (updates.tags !== undefined) data.tags = updates.tags || null
  
  await prisma.person.updateMany({
    where: {
      id,
      tenantId,
    },
    data,
  })
}

export async function deletePerson(tenantId: string, id: number): Promise<void> {
  await prisma.person.deleteMany({
    where: {
      id,
      tenantId,
    },
  })
}
