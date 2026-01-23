import { prisma } from '../index'
import type { Category } from '@/types'

export interface Reminder {
  id: number
  tenantId: string
  userId: string
  reminderType: string
  itemType: Category
  itemId: number
  title: string
  message: string
  dueDate: Date | null
  priority: 'low' | 'medium' | 'high'
  status: 'active' | 'snoozed' | 'dismissed' | 'completed'
  snoozedUntil: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface ReminderPreference {
  reminderType: string
  enabled: boolean
  quietHoursStart: string | null
  quietHoursEnd: string | null
  frequency: string
  channels: string[]
}

/**
 * Create a reminder
 */
export async function createReminder(
  tenantId: string,
  userId: string,
  reminderType: string,
  itemType: Category,
  itemId: number,
  title: string,
  message: string,
  dueDate?: Date,
  priority: 'low' | 'medium' | 'high' = 'medium'
): Promise<Reminder> {
  const reminder = await prisma.reminder.create({
    data: {
      tenantId,
      userId,
      reminderType,
      itemType,
      itemId,
      title,
      message,
      dueDate: dueDate || null,
      priority,
      status: 'active',
    },
  })

  return {
    id: reminder.id,
    tenantId: reminder.tenantId,
    userId: reminder.userId,
    reminderType: reminder.reminderType,
    itemType: reminder.itemType as Category,
    itemId: reminder.itemId,
    title: reminder.title,
    message: reminder.message,
    dueDate: reminder.dueDate,
    priority: reminder.priority as 'low' | 'medium' | 'high',
    status: reminder.status as 'active' | 'snoozed' | 'dismissed' | 'completed',
    snoozedUntil: reminder.snoozedUntil,
    createdAt: reminder.createdAt,
    updatedAt: reminder.updatedAt,
  }
}

/**
 * Get active reminders for a user
 */
export async function getActiveReminders(
  tenantId: string,
  userId: string,
  reminderType?: string
): Promise<Reminder[]> {
  const reminders = await prisma.reminder.findMany({
    where: {
      tenantId,
      userId,
      status: 'active',
      ...(reminderType ? { reminderType } : {}),
      OR: [
        { snoozedUntil: null },
        { snoozedUntil: { lt: new Date() } },
      ],
    },
    orderBy: [
      { priority: 'desc' },
      { dueDate: 'asc' },
      { createdAt: 'asc' },
    ],
  })

  return reminders.map(rem => ({
    id: rem.id,
    tenantId: rem.tenantId,
    userId: rem.userId,
    reminderType: rem.reminderType,
    itemType: rem.itemType as Category,
    itemId: rem.itemId,
    title: rem.title,
    message: rem.message,
    dueDate: rem.dueDate,
    priority: rem.priority as 'low' | 'medium' | 'high',
    status: rem.status as 'active' | 'snoozed' | 'dismissed' | 'completed',
    snoozedUntil: rem.snoozedUntil,
    createdAt: rem.createdAt,
    updatedAt: rem.updatedAt,
  }))
}

/**
 * Update reminder status
 */
export async function updateReminderStatus(
  tenantId: string,
  userId: string,
  reminderId: number,
  status: 'active' | 'snoozed' | 'dismissed' | 'completed',
  snoozedUntil?: Date
): Promise<void> {
  await prisma.reminder.updateMany({
    where: {
      id: reminderId,
      tenantId,
      userId,
    },
    data: {
      status,
      snoozedUntil: snoozedUntil || null,
      updatedAt: new Date(),
    },
  })
}

/**
 * Delete reminder
 */
export async function deleteReminder(
  tenantId: string,
  userId: string,
  reminderId: number
): Promise<void> {
  await prisma.reminder.deleteMany({
    where: {
      id: reminderId,
      tenantId,
      userId,
    },
  })
}

/**
 * Get reminder preferences
 */
export async function getReminderPreferences(
  tenantId: string,
  userId: string
): Promise<ReminderPreference[]> {
  const preferences = await prisma.reminderPreference.findMany({
    where: {
      tenantId,
      userId,
    },
  })

  return preferences.map(pref => ({
    reminderType: pref.reminderType,
    enabled: pref.enabled,
    quietHoursStart: pref.quietHoursStart,
    quietHoursEnd: pref.quietHoursEnd,
    frequency: pref.frequency,
    channels: pref.channels ? JSON.parse(pref.channels) : ['in_app'],
  }))
}

/**
 * Update reminder preference
 */
export async function updateReminderPreference(
  tenantId: string,
  userId: string,
  reminderType: string,
  preference: Partial<ReminderPreference>
): Promise<void> {
  await prisma.reminderPreference.upsert({
    where: {
      tenantId_userId_reminderType: {
        tenantId,
        userId,
        reminderType,
      },
    },
    create: {
      tenantId,
      userId,
      reminderType,
      enabled: preference.enabled ?? true,
      quietHoursStart: preference.quietHoursStart || null,
      quietHoursEnd: preference.quietHoursEnd || null,
      frequency: preference.frequency || 'daily',
      channels: JSON.stringify(preference.channels || ['in_app']),
    },
    update: {
      enabled: preference.enabled,
      quietHoursStart: preference.quietHoursStart,
      quietHoursEnd: preference.quietHoursEnd,
      frequency: preference.frequency,
      channels: preference.channels ? JSON.stringify(preference.channels) : undefined,
      updatedAt: new Date(),
    },
  })
}

/**
 * Check if reminder should be sent based on preferences
 */
export async function shouldSendReminder(
  tenantId: string,
  userId: string,
  reminderType: string
): Promise<boolean> {
  const preference = await prisma.reminderPreference.findUnique({
    where: {
      tenantId_userId_reminderType: {
        tenantId,
        userId,
        reminderType,
      },
    },
  })

  if (!preference) {
    return true // Default to enabled
  }

  if (!preference.enabled) {
    return false
  }

  // Check quiet hours
  if (preference.quietHoursStart && preference.quietHoursEnd) {
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const currentTime = currentHour * 60 + currentMinute

    const [startHour, startMin] = preference.quietHoursStart.split(':').map(Number)
    const [endHour, endMin] = preference.quietHoursEnd.split(':').map(Number)
    const startTime = startHour * 60 + startMin
    const endTime = endHour * 60 + endMin

    if (startTime <= endTime) {
      // Same day quiet hours
      if (currentTime >= startTime && currentTime <= endTime) {
        return false
      }
    } else {
      // Overnight quiet hours
      if (currentTime >= startTime || currentTime <= endTime) {
        return false
      }
    }
  }

  return true
}
