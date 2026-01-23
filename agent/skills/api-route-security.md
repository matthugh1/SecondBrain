---
name: api-route-security
description: Enforce security best practices for all API routes including authentication, validation, rate limiting, and error handling.
---

# API Route Security Pattern

**CRITICAL**: All API routes MUST follow this pattern to ensure security, reliability, and consistency.

## Required Pattern for All API Routes

Every API route handler MUST include these security layers in order:

### 1. Authentication & Authorization
```typescript
import { requireTenant } from '@/lib/auth/utils'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  // ALWAYS check tenant authentication first
  const tenantCheck = await requireTenant()
  if (tenantCheck instanceof NextResponse) {
    return tenantCheck // Returns 401/403 if unauthorized
  }
  
  const { tenantId, userId } = tenantCheck
  // Now you have verified tenantId - NEVER accept it from request body
}
```

**Rules**:
- ✅ Use `requireTenant()` for authenticated routes
- ✅ Use `requireTenantOrApiKey()` for service account routes
- ❌ NEVER accept `tenantId` from request body (security risk)
- ❌ NEVER trust user-provided tenant IDs

### 2. Rate Limiting (for expensive/auth endpoints)
```typescript
import { authRateLimit, captureRateLimit, queryRateLimit } from '@/lib/middleware/rate-limit'

// For auth endpoints (signin, register)
const rateLimitCheck = await authRateLimit(request)
if (rateLimitCheck) {
  return rateLimitCheck // Returns 429 if rate limited
}

// For expensive endpoints (capture, query)
const rateLimitCheck = await captureRateLimit(request, tenantId)
if (rateLimitCheck) {
  return rateLimitCheck
}
```

**Rules**:
- ✅ Apply `authRateLimit` to `/api/auth/*` routes (5 attempts/minute)
- ✅ Apply `captureRateLimit` to `/api/capture` (100/hour per tenant)
- ✅ Apply `queryRateLimit` to `/api/query` (50/hour per tenant)
- ✅ Apply rate limiting to any endpoint that:
  - Makes AI calls
  - Processes large data
  - Accesses external APIs
  - Could be abused for cost

### 3. Request Validation (for POST/PATCH/PUT)
```typescript
import { validateRequest } from '@/lib/middleware/validate-request'
import { yourSchema } from '@/lib/validation/schemas'

// ALWAYS validate request body
const validation = await validateRequest(yourSchema, request)
if (!validation.success) {
  return validation.response // Returns 400 with validation errors
}

const { data } = validation // Type-safe validated data
```

**Rules**:
- ✅ Create Zod schema in `lib/validation/schemas.ts`
- ✅ Use `validateRequest` for ALL POST/PATCH/PUT routes
- ✅ Validate query parameters for GET routes (if complex)
- ❌ NEVER trust request body without validation
- ❌ NEVER use `request.json()` directly without validation

### 4. Error Handling
```typescript
import { handleError } from '@/lib/middleware/error-handler'

try {
  // Your route logic
} catch (error) {
  return handleError(error, '/api/your-route')
}
```

**Rules**:
- ✅ ALWAYS wrap route logic in try/catch
- ✅ Use `handleError()` for consistent error responses
- ✅ Errors are sanitized (no stack traces to client)
- ✅ Full errors logged server-side only
- ❌ NEVER return raw errors to client
- ❌ NEVER use `console.error` without `handleError`

### 5. Complete Example

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/auth/utils'
import { validateRequest } from '@/lib/middleware/validate-request'
import { handleError } from '@/lib/middleware/error-handler'
import { captureRateLimit } from '@/lib/middleware/rate-limit'
import { captureSchema } from '@/lib/validation/schemas'

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }
    const { tenantId, userId } = tenantCheck

    // 2. Rate Limiting (if needed)
    const rateLimitCheck = await captureRateLimit(request, tenantId)
    if (rateLimitCheck) {
      return rateLimitCheck
    }

    // 3. Request Validation
    const validation = await validateRequest(captureSchema, request)
    if (!validation.success) {
      return validation.response
    }
    const { data } = validation

    // 4. Business Logic (use validated data)
    const result = await yourServiceMethod(tenantId, data)

    return NextResponse.json(result)
  } catch (error) {
    // 5. Error Handling
    return handleError(error, '/api/your-route')
  }
}
```

## Special Cases

### Webhook Endpoints
```typescript
// For Slack webhooks
import { validateSlackWebhook } from '@/lib/integrations/slack-verification'

