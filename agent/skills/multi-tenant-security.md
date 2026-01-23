---
name: multi-tenant-security
description: Enforce multi-tenant security patterns to prevent tenant isolation breaches and data leakage.
---

# Multi-Tenant Security Pattern

**CRITICAL**: This application uses row-level tenant isolation. Violating these patterns can lead to data breaches.

## Core Principle

**NEVER trust tenantId from user input. ALWAYS derive it from authenticated session or verified token.**

## Tenant ID Sources (Ranked by Security)

### ✅ Secure Sources (Use These)

1. **From Authenticated Session** (Most Secure)
   ```typescript
   const tenantCheck = await requireTenant()
   const { tenantId } = tenantCheck // ✅ Verified from JWT session
   ```

2. **From Service Account Token** (Secure)
   ```typescript
   const tenantCheck = await requireTenantOrApiKey(request)
   const { tenantId } = tenantCheck // ✅ Verified from token validation
   ```

3. **From Verified Webhook Integration** (Secure)
   ```typescript
   // After verifying webhook signature
   const integration = await getIntegrationBySlackTeamId(teamId)
   const tenantId = integration.tenantId // ✅ Verified from database lookup
   ```

### ❌ Insecure Sources (NEVER Use These)

1. **From Request Body** (CRITICAL SECURITY RISK)
   ```typescript
   const body = await request.json()
   const tenantId = body.tenantId // ❌ SPOOFABLE - DO NOT USE
   ```

2. **From Query Parameters** (CRITICAL SECURITY RISK)
   ```typescript
   const tenantId = request.nextUrl.searchParams.get('tenantId') // ❌ SPOOFABLE
   ```

3. **From Headers** (CRITICAL SECURITY RISK)
   ```typescript
   const tenantId = request.headers.get('x-tenant-id') // ❌ SPOOFABLE
   ```

4. **From Environment Variables** (Wrong Pattern)
   ```typescript
   const tenantId = process.env.MCP_TENANT_ID // ❌ Not tenant-aware
   ```

## Repository Pattern Rules

### ✅ Correct: Always Pass tenantId Explicitly

```typescript
// Repository method signature
export async function getItemById(
  tenantId: string, // ✅ REQUIRED parameter
  id: number
): Promise<Item | null> {
  return prisma.item.findFirst({
    where: {
      id,
      tenantId, // ✅ ALWAYS filter by tenantId
    },
  })
}

// Service layer usage
export async function getItem(tenantId: string, id: number) {
  // tenantId comes from requireTenant(), not request
  return itemRepo.getItemById(tenantId, id)
}

// API route usage
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const tenantCheck = await requireTenant()
  const { tenantId } = tenantCheck // ✅ From session
  
  const item = await getItem(tenantId, parseInt(params.id))
  return NextResponse.json(item)
}
```

### ❌ Wrong: Implicit or Missing tenantId

```typescript
// BAD: Missing tenantId parameter
export async function getItemById(id: number) {
  return prisma.item.findUnique({
    where: { id }, // ❌ No tenant filter - SECURITY RISK
  })
}

// BAD: Accepting tenantId from request
export async function POST(request: NextRequest) {
  const body = await request.json()
  const tenantId = body.tenantId // ❌ SPOOFABLE
  await createItem(tenantId, body) // ❌ Could access any tenant
}
```

## Database Query Rules

### ✅ Always Include tenantId in WHERE Clauses

```typescript
// Single record lookup
prisma.item.findFirst({
  where: {
    id: itemId,
    tenantId, // ✅ REQUIRED
  },
})

// List queries
prisma.item.findMany({
  where: {
    tenantId, // ✅ REQUIRED
    status: 'active',
  },
})

// Updates
prisma.item.updateMany({
  where: {
    id: itemId,
    tenantId, // ✅ REQUIRED - prevents cross-tenant updates
  },
  data: { ... },
})

// Deletes
prisma.item.deleteMany({
  where: {
    id: itemId,
    tenantId, // ✅ REQUIRED - prevents cross-tenant deletes
  },
})
```

### ❌ Never Query Without tenantId Filter

```typescript
// BAD: Missing tenantId filter
prisma.item.findUnique({
  where: { id: itemId }, // ❌ Could return any tenant's data
})

// BAD: Using includes without tenant filter
prisma.item.findMany({
  include: {
    relatedItems: true, // ❌ Related items might be from other tenants
  },
})
```

### ✅ Correct: Filter Related Data

```typescript
// GOOD: Filter related data by tenantId
prisma.item.findMany({
  where: { tenantId },
  include: {
    relatedItems: {
      where: { tenantId }, // ✅ Filter related items too
    },
  },
})
```

## Service Layer Rules

### ✅ Always Accept tenantId as First Parameter

