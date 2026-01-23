import * as calendarRepo from '@/lib/db/repositories/calendar'
import type { CalendarEvent } from '@/lib/db/repositories/calendar'

export function formatMeetingContextForItem(meeting: CalendarEvent): string {
  const date = meeting.startTime.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  
  const time = meeting.startTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
  
  return `Captured during meeting: ${meeting.subject} on ${date} at ${time} [Calendar Event ID: ${meeting.id}]`
}

/**
 * Get calendar event ID from context string
 */
export function extractCalendarEventIdFromContext(context: string): number | null {
  const match = context.match(/\[Calendar Event ID: (\d+)\]/)
  return match ? parseInt(match[1], 10) : null
}

/**
 * Link capture to calendar event (enhances existing context-based linking)
 */
export async function linkCaptureToCalendarEvent(
  tenantId: string,
  itemType: string,
  itemId: number,
  calendarEventId: number
): Promise<void> {
  // This enhances the existing context-based linking
  // The calendar event ID is already included in the context string
  // Additional explicit linking can be added here if needed
}

export async function getCurrentMeetingContext(tenantId: string): Promise<string | null> {
  const meeting = await calendarRepo.getCurrentMeeting(tenantId)
  
  if (!meeting) {
    return null
  }

  const endTime = meeting.endTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  return `User is currently in a meeting: "${meeting.subject}" (until ${endTime})`
}

export async function getUpcomingMeetingsContext(
  tenantId: string,
  limit: number = 3
): Promise<string | null> {
  const meetings = await calendarRepo.getUpcomingMeetings(tenantId, limit)
  
  if (meetings.length === 0) {
    return null
  }

  const meetingList = meetings
    .map((meeting) => {
      const startTime = meeting.startTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
      return `- ${meeting.subject} at ${startTime}`
    })
    .join('\n')

  return `Upcoming meetings:\n${meetingList}`
}

export async function getTodaysScheduleContext(tenantId: string): Promise<string | null> {
  const meetings = await calendarRepo.getTodaysMeetings(tenantId)
  
  if (meetings.length === 0) {
    return 'No meetings scheduled for today.'
  }

  const meetingList = meetings
    .map((meeting) => {
      const startTime = meeting.startTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
      const endTime = meeting.endTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
      return `- ${meeting.subject} (${startTime} - ${endTime})`
    })
    .join('\n')

  return `Today's schedule:\n${meetingList}`
}
