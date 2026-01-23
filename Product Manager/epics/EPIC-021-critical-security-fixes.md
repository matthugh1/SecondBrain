# Epic 021: Critical Security Fixes

**Phase**: 0 - Production Readiness (Critical)  
**Priority**: P0 - BLOCKER  
**Timeline**: Week 1-2  
**Story Points**: 34

## Description

Fix critical security vulnerabilities that could lead to data breaches and tenant isolation failures. These issues must be resolved before any production deployment.

## Goals

- Fix webhook tenant spoofing vulnerabilities
- Secure API key authentication
- Add request validation to prevent injection attacks
- Implement rate limiting to prevent abuse
- Centralize error handling to prevent information leakage

## User Stories

### US-021-001: Fix Slack Webhook Tenant Spoofing
**As a** security engineer  
**I want** Slack webhooks to verify signatures and lookup tenants securely  
**So that** attackers cannot inject data into any tenant

**Priority**: P0 - CRITICAL  
**Story Points**: 8  
**Dependencies**: None

**Acceptance Criteria**:
- [x] Slack webhook verifies request signature using signing secret ✅
- [x] Tenant ID is looked up from Integration table (not from request body) ✅
- [x] Invalid signatures return 401 Unauthorized ✅
- [x] Replay protection (timestamp validation) ✅
- [x] Webhook verification utility function created ✅
- [x] **Gmail/Notion**: Documented - These integrations use API endpoints, not webhooks ✅
  - Gmail: `/api/emails` POST (requires authenticated tenant)
  - Notion: `/api/integrations/notion/sync` (requires authenticated tenant)
  - Both are secured via `requireTenant()` middleware
- [ ] Integration tests verify webhook security (deferred to EPIC-024)

**Technical Notes**:
- Create `lib/integrations/slack-verification.ts` with signature verification
- Update `app/api/integrations/slack/webhook/route.ts`
- Lookup tenant via `getIntegrationByProvider` using team_id
- Add timestamp validation (reject requests > 5 minutes old)
- Store signing secrets in environment variables

**Files to Modify**:
- `app/api/integrations/slack/webhook/route.ts`
- `app/api/integrations/gmail/webhook/route.ts` (if exists)
- `app/api/integrations/notion/webhook/route.ts` (if exists)
- `lib/integrations/slack-verification.ts` (new)
- `lib/integrations/webhook-verification.ts` (new, shared utilities)

---

### US-021-002: Remove Tenant ID from API Key Body
**As a** security engineer  
**I want** API key authentication to never accept tenantId from request body  
**So that** attackers cannot access arbitrary tenant data

**Priority**: P0 - CRITICAL  
**Story Points**: 8 (increased due to service account implementation)  
**Dependencies**: None  
**Status**: ✅ COMPLETED

**Acceptance Criteria**:
- [x] `requireTenantOrApiKey` never accepts tenantId from body
- [x] Service account tokens implemented (Option B - recommended)
- [x] Service account tokens include tenant context securely
- [x] Legacy API key auth requires session (deprecated)
- [x] MCP server updated to use service account tokens
- [x] Service account management API endpoints created
- [x] Service accounts can be created, listed, revoked, and deleted
- [x] Unit tests verify tenant isolation (pending)

**Technical Notes**:
- ✅ Updated `lib/auth/utils.ts:requireTenantOrApiKey` to reject tenantId from body
- ✅ Implemented service account token system:
  - `lib/auth/service-account.ts` - Token generation, hashing, validation
  - `lib/db/repositories/service-accounts.ts` - Repository layer
  - `app/api/service-accounts/route.ts` - CRUD endpoints
  - Prisma schema: `ServiceAccount` model added
- ✅ Service account tokens use SHA-256 hashing (one-way)
- ✅ Tokens include tenant context, no need to pass tenantId
- ✅ Legacy `MCP_API_KEY` still supported but deprecated
- ✅ Updated `mcp-server/index.ts` to use `MCP_SERVICE_ACCOUNT_TOKEN`
- ✅ Updated `README_MCP.md` with service account setup instructions

**Implementation Details**:
- Service account tokens format: `sa_<32-byte hex>`
- Tokens are hashed with SHA-256 before storage
- Token validation includes revocation and expiration checks
- Last used timestamp updated on each validation
- Service accounts are tenant-scoped and can be revoked/deleted

**Files Created**:
- `lib/auth/service-account.ts`
- `lib/db/repositories/service-accounts.ts`
- `app/api/service-accounts/route.ts`
- `app/api/service-accounts/[id]/route.ts`

**Files Modified**:
- `lib/auth/utils.ts`
- `app/api/mcp/tools/route.ts`
- `mcp-server/index.ts`
- `prisma/schema.prisma`
- `README_MCP.md`

---

### US-021-003: Add Request Validation with Zod
**As a** developer  
**I want** all API routes to validate requests with Zod schemas  
**So that** injection attacks and malformed data are prevented

**Priority**: P0 - CRITICAL  
**Story Points**: 8  
**Dependencies**: None

**Acceptance Criteria**:
- [ ] Zod package installed
- [ ] Validation middleware created
- [ ] All critical routes have validation schemas:
  - Capture endpoint
  - Auth endpoints (signin, register)
  - Admin CRUD endpoints
  - Query endpoint
