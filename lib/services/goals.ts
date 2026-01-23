import * as goalsRepo from '@/lib/db/repositories/goals'
import * as projectsRepo from '@/lib/db/repositories/projects'
import { prisma } from '@/lib/db/index'

/**
 * Calculate progress for a goal based on linked items
 */
export async function calculateGoalProgress(
  tenantId: string,
  goalId: number
): Promise<number> {
  const goal = await goalsRepo.getGoalById(tenantId, goalId)
  if (!goal || goal.progressMethod !== 'auto_from_items') {
    return goal?.progress || 0
  }

  // Get linked projects
  const linkedProjects = await prisma.goalProject.findMany({
    where: { tenantId, goalId },
    include: {
      project: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  })

  // Get linked ideas
  const linkedIdeas = await prisma.goalIdea.findMany({
    where: { tenantId, goalId },
  })

  if (linkedProjects.length === 0 && linkedIdeas.length === 0) {
    return 0
  }

  // Calculate progress from projects
  let totalWeight = 0
  let completedWeight = 0

  for (const link of linkedProjects) {
    totalWeight += link.weight
    if (link.project.status === 'Done') {
      completedWeight += link.weight
    }
  }

  // Ideas don't directly contribute to progress, but conversions do
  // For now, we'll just count projects

  const progress = totalWeight > 0 ? (completedWeight / totalWeight) * 100 : 0

  // Update goal progress
  await goalsRepo.updateGoal(tenantId, goalId, { progress })
  
  // Record progress history
  await goalsRepo.recordProgress(tenantId, goalId, progress)

  return progress
}

/**
 * Update progress for all goals linked to a project
 */
export async function updateProgressForProject(
  tenantId: string,
  projectId: number
): Promise<void> {
  const goalProjects = await prisma.goalProject.findMany({
    where: { tenantId, projectId },
    select: { goalId: true },
  })

  for (const link of goalProjects) {
    await calculateGoalProgress(tenantId, link.goalId).catch(err =>
      console.error(`Error calculating progress for goal ${link.goalId}:`, err)
    )
  }
}

/**
 * Get goals linked to a project
 */
export async function getGoalsForProject(
  tenantId: string,
  projectId: number
): Promise<Array<{ id: number; name: string; progress: number }>> {
  const goalProjects = await prisma.goalProject.findMany({
    where: { tenantId, projectId },
    include: {
      goal: {
        select: {
          id: true,
          name: true,
          progress: true,
        },
      },
    },
  })

  return goalProjects.map(gp => ({
    id: gp.goal.id,
    name: gp.goal.name,
    progress: gp.goal.progress,
  }))
}

/**
 * Get goals linked to an idea
 */
export async function getGoalsForIdea(
  tenantId: string,
  ideaId: number
): Promise<Array<{ id: number; name: string; progress: number }>> {
  const goalIdeas = await prisma.goalIdea.findMany({
    where: { tenantId, ideaId },
    include: {
      goal: {
        select: {
          id: true,
          name: true,
          progress: true,
        },
      },
    },
  })

  return goalIdeas.map(gi => ({
    id: gi.goal.id,
    name: gi.goal.name,
    progress: gi.goal.progress,
  }))
}

/**
 * Generate goal insights for weekly review
 */
export async function generateGoalInsights(tenantId: string): Promise<{
  activeGoals: number
  completedThisWeek: number
  atRisk: number
  recommendations: string[]
}> {
  const goals = await goalsRepo.getAllGoals(tenantId)
  const now = new Date()
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const activeGoals = goals.filter(g => g.status === 'active').length
  const completedThisWeek = goals.filter(
    g => g.status === 'completed' && g.updatedAt >= oneWeekAgo
  ).length

  const atRisk = goals.filter(g => {
    if (g.status !== 'active' || !g.targetDate) return false
    const daysUntilTarget = (g.targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    const expectedProgress = Math.max(0, 100 - (daysUntilTarget / 30) * 100) // Assume 30-day goals
    return g.progress < expectedProgress - 10 // 10% behind schedule
  }).length

  const recommendations: string[] = []
  if (atRisk > 0) {
    recommendations.push(`${atRisk} goal${atRisk !== 1 ? 's' : ''} ${atRisk !== 1 ? 'are' : 'is'} behind schedule`)
  }
  if (completedThisWeek > 0) {
    recommendations.push(`Great progress! ${completedThisWeek} goal${completedThisWeek !== 1 ? 's' : ''} completed this week`)
  }

  return {
    activeGoals,
    completedThisWeek,
    atRisk,
    recommendations,
  }
}
