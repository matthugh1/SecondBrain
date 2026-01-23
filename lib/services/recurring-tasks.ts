import * as adminRepo from '@/lib/db/repositories/admin'
import type { Admin } from '@/types'

interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  interval?: number // e.g., every 2 weeks
  count?: number // number of occurrences
  until?: string // end date (ISO string)
  byDay?: string[] // ['MO', 'TU', 'WE'] for weekly
  byMonthDay?: number[] // [1, 15] for monthly
}

/**
 * Parse recurrence rule from JSON string
 */
export function parseRecurrenceRule(ruleString: string): RecurrenceRule | null {
  try {
    return JSON.parse(ruleString)
  } catch {
    return null
  }
}

/**
 * Generate next occurrence date based on recurrence rule
 */
export function getNextOccurrence(
  startDate: Date,
  rule: RecurrenceRule,
  lastOccurrence?: Date
): Date | null {
  const baseDate = lastOccurrence || startDate
  const nextDate = new Date(baseDate)
  const interval = rule.interval || 1

  switch (rule.frequency) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + interval)
      break
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + (7 * interval))
      break
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + interval)
      break
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + interval)
      break
    default:
      return null
  }

  // Check if we've exceeded the until date
  if (rule.until) {
    const untilDate = new Date(rule.until)
    if (nextDate > untilDate) {
      return null
    }
  }

  return nextDate
}

/**
 * Generate all occurrences up to a certain date
 */
export function generateOccurrences(
  startDate: Date,
  rule: RecurrenceRule,
  upToDate: Date
): Date[] {
  const occurrences: Date[] = []
  let currentDate = new Date(startDate)
  let count = 0

  while (currentDate <= upToDate) {
    occurrences.push(new Date(currentDate))
    count++

    // Check count limit
    if (rule.count && count >= rule.count) {
      break
    }

    // Check until date
    if (rule.until) {
      const untilDate = new Date(rule.until)
      if (currentDate >= untilDate) {
        break
      }
    }

    const nextDate = getNextOccurrence(startDate, rule, currentDate)
    if (!nextDate) {
      break
    }
    currentDate = nextDate
  }

  return occurrences
}

/**
 * Auto-create recurring task instances
 */
export async function createRecurringInstances(
  tenantId: string,
  taskId: number
): Promise<number> {
  const task = await adminRepo.getAdminById(tenantId, taskId)
  if (!task || !task.recurrenceRule) {
    return 0
  }

  const rule = parseRecurrenceRule(task.recurrenceRule)
  if (!rule) {
    return 0
  }

  const startDate = task.startDate ? new Date(task.startDate) : new Date()
  const dueDate = task.due_date ? new Date(task.due_date) : new Date()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Generate occurrences for the next 30 days
  const futureDate = new Date(today)
  futureDate.setDate(futureDate.getDate() + 30)

  const occurrences = generateOccurrences(startDate, rule, futureDate)
  let created = 0

  for (const occurrenceDate of occurrences) {
    // Only create if it's in the future
    if (occurrenceDate < today) {
      continue
    }

    // Check if instance already exists (same name and due date)
    const existingTasks = await adminRepo.getAllAdmin(tenantId, false)
    const alreadyExists = existingTasks.some(
      t => t.name === task.name && t.due_date === occurrenceDate.toISOString().split('T')[0]
    )

    if (!alreadyExists) {
      const newTask: Admin = {
        name: task.name,
        due_date: occurrenceDate.toISOString().split('T')[0],
        startDate: occurrenceDate.toISOString(),
        status: task.status || 'Todo',
        priority: task.priority || 'medium',
        notes: task.notes,
        recurrenceRule: task.recurrenceRule,
        projectId: task.projectId,
      }

      await adminRepo.createAdmin(tenantId, newTask)
      created++
    }
  }

  return created
}

/**
 * Process all recurring tasks and create instances
 */
export async function processAllRecurringTasks(tenantId: string): Promise<{
  processed: number
  created: number
  errors: string[]
}> {
  const recurringTasks = await adminRepo.getRecurringTasks(tenantId)
  const errors: string[] = []
  let created = 0

  for (const task of recurringTasks) {
    try {
      const count = await createRecurringInstances(tenantId, task.id!)
      created += count
    } catch (error: any) {
      errors.push(`Task ${task.id}: ${error.message}`)
    }
  }

  return {
    processed: recurringTasks.length,
    created,
    errors,
  }
}

/**
 * Handle completion of recurring task
 */
export async function handleRecurringTaskCompletion(
  tenantId: string,
  taskId: number
): Promise<void> {
  const task = await adminRepo.getAdminById(tenantId, taskId)
  if (!task || !task.recurrenceRule) {
    return
  }

  const rule = parseRecurrenceRule(task.recurrenceRule)
  if (!rule) {
    return
  }

  // Create next occurrence
  const startDate = task.startDate ? new Date(task.startDate) : new Date()
  const dueDate = task.due_date ? new Date(task.due_date) : new Date()
  const nextDate = getNextOccurrence(startDate, rule, dueDate)

  if (nextDate) {
    const newTask: Admin = {
      name: task.name,
      due_date: nextDate.toISOString().split('T')[0],
      startDate: nextDate.toISOString(),
      status: 'Todo',
      priority: task.priority || 'medium',
      notes: task.notes,
      recurrenceRule: task.recurrenceRule,
      projectId: task.projectId,
    }

    await adminRepo.createAdmin(tenantId, newTask)
  }
}
