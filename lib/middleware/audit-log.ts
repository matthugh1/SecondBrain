import { getRequestContext } from '@/lib/logger/context'
import { createActionHistory } from '@/lib/db/repositories/actionHistory'
import type { ActionType } from '@/lib/db/repositories/actionHistory'

/**
 * Audit log entry interface
 */
export interface AuditLogEntry {
  action: ActionType
  resource: string // itemType
  resourceId?: number
  oldData?: any
  newData?: any
  details?: Record<string, any>
}

/**
 * Create an audit log entry
 * Automatically includes request context (userId, tenantId, IP, userAgent, requestId)
 */
export async function auditLog(
  tenantId: string,
  entry: AuditLogEntry
): Promise<void> {
  try {
    const requestContext = getRequestContext()
    
    // Get userId from context or entry details
    const userId = requestContext?.userId || entry.details?.userId

    await createActionHistory(tenantId, {
      action_type: entry.action,
      item_type: entry.resource,
      item_id: entry.resourceId || null,
      old_data: entry.oldData ? JSON.stringify(entry.oldData) : null,
      new_data: entry.newData ? JSON.stringify(entry.newData) : null,
      undone: 0,
      // Audit fields
      user_id: userId || undefined,
      request_id: requestContext?.requestId || undefined,
      ip_address: requestContext?.ipAddress || undefined,
      user_agent: requestContext?.userAgent || undefined,
      details: entry.details ? JSON.stringify(entry.details) : undefined,
    })
  } catch (error) {
    // Don't fail the operation if audit logging fails
    // Log the error but continue
    const { getContextLogger } = await import('@/lib/logger/context')
    const logger = getContextLogger()
    logger.error({ error, entry }, 'Failed to create audit log entry')
  }
}

/**
 * Helper to audit create operations
 */
export async function auditCreate(
  tenantId: string,
  resource: string,
  resourceId: number,
  newData: any,
  details?: Record<string, any>
): Promise<void> {
  await auditLog(tenantId, {
    action: 'create',
    resource,
    resourceId,
    newData,
    details,
  })
}

/**
 * Helper to audit update operations
 */
export async function auditUpdate(
  tenantId: string,
  resource: string,
  resourceId: number,
  oldData: any,
  newData: any,
  details?: Record<string, any>
): Promise<void> {
  await auditLog(tenantId, {
    action: 'update',
    resource,
    resourceId,
    oldData,
    newData,
    details,
  })
}

/**
 * Helper to audit delete operations
 */
export async function auditDelete(
  tenantId: string,
  resource: string,
  resourceId: number,
  oldData: any,
  details?: Record<string, any>
): Promise<void> {
  await auditLog(tenantId, {
    action: 'delete',
    resource,
    resourceId,
    oldData,
    details,
  })
}

/**
 * Helper to audit bulk operations
 */
export async function auditBulkOperation(
  tenantId: string,
  action: ActionType,
  resource: string,
  resourceIds: number[],
  details?: Record<string, any>
): Promise<void> {
  await auditLog(tenantId, {
    action,
    resource,
    resourceId: resourceIds[0] || undefined, // Store first ID, rest in details
    details: {
      ...details,
      resourceIds,
      count: resourceIds.length,
    },
  })
}
