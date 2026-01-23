import { prisma } from '../index'
import type { TaskTemplate } from '@/types'

export async function createTaskTemplate(
  tenantId: string,
  template: TaskTemplate
): Promise<number> {
  const result = await prisma.taskTemplate.create({
    data: {
      tenantId,
      name: template.name,
      description: template.description || null,
      fields: template.fields,
      defaultValues: template.defaultValues || null,
    },
  })
  return result.id
}

export async function getTaskTemplateById(
  tenantId: string,
  id: number
): Promise<TaskTemplate | null> {
  const result = await prisma.taskTemplate.findFirst({
    where: {
      id,
      tenantId,
    },
  })
  if (!result) return null
  return {
    id: result.id,
    name: result.name,
    description: result.description || undefined,
    fields: result.fields,
    defaultValues: result.defaultValues || undefined,
  }
}

export async function getAllTaskTemplates(tenantId: string): Promise<TaskTemplate[]> {
  const results = await prisma.taskTemplate.findMany({
    where: {
      tenantId,
    },
    orderBy: { createdAt: 'desc' },
  })
  return results.map(result => ({
    id: result.id,
    name: result.name,
    description: result.description || undefined,
    fields: result.fields,
    defaultValues: result.defaultValues || undefined,
  }))
}

export async function updateTaskTemplate(
  tenantId: string,
  id: number,
  updates: Partial<TaskTemplate>
): Promise<void> {
  const data: any = {
    updatedAt: new Date(),
  }
  
  if (updates.name !== undefined) data.name = updates.name
  if (updates.description !== undefined) data.description = updates.description || null
  if (updates.fields !== undefined) data.fields = updates.fields
  if (updates.defaultValues !== undefined) data.defaultValues = updates.defaultValues || null
  
  await prisma.taskTemplate.updateMany({
    where: {
      id,
      tenantId,
    },
    data,
  })
}

export async function deleteTaskTemplate(tenantId: string, id: number): Promise<void> {
  await prisma.taskTemplate.deleteMany({
    where: {
      id,
      tenantId,
    },
  })
}
