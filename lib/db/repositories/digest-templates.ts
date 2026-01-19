import { prisma } from '../index'

export interface CustomDigestTemplate {
  id?: number
  tenantId: string
  name: string
  prompt: string
  created?: string
  updated?: string
}

export async function createTemplate(tenantId: string, template: Omit<CustomDigestTemplate, 'tenantId' | 'id' | 'created' | 'updated'>): Promise<number> {
  const result = await prisma.customDigestTemplate.create({
    data: {
      tenantId,
      name: template.name,
      prompt: template.prompt,
    },
  })
  return result.id
}

export async function getAllTemplates(tenantId: string): Promise<CustomDigestTemplate[]> {
  const results = await prisma.customDigestTemplate.findMany({
    where: { tenantId },
    orderBy: { created: 'asc' },
  })
  return results.map(row => ({
    id: row.id,
    tenantId: row.tenantId,
    name: row.name,
    prompt: row.prompt,
    created: row.created.toISOString(),
    updated: row.updated.toISOString(),
  }))
}

export async function getTemplateById(tenantId: string, id: number): Promise<CustomDigestTemplate | null> {
  const result = await prisma.customDigestTemplate.findFirst({
    where: {
      id,
      tenantId,
    },
  })
  if (!result) return null
  return {
    id: result.id,
    tenantId: result.tenantId,
    name: result.name,
    prompt: result.prompt,
    created: result.created.toISOString(),
    updated: result.updated.toISOString(),
  }
}

export async function updateTemplate(tenantId: string, id: number, updates: { name?: string; prompt?: string }): Promise<void> {
  const updateData: { name?: string; prompt?: string } = {}
  if (updates.name !== undefined) {
    updateData.name = updates.name
  }
  if (updates.prompt !== undefined) {
    updateData.prompt = updates.prompt
  }
  
  await prisma.customDigestTemplate.updateMany({
    where: {
      id,
      tenantId,
    },
    data: updateData,
  })
}

export async function deleteTemplate(tenantId: string, id: number): Promise<void> {
  await prisma.customDigestTemplate.deleteMany({
    where: {
      id,
      tenantId,
    },
  })
}
