import * as integrationsRepo from '@/lib/db/repositories/integrations'
import * as calendarSyncRepo from '@/lib/db/repositories/calendar-sync'
import * as adminRepo from '@/lib/db/repositories/admin'
import * as calendarRepo from '@/lib/db/repositories/calendar'

/**
 * Sync admin task to Google Calendar
 */
export async function syncTaskToCalendar(
  tenantId: string,
  taskId: number
): Promise<{ success: boolean; eventId?: string; error?: string }> {
  const integration = await integrationsRepo.getIntegrationByProvider(tenantId, 'google_calendar')
  if (!integration || integration.status !== 'active') {
    return { success: false, error: 'Google Calendar integration not active' }
  }

  const task = await adminRepo.getAdminById(tenantId, taskId)
  if (!task || !task.due_date) {
    return { success: false, error: 'Task not found or has no due date' }
  }

  const accessToken = integration.config.accessToken
  if (!accessToken) {
    return { success: false, error: 'No access token available' }
  }

  try {
    // Check if already synced
    const existingSync = await calendarSyncRepo.getSyncByItem(
      tenantId,
      integration.id,
      'admin',
      taskId
    )

    const eventData = {
      summary: task.name,
      description: task.notes || '',
      start: {
        dateTime: new Date(task.due_date).toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: new Date(new Date(task.due_date).getTime() + 60 * 60 * 1000).toISOString(), // 1 hour default
        timeZone: 'UTC',
      },
    }

    let eventId: string

    if (existingSync) {
      // Update existing event (with retry and timeout)
      const { fetchWithRetryAndTimeout } = await import('@/lib/utils/timeout')
      const updateResponse = await fetchWithRetryAndTimeout(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${existingSync.calendarEventId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventData),
        }
      )

      if (!updateResponse.ok) {
        throw new Error(`Failed to update calendar event: ${updateResponse.statusText}`)
      }

      const updatedEvent = await updateResponse.json()
      eventId = updatedEvent.id
    } else {
      // Create new event (with retry and timeout)
      const { fetchWithRetryAndTimeout } = await import('@/lib/utils/timeout')
      const createResponse = await fetchWithRetryAndTimeout(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(eventData),
        }
      )

      if (!createResponse.ok) {
        throw new Error(`Failed to create calendar event: ${createResponse.statusText}`)
      }

      const createdEvent = await createResponse.json()
      eventId = createdEvent.id
    }

    // Store sync record
    await calendarSyncRepo.upsertCalendarSync(
      tenantId,
      integration.id,
      'admin',
      taskId,
      eventId,
      'to_calendar'
    )

    return { success: true, eventId }
  } catch (error: any) {
    return { success: false, error: error.message || 'Unknown error' }
  }
}

/**
 * Sync calendar events to Second Brain
 */
export async function syncCalendarToSecondBrain(
  tenantId: string,
  maxResults: number = 50
): Promise<{ synced: number; errors: string[] }> {
  const integration = await integrationsRepo.getIntegrationByProvider(tenantId, 'google_calendar')
  if (!integration || integration.status !== 'active') {
    return { synced: 0, errors: ['Google Calendar integration not active'] }
  }

  const accessToken = integration.config.accessToken
  if (!accessToken) {
    return { synced: 0, errors: ['No access token available'] }
  }

  const errors: string[] = []
  let synced = 0

  try {
    // Fetch upcoming events
    const timeMin = new Date().toISOString()
    const timeMax = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // Next 7 days

    const { fetchWithRetryAndTimeout } = await import('@/lib/utils/timeout')
    const response = await fetchWithRetryAndTimeout(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&maxResults=${maxResults}&singleEvents=true&orderBy=startTime`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch calendar events: ${response.statusText}`)
    }

    const data = await response.json()
    const events = data.items || []

    // Sync each event
    for (const event of events) {
      try {
        // Check if already synced
        const existingSync = await calendarSyncRepo.getSyncByCalendarEventId(
          tenantId,
          integration.id,
          event.id
        )

        if (!existingSync) {
          // Create calendar event in Second Brain
          const startTime = event.start?.dateTime || event.start?.date
          const endTime = event.end?.dateTime || event.end?.date

          if (startTime) {
            const calendarEvent = await calendarRepo.createCalendarEvent(tenantId, {
              subject: event.summary || 'Untitled Event',
              startTime: new Date(startTime),
              endTime: endTime ? new Date(endTime) : new Date(new Date(startTime).getTime() + 60 * 60 * 1000),
              description: event.description || '',
              location: event.location || '',
            })

            // Store sync record
            await calendarSyncRepo.upsertCalendarSync(
              tenantId,
              integration.id,
              'admin', // Calendar events are treated as admin items
              calendarEvent.id,
              event.id,
              'from_calendar'
            )

            synced++
          }
        }
      } catch (error: any) {
        errors.push(`Error syncing event ${event.id}: ${error.message}`)
      }
    }

    // Update last sync time
    await integrationsRepo.updateLastSync(tenantId, 'google_calendar')
  } catch (error: any) {
    errors.push(error.message)
  }

  return { synced, errors }
}

/**
 * Link capture to current calendar event
 */
export async function linkCaptureToCalendarEvent(
  tenantId: string,
  captureId: number,
  calendarEventId?: string
): Promise<void> {
  // This would be called when a capture is made during a meeting
  // The calendarEventId can be determined from the current time and calendar context
  // For now, this is a placeholder that can be enhanced with the existing calendar-context service
}
