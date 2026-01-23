import { prisma } from '../index'

export interface MessageLog {
  id: number
  tenantId: string
  userId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  category?: string
  destinationUrl?: string
  timestamp: Date
}

/**
 * Create a message log entry
 */
export async function createMessageLog(
  tenantId: string,
  userId: string,
  message: {
    role: 'user' | 'assistant' | 'system'
    content: string
    category?: string
    destinationUrl?: string
  }
): Promise<number> {
  const result = await prisma.messageLog.create({
    data: {
      tenantId,
      userId,
      role: message.role,
      content: message.content,
      category: message.category || null,
      destinationUrl: message.destinationUrl || null,
    },
  })
  return result.id
}

/**
 * Get message logs for user
 */
export async function getMessageLogs(
  tenantId: string,
  userId: string,
  options: {
    limit?: number
    offset?: number
    startDate?: Date
    endDate?: Date
    category?: string
  } = {}
): Promise<MessageLog[]> {
  const {
    limit = 50,
    offset = 0,
    startDate,
    endDate,
    category,
  } = options

  const where: any = {
    tenantId,
    userId,
  }

  if (startDate || endDate) {
    where.timestamp = {}
    if (startDate) where.timestamp.gte = startDate
    if (endDate) where.timestamp.lte = endDate
  }

  if (category) {
    where.category = category
  }

  const messages = await prisma.messageLog.findMany({
    where,
    orderBy: { timestamp: 'desc' },
    take: limit,
    skip: offset,
  })

  return messages.map(msg => ({
    id: msg.id,
    tenantId: msg.tenantId,
    userId: msg.userId,
    role: msg.role as 'user' | 'assistant' | 'system',
    content: msg.content,
    category: msg.category || undefined,
    destinationUrl: msg.destinationUrl || undefined,
    timestamp: msg.timestamp,
  }))
}

/**
 * Get message log by ID
 */
export async function getMessageLogById(
  tenantId: string,
  messageId: number
): Promise<MessageLog | null> {
  const message = await prisma.messageLog.findFirst({
    where: {
      id: messageId,
      tenantId,
    },
  })

  if (!message) return null

  return {
    id: message.id,
    tenantId: message.tenantId,
    userId: message.userId,
    role: message.role as 'user' | 'assistant' | 'system',
    content: message.content,
    category: message.category || undefined,
    destinationUrl: message.destinationUrl || undefined,
    timestamp: message.timestamp,
  }
}

/**
 * Search message logs by content
 */
export async function searchMessageLogs(
  tenantId: string,
  userId: string,
  query: string,
  limit: number = 20
): Promise<MessageLog[]> {
  const messages = await prisma.messageLog.findMany({
    where: {
      tenantId,
      userId,
      content: {
        contains: query,
        mode: 'insensitive',
      },
    },
    orderBy: { timestamp: 'desc' },
    take: limit,
  })

  return messages.map(msg => ({
    id: msg.id,
    tenantId: msg.tenantId,
    userId: msg.userId,
    role: msg.role as 'user' | 'assistant' | 'system',
    content: msg.content,
    category: msg.category || undefined,
    destinationUrl: msg.destinationUrl || undefined,
    timestamp: msg.timestamp,
  }))
}
