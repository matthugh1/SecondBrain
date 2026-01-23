import { prisma } from '../index'
import type { PlanStep } from '@/lib/services/action-planner'

export type PlanStatus = 'draft' | 'approved' | 'executing' | 'completed' | 'failed' | 'cancelled'

export interface Plan {
  id: number
  tenantId: string
  userId: string
  name: string
  description?: string
  request: string
  steps: PlanStep[]
  status: PlanStatus
  approvedAt?: Date
  startedAt?: Date
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
}

/**
 * Create a plan
 */
export async function createPlan(
  tenantId: string,
  userId: string,
  plan: {
    name: string
    description?: string
    request: string
    steps: PlanStep[]
  }
): Promise<number> {
  const result = await prisma.plan.create({
    data: {
      tenantId,
      userId,
      name: plan.name,
      description: plan.description || null,
      request: plan.request,
      steps: JSON.stringify(plan.steps),
      status: 'draft',
    },
  })

  // Create plan steps
  for (const step of plan.steps) {
    await prisma.planStep.create({
      data: {
        tenantId,
        planId: result.id,
        stepOrder: step.stepOrder,
        actionType: step.actionType,
        actionParams: JSON.stringify(step.actionParams),
        dependencies: step.dependencies ? JSON.stringify(step.dependencies) : null,
        status: 'pending',
      },
    })
  }

  return result.id
}

/**
 * Get plan by ID
 */
export async function getPlanById(tenantId: string, id: number): Promise<Plan | null> {
  const plan = await prisma.plan.findFirst({
    where: { id, tenantId },
    include: {
      planSteps: {
        orderBy: { stepOrder: 'asc' },
      },
    },
  })

  if (!plan) return null

  return {
    id: plan.id,
    tenantId: plan.tenantId,
    userId: plan.userId,
    name: plan.name,
    description: plan.description || undefined,
    request: plan.request,
    steps: plan.planSteps.map(step => ({
      stepOrder: step.stepOrder,
      actionType: step.actionType,
      actionParams: JSON.parse(step.actionParams),
      dependencies: step.dependencies ? JSON.parse(step.dependencies) : undefined,
      description: '', // Not stored separately
      status: step.status as any,
      result: step.result ? JSON.parse(step.result) : undefined,
      errorMessage: step.errorMessage || undefined,
      executedAt: step.executedAt || undefined,
    })),
    status: plan.status as PlanStatus,
    approvedAt: plan.approvedAt || undefined,
    startedAt: plan.startedAt || undefined,
    completedAt: plan.completedAt || undefined,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
  }
}

/**
 * Get all plans for a user
 */
export async function getAllPlans(
  tenantId: string,
  userId?: string,
  status?: PlanStatus
): Promise<Plan[]> {
  const plans = await prisma.plan.findMany({
    where: {
      tenantId,
      ...(userId ? { userId } : {}),
      ...(status ? { status } : {}),
    },
    include: {
      planSteps: {
        orderBy: { stepOrder: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return plans.map(plan => ({
    id: plan.id,
    tenantId: plan.tenantId,
    userId: plan.userId,
    name: plan.name,
    description: plan.description || undefined,
    request: plan.request,
    steps: plan.planSteps.map(step => ({
      stepOrder: step.stepOrder,
      actionType: step.actionType,
      actionParams: JSON.parse(step.actionParams),
      dependencies: step.dependencies ? JSON.parse(step.dependencies) : undefined,
      description: '',
      status: step.status as any,
      result: step.result ? JSON.parse(step.result) : undefined,
      errorMessage: step.errorMessage || undefined,
      executedAt: step.executedAt || undefined,
    })),
    status: plan.status as PlanStatus,
    approvedAt: plan.approvedAt || undefined,
    startedAt: plan.startedAt || undefined,
    completedAt: plan.completedAt || undefined,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
  }))
}

/**
 * Update plan status
 */
export async function updatePlanStatus(
  tenantId: string,
  planId: number,
  status: PlanStatus,
  approvedAt?: Date,
  startedAt?: Date,
  completedAt?: Date
): Promise<void> {
  const data: any = { status }
  if (approvedAt) data.approvedAt = approvedAt
  if (startedAt) data.startedAt = startedAt
  if (completedAt) data.completedAt = completedAt

  await prisma.plan.updateMany({
    where: { id: planId, tenantId },
    data,
  })
}

/**
 * Update plan steps
 */
export async function updatePlanSteps(
  tenantId: string,
  planId: number,
  steps: PlanStep[]
): Promise<void> {
  // Delete existing steps
  await prisma.planStep.deleteMany({
    where: { tenantId, planId },
  })

  // Create new steps
  for (const step of steps) {
    await prisma.planStep.create({
      data: {
        tenantId,
        planId,
        stepOrder: step.stepOrder,
        actionType: step.actionType,
        actionParams: JSON.stringify(step.actionParams),
        dependencies: step.dependencies ? JSON.stringify(step.dependencies) : null,
        status: 'pending',
      },
    })
  }
}

/**
 * Update step status
 */
export async function updateStepStatus(
  tenantId: string,
  planId: number,
  stepOrder: number,
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'skipped',
  result?: Record<string, any>,
  errorMessage?: string
): Promise<void> {
  const data: any = { status }
  if (result) data.result = JSON.stringify(result)
  if (errorMessage) data.errorMessage = errorMessage
  if (status === 'executing' || status === 'completed') {
    data.executedAt = new Date()
  }

  await prisma.planStep.updateMany({
    where: {
      tenantId,
      planId,
      stepOrder,
    },
    data,
  })
}