```typescript
// Service method signature
export async function createItem(
  tenantId: string, // ✅ First parameter
  data: CreateItemInput
): Promise<Item> {
  // Validate tenant access if needed
  await verifyTenantAccess(tenantId, userId)
  
  return itemRepo.createItem(tenantId, data)
}

// Usage
const tenantCheck = await requireTenant()
const { tenantId, userId } = tenantCheck
const item = await createItem(tenantId, validatedData)
```

### ❌ Never Derive tenantId in Service Layer

```typescript
// BAD: Service derives tenantId
export async function createItem(data: CreateItemInput) {
  const tenantId = await getActiveTenantId() // ❌ Unclear source
  return itemRepo.createItem(tenantId, data)
}
```

## API Route Pattern

### ✅ Complete Secure Pattern

```typescript
import { requireTenant } from '@/lib/auth/utils'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // 1. Get tenantId from authenticated session (NEVER from body)
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck // 401/403 if unauthorized
    }
    
    const { tenantId, userId } = tenantCheck // ✅ Secure source
    
    // 2. Validate request (don't trust body)
    const validation = await validateRequest(schema, request)
    if (!validation.success) {
      return validation.response
    }
    
    // 3. Pass tenantId explicitly (never from validated data)
    const result = await createItem(tenantId, validation.data)
    
    return NextResponse.json(result)
  } catch (error) {
    return handleError(error, '/api/items')
  }
}
```

## Webhook Security Pattern

### ✅ Secure Webhook Handling

```typescript
// 1. Verify signature FIRST (before any processing)
const bodyText = await request.text() // Read raw body
const verification = validateSlackWebhook(bodyText, signature, timestamp, secret)
if (!verification.isValid) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

// 2. Parse body AFTER verification
const body = JSON.parse(bodyText)

// 3. Lookup tenant from Integration table (NOT from body)
const integration = await getIntegrationBySlackTeamId(body.team_id)
if (!integration) {
  return NextResponse.json({ error: 'Integration not found' }, { status: 404 })
}

const tenantId = integration.tenantId // ✅ From database lookup

// 4. Process with verified tenantId
await processWebhook(tenantId, body)
```

### ❌ Insecure Webhook Handling

```typescript
// BAD: Trusting body without verification
const body = await request.json()
const tenantId = body.tenantId // ❌ SPOOFABLE

// BAD: No signature verification
await processWebhook(tenantId, body) // ❌ Anyone can call this
```

## Service Account Pattern

### ✅ Secure Service Account Usage

```typescript
// Service account token includes tenantId securely
const tenantCheck = await requireTenantOrApiKey(request)
if (tenantCheck instanceof NextResponse) {
  return tenantCheck
}

const { tenantId, serviceAccountId } = tenantCheck
// tenantId comes from token validation, NOT request body
```

### ❌ Insecure Service Account Usage

```typescript
// BAD: Accepting tenantId from body
const body = await request.json()
const tenantId = body.tenantId // ❌ SPOOFABLE

// BAD: Using environment variable
const tenantId = process.env.MCP_TENANT_ID // ❌ Not tenant-aware
```

## Checklist for Multi-Tenant Code

When writing code that accesses tenant data:

- [ ] tenantId comes from `requireTenant()` or verified token (NOT request body)
- [ ] All database queries include `tenantId` in WHERE clause
- [ ] Related data queries filter by `tenantId`
- [ ] Service methods accept `tenantId` as first parameter
- [ ] Webhooks verify signature and lookup tenant from database
- [ ] No `tenantId` accepted from user input (body, query, headers)
- [ ] Repository methods require `tenantId` parameter
- [ ] Updates/deletes use `updateMany`/`deleteMany` with tenantId filter

## Common Vulnerabilities

### 1. Tenant Spoofing via Request Body
```typescript
// VULNERABLE
const tenantId = request.body.tenantId
await getItems(tenantId) // Attacker can access any tenant
```

### 2. Missing tenantId Filter
```typescript
// VULNERABLE
prisma.item.findUnique({ where: { id } }) // Returns any tenant's item
```

### 3. Related Data Leakage
```typescript
// VULNERABLE
prisma.item.findMany({
  include: { relatedItems: true }, // Might include other tenants' items
})
```

## Testing Multi-Tenant Security

When testing, verify:
- [ ] User A cannot access User B's tenant data
- [ ] Webhook with wrong signature is rejected
- [ ] Service account token only accesses its tenant
- [ ] tenantId in request body is ignored
- [ ] Cross-tenant queries return empty results

## References

- Auth utilities: `lib/auth/utils.ts`
- Service accounts: `lib/auth/service-account.ts`
- Webhook verification: `lib/integrations/slack-verification.ts`
- Repository pattern: `lib/db/repositories/`
