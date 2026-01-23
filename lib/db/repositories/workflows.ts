import { prisma } from '../index'

export interface WorkflowTrigger {
  type: 'item_created' | 'item_updated' | 'item_deleted' | 'status_changed' | 'scheduled'
  itemType?: string
  conditions?: Array<{
    field: string
    operator: string
    value: any
  }>
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly'
    time?: string
    day?: number
  }
}

export interface WorkflowAction {
  actionType: string
  targetType?: string
  parameters: Record<string, any>
}

export interface Workflow {
  id: number
  tenantId: string
  name: string
  description?: string
  trigger: WorkflowTrigger
  actions: WorkflowAction[]
  priority: number
  enabled: boolean
  executionCount: number
  lastExecutedAt?: Date
  createdAt: Date
  updatedAt: Date
}

/**
 * Create workflow
 */
export async function createWorkflow(
  tenantId: string,
  workflow: {
    name: string
    description?: string
    trigger: WorkflowTrigger
    actions: WorkflowAction[]
    priority?: number
    enabled?: boolean
  }
): Promise<number> {
  const result = await prisma.workflow.create({
    data: {
      tenantId,
      name: workflow.name,
      description: workflow.description || null,
      trigger: JSON.stringify(workflow.trigger),
      actions: JSON.stringify(workflow.actions),
      priority: workflow.priority || 0,
      enabled: workflow.enabled ?? true,
    },
  })
  return result.id
}

/**
 * Get workflow by ID
 */
export async function getWorkflowById(tenantId: string, id: number): Promise<Workflow | null> {
  const workflow = await prisma.workflow.findFirst({
    where: { id, tenantId },
  })

  if (!workflow) return null

  return {
    id: workflow.id,
    tenantId: workflow.tenantId,
    name: workflow.name,
    description: workflow.description || undefined,
    trigger: JSON.parse(workflow.trigger),
    actions: JSON.parse(workflow.actions),
    priority: workflow.priority,
    enabled: workflow.enabled,
    executionCount: workflow.executionCount,
    lastExecutedAt: workflow.lastExecutedAt || undefined,
    createdAt: workflow.createdAt,
    updatedAt: workflow.updatedAt,
  }
}

/**
 * Get all workflows for a tenant
 */
export async function getAllWorkflows(
  tenantId: string,
  enabledOnly: boolean = false
): Promise<Workflow[]> {
  const workflows = await prisma.workflow.findMany({
    where: {
      tenantId,
      ...(enabledOnly ? { enabled: true } : {}),
    },
    orderBy: [
      { priority: 'desc' },
      { createdAt: 'desc' },
    ],
  })

  return workflows.map(workflow => ({
    id: workflow.id,
    tenantId: workflow.tenantId,
    name: workflow.name,
    description: workflow.description || undefined,
    trigger: JSON.parse(workflow.trigger),
    actions: JSON.parse(workflow.actions),
    priority: workflow.priority,
    enabled: workflow.enabled,
    executionCount: workflow.executionCount,
    lastExecutedAt: workflow.lastExecutedAt || undefined,
    createdAt: workflow.createdAt,
    updatedAt: workflow.updatedAt,
  }))
}

/**
 * Update workflow
 */
export async function updateWorkflow(
  tenantId: string,
  id: number,
  updates: Partial<Workflow>
): Promise<void> {
  const data: any = {}
  if (updates.name !== undefined) data.name = updates.name
  if (updates.description !== undefined) data.description = updates.description || null
  if (updates.trigger !== undefined) data.trigger = JSON.stringify(updates.trigger)
  if (updates.actions !== undefined) data.actions = JSON.stringify(updates.actions)
  if (updates.priority !== undefined) data.priority = updates.priority
  if (updates.enabled !== undefined) data.enabled = updates.enabled

  await prisma.workflow.updateMany({
    where: { id, tenantId },
    data,
  })
}

/**
 * Delete workflow
 */
export async function deleteWorkflow(tenantId: string, id: number): Promise<void> {
  await prisma.workflow.deleteMany({
    where: { id, tenantId },
  })
}

/**
 * Record workflow execution
 */
export async function recordWorkflowExecution(
  tenantId: string,
  workflowId: number,
  status: 'success' | 'failed' | 'skipped',
  triggerData?: Record<string, any>,
  executedActions?: WorkflowAction[],
  errorMessage?: string,
  idempotencyKey?: string
): Promise<void> {
  await prisma.workflowExecution.create({
    data: {
      tenantId,
      workflowId,
      status,
      triggerData: triggerData ? JSON.stringify(triggerData) : null,
      executedActions: executedActions ? JSON.stringify(executedActions) : null,
      errorMessage: errorMessage || null,
      idempotencyKey: idempotencyKey || null,
    },
  })

  // Update workflow execution count
  await prisma.workflow.updateMany({
    where: { id: workflowId, tenantId },
    data: {
      executionCount: { increment: 1 },
      lastExecutedAt: new Date(),
    },
  })
}
