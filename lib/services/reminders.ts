import * as remindersRepo from '@/lib/db/repositories/reminders'
import * as adminRepo from '@/lib/db/repositories/admin'
import * as ideasRepo from '@/lib/db/repositories/ideas'
import * as peopleRepo from '@/lib/db/repositories/people'
import * as relationshipsRepo from '@/lib/db/repositories/relationships'
import { prisma } from '@/lib/db/index'
import type { Category } from '@/types'

/**
 * Generate due date reminders for admin tasks
 */
export async function generateDueDateReminders(
  tenantId: string,
  userId: string
): Promise<void> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Get tasks due today or tomorrow
  const adminTasks = await adminRepo.getAllAdmin(tenantId, false)
  
  for (const task of adminTasks) {
    if (!task.due_date) continue

    const dueDate = new Date(task.due_date)
    dueDate.setHours(0, 0, 0, 0)

    // Check if due today or tomorrow
    const isDueToday = dueDate.getTime() === today.getTime()
    const isDueTomorrow = dueDate.getTime() === tomorrow.getTime()
    const isOverdue = dueDate.getTime() < today.getTime()

    if (isDueToday || isDueTomorrow || isOverdue) {
      // Check if reminder already exists
      const existingReminders = await remindersRepo.getActiveReminders(
        tenantId,
        userId,
        'due_date'
      )
      const alreadyReminded = existingReminders.some(
        r => r.itemType === 'admin' && r.itemId === task.id
      )

      if (!alreadyReminded && task.id) {
        const priority = isOverdue ? 'high' : isDueToday ? 'high' : 'medium'
        const message = isOverdue
          ? `Overdue: ${task.name} was due ${task.due_date}`
          : isDueToday
          ? `Due today: ${task.name}`
          : `Due tomorrow: ${task.name}`

        await remindersRepo.createReminder(
          tenantId,
          userId,
          'due_date',
          'admin',
          task.id,
          task.name,
          message,
          dueDate,
          priority
        )
      }
    }
  }
}

/**
 * Generate follow-up reminders for people
 */
export async function generateFollowUpReminders(
  tenantId: string,
  userId: string,
  daysThreshold: number = 14
): Promise<void> {
  const people = await peopleRepo.getAllPeople(tenantId, false)
  const thresholdDate = new Date()
  thresholdDate.setDate(thresholdDate.getDate() - daysThreshold)

  for (const person of people) {
    if (!person.last_touched) continue

    if (!person.id) continue
    const lastTouched = new Date(person.last_touched)
    if (lastTouched < thresholdDate) {
      // Check if person is mentioned in active projects (higher priority)
      const relationships = await relationshipsRepo.getRelationshipsForTarget(
        tenantId,
        'people',
        person.id
      )
      
      const mentionedInProjects = relationships.some(
        rel => rel.sourceType === 'projects' && rel.mentionCount > 0
      )

      const priority = mentionedInProjects ? 'high' : 'medium'
      const daysSince = Math.floor((Date.now() - lastTouched.getTime()) / (1000 * 60 * 60 * 24))

      // Check if reminder already exists
      const existingReminders = await remindersRepo.getActiveReminders(
        tenantId,
        userId,
        'follow_up'
      )
      const alreadyReminded = existingReminders.some(
        r => r.itemType === 'people' && r.itemId === person.id
      )

      if (!alreadyReminded) {
        await remindersRepo.createReminder(
          tenantId,
          userId,
          'follow_up',
          'people',
          person.id,
          person.name,
          `You haven't touched ${person.name} in ${daysSince} days${mentionedInProjects ? ' (mentioned in active projects)' : ''}`,
          undefined,
          priority
        )
      }
    }
  }
}

/**
 * Generate stale item alerts
 */