// Read raw body BEFORE JSON parsing
const bodyText = await request.text()
const signature = request.headers.get('x-slack-signature')
const timestamp = request.headers.get('x-slack-request-timestamp')

const verification = validateSlackWebhook(bodyText, signature, timestamp, signingSecret)
if (!verification.isValid) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

// NOW parse JSON
const body = JSON.parse(bodyText)

// Lookup tenant from Integration table (NOT from body)
const integration = await getIntegrationBySlackTeamId(body.team_id)
```

**Rules**:
- ✅ Verify webhook signatures BEFORE processing
- ✅ Lookup tenant from database (not request body)
- ✅ Validate timestamps (replay protection)
- ❌ NEVER trust webhook payloads without verification

### Cron Endpoints
```typescript
// ALWAYS require CRON_SECRET
const authHeader = request.headers.get('authorization')
const cronSecret = process.env.CRON_SECRET

if (!cronSecret) {
  return NextResponse.json(
    { error: 'Cron endpoint not configured' },
    { status: 500 }
  )
}

if (authHeader !== `Bearer ${cronSecret}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

**Rules**:
- ✅ CRON_SECRET is REQUIRED (not optional)
- ✅ Return 500 if not configured (fail secure)
- ✅ Return 401 if invalid

### Service Account Routes
```typescript
import { requireTenantOrApiKey } from '@/lib/auth/utils'

// Service accounts include tenant context securely
const tenantCheck = await requireTenantOrApiKey(request)
if (tenantCheck instanceof NextResponse) {
  return tenantCheck
}

const { tenantId, serviceAccountId } = tenantCheck
// tenantId comes from token validation, NOT request body
```

## Checklist for New Routes

When creating a new API route, verify:

- [ ] Authentication check (`requireTenant` or `requireTenantOrApiKey`)
- [ ] Rate limiting (if expensive/auth endpoint)
- [ ] Request validation (if POST/PATCH/PUT)
- [ ] Error handling (`handleError` in catch block)
- [ ] Tenant isolation (never accept tenantId from body)
- [ ] Webhook signature verification (if webhook endpoint)
- [ ] CRON_SECRET check (if cron endpoint)

## Common Mistakes to Avoid

❌ **DON'T**:
```typescript
// BAD: No authentication
export async function POST(request: NextRequest) {
  const body = await request.json() // No validation
  const tenantId = body.tenantId // SECURITY RISK!
  // ...
}

// BAD: No error handling
export async function POST(request: NextRequest) {
  const result = await someOperation() // Could throw
  return NextResponse.json(result) // Error leaks to client
}

// BAD: No rate limiting on expensive endpoint
export async function POST(request: NextRequest) {
  const result = await expensiveAICall() // Could be abused
  return NextResponse.json(result)
}
```

✅ **DO**:
```typescript
// GOOD: Follows all security patterns
export async function POST(request: NextRequest) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) return tenantCheck
    
    const rateLimitCheck = await expensiveRateLimit(request, tenantId)
    if (rateLimitCheck) return rateLimitCheck
    
    const validation = await validateRequest(schema, request)
    if (!validation.success) return validation.response
    
    const result = await someOperation(tenantId, validation.data)
    return NextResponse.json(result)
  } catch (error) {
    return handleError(error, '/api/route')
  }
}
```

## References

- Validation schemas: `lib/validation/schemas.ts`
- Error handler: `lib/middleware/error-handler.ts`
- Rate limiters: `lib/middleware/rate-limit.ts`
- Auth utilities: `lib/auth/utils.ts`
- Webhook verification: `lib/integrations/slack-verification.ts`
