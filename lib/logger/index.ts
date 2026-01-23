import pino from 'pino'

/**
 * Structured logger instance using Pino
 * 
 * Configuration:
 * - Production: JSON format (for log aggregation)
 * - Development: Pretty format (human-readable)
 * - Log level controlled by LOG_LEVEL env var (default: info)
 */
const isDevelopment = process.env.NODE_ENV === 'development'

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss.l',
          ignore: 'pid,hostname',
        },
      }
    : undefined, // Production uses JSON format
  formatters: {
    level: (label) => ({ level: label }),
  },
  // Redact sensitive fields
  redact: {
    paths: [
      'password',
      'token',
      'apiKey',
      'secret',
      'authorization',
      'cookie',
      '*.password',
      '*.token',
      '*.apiKey',
      '*.secret',
    ],
    remove: true,
  },
})

/**
 * Create a child logger with additional context
 */
export function createLogger(context: Record<string, any> = {}) {
  return logger.child(context)
}

/**
 * Logger with tenant context
 */
export function createTenantLogger(tenantId: string, additionalContext: Record<string, any> = {}) {
  return logger.child({
    tenantId: tenantId.substring(0, 8) + '...', // Sanitize: only log partial tenantId
    ...additionalContext,
  })
}

/**
 * Logger with tenant and user context
 */
export function createUserLogger(
  tenantId: string,
  userId: string,
  additionalContext: Record<string, any> = {}
) {
  return logger.child({
    tenantId: tenantId.substring(0, 8) + '...', // Sanitize
    userId: userId.substring(0, 8) + '...', // Sanitize
    ...additionalContext,
  })
}

// Export convenience methods
export const log = {
  error: logger.error.bind(logger),
  warn: logger.warn.bind(logger),
  info: logger.info.bind(logger),
  debug: logger.debug.bind(logger),
  trace: logger.trace.bind(logger),
}
