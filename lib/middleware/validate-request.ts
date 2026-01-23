import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

/**
 * Validate request body against a Zod schema
 * @param schema - Zod schema to validate against
 * @param request - Next.js request object
 * @returns Object with validated data or error response
 */
export async function validateRequest<T extends z.ZodType>(
  schema: T,
  request: NextRequest
): Promise<
  | { success: true; data: z.infer<T> }
  | { success: false; response: NextResponse }
> {
  try {
    const body = await request.json()
    const data = schema.parse(body)
    return { success: true, data }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        response: NextResponse.json(
          {
            error: 'Validation failed',
            details: error.errors.map((err) => ({
              path: err.path.join('.'),
              message: err.message,
            })),
          },
          { status: 400 }
        ),
      }
    }

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Invalid JSON in request body' },
          { status: 400 }
        ),
      }
    }

    // Unknown error
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      ),
    }
  }
}

/**
 * Middleware wrapper for request validation
 * Use this in API routes to validate request bodies
 * 
 * @example
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   const validation = await validateRequest(captureSchema, request)
 *   if (!validation.success) {
 *     return validation.response
 *   }
 *   const { data } = validation
 *   // Use data.message, data is type-safe
 * }
 * ```
 */
export { validateRequest as default }
