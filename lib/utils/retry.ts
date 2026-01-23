/**
 * Retry utility with exponential backoff and jitter
 * Prevents cascading failures and handles transient errors gracefully
 */

export interface RetryOptions {
  maxRetries?: number // Maximum number of retry attempts (default: 3)
  initialDelayMs?: number // Initial delay before first retry (default: 1000ms)
  maxDelayMs?: number // Maximum delay between retries (default: 10000ms)
  backoffMultiplier?: number // Exponential backoff multiplier (default: 2)
  jitter?: boolean // Add random jitter to prevent thundering herd (default: true)
  retryableErrors?: string[] // Error codes/messages that should trigger retry
  onRetry?: (attempt: number, error: Error, delayMs: number) => void // Callback for retry attempts
}

/**
 * Check if an error is retryable
 */
function isRetryableError(error: unknown, retryableErrors?: string[]): boolean {
  if (!error) return false

  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorCode = (error as any)?.code || (error as any)?.status

  // Network errors (always retryable)
  const networkErrors = ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNREFUSED', 'EAI_AGAIN']
  if (networkErrors.includes(errorCode)) {
    return true
  }

  // HTTP 5xx errors (server errors - retryable)
  if (typeof errorCode === 'number' && errorCode >= 500 && errorCode < 600) {
    return true
  }

  // HTTP 429 (rate limit - retryable with longer backoff)
  if (errorCode === 429) {
    return true
  }

  // Custom retryable errors
  if (retryableErrors && retryableErrors.length > 0) {
    return retryableErrors.some(pattern => 
      errorMessage.includes(pattern) || String(errorCode).includes(pattern)
    )
  }

  return false
}

/**
 * Calculate delay with exponential backoff and optional jitter
 */
function calculateDelay(
  attempt: number,
  initialDelayMs: number,
  maxDelayMs: number,
  backoffMultiplier: number,
  jitter: boolean
): number {
  // Exponential backoff: initialDelay * (multiplier ^ attempt)
  const exponentialDelay = initialDelayMs * Math.pow(backoffMultiplier, attempt)
  
  // Cap at max delay
  const cappedDelay = Math.min(exponentialDelay, maxDelayMs)
  
  // Add jitter (±20%) to prevent thundering herd
  if (jitter) {
    const jitterAmount = cappedDelay * 0.2
    const jitterValue = (Math.random() * 2 - 1) * jitterAmount // Random between -jitterAmount and +jitterAmount
    return Math.max(0, cappedDelay + jitterValue)
  }
  
  return cappedDelay
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Retry a function with exponential backoff
 * 
 * @param fn - Function to retry (should return a Promise)
 * @param options - Retry configuration options
 * @returns Result of the function call
 * @throws Last error if all retries fail
 * 
 * @example
 * ```typescript
 * const result = await withRetry(
 *   () => openai.chat.completions.create({ ... }),
 *   {
 *     maxRetries: 3,
 *     initialDelayMs: 1000,
 *     onRetry: (attempt, error, delay) => {
 *       console.log(`Retry ${attempt} after ${delay}ms: ${error.message}`)
 *     }
 *   }
 * )
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 1000,
    maxDelayMs = 10000,
    backoffMultiplier = 2,
    jitter = true,
    retryableErrors,
    onRetry,
  } = options

  let lastError: Error | unknown

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      // Don't retry on last attempt
      if (attempt >= maxRetries) {
        break
      }

      // Check if error is retryable
      if (!isRetryableError(error, retryableErrors)) {
        // Not retryable - throw immediately
        throw error
      }

      // Calculate delay (longer for rate limits)
      const isRateLimit = (error as any)?.status === 429 || (error as any)?.code === 429
      const delayMs = isRateLimit
        ? Math.max(maxDelayMs, initialDelayMs * Math.pow(backoffMultiplier, attempt + 1)) // Longer backoff for rate limits
        : calculateDelay(attempt, initialDelayMs, maxDelayMs, backoffMultiplier, jitter)

      // Log retry attempt
      if (onRetry) {
        onRetry(attempt + 1, error as Error, delayMs)
      } else {
        console.warn(
          `⚠️  Retry attempt ${attempt + 1}/${maxRetries} after ${Math.round(delayMs)}ms:`,
          error instanceof Error ? error.message : String(error)
        )
      }

      // Wait before retrying
      await sleep(delayMs)
    }
  }

  // All retries exhausted - throw last error
  throw lastError
}

/**
 * Pre-configured retry functions for common use cases
 */

// AI API calls: 3 retries, 1s initial delay, handles network and 5xx errors
export const retryAICall = <T>(fn: () => Promise<T>): Promise<T> => {
  return withRetry(fn, {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    onRetry: (attempt, error, delay) => {
      console.warn(`🔄 AI call retry ${attempt}/3 after ${Math.round(delay)}ms: ${error.message}`)
    },
  })
}

// Integration API calls: 2 retries, 500ms initial delay
export const retryIntegrationCall = <T>(fn: () => Promise<T>): Promise<T> => {
  return withRetry(fn, {
    maxRetries: 2,
    initialDelayMs: 500,
    maxDelayMs: 5000,
    onRetry: (attempt, error, delay) => {
      console.warn(`🔄 Integration call retry ${attempt}/2 after ${Math.round(delay)}ms: ${error.message}`)
    },
  })
}

// Rate limit aware retry: Longer delays for 429 errors
export const retryWithRateLimit = <T>(fn: () => Promise<T>): Promise<T> => {
  return withRetry(fn, {
    maxRetries: 3,
    initialDelayMs: 2000, // Longer initial delay for rate limits
    maxDelayMs: 30000, // Up to 30 seconds for rate limits
    onRetry: (attempt, error, delay) => {
      const isRateLimit = (error as any)?.status === 429
      console.warn(
        `🔄 ${isRateLimit ? 'Rate limit' : 'API'} retry ${attempt}/3 after ${Math.round(delay)}ms: ${error.message}`
      )
    },
  })
}