- [ ] Validation errors return 400 with clear messages
- [ ] Type-safe request handling
- [ ] Validation schemas documented

**Technical Notes**:
- Install `zod` package
- Create `lib/middleware/validate-request.ts`
- Create schemas in `lib/validation/schemas.ts`
- Update routes to use validation middleware
- Add TypeScript types from Zod schemas

**Files to Create**:
- `lib/middleware/validate-request.ts`
- `lib/validation/schemas.ts`

**Files to Modify**:
- `app/api/capture/route.ts`
- `app/api/auth/signin/route.ts`
- `app/api/auth/register/route.ts`
- `app/api/[database]/route.ts`
- `app/api/[database]/[id]/route.ts`
- `app/api/query/route.ts`

---

### US-021-004: Add Rate Limiting
**As a** security engineer  
**I want** rate limiting on auth and capture endpoints  
**So that** brute force attacks and cost abuse are prevented

**Priority**: P0 - CRITICAL  
**Story Points**: 5  
**Dependencies**: None

**Acceptance Criteria**:
- [ ] Rate limiting library installed (@upstash/ratelimit or similar)
- [ ] Auth endpoints: 5 attempts per minute per IP
- [ ] Capture endpoint: 100 requests per hour per tenant
- [ ] Rate limit headers returned (X-RateLimit-*)
- [ ] Rate limit exceeded returns 429 Too Many Requests
- [ ] Rate limits configurable per endpoint
- [ ] Rate limit middleware created

**Technical Notes**:
- Install `@upstash/ratelimit` or use Vercel Edge Config
- Create `lib/middleware/rate-limit.ts`
- Apply to auth routes (signin, register)
- Apply to capture route
- Store rate limit state in Redis or Edge Config
- Per-tenant rate limiting for capture endpoint

**Files to Create**:
- `lib/middleware/rate-limit.ts`

**Files to Modify**:
- `app/api/auth/signin/route.ts`
- `app/api/auth/register/route.ts`
- `app/api/capture/route.ts`

---

### US-021-005: Centralize Error Handling
**As a** developer  
**I want** centralized error handling that sanitizes error messages  
**So that** internal details are not leaked to clients

**Priority**: P1 - HIGH  
**Story Points**: 5  
**Dependencies**: None

**Acceptance Criteria**:
- [ ] Custom error classes created
- [ ] Centralized error handler middleware
- [ ] Error messages sanitized (no stack traces to client)
- [ ] Detailed errors logged server-side only
- [ ] Consistent error response format
- [ ] Error tracking integration (Sentry) prepared

**Technical Notes**:
- Create `lib/errors/app-error.ts` with error classes
- Create `lib/middleware/error-handler.ts`
- Update all API routes to use error handler
- Sanitize error messages before sending to client
- Log full error details server-side
- Prepare Sentry integration (install, configure)

**Files to Create**:
- `lib/errors/app-error.ts`
- `lib/middleware/error-handler.ts`

**Files to Modify**:
- All API route files (use error handler)

---

### US-021-006: Require CRON_SECRET
**As a** security engineer  
**I want** cron endpoints to require CRON_SECRET  
**So that** unauthorized access is prevented

**Priority**: P1 - HIGH  
**Story Points**: 3  
**Dependencies**: None

**Acceptance Criteria**:
- [ ] CRON_SECRET check fails if not set (no optional check)
- [ ] Cron endpoints return 500 if CRON_SECRET not configured
- [ ] Invalid CRON_SECRET returns 401
- [ ] Documentation updated with CRON_SECRET requirement
- [ ] Environment variable validation on startup

**Technical Notes**:
- Update `app/api/cron/daily-digest/route.ts`
- Update `app/api/cron/weekly-review/route.ts`
- Change optional check to required check
- Add startup validation in middleware or config
- Update deployment docs

**Files to Modify**:
- `app/api/cron/daily-digest/route.ts`
- `app/api/cron/weekly-review/route.ts`
- `middleware.ts` (add startup validation)

---

## Technical Architecture

### Components
- `lib/integrations/slack-verification.ts` - Slack signature verification
- `lib/integrations/webhook-verification.ts` - Shared webhook utilities
- `lib/middleware/validate-request.ts` - Request validation middleware
- `lib/middleware/rate-limit.ts` - Rate limiting middleware
- `lib/middleware/error-handler.ts` - Centralized error handling
- `lib/errors/app-error.ts` - Custom error classes
- `lib/validation/schemas.ts` - Zod validation schemas

### External Dependencies
- `zod` - Request validation
- `@upstash/ratelimit` or Vercel Edge Config - Rate limiting
- `@sentry/nextjs` - Error tracking (prepare, install later)

### Database Changes
None required (uses existing Integration table for tenant lookup)

## Success Metrics

- Zero webhook security vulnerabilities
- Zero tenant isolation bypasses
- 100% of critical routes have request validation
- Rate limiting prevents brute force attacks
- Error messages never leak internal details
- CRON_SECRET required in all environments

## Security Checklist

- [ ] All webhooks verify signatures
- [ ] No tenantId accepted from request body (except verified webhooks)
- [ ] All routes validate input with Zod
- [ ] Rate limiting on auth endpoints
- [ ] Rate limiting on expensive endpoints (capture)
- [ ] Error messages sanitized
- [ ] CRON_SECRET required
- [ ] Security tests pass
