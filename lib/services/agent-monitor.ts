import * as projectsRepo from '@/lib/db/repositories/projects'
import * as ideasRepo from '@/lib/db/repositories/ideas'
import * as adminRepo from '@/lib/db/repositories/admin'
import * as peopleRepo from '@/lib/db/repositories/people'
import * as relationshipsRepo from '@/lib/db/repositories/relationships'
import { prisma } from '@/lib/db/index'

export interface MonitoringResult {
  type: 'stale_item' | 'overdue_task' | 'unlinked_relationship' | 'pattern_anomaly'
  itemType: string
  itemId: number
  itemName: string
  description: string
  priority: 'low' | 'medium' | 'high'
}

/**
 * Monitor system state and identify opportunities
 */
export async function monitorSystemState(
  tenantId: string,
  userId: string
): Promise<MonitoringResult[]> {
  const results: MonitoringResult[] = []

  // Check for stale projects
  const projects = await projectsRepo.getAllProjects(tenantId, false)
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  for (const project of projects) {
    if (project.status === 'Done' || project.status === 'Someday') continue

    const projectRecord = await prisma.project.findFirst({
      where: { id: project.id, tenantId },
      select: { updatedAt: true, createdAt: true },
    })

    if (projectRecord && project.id) {
      const updatedAt = projectRecord.updatedAt || projectRecord.createdAt
      if (updatedAt < thirtyDaysAgo) {
        const daysSince = Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24))
        results.push({
          type: 'stale_item',
          itemType: 'projects',
          itemId: project.id,
          itemName: project.name,
          description: `Project "${project.name}" hasn't been updated in ${daysSince} days`,
          priority: 'medium',
        })
      }
    }
  }

  // Check for overdue tasks
  const adminTasks = await adminRepo.getAllAdmin(tenantId, false)
  for (const task of adminTasks) {
    if (task.id && task.due_date && new Date(task.due_date) < now) {
      results.push({
        type: 'overdue_task',
        itemType: 'admin',
        itemId: task.id,
        itemName: task.name,
        description: `Task "${task.name}" is overdue`,
        priority: 'high',
      })
    }
  }

  // Check for ideas that could become projects
  const ideas = await ideasRepo.getAllIdeas(tenantId, false)
  for (const idea of ideas) {
    if (!idea.id) continue
    const relationships = await relationshipsRepo.getRelationshipsForSource(
      tenantId,
      'ideas',
      idea.id
    )
    
    if (relationships.length >= 3) {
      results.push({
        type: 'pattern_anomaly',
        itemType: 'ideas',
        itemId: idea.id,
        itemName: idea.name,
        description: `Idea "${idea.name}" is mentioned ${relationships.length} times - consider converting to project`,
        priority: 'medium',
      })
    }
  }

  // Check for people needing follow-ups
  const people = await peopleRepo.getAllPeople(tenantId, false)
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

  for (const person of people) {
    if (!person.id) continue
    if (person.last_touched) {
      const lastTouched = new Date(person.last_touched)
      if (lastTouched < twoWeeksAgo) {
        // Check if person is mentioned in active projects
        const relationships = await relationshipsRepo.getRelationshipsForTarget(
          tenantId,
          'people',
          person.id
        )
        
        const mentionedInProjects = relationships.some(
          rel => rel.sourceType === 'projects'
        )

        if (mentionedInProjects) {
          const daysSince = Math.floor((now.getTime() - lastTouched.getTime()) / (1000 * 60 * 60 * 24))
          results.push({
            type: 'unlinked_relationship',
            itemType: 'people',
            itemId: person.id,
            itemName: person.name,
            description: `${person.name} mentioned in projects but hasn't been touched in ${daysSince} days - create follow-up?`,
            priority: 'medium',
          })
        }
      }
    }
  }

  return results
}
