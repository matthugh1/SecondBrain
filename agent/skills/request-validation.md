---
name: request-validation
description: Enforce request validation patterns using Zod schemas for all API endpoints to prevent injection attacks and malformed data.
---

# Request Validation Pattern

**CRITICAL**: All API routes that accept user input MUST validate requests using Zod schemas.

## Why Validation is Required

- ✅ Prevents injection attacks (SQL, NoSQL, XSS)
- ✅ Ensures data integrity
- ✅ Provides type safety
- ✅ Returns clear error messages
- ✅ Prevents malformed data from reaching business logic

## Required Pattern

### 1. Create Zod Schema

**Location**: `lib/validation/schemas.ts`

```typescript
import { z } from 'zod'

// Example: Create item schema
export const createItemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(500, 'Name too long'),
  description: z.string().max(10000, 'Description too long').optional(),
  status: z.enum(['active', 'inactive']).optional(),
  tags: z.array(z.string()).max(10, 'Too many tags').optional(),
  metadata: z.record(z.any()).optional(), // For flexible JSON fields
})

// Export TypeScript type
export type CreateItemRequest = z.infer<typeof createItemSchema>

// Update schema (all fields optional)
export const updateItemSchema = createItemSchema.partial()
export type UpdateItemRequest = z.infer<typeof updateItemSchema>
```

### 2. Use Validation in Route

```typescript
import { validateRequest } from '@/lib/middleware/validate-request'
import { createItemSchema } from '@/lib/validation/schemas'

export async function POST(request: NextRequest) {
  try {
    const tenantCheck = await requireTenant()
    // ... auth check ...

    // ALWAYS validate request body
    const validation = await validateRequest(createItemSchema, request)
    if (!validation.success) {
      return validation.response // Returns 400 with validation errors
    }

    const { data } = validation // Type-safe validated data
    
    // Use validated data (not raw body)
    const item = await createItem(tenantId, data)
    return NextResponse.json(item)
  } catch (error) {
    return handleError(error, '/api/items')
  }
}
```

## Schema Design Rules

### ✅ Good Schema Design

```typescript
// 1. Use appropriate validators
z.string().min(1).max(500) // Length limits
z.string().email() // Email format
z.string().url() // URL format
z.string().regex(/^\d{4}-\d{2}-\d{2}$/) // Date format
z.number().int().positive() // Positive integer
z.enum(['value1', 'value2']) // Enum values

// 2. Make optional fields explicit
z.string().optional() // Optional string
z.string().nullable() // Can be null
z.string().default('default') // Default value

// 3. Use unions for multiple types
z.union([z.string(), z.number()]) // String or number
z.discriminatedUnion('type', [
  z.object({ type: z.literal('a'), value: z.string() }),
  z.object({ type: z.literal('b'), value: z.number() }),
])

// 4. Validate nested objects
z.object({
  address: z.object({
    street: z.string(),
    city: z.string(),
    zip: z.string().regex(/^\d{5}$/),
  }),
})

// 5. Validate arrays
z.array(z.string()).min(1, 'At least one item required').max(10)
```

### ❌ Bad Schema Design

```typescript
// BAD: Too permissive
z.any() // ❌ Allows anything - security risk
z.unknown() // ❌ Use only if truly needed
z.string() // ❌ No length limits - could be huge

// BAD: Missing validation
z.string() // ❌ No min/max - could be empty or huge
z.number() // ❌ No range - could be negative or huge

// BAD: Wrong type
z.string() // ❌ Should be z.number() for numeric IDs
```

## Common Schema Patterns

### Email Schema
```typescript
export const emailSchema = z.string().email('Invalid email address')
```

### Date Schema
```typescript
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
// Or use datetime
export const datetimeSchema = z.string().datetime('Invalid datetime format')
```

### ID Schema
```typescript
export const idSchema = z.number().int().positive('ID must be positive')
// Or string ID
export const stringIdSchema = z.string().min(1, 'ID is required')
```

### Enum Schema
```typescript
export const statusSchema = z.enum(['active', 'inactive', 'archived'])
```

### Union Schema (for multiple types)
```typescript
// For endpoints that accept different request types
export const syncOrWebhookSchema = z.union([
  z.object({ sync: z.literal('gmail') }),
  z.object({
    messageId: z.string().optional(),
    subject: z.string().optional(),
    // ... webhook fields
  }),
])
```

## Route-Specific Patterns

### POST Routes (Create)
```typescript
// All required fields, optional fields marked
export const createItemSchema = z.object({
  name: z.string().min(1), // Required
  description: z.string().optional(), // Optional
})
```

### PATCH Routes (Update)
```typescript
// All fields optional (use .partial())
export const updateItemSchema = createItemSchema.partial()
// Or define explicitly
export const updateItemSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
})
```

### GET Routes (Query Parameters)
```typescript
// Validate query params if complex
const searchParams = request.nextUrl.searchParams
const limit = parseInt(searchParams.get('limit') || '50', 10)
const offset = parseInt(searchParams.get('offset') || '0', 10)

// Validate parsed values
if (limit < 1 || limit > 100) {
  return NextResponse.json({ error: 'Limit must be between 1 and 100' }, { status: 400 })
}
```

## Error Response Format

Validation errors automatically return:
```json
{
  "error": "Validation failed",
  "details": [
    {
      "path": ["name"],
      "message": "Name is required"
    },
    {
      "path": ["email"],
      "message": "Invalid email address"
    }
  ]
}
```

Status code: `400 Bad Request`

## Checklist for New Routes

When creating a new route that accepts input:

- [ ] Schema created in `lib/validation/schemas.ts`
- [ ] Schema exported with TypeScript type
- [ ] `validateRequest` called before processing
- [ ] Validated data used (not raw body)
- [ ] Update schema uses `.partial()` if applicable
- [ ] String fields have min/max length
- [ ] Numeric fields have range validation
- [ ] Enum values validated
- [ ] Nested objects validated
- [ ] Arrays have length limits

## Common Mistakes

### ❌ Missing Validation
```typescript
// BAD: No validation
export async function POST(request: NextRequest) {
  const body = await request.json() // ❌ No validation
  await createItem(body) // ❌ Could be malformed
}
```

### ❌ Using Raw Body After Validation
```typescript
// BAD: Using raw body instead of validated data
const validation = await validateRequest(schema, request)
const body = await request.json() // ❌ Reading body twice + not using validated data
```

### ❌ Too Permissive Schema
```typescript
// BAD: Allows anything
const schema = z.object({
  data: z.any(), // ❌ No validation
})
```

### ✅ Correct Pattern
```typescript
// GOOD: Proper validation
const validation = await validateRequest(schema, request)
if (!validation.success) {
  return validation.response
}
const { data } = validation // ✅ Type-safe validated data
await createItem(tenantId, data)
```

## References

- Validation middleware: `lib/middleware/validate-request.ts`
- Schema examples: `lib/validation/schemas.ts`
- Zod documentation: https://zod.dev
