---
name: error-handling
description: Enforce consistent error handling patterns to prevent information leakage and ensure proper error responses.
---

# Error Handling Pattern

**CRITICAL**: All API routes MUST use centralized error handling to prevent information leakage and ensure consistent error responses.

## Required Pattern

### ✅ Always Use handleError

```typescript
import { handleError } from '@/lib/middleware/error-handler'

export async function POST(request: NextRequest) {
  try {
    // Your route logic
    const result = await someOperation()
    return NextResponse.json(result)
  } catch (error) {
    // ALWAYS use handleError
    return handleError(error, '/api/your-route')
  }
}
```

## What handleError Does

1. **Sanitizes Errors**: Removes stack traces and sensitive info from client response
2. **Logs Server-Side**: Full error details logged server-side only
3. **Consistent Format**: Returns standardized error response
4. **Proper Status Codes**: Maps errors to appropriate HTTP status codes

## Error Response Format

### Client Receives (Sanitized)
```json
{
  "error": "Internal server error",
  "code": "INTERNAL_ERROR"
}
```

### Server Logs (Full Details)
```
[ERROR] /api/items: Database connection failed
  Error: Connection timeout
  Stack: ...
  TenantId: abc123
  UserId: user456
```

## Custom Error Classes

Use custom error classes for specific error types:

```typescript
import {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  RateLimitError,
} from '@/lib/errors/app-error'

// Throw specific errors
if (!item) {
  throw new NotFoundError('Item not found')
}

if (!hasPermission) {
  throw new AuthorizationError('Insufficient permissions')
}

if (validationFailed) {
  throw new ValidationError('Invalid input')
}
```

## Error Classes Available

```typescript
// Validation errors (400)
throw new ValidationError('Invalid email format')

// Authentication errors (401)
throw new AuthenticationError('Invalid credentials')

// Authorization errors (403)
throw new AuthorizationError('Access denied')

// Not found errors (404)
throw new NotFoundError('Resource not found')

// Rate limit errors (429)
throw new RateLimitError('Too many requests')

// Internal errors (500)
throw new InternalServerError('Database error')
```

## Common Patterns

### ✅ Correct: Full Error Handling

```typescript
export async function POST(request: NextRequest) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }

    const validation = await validateRequest(schema, request)
    if (!validation.success) {
      return validation.response // Validation errors handled
    }

    const result = await someOperation(tenantId, validation.data)
    return NextResponse.json(result)
  } catch (error) {
    return handleError(error, '/api/items') // ✅ All errors handled
  }
}
```

### ❌ Wrong: Manual Error Handling

```typescript
// BAD: Manual error handling leaks information
export async function POST(request: NextRequest) {
  try {
    const result = await someOperation()
    return NextResponse.json(result)
  } catch (error: any) {
    // ❌ Leaks error message and stack trace
    return NextResponse.json(
      { error: error.message, stack: error.stack },
      { status: 500 }
    )
  }
}

// BAD: No error handling
export async function POST(request: NextRequest) {
  const result = await someOperation() // ❌ Unhandled errors crash
  return NextResponse.json(result)
}

// BAD: Only console.error (no client response)
export async function POST(request: NextRequest) {
  try {
    const result = await someOperation()
    return NextResponse.json(result)
  } catch (error) {
    console.error(error) // ❌ No response to client
    // Client gets 500 with no details
  }
}
```

## Error Handling in Different Scenarios

### Database Errors
```typescript
try {
  const item = await prisma.item.findUnique({ where: { id } })
  if (!item) {
    throw new NotFoundError('Item not found')
  }
} catch (error) {
  // Prisma errors are caught and sanitized
  return handleError(error, '/api/items')
}
```

### External API Errors
```typescript
try {
  const response = await fetch('https://api.example.com/data')
  if (!response.ok) {
    throw new Error(`External API error: ${response.status}`)
  }
} catch (error) {
  // Error sanitized, full details logged
  return handleError(error, '/api/external')
}
```

### Validation Errors
```typescript
// Validation errors are handled by validateRequest
const validation = await validateRequest(schema, request)
if (!validation.success) {
  return validation.response // Already sanitized
}
```

### Authentication Errors
```typescript
// Auth errors are handled by requireTenant
const tenantCheck = await requireTenant()
if (tenantCheck instanceof NextResponse) {
  return tenantCheck // Already sanitized
}
```

## Error Context

Always provide context when calling handleError:

```typescript
// Good: Provides route context
return handleError(error, '/api/items')

// Better: Provides operation context
return handleError(error, '/api/items:create')

// Best: Provides full context
return handleError(error, `/api/items:create:tenant-${tenantId}`)
```

## Checklist

When writing error handling:

- [ ] All route handlers wrapped in try/catch
- [ ] `handleError` used in catch blocks
- [ ] Route context provided to handleError
- [ ] Custom error classes used when appropriate
- [ ] No raw error messages sent to client
- [ ] No stack traces in client responses
- [ ] Full error details logged server-side

## Common Mistakes

### ❌ Returning Raw Errors
```typescript
catch (error: any) {
  return NextResponse.json({ error: error.message }) // ❌ Leaks info
}
```

### ❌ No Error Handling
```typescript
const result = await operation() // ❌ Unhandled errors
```

### ❌ Only Logging
```typescript
catch (error) {
  console.error(error) // ❌ No client response
}
```

### ✅ Correct Pattern
```typescript
catch (error) {
  return handleError(error, '/api/route') // ✅ Sanitized + logged
}
```

## References

- Error handler: `lib/middleware/error-handler.ts`
- Error classes: `lib/errors/app-error.ts`
