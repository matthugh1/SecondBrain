/**
 * Shared utilities for webhook verification across different providers
 */

export interface WebhookVerificationResult {
  isValid: boolean
  error?: string
  provider?: string
}

/**
 * Base class for webhook verification
 * Each provider should implement their own verification logic
 */
export abstract class WebhookVerifier {
  abstract verify(
    request: Request,
    secret: string
  ): Promise<WebhookVerificationResult>
}

/**
 * Get webhook signing secret from environment variables
 * @param provider - Integration provider (slack, gmail, notion, etc.)
 * @returns Signing secret or null if not configured
 */
export function getWebhookSecret(provider: string): string | null {
  const envKey = `${provider.toUpperCase()}_WEBHOOK_SECRET` || 
                 `${provider.toUpperCase()}_SIGNING_SECRET`
  return process.env[envKey] || null
}

/**
 * Validate webhook timestamp to prevent replay attacks
 * @param timestamp - Request timestamp (Unix epoch seconds)
 * @param maxAgeSeconds - Maximum age in seconds (default: 300 = 5 minutes)
 * @returns true if timestamp is valid, false if too old
 */
export function validateWebhookTimestamp(
  timestamp: string | number,
  maxAgeSeconds: number = 300
): boolean {
  const requestTime = typeof timestamp === 'string' 
    ? parseInt(timestamp, 10) 
    : timestamp
  
  if (isNaN(requestTime)) {
    return false
  }

  const currentTime = Math.floor(Date.now() / 1000)
  const timeDiff = Math.abs(currentTime - requestTime)
  
  return timeDiff <= maxAgeSeconds
}
