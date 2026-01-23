import { prisma } from '../index'

export interface ActionTemplate {
  id: number
  tenantId: string
  name: string
  description?: string
  actions: Array<{
    actionType: string
    targetType?: string
    parameters: Record<string, any>
  }>
  parameters?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

/**
 * Create action template
 */
export async function createActionTemplate(
  tenantId: string,
  template: {
    name: string
    description?: string
    actions: Array<{
      actionType: string
      targetType?: string
      parameters: Record<string, any>
    }>
    parameters?: Record<string, any>
  }
): Promise<number> {
  const result = await prisma.actionTemplate.create({
    data: {
      tenantId,
      name: template.name,
      description: template.description || null,
      actions: JSON.stringify(template.actions),
      parameters: template.parameters ? JSON.stringify(template.parameters) : null,
    },
  })
  return result.id
}

/**
 * Get template by ID
 */
export async function getActionTemplateById(
  tenantId: string,
  id: number
): Promise<ActionTemplate | null> {
  const template = await prisma.actionTemplate.findFirst({
    where: { id, tenantId },
  })

  if (!template) return null

  return {
    id: template.id,
    tenantId: template.tenantId,
    name: template.name,
    description: template.description || undefined,
    actions: JSON.parse(template.actions),
    parameters: template.parameters ? JSON.parse(template.parameters) : undefined,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
  }
}

/**
 * Get all templates for a tenant
 */
export async function getAllActionTemplates(tenantId: string): Promise<ActionTemplate[]> {
  const templates = await prisma.actionTemplate.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
  })

  return templates.map(template => ({
    id: template.id,
    tenantId: template.tenantId,
    name: template.name,
    description: template.description || undefined,
    actions: JSON.parse(template.actions),
    parameters: template.parameters ? JSON.parse(template.parameters) : undefined,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
  }))
}

/**
 * Update template
 */
export async function updateActionTemplate(
  tenantId: string,
  id: number,
  updates: Partial<ActionTemplate>
): Promise<void> {
  const data: any = {}
  if (updates.name !== undefined) data.name = updates.name
  if (updates.description !== undefined) data.description = updates.description || null
  if (updates.actions !== undefined) data.actions = JSON.stringify(updates.actions)
  if (updates.parameters !== undefined) {
    data.parameters = updates.parameters ? JSON.stringify(updates.parameters) : null
  }

  await prisma.actionTemplate.updateMany({
    where: { id, tenantId },
    data,
  })
}

/**
 * Delete template
 */
export async function deleteActionTemplate(tenantId: string, id: number): Promise<void> {
  await prisma.actionTemplate.deleteMany({
    where: { id, tenantId },
  })
}
