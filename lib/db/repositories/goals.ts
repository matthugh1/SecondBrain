import { prisma } from '../index'

export interface Goal {
  id: number
  tenantId: string
  name: string
  description?: string
  targetDate?: Date
  status: 'active' | 'completed' | 'paused' | 'cancelled'
  progress: number // 0-100
  progressMethod: 'manual' | 'auto_from_items'
  createdAt: Date
  updatedAt: Date
}

export interface GoalWithLinks extends Goal {
  linkedProjects: Array<{ projectId: number; weight: number }>
  linkedIdeas: Array<{ ideaId: number; weight: number }>
}

/**
 * Create a goal
 */
export async function createGoal(
  tenantId: string,
  goal: {
    name: string
    description?: string
    targetDate?: Date
    progressMethod?: 'manual' | 'auto_from_items'
  }
): Promise<number> {
  const result = await prisma.goal.create({
    data: {
      tenantId,
      name: goal.name,
      description: goal.description || null,
      targetDate: goal.targetDate || null,
      progressMethod: goal.progressMethod || 'manual',
      status: 'active',
      progress: 0,
    },
  })
  return result.id
}

/**
 * Get goal by ID
 */
export async function getGoalById(tenantId: string, id: number): Promise<GoalWithLinks | null> {
  const goal = await prisma.goal.findFirst({
    where: { id, tenantId },
    include: {
      linkedProjects: {
        select: {
          projectId: true,
          weight: true,
        },
      },
      linkedIdeas: {
        select: {
          ideaId: true,
          weight: true,
        },
      },
    },
  })

  if (!goal) return null

  return {
    id: goal.id,
    tenantId: goal.tenantId,
    name: goal.name,
    description: goal.description || undefined,
    targetDate: goal.targetDate || undefined,
    status: goal.status as 'active' | 'completed' | 'paused' | 'cancelled',
    progress: goal.progress,
    progressMethod: goal.progressMethod as 'manual' | 'auto_from_items',
    createdAt: goal.createdAt,
    updatedAt: goal.updatedAt,
    linkedProjects: goal.linkedProjects.map(lp => ({
      projectId: lp.projectId,
      weight: lp.weight,
    })),
    linkedIdeas: goal.linkedIdeas.map(li => ({
      ideaId: li.ideaId,
      weight: li.weight,
    })),
  }
}

/**
 * Get all goals for a tenant
 */
export async function getAllGoals(
  tenantId: string,
  status?: 'active' | 'completed' | 'paused' | 'cancelled'
): Promise<Goal[]> {
  const goals = await prisma.goal.findMany({
    where: {
      tenantId,
      ...(status ? { status } : {}),
    },
    orderBy: [
      { status: 'asc' },
      { targetDate: 'asc' },
      { createdAt: 'desc' },
    ],
  })

  return goals.map(goal => ({
    id: goal.id,
    tenantId: goal.tenantId,
    name: goal.name,
    description: goal.description || undefined,
    targetDate: goal.targetDate || undefined,
    status: goal.status as 'active' | 'completed' | 'paused' | 'cancelled',
    progress: goal.progress,
    progressMethod: goal.progressMethod as 'manual' | 'auto_from_items',
    createdAt: goal.createdAt,
    updatedAt: goal.updatedAt,
  }))
}

/**
 * Update goal
 */
export async function updateGoal(
  tenantId: string,
  id: number,
  updates: Partial<Goal>
): Promise<void> {
  const data: any = {}
  if (updates.name !== undefined) data.name = updates.name
  if (updates.description !== undefined) data.description = updates.description || null
  if (updates.targetDate !== undefined) data.targetDate = updates.targetDate || null
  if (updates.status !== undefined) data.status = updates.status
  if (updates.progress !== undefined) data.progress = updates.progress
  if (updates.progressMethod !== undefined) data.progressMethod = updates.progressMethod

  await prisma.goal.updateMany({
    where: { id, tenantId },
    data,
  })
}

/**
 * Delete goal
 */
export async function deleteGoal(tenantId: string, id: number): Promise<void> {
  await prisma.goal.deleteMany({
    where: { id, tenantId },
  })
}

/**
 * Link project to goal
 */
export async function linkProjectToGoal(
  tenantId: string,
  goalId: number,
  projectId: number,
  weight: number = 1.0
): Promise<void> {
  await prisma.goalProject.upsert({
    where: {
      tenantId_goalId_projectId: {
        tenantId,
        goalId,
        projectId,
      },
    },
    create: {
      tenantId,
      goalId,
      projectId,
      weight,
    },
    update: {
      weight,
    },
  })
}

/**
 * Link idea to goal
 */
export async function linkIdeaToGoal(
  tenantId: string,
  goalId: number,
  ideaId: number,
  weight: number = 1.0
): Promise<void> {
  await prisma.goalIdea.upsert({
    where: {
      tenantId_goalId_ideaId: {
        tenantId,
        goalId,
        ideaId,
      },
    },
    create: {
      tenantId,
      goalId,
      ideaId,
      weight,
    },
    update: {
      weight,
    },
  })
}

/**
 * Unlink project from goal
 */
export async function unlinkProjectFromGoal(
  tenantId: string,
  goalId: number,
  projectId: number
): Promise<void> {
  await prisma.goalProject.deleteMany({
    where: {
      tenantId,
      goalId,
      projectId,
    },
  })
}

/**
 * Unlink idea from goal
 */
export async function unlinkIdeaFromGoal(
  tenantId: string,
  goalId: number,
  ideaId: number
): Promise<void> {
  await prisma.goalIdea.deleteMany({
    where: {
      tenantId,
      goalId,
      ideaId,
    },
  })
}

/**
 * Record progress history
 */
export async function recordProgress(
  tenantId: string,
  goalId: number,
  progress: number
): Promise<void> {
  await prisma.goalProgress.create({
    data: {
      tenantId,
      goalId,
      progress,
    },
  })
}

/**
 * Get progress history
 */
export async function getProgressHistory(
  tenantId: string,
  goalId: number,
  limit: number = 30
): Promise<Array<{ progress: number; recordedAt: Date }>> {
  const history = await prisma.goalProgress.findMany({
    where: { tenantId, goalId },
    orderBy: { recordedAt: 'desc' },
    take: limit,
    select: {
      progress: true,
      recordedAt: true,
    },
  })

  return history.map(h => ({
    progress: h.progress,
    recordedAt: h.recordedAt,
  }))
}
