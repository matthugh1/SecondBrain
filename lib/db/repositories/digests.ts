import { prisma } from '../index'

export interface Digest {
  id?: number
  type: 'daily' | 'weekly' | 'custom'
  content: string
  created?: string
  prompt?: string
  name?: string
}

export async function createDigest(tenantId: string, digest: Digest): Promise<number> {
  const result = await prisma.digest.create({
    data: {
      tenantId,
      type: digest.type,
      content: digest.content,
      created: digest.created ? new Date(digest.created) : new Date(),
    },
  })
  return result.id
}

export async function getAllDigests(tenantId: string): Promise<Digest[]> {
  const results = await prisma.digest.findMany({
    where: { tenantId },
    orderBy: { created: 'desc' },
  })
  return results.map(row => ({
    id: row.id,
    type: row.type as 'daily' | 'weekly' | 'custom',
    content: row.content,
    created: row.created.toISOString(),
  }))
}

export async function getDigestsByType(tenantId: string, type: 'daily' | 'weekly'): Promise<Digest[]> {
  const results = await prisma.digest.findMany({
    where: {
      tenantId,
      type,
    },
    orderBy: { created: 'desc' },
  })
  return results.map(row => ({
    id: row.id,
    type: row.type as 'daily' | 'weekly',
    content: row.content,
    created: row.created.toISOString(),
  }))
}

export async function getLatestDigest(tenantId: string, type: 'daily' | 'weekly'): Promise<Digest | null> {
  const result = await prisma.digest.findFirst({
    where: {
      tenantId,
      type,
    },
    orderBy: { created: 'desc' },
  })
  if (!result) return null
  return {
    id: result.id,
    type: result.type as 'daily' | 'weekly',
    content: result.content,
    created: result.created.toISOString(),
  }
}

export async function deleteDigest(tenantId: string, id: number): Promise<void> {
  await prisma.digest.deleteMany({
    where: {
      id,
      tenantId,
    },
  })
}