export async function generateStaleItemAlerts(
  tenantId: string,
  userId: string,
  projectDays: number = 30,
  ideaDays: number = 60
): Promise<void> {
  const now = new Date()
  const projectThreshold = new Date(now.getTime() - projectDays * 24 * 60 * 60 * 1000)
  const ideaThreshold = new Date(now.getTime() - ideaDays * 24 * 60 * 60 * 1000)

  // Check projects - need to get from Prisma directly to access updatedAt
  const projects = await prisma.project.findMany({
    where: {
      tenantId,
      archived: 0,
      status: { notIn: ['Done', 'Someday'] },
    },
    select: {
      id: true,
      name: true,
      status: true,
      updatedAt: true,
      createdAt: true,
    },
  })

  for (const project of projects) {
    if (!project.id) continue
    const updatedAt = project.updatedAt || project.createdAt
    if (updatedAt && new Date(updatedAt) < projectThreshold) {
      // Check if already reminded
      const existingReminders = await remindersRepo.getActiveReminders(
        tenantId,
        userId,
        'stale_item'
      )
      const alreadyReminded = existingReminders.some(
        r => r.itemType === 'projects' && r.itemId === project.id
      )

      if (!alreadyReminded && project.id) {
        const daysSince = Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24))
        await remindersRepo.createReminder(
          tenantId,
          userId,
          'stale_item',
          'projects',
          project.id,
          project.name,
          `Project "${project.name}" hasn't been updated in ${daysSince} days`,
          undefined,
          'medium'
        )
      }
    }
  }

  // Check ideas
  const ideas = await ideasRepo.getAllIdeas(tenantId, false)
  for (const idea of ideas) {
    if (!idea.id || !idea.last_touched) continue

    const lastTouched = new Date(idea.last_touched)
    if (lastTouched < ideaThreshold) {
      // Check if already reminded
      const existingReminders = await remindersRepo.getActiveReminders(
        tenantId,
        userId,
        'stale_item'
      )
      const alreadyReminded = existingReminders.some(
        r => r.itemType === 'ideas' && r.itemId === idea.id
      )

      if (!alreadyReminded && idea.id) {
        const daysSince = Math.floor((now.getTime() - lastTouched.getTime()) / (1000 * 60 * 60 * 24))
        await remindersRepo.createReminder(
          tenantId,
          userId,
          'stale_item',
          'ideas',
          idea.id,
          idea.name,
          `Idea "${idea.name}" hasn't been touched in ${daysSince} days`,
          undefined,
          'low'
        )
      }
    }
  }
}

/**
 * Generate all reminders for a user
 */
export async function generateAllReminders(
  tenantId: string,
  userId: string
): Promise<void> {
  // Check preferences before generating
  const shouldGenerateDueDate = await remindersRepo.shouldSendReminder(
    tenantId,
    userId,
    'due_date'
  )
  const shouldGenerateFollowUp = await remindersRepo.shouldSendReminder(
    tenantId,
    userId,
    'follow_up'
  )
  const shouldGenerateStale = await remindersRepo.shouldSendReminder(
    tenantId,
    userId,
    'stale_item'
  )

  if (shouldGenerateDueDate) {
    await generateDueDateReminders(tenantId, userId).catch(err =>
      console.error('Error generating due date reminders:', err)
    )
  }

  if (shouldGenerateFollowUp) {
    await generateFollowUpReminders(tenantId, userId).catch(err =>
      console.error('Error generating follow-up reminders:', err)
    )
  }

  if (shouldGenerateStale) {
    await generateStaleItemAlerts(tenantId, userId).catch(err =>
      console.error('Error generating stale item alerts:', err)
    )
  }
}

/**
 * Clean up old completed/dismissed reminders
 */
export async function cleanupOldReminders(tenantId: string, daysOld: number = 30): Promise<void> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysOld)

  await prisma.reminder.deleteMany({
    where: {
      tenantId,
      status: { in: ['completed', 'dismissed'] },
      updatedAt: { lt: cutoffDate },
    },
  })
}
