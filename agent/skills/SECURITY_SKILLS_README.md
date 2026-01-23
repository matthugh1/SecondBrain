# Security & Quality Skills

This directory contains skills that enforce security and quality patterns to prevent vulnerabilities and ensure consistent code quality.

## Available Skills

### 🔒 api-route-security.md
**Purpose**: Enforce security best practices for all API routes

**When to use**: When creating or modifying API routes

**Enforces**:
- Authentication & authorization checks
- Rate limiting on expensive/auth endpoints
- Request validation with Zod
- Centralized error handling
- Webhook signature verification
- CRON_SECRET requirements

**Key Pattern**:
```typescript
export async function POST(request: NextRequest) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) return tenantCheck
    
    const rateLimitCheck = await rateLimit(request, tenantId)
    if (rateLimitCheck) return rateLimitCheck
    
    const validation = await validateRequest(schema, request)
    if (!validation.success) return validation.response
    
    const result = await operation(tenantId, validation.data)
    return NextResponse.json(result)
  } catch (error) {
    return handleError(error, '/api/route')
  }
}
```

---

### 🏢 multi-tenant-security.md
**Purpose**: Prevent tenant isolation breaches and data leakage

**When to use**: When writing code that accesses tenant data

**Enforces**:
- Never accept tenantId from user input
- Always derive tenantId from authenticated session
- All database queries include tenantId filter
- Repository methods require tenantId parameter
- Webhook tenant lookup from database

**Key Rules**:
- ✅ `tenantId` from `requireTenant()` - SECURE
- ✅ `tenantId` from service account token - SECURE
- ❌ `tenantId` from request body - SPOOFABLE
- ❌ `tenantId` from query params - SPOOFABLE

---

### ✅ request-validation.md
**Purpose**: Prevent injection attacks and ensure data integrity

**When to use**: When creating routes that accept user input

**Enforces**:
- Zod schemas for all POST/PATCH/PUT routes
- Type-safe validated data
- Length limits on strings
- Range validation on numbers
- Enum validation

**Key Pattern**:
```typescript
// 1. Create schema in lib/validation/schemas.ts
export const createItemSchema = z.object({
  name: z.string().min(1).max(500),
  status: z.enum(['active', 'inactive']),
})

// 2. Use in route
const validation = await validateRequest(createItemSchema, request)
if (!validation.success) return validation.response
const { data } = validation // Type-safe!
```

---

### 🛡️ error-handling.md
**Purpose**: Prevent information leakage and ensure consistent errors

**When to use**: When writing error handling code

**Enforces**:
- Centralized error handling with `handleError()`
- Error sanitization (no stack traces to client)
- Server-side logging of full errors
- Custom error classes for specific types

**Key Pattern**:
```typescript
try {
  // Your code
} catch (error) {
  return handleError(error, '/api/route')
}
```

---

### 🔍 code-audit.md (Updated)
**Purpose**: Code quality checks before committing

**When to use**: Before every commit

**Includes**:
- Security checklist (references above skills)
- Linting
- Debug code removal
- Dependency checks

---

## How to Use These Skills

### When Creating New API Routes

1. **Read `api-route-security.md`** - Follow the complete pattern
2. **Read `multi-tenant-security.md`** - Ensure tenant isolation
3. **Read `request-validation.md`** - Create validation schemas
4. **Read `error-handling.md`** - Use proper error handling

### When Modifying Existing Routes

1. **Check `code-audit.md`** - Verify security checklist
2. **Apply missing patterns** from relevant skills
3. **Test tenant isolation** - Ensure no cross-tenant access

### Before Committing

1. **Run `code-audit.md` checklist**
2. **Verify all security patterns** are followed
3. **Test with different tenants** - Ensure isolation

## Quick Reference Checklist

When creating/modifying API routes:

- [ ] Authentication: `requireTenant()` or `requireTenantOrApiKey()`
- [ ] Rate Limiting: Applied to expensive/auth endpoints
- [ ] Validation: Zod schema + `validateRequest()` for POST/PATCH/PUT
- [ ] Error Handling: `handleError()` in catch blocks
- [ ] Tenant Security: No `tenantId` from request body
- [ ] Database Queries: Always include `tenantId` filter
- [ ] Webhooks: Verify signatures before processing
- [ ] Cron: Require CRON_SECRET

## Integration with Cursor

These skills are designed to be used by Cursor AI when:
- Creating new API routes
- Modifying existing routes
- Reviewing code for security issues
- Suggesting code improvements

**Cursor will automatically reference these skills when:**
- You ask to create a new API endpoint
- You ask to modify an existing route
- You ask for code review
- You ask about security patterns

## Related Files

- Validation schemas: `lib/validation/schemas.ts`
- Error handler: `lib/middleware/error-handler.ts`
- Rate limiters: `lib/middleware/rate-limit.ts`
- Auth utilities: `lib/auth/utils.ts`
- Webhook verification: `lib/integrations/slack-verification.ts`

## Questions?

If you're unsure about a security pattern:
1. Check the relevant skill file
2. Look at existing secure routes (e.g., `app/api/capture/route.ts`)
3. Ask Cursor to review using these skills
