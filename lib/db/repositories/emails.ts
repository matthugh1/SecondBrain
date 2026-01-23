import { prisma } from '../index'
import type { Category } from '@/types'

export interface Email {
  id: number
  tenantId: string
  integrationId: number
  messageId: string
  subject: string
  body: string
  senderEmail: string
  senderName?: string
  recipientEmail: string
  receivedAt: Date
  classifiedAs?: Category
  linkedPersonId?: number
  linkedProjectId?: number
  linkedAdminId?: number
  attachments?: Array<{ name: string; url: string; size: number }>
  createdAt: Date
}

/**
 * Create email record
 */
export async function createEmail(
  tenantId: string,
  integrationId: number,
  email: {
    messageId: string
    subject: string
    body: string
    senderEmail: string
    senderName?: string
    recipientEmail: string
    receivedAt: Date
    attachments?: Array<{ name: string; url: string; size: number }>
  }
): Promise<number> {
  const result = await prisma.email.create({
    data: {
      tenantId,
      integrationId,
      messageId: email.messageId,
      subject: email.subject,
      body: email.body,
      senderEmail: email.senderEmail,
      senderName: email.senderName || null,
      recipientEmail: email.recipientEmail,
      receivedAt: email.receivedAt,
      attachments: email.attachments ? JSON.stringify(email.attachments) : null,
    },
  })
  return result.id
}

/**
 * Get email by ID
 */
export async function getEmailById(tenantId: string, id: number): Promise<Email | null> {
  const email = await prisma.email.findFirst({
    where: { id, tenantId },
  })

  if (!email) return null

  return {
    id: email.id,
    tenantId: email.tenantId,
    integrationId: email.integrationId,
    messageId: email.messageId,
    subject: email.subject,
    body: email.body,
    senderEmail: email.senderEmail,
    senderName: email.senderName || undefined,
    recipientEmail: email.recipientEmail,
    receivedAt: email.receivedAt,
    classifiedAs: email.classifiedAs as Category | undefined,
    linkedPersonId: email.linkedPersonId || undefined,
    linkedProjectId: email.linkedProjectId || undefined,
    linkedAdminId: email.linkedAdminId || undefined,
    attachments: email.attachments ? JSON.parse(email.attachments) : undefined,
    createdAt: email.createdAt,
  }
}

/**
 * Get emails for a tenant
 */
export async function getEmails(
  tenantId: string,
  options: {
    senderEmail?: string
    classifiedAs?: Category
    linkedPersonId?: number
    limit?: number
    offset?: number
  } = {}
): Promise<Email[]> {
  const emails = await prisma.email.findMany({
    where: {
      tenantId,
      ...(options.senderEmail ? { senderEmail: options.senderEmail } : {}),
      ...(options.classifiedAs ? { classifiedAs: options.classifiedAs } : {}),
      ...(options.linkedPersonId ? { linkedPersonId: options.linkedPersonId } : {}),
    },
    orderBy: { receivedAt: 'desc' },
    take: options.limit || 50,
    skip: options.offset || 0,
  })

  return emails.map(email => ({
    id: email.id,
    tenantId: email.tenantId,
    integrationId: email.integrationId,
    messageId: email.messageId,
    subject: email.subject,
    body: email.body,
    senderEmail: email.senderEmail,
    senderName: email.senderName || undefined,
    recipientEmail: email.recipientEmail,
    receivedAt: email.receivedAt,
    classifiedAs: email.classifiedAs as Category | undefined,
    linkedPersonId: email.linkedPersonId || undefined,
    linkedProjectId: email.linkedProjectId || undefined,
    linkedAdminId: email.linkedAdminId || undefined,
    attachments: email.attachments ? JSON.parse(email.attachments) : undefined,
    createdAt: email.createdAt,
  }))
}

/**
 * Update email classification and links
 */
export async function updateEmailLinks(
  tenantId: string,
  emailId: number,
  updates: {
    classifiedAs?: Category
    linkedPersonId?: number
    linkedProjectId?: number
    linkedAdminId?: number
  }
): Promise<void> {
  await prisma.email.updateMany({
    where: { id: emailId, tenantId },
    data: {
      classifiedAs: updates.classifiedAs || null,
      linkedPersonId: updates.linkedPersonId || null,
      linkedProjectId: updates.linkedProjectId || null,
      linkedAdminId: updates.linkedAdminId || null,
    },
  })
}

/**
 * Search emails
 */
export async function searchEmails(
  tenantId: string,
  query: string,
  limit: number = 50
): Promise<Email[]> {
  const emails = await prisma.email.findMany({
    where: {
      tenantId,
      OR: [
        { subject: { contains: query, mode: 'insensitive' } },
        { body: { contains: query, mode: 'insensitive' } },
        { senderEmail: { contains: query, mode: 'insensitive' } },
        { senderName: { contains: query, mode: 'insensitive' } },
      ],
    },
    orderBy: { receivedAt: 'desc' },
    take: limit,
  })

  return emails.map(email => ({
    id: email.id,
    tenantId: email.tenantId,
    integrationId: email.integrationId,
    messageId: email.messageId,
    subject: email.subject,
    body: email.body,
    senderEmail: email.senderEmail,
    senderName: email.senderName || undefined,
    recipientEmail: email.recipientEmail,
    receivedAt: email.receivedAt,
    classifiedAs: email.classifiedAs as Category | undefined,
    linkedPersonId: email.linkedPersonId || undefined,
    linkedProjectId: email.linkedProjectId || undefined,
    linkedAdminId: email.linkedAdminId || undefined,
    attachments: email.attachments ? JSON.parse(email.attachments) : undefined,
    createdAt: email.createdAt,
  }))
}
