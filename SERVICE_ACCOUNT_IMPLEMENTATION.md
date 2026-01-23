# Service Account Token Implementation

## Overview

This document describes the implementation of **Option B: Service Account Tokens** for secure server-to-server authentication, replacing the insecure API key + tenantId pattern.

## What Was Implemented

### 1. Database Schema
- Added `ServiceAccount` model to Prisma schema
- Fields: `id`, `tenantId`, `name`, `description`, `tokenHash`, `lastUsedAt`, `expiresAt`, `revokedAt`, `createdBy`
- Indexes on `tenantId`, `tokenHash`, and `revokedAt` for performance

### 2. Token Generation & Validation
**File**: `lib/auth/service-account.ts`
- `generateServiceAccountToken()`: Creates secure random tokens (`sa_<hex>`)
- `hashServiceAccountToken()`: SHA-256 hashing (one-way, cannot be reversed)
- `verifyServiceAccountToken()`: Timing-safe comparison
- `extractServiceAccountToken()`: Parses Bearer token from Authorization header
- `validateServiceAccountToken()`: Validates token, checks revocation/expiration, updates lastUsedAt

### 3. Repository Layer
**File**: `lib/db/repositories/service-accounts.ts`
- `createServiceAccount()`: Creates account and returns token (only shown once)
- `getServiceAccounts()`: Lists active accounts for a tenant
- `getServiceAccountById()`: Gets account by ID (tenant-scoped)
- `revokeServiceAccount()`: Soft-delete (sets revokedAt)
- `deleteServiceAccount()`: Hard-delete (permanent removal)

### 4. API Endpoints
**Files**: 
- `app/api/service-accounts/route.ts` (GET, POST)
- `app/api/service-accounts/[id]/route.ts` (GET, DELETE, PATCH)

**Endpoints**:
- `GET /api/service-accounts` - List all service accounts for tenant
- `POST /api/service-accounts` - Create new service account (returns token)
- `GET /api/service-accounts/[id]` - Get service account details
- `DELETE /api/service-accounts/[id]` - Delete service account
- `PATCH /api/service-accounts/[id]` - Revoke service account (`{"action": "revoke"}`)

### 5. Authentication Integration
**File**: `lib/auth/utils.ts`
- Updated `requireTenantOrApiKey()` to support service account tokens
- Service account tokens are checked first (preferred)
- Legacy `MCP_API_KEY` still supported but deprecated
- Service account tokens include tenant context securely

### 6. MCP Server Updates
**File**: `mcp-server/index.ts`
- Updated to use `MCP_SERVICE_ACCOUNT_TOKEN` environment variable
- Legacy `MCP_API_KEY` still works but shows deprecation warning
- Removed `MCP_TENANT_ID` requirement (tenant comes from token)

### 7. Documentation
**File**: `README_MCP.md`
- Updated with service account setup instructions
- Migration guide from legacy API key
- Security best practices

## Security Features

1. **Token Hashing**: Tokens are hashed with SHA-256 before storage (one-way)
2. **Tenant Isolation**: Tokens are tenant-scoped, cannot access other tenants
3. **Revocation**: Tokens can be revoked without deletion (audit trail)
4. **Expiration**: Optional expiration dates for tokens
5. **Last Used Tracking**: Tracks when tokens are last used
6. **Timing-Safe Comparison**: Prevents timing attacks during validation
7. **No Tenant Spoofing**: Tenant ID comes from token validation, not request body

## Migration Steps

### 1. Run Database Migration
```bash
npx prisma migrate dev --name add_service_accounts
# Or for production:
npx prisma migrate deploy
```

### 2. Generate Prisma Client
```bash
npx prisma generate
```

### 3. Migrate Existing Tenants (if any)
```bash
# Create service accounts for existing tenants that don't have one
npx tsx scripts/migrate-existing-tenants-service-accounts.ts
```

**Note**: New tenants automatically get a service account created during registration. This migration is only needed for tenants created before this feature was added.

### 4. Get Service Account Token

Service accounts are created automatically, but you need to retrieve the token. You have two options:

**Option A: Use the API** (requires authenticated session)
```bash
curl -X GET http://localhost:3000/api/service-accounts \
  -H "Cookie: next-auth.session-token=<your-session>"
```

**Option B: Use the setup script**
```bash
npx tsx scripts/create-service-account.ts [tenant-id]
```

**Important**: The token is only shown when the service account is first created. If you need to see it again, you'll need to create a new service account or check your initial setup logs.

### 5. Update MCP Server Environment
```bash
# In mcp-server/.env or environment variables
MCP_SERVICE_ACCOUNT_TOKEN=sa_<your-token-here>
```

The setup script (`scripts/create-service-account.ts`) can automatically update this file for you.

### 6. Test MCP Server
```bash
cd mcp-server
npm run mcp:dev
```

## Usage Examples

### Creating a Service Account (via API)
```typescript
const response = await fetch('/api/service-accounts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    // Session cookie or Authorization header
  },
  body: JSON.stringify({
    name: 'My Service Account',
    description: 'For automated scripts',
    expiresAt: '2025-12-31T23:59:59Z', // Optional
  }),
})

const { token } = await response.json()
// ⚠️ Save token immediately - it's only shown once!
```

### Using Service Account Token
```typescript
const response = await fetch('/api/mcp/tools', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${serviceAccountToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    tool: 'list_tasks_due_today',
    parameters: {},
  }),
})
```

### Revoking a Service Account
```typescript
await fetch(`/api/service-accounts/${id}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'revoke' }),
})
```

## Benefits Over Legacy API Key

1. **Secure Tenant Context**: Tenant ID comes from token validation, not request body
2. **Revocable**: Can revoke without deleting (maintains audit trail)
3. **Expirable**: Optional expiration dates
4. **Auditable**: Tracks creation, last used, revocation
5. **Multi-Token Support**: Multiple service accounts per tenant
6. **No Session Required**: Works for server-to-server without user sessions

## Automatic Service Account Creation

**Service accounts are now automatically created when a tenant is created!**

When a user registers (creates a new tenant), a default service account named "MCP Server" is automatically created. This means:
- ✅ Every new tenant gets a service account ready to use
- ✅ No manual setup required for new tenants
- ✅ MCP server works immediately for new tenants
- ✅ Token can be retrieved via API or settings UI (future)

The service account is created within the same transaction as tenant creation, ensuring data consistency.

## Next Steps

1. ✅ Database migration (run `prisma migrate dev`)
2. ✅ Automatic service account creation on tenant creation
3. ✅ Migration script for existing tenants
4. ✅ Update MCP server environment variables
5. ⏳ Add UI for service account management (future enhancement)
6. ⏳ Add integration tests for service account authentication
7. ⏳ Deprecate and remove legacy `MCP_API_KEY` support (future)

## Files Changed

**Created**:
- `lib/auth/service-account.ts`
- `lib/db/repositories/service-accounts.ts`
- `app/api/service-accounts/route.ts`
- `app/api/service-accounts/[id]/route.ts`
- `SERVICE_ACCOUNT_IMPLEMENTATION.md` (this file)

**Modified**:
- `prisma/schema.prisma` (added ServiceAccount model)
- `lib/auth/utils.ts` (updated requireTenantOrApiKey)
- `mcp-server/index.ts` (updated to use service account tokens)
- `README_MCP.md` (updated documentation)
- `Product Manager/epics/EPIC-021-critical-security-fixes.md` (marked US-021-002 as completed)
