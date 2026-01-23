import crypto from 'crypto'

/**
 * Verify Slack webhook signature
 * @param body - Raw request body as string
 * @param signature - X-Slack-Signature header value
 * @param timestamp - X-Slack-Request-Timestamp header value
 * @param signingSecret - Slack signing secret from environment
 * @returns true if signature is valid, false otherwise
 */
export function verifySlackSignature(
  body: string,
  signature: string,
  timestamp: string,
  signingSecret: string
): boolean {
  if (!signature || !timestamp || !signingSecret) {
    return false
  }

  // Verify timestamp to prevent replay attacks (reject if > 5 minutes old)
  const requestTime = parseInt(timestamp, 10)
  const currentTime = Math.floor(Date.now() / 1000)
  const timeDiff = Math.abs(currentTime - requestTime)
  
  // Reject requests older than 5 minutes
  if (timeDiff > 300) {
    return false
  }

  // Extract version and hash from signature
  // Format: v0=hex_hash
  const [version, hash] = signature.split('=')
  if (version !== 'v0' || !hash) {
    return false
  }

  // Create base string: version:timestamp:body
  const baseString = `${version}:${timestamp}:${body}`

  // Compute HMAC-SHA256
  const hmac = crypto.createHmac('sha256', signingSecret)
  hmac.update(baseString)
  const computedHash = hmac.digest('hex')

  // Use timing-safe comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(hash),
      Buffer.from(computedHash)
    )
  } catch {
    return false
  }
}

/**
 * Validate Slack webhook request
 * @param bodyText - Raw request body as string (must be read before JSON parsing)
 * @param signature - X-Slack-Signature header value
 * @param timestamp - X-Slack-Request-Timestamp header value
 * @param signingSecret - Slack signing secret
 * @returns Object with isValid flag and error message if invalid
 */
export function validateSlackWebhook(
  bodyText: string,
  signature: string | null,
  timestamp: string | null,
  signingSecret: string
): { isValid: boolean; error?: string } {
  if (!signature) {
    return { isValid: false, error: 'Missing X-Slack-Signature header' }
  }

  if (!timestamp) {
    return { isValid: false, error: 'Missing X-Slack-Request-Timestamp header' }
  }

  const isValid = verifySlackSignature(bodyText, signature, timestamp, signingSecret)
  
  if (!isValid) {
    return { isValid: false, error: 'Invalid signature or replay attack detected' }
  }

  return { isValid: true }
}
