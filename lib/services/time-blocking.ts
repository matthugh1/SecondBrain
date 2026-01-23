import * as adminRepo from '@/lib/db/repositories/admin'
import * as calendarRepo from '@/lib/db/repositories/calendar'
import * as integrationsRepo from '@/lib/db/repositories/integrations'

export interface TimeBlockSuggestion {
  taskId: number
  taskName: string
  suggestedStart: Date
  suggestedEnd: Date
  reason: string
}

/**
 * Generate time blocking suggestions based on tasks
 */
export async function generateTimeBlockSuggestions(
  tenantId: string,
  workingHours: { start: string; end: string } = { start: '09:00', end: '17:00' }
): Promise<TimeBlockSuggestion[]> {
  // Get tasks with due dates
  const adminTasks = await adminRepo.getAllAdmin(tenantId, false)
  const tasksWithDueDates = adminTasks.filter(t => t.due_date && new Date(t.due_date) >= new Date())

  // Get existing calendar events
  const now = new Date()
  const endOfWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const existingEvents = await calendarRepo.getCalendarEvents(tenantId, now, endOfWeek)

  const suggestions: TimeBlockSuggestion[] = []

  // Sort tasks by due date and priority
  const sortedTasks = tasksWithDueDates.sort((a, b) => {
    const dateA = a.due_date ? new Date(a.due_date).getTime() : Infinity
    const dateB = b.due_date ? new Date(b.due_date).getTime() : Infinity
    return dateA - dateB
  })

  // Generate suggestions
  for (const task of sortedTasks.slice(0, 10)) { // Limit to top 10
    if (!task.due_date) continue

    const dueDate = new Date(task.due_date)
    const [startHour, startMin] = workingHours.start.split(':').map(Number)
    const [endHour, endMin] = workingHours.end.split(':').map(Number)

    // Find available time slot
    const suggestedStart = new Date(dueDate)
    suggestedStart.setHours(startHour, startMin, 0, 0)

    // If due date is today and it's past working hours, suggest tomorrow
    if (suggestedStart < now) {
      suggestedStart.setDate(suggestedStart.getDate() + 1)
    }

    // Check if slot conflicts with existing events
    const conflicts = existingEvents.filter(e => {
      const eventStart = new Date(e.startTime)
      const eventEnd = new Date(e.endTime)
      return (
        (suggestedStart >= eventStart && suggestedStart < eventEnd) ||
        (suggestedStart.getTime() + 60 * 60 * 1000 > eventStart.getTime() && suggestedStart < eventStart)
      )
    })

    if (conflicts.length === 0 && task.id) {
      const suggestedEnd = new Date(suggestedStart.getTime() + 60 * 60 * 1000) // 1 hour default

      suggestions.push({
        taskId: task.id,
        taskName: task.name,
        suggestedStart,
        suggestedEnd,
        reason: `Due ${dueDate.toLocaleDateString()}`,
      })
    }
  }

  return suggestions
}

/**
 * Create calendar event from time block suggestion
 */
export async function createEventFromSuggestion(
  tenantId: string,
  suggestion: TimeBlockSuggestion
): Promise<{ success: boolean; eventId?: number; error?: string }> {
  try {
    const event = await calendarRepo.createCalendarEvent(tenantId, {
      subject: suggestion.taskName,
      startTime: suggestion.suggestedStart,
      endTime: suggestion.suggestedEnd,
      description: `Time block for: ${suggestion.taskName}\nReason: ${suggestion.reason}`,
    })

    // Sync to Google Calendar if connected
    const integration = await integrationsRepo.getIntegrationByProvider(tenantId, 'google_calendar')
    if (integration && integration.status === 'active') {
      const { syncTaskToCalendar } = await import('./calendar-sync')
      // Note: This would need to be adapted for calendar events
    }

    return { success: true, eventId: event.id }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
