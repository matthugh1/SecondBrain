/**
 * Timeout utility for external API calls
 * Prevents hanging requests from blocking resources
 */

export interface TimeoutOptions {
  timeoutMs: number // Timeout in milliseconds
  errorMessage?: string // Custom error message
  onTimeout?: () => void // Callback when timeout occurs
}

/**
 * Create a timeout promise that rejects after specified time
 */
function createTimeout(timeoutMs: number, errorMessage: string): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(errorMessage))
    }, timeoutMs)
  })
}

/**
 * Wrap a promise with a timeout
 * 
 * @param promise - Promise to wrap
 * @param timeoutMs - Timeout in milliseconds
 * @param errorMessage - Custom error message (optional)
 * @returns Promise that rejects if timeout is exceeded
 * 
 * @example
 * ```typescript
 * const result = await withTimeout(
 *   fetch('https://api.example.com/data'),
 *   5000,
 *   'API call timed out'
 * )
 * ```
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage?: string
): Promise<T> {
  const message = errorMessage || `Operation timed out after ${timeoutMs}ms`
  const timeout = createTimeout(timeoutMs, message)

  return Promise.race([promise, timeout])
}

/**
 * Wrap a function call with a timeout using AbortController
 * Useful for fetch requests
 * 
 * @param fn - Function that accepts AbortSignal and returns Promise
 * @param timeoutMs - Timeout in milliseconds
 * @param errorMessage - Custom error message (optional)
 * @returns Result of function call
 * 
 * @example
 * ```typescript
 * const result = await withAbortTimeout(
 *   (signal) => fetch('https://api.example.com/data', { signal }),
 *   5000
 * )
 * ```
 */
export async function withAbortTimeout<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number,
  errorMessage?: string
): Promise<T> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const result = await fn(controller.signal)
    clearTimeout(timeoutId)
    return result
  } catch (error) {
    clearTimeout(timeoutId)
    
    if (controller.signal.aborted) {
      const message = errorMessage || `Operation timed out after ${timeoutMs}ms`
      throw new Error(message)
    }
    
    throw error
  }
}

/**
 * Pre-configured timeout values for different operation types
 */
export const TIMEOUTS = {
  AI_CALL: 30000, // 30 seconds for AI API calls
  INTEGRATION_CALL: 15000, // 15 seconds for integration API calls
  DATABASE_QUERY: 10000, // 10 seconds for database queries
  WEBHOOK_PROCESSING: 5000, // 5 seconds for webhook processing
} as const

/**
 * Pre-configured timeout wrappers
 */

// AI API call timeout (30 seconds)
export const timeoutAICall = <T>(promise: Promise<T>): Promise<T> => {
  return withTimeout(promise, TIMEOUTS.AI_CALL, 'AI API call timed out after 30 seconds')
}

// Integration API call timeout (15 seconds)
export const timeoutIntegrationCall = <T>(promise: Promise<T>): Promise<T> => {
  return withTimeout(promise, TIMEOUTS.INTEGRATION_CALL, 'Integration API call timed out after 15 seconds')
}

// Database query timeout (10 seconds)
export const timeoutDatabaseQuery = <T>(promise: Promise<T>): Promise<T> => {
  return withTimeout(promise, TIMEOUTS.DATABASE_QUERY, 'Database query timed out after 10 seconds')
}

// Webhook processing timeout (5 seconds)
export const timeoutWebhook = <T>(promise: Promise<T>): Promise<T> => {
  return withTimeout(promise, TIMEOUTS.WEBHOOK_PROCESSING, 'Webhook processing timed out after 5 seconds')
}

/**
 * Fetch with retry and timeout for integration API calls
 * Combines retry logic and timeout for convenience
 */
export async function fetchWithRetryAndTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = TIMEOUTS.INTEGRATION_CALL
): Promise<Response> {
  const { retryIntegrationCall } = await import('./retry')
  
  return retryIntegrationCall(async () => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      })
      clearTimeout(timeoutId)
      return response
    } catch (error) {
      clearTimeout(timeoutId)
      if (controller.signal.aborted) {
        throw new Error(`Request timed out after ${timeoutMs}ms`)
      }
      throw error
    }
  })
}
