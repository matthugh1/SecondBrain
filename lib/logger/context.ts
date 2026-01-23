import { AsyncLocalStorage } from 'async_hooks'
import { logger, createLogger } from './index'

/**
 * Request context storage using AsyncLocalStorage
 * This allows us to access request context (requestId, tenantId, userId) from anywhere
 * without passing it through every function call
 */
interface RequestContext {
  requestId: string
  tenantId?: string
  userId?: string
  ipAddress?: string
  userAgent?: string
}

const requestContextStorage = new AsyncLocalStorage<RequestContext>()

/**
 * Get the current request context
 */
export function getRequestContext(): RequestContext | undefined {
  return requestContextStorage.getStore()
}

/**
 * Get a logger with current request context automatically included
 */
export function getContextLogger(): ReturnType<typeof createLogger> {
  const context = getRequestContext()
  if (!context) {
    return logger
  }
  
  return createLogger({
    requestId: context.requestId,
    tenantId: context.tenantId ? context.tenantId.substring(0, 8) + '...' : undefined,
    userId: context.userId ? context.userId.substring(0, 8) + '...' : undefined,
  })
}

/**
 * Run a function with request context
 */
export function runWithContext<T>(context: RequestContext, fn: () => T): T {
  return requestContextStorage.run(context, fn)
}

/**
 * Run an async function with request context
 */
export async function runWithContextAsync<T>(
  context: RequestContext,
  fn: () => Promise<T>
): Promise<T> {
  return requestContextStorage.run(context, fn)
}

/**
 * Set request context (for use in middleware)
 */
export function setRequestContext(context: RequestContext): void {
  requestContextStorage.enterWith(context)
}

export type { RequestContext }
