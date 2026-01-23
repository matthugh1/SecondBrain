import { prisma } from '../index'
import type { Category } from '@/types'

export type ActionType = 'create' | 'update' | 'delete' | 'link' | 'notify' | 'schedule'
export type ActionStatus = 'pending' | 'approved' | 'executing' | 'executed' | 'rejected' | 'failed'

export interface AgentAction {
  id: number
  tenantId: string
  userId?: string
  actionType: ActionType
  targetType?: Category
  targetId?: number
  parameters: Record<string, any>
  status: ActionStatus
  requiresApproval: boolean
  approvedBy?: string
  approvedAt?: Date
  executedAt?: Date
  result?: Record<string, any>
  errorMessage?: string
  rollbackData?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

/**
 * Create an action
 */
export async function createAction(
  tenantId: string,
  action: {
    userId?: string
    actionType: ActionType
    targetType?: Category
    targetId?: number
    parameters: Record<string, any>
    requiresApproval?: boolean
  }
): Promise<number> {
  const result = await prisma.agentAction.create({
    data: {
      tenantId,
      userId: action.userId || null,
      actionType: action.actionType,
      targetType: action.targetType || null,
      targetId: action.targetId || null,
      parameters: JSON.stringify(action.parameters),
      requiresApproval: action.requiresApproval ?? true,
      status: 'pending',
    },
  })
  return result.id
}

/**
 * Get action by ID
 */
export async function getActionById(tenantId: string, id: number): Promise<AgentAction | null> {
  const action = await prisma.agentAction.findFirst({
    where: { id, tenantId },
  })

  if (!action) return null

  return {
    id: action.id,
    tenantId: action.tenantId,
    userId: action.userId || undefined,
    actionType: action.actionType as ActionType,
    targetType: action.targetType as Category | undefined,
    targetId: action.targetId || undefined,
    parameters: JSON.parse(action.parameters),
    status: action.status as ActionStatus,
    requiresApproval: action.requiresApproval,
    approvedBy: action.approvedBy || undefined,
    approvedAt: action.approvedAt || undefined,
    executedAt: action.executedAt || undefined,
    result: action.result ? JSON.parse(action.result) : undefined,
    errorMessage: action.errorMessage || undefined,
    rollbackData: action.rollbackData ? JSON.parse(action.rollbackData) : undefined,
    createdAt: action.createdAt,
    updatedAt: action.updatedAt,
  }
}

/**
 * Get pending actions requiring approval
 */
export async function getPendingActions(tenantId: string, userId?: string): Promise<AgentAction[]> {
  const actions = await prisma.agentAction.findMany({
    where: {
      tenantId,
      status: 'pending',
      requiresApproval: true,
      ...(userId ? { userId } : {}),
    },
    orderBy: { createdAt: 'asc' },
  })

  return actions.map(action => ({
    id: action.id,
    tenantId: action.tenantId,
    userId: action.userId || undefined,
    actionType: action.actionType as ActionType,
    targetType: action.targetType as Category | undefined,
    targetId: action.targetId || undefined,
    parameters: JSON.parse(action.parameters),
    status: action.status as ActionStatus,
    requiresApproval: action.requiresApproval,
    approvedBy: action.approvedBy || undefined,
    approvedAt: action.approvedAt || undefined,
    executedAt: action.executedAt || undefined,
    result: action.result ? JSON.parse(action.result) : undefined,
    errorMessage: action.errorMessage || undefined,
    rollbackData: action.rollbackData ? JSON.parse(action.rollbackData) : undefined,
    createdAt: action.createdAt,
    updatedAt: action.updatedAt,
  }))
}

/**
 * Get action history
 */
export async function getActionHistory(
  tenantId: string,
  options: {
    userId?: string
    actionType?: ActionType
    status?: ActionStatus
    limit?: number
  } = {}
): Promise<AgentAction[]> {
  const actions = await prisma.agentAction.findMany({
    where: {
      tenantId,
      ...(options.userId ? { userId: options.userId } : {}),
      ...(options.actionType ? { actionType: options.actionType } : {}),
      ...(options.status ? { status: options.status } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: options.limit || 100,
  })

  return actions.map(action => ({
    id: action.id,
    tenantId: action.tenantId,
    userId: action.userId || undefined,
    actionType: action.actionType as ActionType,
    targetType: action.targetType as Category | undefined,
    targetId: action.targetId || undefined,
    parameters: JSON.parse(action.parameters),
    status: action.status as ActionStatus,
    requiresApproval: action.requiresApproval,
    approvedBy: action.approvedBy || undefined,
    approvedAt: action.approvedAt || undefined,
    executedAt: action.executedAt || undefined,
    result: action.result ? JSON.parse(action.result) : undefined,
    errorMessage: action.errorMessage || undefined,
    rollbackData: action.rollbackData ? JSON.parse(action.rollbackData) : undefined,
    createdAt: action.createdAt,
    updatedAt: action.updatedAt,
  }))
}

/**
 * Approve action
 */
export async function approveAction(
  tenantId: string,
  actionId: number,
  approvedBy: string
): Promise<void> {
  await prisma.agentAction.updateMany({
    where: {
      id: actionId,
      tenantId,
      status: 'pending',
    },
    data: {
      status: 'approved',
      approvedBy,
      approvedAt: new Date(),
      updatedAt: new Date(),
    },
  })
}

/**
 * Reject action
 */
export async function rejectAction(
  tenantId: string,
  actionId: number,
  reason?: string
): Promise<void> {
  await prisma.agentAction.updateMany({
    where: {
      id: actionId,
      tenantId,
      status: 'pending',
    },
    data: {
      status: 'rejected',
      errorMessage: reason || 'Rejected by user',
      updatedAt: new Date(),
    },
  })
}

/**
 * Update action status
 */
export async function updateActionStatus(
  tenantId: string,
  actionId: number,
  status: ActionStatus,
  result?: Record<string, any>,
  errorMessage?: string,
  rollbackData?: Record<string, any>
): Promise<void> {
  const data: any = {
    status,
    updatedAt: new Date(),
  }

  if (status === 'executing' || status === 'executed') {
    data.executedAt = new Date()
  }

  if (result) {
    data.result = JSON.stringify(result)
  }

  if (errorMessage) {
    data.errorMessage = errorMessage
  }

  if (rollbackData) {
    data.rollbackData = JSON.stringify(rollbackData)
  }

  await prisma.agentAction.updateMany({
    where: {
      id: actionId,
      tenantId,
    },
    data,
  })
}

/**
 * Store rollback data before execution
 */
export async function storeRollbackData(
  tenantId: string,
  actionId: number,
  rollbackData: Record<string, any>
): Promise<void> {
  await prisma.agentAction.updateMany({
    where: {
      id: actionId,
      tenantId,
    },
    data: {
      rollbackData: JSON.stringify(rollbackData),
      updatedAt: new Date(),
    },
  })
}
