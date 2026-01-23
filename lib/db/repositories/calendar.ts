import { prisma } from '../index'

export interface CalendarEvent {
  id: number
  tenantId: string
  subject: string
  startTime: Date
  endTime: Date
  location?: string | null
  attendees?: string | null
  description?: string | null
  isAllDay: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateCalendarEventData {
  subject: string
  startTime: Date
  endTime: Date
  location?: string
  attendees?: string
  description?: string
  isAllDay?: boolean
}

export interface UpdateCalendarEventData {
  subject?: string
  startTime?: Date
  endTime?: Date
  location?: string
  attendees?: string
  description?: string
  isAllDay?: boolean
}

export async function getCalendarEvents(
  tenantId: string,
  startDate?: Date,
  endDate?: Date
): Promise<CalendarEvent[]> {
  const where: any = {
    tenantId,
  }

  if (startDate || endDate) {
    if (startDate && endDate) {
      // Events that overlap with the date range
      // An event overlaps if it starts before the range ends AND ends after the range starts
      where.AND = [
        { startTime: { lte: endDate } },
        { endTime: { gte: startDate } },
      ]
    } else if (startDate) {
      where.endTime = { gte: startDate } // Event ends on or after startDate
    } else if (endDate) {
      where.startTime = { lte: endDate } // Event starts on or before endDate
    }
  }

  const results = await prisma.calendarEvent.findMany({
    where,
    orderBy: { startTime: 'asc' },
  })

  return results.map((result) => ({
    id: result.id,
    tenantId: result.tenantId,
    subject: result.subject,
    startTime: result.startTime,
    endTime: result.endTime,
    location: result.location,
    attendees: result.attendees,
    description: result.description,
    isAllDay: result.isAllDay,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
  }))
}

export async function getCurrentMeeting(tenantId: string): Promise<CalendarEvent | null> {
  const now = new Date()

  const result = await prisma.calendarEvent.findFirst({
    where: {
      tenantId,
      startTime: { lte: now },
      endTime: { gte: now },
      isAllDay: false,
    },
    orderBy: { startTime: 'desc' },
  })

  if (!result) return null

  return {
    id: result.id,
    tenantId: result.tenantId,
    subject: result.subject,
    startTime: result.startTime,
    endTime: result.endTime,
    location: result.location,
    attendees: result.attendees,
    description: result.description,
    isAllDay: result.isAllDay,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
  }
}

export async function getUpcomingMeetings(
  tenantId: string,
  limit: number = 5
): Promise<CalendarEvent[]> {
  const now = new Date()

  const results = await prisma.calendarEvent.findMany({
    where: {
      tenantId,
      startTime: { gte: now },
      isAllDay: false,
    },
    orderBy: { startTime: 'asc' },
    take: limit,
  })

  return results.map((result) => ({
    id: result.id,
    tenantId: result.tenantId,
    subject: result.subject,
    startTime: result.startTime,
    endTime: result.endTime,
    location: result.location,
    attendees: result.attendees,
    description: result.description,
    isAllDay: result.isAllDay,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
  }))
}

export async function getTodaysMeetings(tenantId: string): Promise<CalendarEvent[]> {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

  return getCalendarEvents(tenantId, startOfDay, endOfDay)
}

export async function createCalendarEvent(
  tenantId: string,
  eventData: CreateCalendarEventData
): Promise<CalendarEvent> {
  const result = await prisma.calendarEvent.create({
    data: {
      tenantId,
      subject: eventData.subject,
      startTime: eventData.startTime,
      endTime: eventData.endTime,
      location: eventData.location || null,
      attendees: eventData.attendees || null,
      description: eventData.description || null,
      isAllDay: eventData.isAllDay || false,
    },
  })

  return {
    id: result.id,
    tenantId: result.tenantId,
    subject: result.subject,
    startTime: result.startTime,
    endTime: result.endTime,
    location: result.location,
    attendees: result.attendees,
    description: result.description,
    isAllDay: result.isAllDay,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
  }
}

export async function updateCalendarEvent(
  tenantId: string,
  eventId: number,
  eventData: UpdateCalendarEventData
): Promise<CalendarEvent | null> {
  // Verify event belongs to tenant
  const existing = await prisma.calendarEvent.findFirst({
    where: {
      id: eventId,
      tenantId,
    },
  })

  if (!existing) return null

  const updateData: any = {}
  if (eventData.subject !== undefined) updateData.subject = eventData.subject
  if (eventData.startTime !== undefined) updateData.startTime = eventData.startTime
  if (eventData.endTime !== undefined) updateData.endTime = eventData.endTime
  if (eventData.location !== undefined) updateData.location = eventData.location || null
  if (eventData.attendees !== undefined) updateData.attendees = eventData.attendees || null
  if (eventData.description !== undefined) updateData.description = eventData.description || null
  if (eventData.isAllDay !== undefined) updateData.isAllDay = eventData.isAllDay

  const result = await prisma.calendarEvent.update({
    where: { id: eventId },
    data: updateData,
  })

  return {
    id: result.id,
    tenantId: result.tenantId,
    subject: result.subject,
    startTime: result.startTime,
    endTime: result.endTime,
    location: result.location,
    attendees: result.attendees,
    description: result.description,
    isAllDay: result.isAllDay,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
  }
}

export async function deleteCalendarEvent(tenantId: string, eventId: number): Promise<boolean> {
  const result = await prisma.calendarEvent.deleteMany({
    where: {
      id: eventId,
      tenantId,
    },
  })

  return result.count > 0
}

export async function getCalendarEventById(
  tenantId: string,
  eventId: number
): Promise<CalendarEvent | null> {
  const result = await prisma.calendarEvent.findFirst({
    where: {
      id: eventId,
      tenantId,
    },
  })

  if (!result) return null

  return {
    id: result.id,
    tenantId: result.tenantId,
    subject: result.subject,
    startTime: result.startTime,
    endTime: result.endTime,
    location: result.location,
    attendees: result.attendees,
    description: result.description,
    isAllDay: result.isAllDay,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
  }
}
