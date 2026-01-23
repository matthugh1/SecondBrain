import { NextRequest, NextResponse } from 'next/server'
import { AppError, isAppError } from '@/lib/errors/app-error'

/**
 * Sanitize error message for client
 * Removes stack traces and internal details
 */
function sanitizeError(error: unknown): {
  message: string
  code?: string
  statusCode: number
} {
  if (isAppError(error)) {
    return {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
    }
  }

  if (error instanceof Error) {
    // Don't expose error messages that might contain sensitive info
    // Only expose generic messages for known error types
    if (error.name === 'ZodError') {
      return {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        statusCode: 400,
      }
    }

    if (error.name === 'PrismaClientKnownRequestError') {
      // Prisma errors - sanitize
      return {
        message: 'Database error',
        code: 'DATABASE_ERROR',
        statusCode: 500,
      }
    }

    // Generic error - don't expose message
    return {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
      statusCode: 500,
    }
  }

  // Unknown error type
  return {
    message: 'Internal server error',
    code: 'UNKNOWN_ERROR',
    statusCode: 500,
  }
}

/**
 * Centralized error handler
 * Logs full error details server-side and returns sanitized error to client
 */
export function handleError(error: unknown, context?: string): NextResponse {
  // Log full error details server-side
  const errorDetails = {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    name: error instanceof Error ? error.name : undefined,
    context,
    timestamp: new Date().toISOString(),
  }

  console.error('Error occurred:', errorDetails)

  // Sanitize error for client
  const sanitized = sanitizeError(error)

  return NextResponse.json(
    {
      error: sanitized.message,
      code: sanitized.code,
    },
    { status: sanitized.statusCode }
  )
}

/**
 * Wrapper for async route handlers that automatically handles errors
 * 
 * @example
 * ```typescript
 * export const POST = withErrorHandler(async (request: NextRequest) => {
 *   // Your route handler code
 *   // Errors will be automatically caught and handled
 * })
 * ```
 */
export function withErrorHandler(
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    try {
      return await handler(request, ...args)
    } catch (error) {
      return handleError(error, request.url)
    }
  }
}
