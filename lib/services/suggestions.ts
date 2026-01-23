import * as adminRepo from '@/lib/db/repositories/admin'
import * as projectsRepo from '@/lib/db/repositories/projects'
import * as peopleRepo from '@/lib/db/repositories/people'
import { prisma } from '@/lib/db/index'

export interface ActionSuggestion {
  type: 'overdue_task' | 'stale_project' | 'follow_up' | 'pattern_match'
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  action: {
    type: string
    targetType?: string
    targetId?: number
    parameters?: Record<string, any>
  }
}

/**
 * Generate next action suggestions
 */
export async function generateActionSuggestions(
  tenantId: string,
  userId: string
): Promise<ActionSuggestion[]> {
  const suggestions: ActionSuggestion[] = []
  const now = new Date()

  // Overdue tasks
  const adminTasks = await adminRepo.getAllAdmin(tenantId, false)
  for (const task of adminTasks) {
    if (task.due_date && new Date(task.due_date) < now) {
      suggestions.push({
        type: 'overdue_task',
        title: `Complete: ${task.name}`,
        description: `Task is overdue`,
        priority: 'high',
        action: {
          type: 'update',
          targetType: 'admin',
          targetId: task.id,
          parameters: { status: 'Done' },
        },
      })
    }
  }

  // Stale projects
  const projects = await projectsRepo.getAllProjects(tenantId, false)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  for (const project of projects) {
    if (project.status === 'Done' || project.status === 'Someday') continue

    const projectRecord = await prisma.project.findFirst({
      where: { id: project.id, tenantId },
      select: { updatedAt: true, createdAt: true },
    })

    if (projectRecord) {
      const updatedAt = projectRecord.updatedAt || projectRecord.createdAt
      if (updatedAt < thirtyDaysAgo) {
        suggestions.push({
          type: 'stale_project',
          title: `Update: ${project.name}`,
          description: `Project hasn't been updated in 30+ days`,
          priority: 'medium',
          action: {
            type: 'update',
            targetType: 'projects',
            targetId: project.id,
          },
        })
      }
    }
  }

  // Follow-ups needed
  const people = await peopleRepo.getAllPeople(tenantId, false)
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

  for (const person of people) {
    if (person.last_touched) {
      const lastTouched = new Date(person.last_touched)
      if (lastTouched < twoWeeksAgo) {
        suggestions.push({
          type: 'follow_up',
          title: `Follow up with ${person.name}`,
          description: `Haven't touched in 14+ days`,
          priority: 'medium',
          action: {
            type: 'create',
            targetType: 'admin',
            parameters: {
              name: `Follow up: ${person.name}`,
              category: 'admin',
            },
          },
        })
      }
    }
  }

  // Sort by priority
  const priorityOrder = { high: 3, medium: 2, low: 1 }
  return suggestions.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])
}
