# Production Blockers - Current Status

**Last Updated**: 2026-01-23  
**EPIC-021 Status**: 🟡 Partially Complete (4/6 stories fully done, 2 partially done)

## Critical Blockers Remaining

### 🔴 US-021-001: Fix Slack Webhook Tenant Spoofing
**Status**: 🟡 Partially Complete  
**Blocking**: Production deployment

**Completed**:
- ✅ Slack webhook signature verification implemented
- ✅ Tenant lookup from Integration table (not request body)
- ✅ Replay protection (timestamp validation)
- ✅ Webhook verification utility functions created

**Missing**:
- ❌ **Gmail webhooks**: No webhook endpoint exists (only API endpoint `/api/emails` POST)
  - **Action**: Either secure the existing endpoint or document that Gmail doesn't use webhooks
- ❌ **Notion webhooks**: No webhook endpoint exists (only `/api/integrations/notion/sync`)
  - **Action**: Either secure the existing endpoint or document that Notion doesn't use webhooks
- ❌ **Integration tests**: No tests verify webhook security
  - **Action**: Add tests in EPIC-024

**Recommendation**: 
- If Gmail/Notion don't use webhooks, update acceptance criteria to reflect this
- If they do, implement signature verification (similar to Slack)
- Add integration tests in EPIC-024

---

### 🟡 US-021-003: Add Request Validation with Zod
**Status**: 🟡 Partially Complete  
**Blocking**: Medium risk

**Completed**:
- ✅ Zod package installed
- ✅ Validation middleware created (`lib/middleware/validate-request.ts`)
- ✅ Validation schemas created (`lib/validation/schemas.ts`)
- ✅ Critical routes have validation:
  - ✅ `/api/capture` - captureSchema
  - ✅ `/api/auth/register` - registerSchema
  - ✅ `/api/query` - querySchema
  - ✅ `/api/[database]` POST - create schemas
  - ✅ `/api/[database]/[id]` PATCH - update schemas

**Missing**:
- ❌ **Signin route**: No `/api/auth/signin` route found (might use NextAuth directly)
  - **Action**: Verify if signin needs validation or is handled by NextAuth
- ❌ **Other routes missing validation**:
  - `/api/emails` POST - No validation
  - `/api/actions` POST - No validation
  - `/api/workflows` POST - No validation
  - `/api/plans` POST - No validation
  - `/api/goals` POST - No validation
  - `/api/messages` POST - No validation
  - `/api/service-accounts` POST - Has validation ✅
  - Many other routes

**Recommendation**: 
- Prioritize routes that accept user input
- Add validation to all POST/PATCH endpoints
- Can be done incrementally (not a hard blocker if critical routes are covered)

---

### 🟡 US-021-004: Add Rate Limiting
**Status**: 🟡 Partially Complete  
**Blocking**: Medium risk

**Completed**:
- ✅ Rate limiting middleware created (`lib/middleware/rate-limit.ts`)
- ✅ Auth rate limit: 5 attempts per minute per IP
- ✅ Capture rate limit: 100 requests per hour per tenant
- ✅ Applied to `/api/auth/register`
- ✅ Applied to `/api/capture`

**Missing**:
- ❌ **Signin route**: No rate limiting (if it exists)
  - **Action**: Add rate limiting if signin route exists
- ❌ **Other expensive endpoints**: No rate limiting
  - `/api/query` - Could be expensive (AI calls)
  - `/api/actions` - Could be expensive
  - `/api/workflows` - Could be expensive

**Recommendation**:
- Add rate limiting to signin (if exists)
- Add rate limiting to AI-powered endpoints (query, actions)
- Can use tenant-based rate limiting for authenticated endpoints

---

### 🟡 US-021-005: Centralize Error Handling
**Status**: 🟡 Partially Complete  
**Blocking**: Low-Medium risk

**Completed**:
- ✅ Custom error classes created (`lib/errors/app-error.ts`)
- ✅ Centralized error handler created (`lib/middleware/error-handler.ts`)
- ✅ Error sanitization implemented
- ✅ Applied to critical routes:
  - ✅ `/api/capture`
  - ✅ `/api/auth/register`
  - ✅ `/api/query`
  - ✅ `/api/[database]` POST/GET
  - ✅ `/api/[database]/[id]` GET/PATCH/DELETE
  - ✅ `/api/service-accounts`

**Missing**:
- ❌ **Many routes still use manual error handling**:
  - `/api/emails` - Uses manual try/catch, doesn't sanitize
  - `/api/actions` - Unknown
  - `/api/workflows` - Unknown
  - `/api/plans` - Unknown
  - `/api/goals` - Unknown
  - `/api/messages` - Unknown
  - Many other routes

**Recommendation**:
- Migrate all routes to use `handleError` incrementally
- Not a hard blocker if critical routes are covered
- Can be done as part of code cleanup

---

### ✅ US-021-002: Remove Tenant ID from API Key Body
**Status**: ✅ Complete  
**No blockers**

---

### ✅ US-021-006: Require CRON_SECRET
**Status**: ✅ Complete  
**No blockers**

---

## Summary of Blockers

### ✅ Completed Blockers:
1. ✅ **US-021-001**: Documented Gmail/Notion webhook status
   - Gmail/Notion use API endpoints (not webhooks), secured via `requireTenant()`
   - Updated EPIC-021 acceptance criteria

2. ✅ **US-021-003**: Added validation to high-priority routes
   - `/api/emails` POST - emailPostSchema
   - `/api/actions` POST - createActionSchema
   - `/api/workflows` POST - createWorkflowSchema
   - Validation schemas added to `lib/validation/schemas.ts`

3. ✅ **US-021-004**: Added rate limiting to signin and AI endpoints
   - NextAuth signin endpoint - rate limited (5 attempts/minute)
   - `/api/query` POST/GET - rate limited (50 requests/hour per tenant)
   - Query rate limiter added to `lib/middleware/rate-limit.ts`

4. ✅ **US-021-005**: Migrated routes to centralized error handling
   - `/api/emails` GET/POST - uses `handleError`
   - `/api/actions` GET/POST - uses `handleError`
   - `/api/workflows` GET/POST - uses `handleError`
   - `/api/query` GET - uses `handleError` (POST already had it)

## Recommended Action Plan

### Week 1 (This Week):
1. ✅ **US-021-002**: Service Account Tokens - DONE
2. ✅ **US-021-006**: CRON_SECRET - DONE
3. ✅ **US-021-001**: Document Gmail/Notion webhook status - DONE
4. ✅ **US-021-004**: Add rate limiting to signin and query routes - DONE
5. ✅ **US-021-003**: Add validation to high-priority routes - DONE
6. ✅ **US-021-005**: Migrate routes to centralized error handling - DONE

### Week 2:
5. 🔄 **US-021-003**: Add validation to high-priority routes (2 hours)
   - `/api/emails` POST
   - `/api/actions` POST
   - `/api/workflows` POST
6. 🔄 **US-021-005**: Migrate high-priority routes to error handler (1 hour)
   - `/api/emails`
   - `/api/actions`
   - `/api/workflows`

### Week 3 (EPIC-024):
7. Add integration tests for webhook security (US-021-001)
8. Add tests for validation (US-021-003)
9. Add tests for rate limiting (US-021-004)

## Next Epic: EPIC-022 (Foundational Reliability)

Once EPIC-021 blockers are resolved, proceed to:
- **EPIC-022**: Foundational Reliability (P1 - HIGH)
  - Prisma connection pooling
  - Retry logic for AI calls
  - Retry logic for integrations
  - Timeouts
  - Idempotency
  - Transaction boundaries
