# Tech Lead Review: Production Readiness Assessment
**Date:** January 23, 2026  
**Reviewer:** Staff+ Tech Lead / Principal Engineer  
**Scope:** End-to-end security, stability, scalability, observability, maintainability

---

## A) Executive Summary

**Critical Findings:**
- **CRITICAL:** Slack webhook accepts unverified requests - allows tenant spoofing via `team_id` in body
- **CRITICAL:** API key authentication accepts `tenantId` from request body - spoofable
- **CRITICAL:** No request validation library (Zod/Yup) - injection risks
- **HIGH:** CRON_SECRET check is optional - if not set, endpoints are unprotected
- **HIGH:** No rate limiting on auth endpoints - brute force vulnerable
- **HIGH:** Prisma connection pooling not configured for Vercel serverless
- **HIGH:** No retry logic for AI calls or integrations - cascading failures
- **MEDIUM:** Error messages leak internal details in some routes
- **MEDIUM:** No structured logging - observability gaps
- **MEDIUM:** No test coverage - regression risk

**Positive Findings:**
- ✅ Repository pattern consistently enforces tenant filtering
- ✅ NextAuth JWT strategy properly configured
- ✅ Database indexes on tenantId columns present
- ✅ Vercel cron jobs configured (better than node-cron)
- ✅ Multi-tenant schema design is sound

**Architecture Style:** Modular monolith with clear separation:
- UI layer (App Router pages/components)
- API routes (Next.js route handlers)
- Service layer (business logic)
- Repository layer (data access)
- Integration layer (external services)

**Recommendation:** **DO NOT DEPLOY TO PRODUCTION** until critical security issues are resolved. Estimated remediation: 2-3 weeks for critical items.

---

## B) Architecture Diagram

### Request Flow (Standard API Route)
```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ HTTP Request
       ▼
┌─────────────────────────────────────┐
│  Next.js Middleware (middleware.ts) │
│  - Auth check (withAuth)             │
│  - Route protection                  │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  API Route Handler                   │
│  (/app/api/[route]/route.ts)        │
│  - requireTenant() → tenantId       │
│  - Request validation (MISSING)      │
│  - Error handling (inconsistent)    │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Service Layer                       │
│  (/lib/services/*.ts)                │
│  - Business logic                    │
│  - AI calls (no retries)             │
│  - Integration calls (no retries)    │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Repository Layer                    │
│  (/lib/db/repositories/*.ts)         │
│  - Prisma queries                    │
│  - Tenant filtering (✅ consistent)   │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Prisma Client                       │
│  (/lib/db/index.ts)                  │
│  - Connection pooling (NOT CONFIGURED)│
│  - Query execution                  │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  PostgreSQL                         │
│  - Row-level tenant isolation       │
│  - Indexes on tenantId (✅ present)  │
└─────────────────────────────────────┘
```

### AI Workflow Flow
```
┌─────────────────────────────────────┐
│  User Input (capture/query)          │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Classification Service              │
│  - Build prompt (DB + template)     │
│  - Call OpenAI/Anthropic            │
│  - NO RETRY on failure              │
│  - NO TIMEOUT configured            │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Parse & Validate Response           │
│  - JSON parsing (try/catch)          │
│  - Category validation               │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Create Record (Repository)          │
│  - Tenant-scoped insert              │
│  - Generate embedding (async)        │
│  - Detect relationships (async)      │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Audit Logging                       │
│  - ClassificationAudit (✅ present)  │
│  - TokenUsage (✅ present)           │
│  - InboxLog (✅ present)             │
└─────────────────────────────────────┘
```

### Webhook Flow (CRITICAL SECURITY ISSUE)
```
┌─────────────────────────────────────┐
│  Slack/Gmail/Notion Webhook          │
└──────┬──────────────────────────────┘
       │
       │ ❌ NO SIGNATURE VERIFICATION
       │ ❌ NO REPLAY PROTECTION
       │
       ▼
┌─────────────────────────────────────┐
│  Webhook Handler                     │
│  (/app/api/integrations/*/webhook)    │
│  - Extract tenantId from body        │
│  - ❌ SPOOFABLE: body.team_id        │
│  - Process event                      │
└──────┬──────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Integration Service                │
│  - Verify integration exists         │
│  - Process message/capture          │
└─────────────────────────────────────┘
```

**Coupling & Duplication:**
- Service layer has direct Prisma calls in some places (should go through repos)
- Error handling duplicated across routes (needs centralization)
- Tenant context passed explicitly (good) but no type-safe wrapper
- AI provider abstraction exists but no retry/backoff wrapper

**Scale Break Points:**
1. Prisma connection exhaustion (no pooling config)
2. AI API rate limits (no per-tenant throttling)
3. Webhook spam (no rate limiting)
4. Large tenant queries (no pagination limits enforced)

---

## C) Findings

### 1. SECURITY REVIEW

#### 1.1 Multi-Tenancy Authorization (CRITICAL)

**Current Implementation:**
- Tenant ID derived from JWT token (`session.activeTenantId`) ✅
- Fallback to first membership if token missing ⚠️
- Repositories consistently filter by `tenantId` ✅
- **CRITICAL:** API key path accepts `tenantId` from request body ❌
- **CRITICAL:** Slack webhook uses `body.team_id` without verification ❌

**Vulnerabilities:**

1. **Tenant Spoofing via API Key** (`lib/auth/utils.ts:63-102`)
   ```typescript
   // ❌ DANGEROUS: tenantId from request body
   if (body?.tenantId) {
     tenantId = body.tenantId
   }
   ```
   **Impact:** Attacker with valid API key can access any tenant's data
   **Fix:** Remove body.tenantId acceptance; require session or lookup from integration

2. **Slack Webhook Tenant Spoofing** (`app/api/integrations/slack/webhook/route.ts:20`)
   ```typescript
   // ❌ NO VERIFICATION: team_id from body
   const tenantId = body.team_id
   ```
   **Impact:** Anyone can POST to webhook with any team_id to inject data into any tenant
   **Fix:** Verify Slack signature, lookup tenant from Integration table by Slack team ID

3. **Missing Tenant Verification in Some Paths**
   - MCP server accepts tenantId from args (`mcp-server/index.ts:113`)
   - No verification that user has access to that tenant

**Tenant Safety Checklist:**
- [ ] ✅ Repository methods require tenantId as first parameter
- [ ] ✅ All Prisma queries include `where: { tenantId }`
- [ ] ❌ API routes never accept tenantId from request body (except verified webhooks)
- [ ] ❌ Webhook handlers verify signature before extracting tenant
- [ ] ❌ Service methods never accept tenantId implicitly
- [ ] ❌ No raw SQL queries bypass tenant filtering
- [ ] ⚠️ Admin/global access paths are clearly marked and protected

**Recommended Pattern:**
```typescript
// ✅ GOOD: Explicit tenant context
interface TenantContext {
  tenantId: string
  userId: string
  role?: 'owner' | 'admin' | 'member'
}

// ❌ BAD: Implicit tenant from session
async function someService(userId: string) {
  const tenantId = await getActiveTenantId() // Hidden dependency
}
```

**Architecture Recommendation:**
- **Current:** Single DB + shared schema + tenant_id everywhere (row-level isolation)
- **Verdict:** ✅ CORRECT for this app
- **Justification:** 
  - Vercel serverless works well with connection pooling
  - Cost-effective for SaaS
  - Prisma enforces tenant filtering at application layer
  - Migration to separate DBs would be expensive and unnecessary

**Refactors Required:**
1. `lib/auth/utils.ts:requireTenantOrApiKey` - Remove body.tenantId acceptance
2. `app/api/integrations/slack/webhook/route.ts` - Add signature verification, lookup tenant from Integration
3. `app/api/mcp/tools/route.ts` - Verify tenant access before processing
4. Create `lib/auth/tenant-context.ts` - Type-safe tenant context wrapper

---

#### 1.2 NextAuth Configuration

**Current Config** (`lib/auth/config.ts`):
- ✅ JWT strategy (good for serverless)
- ✅ Prisma adapter configured
- ⚠️ Secret fallback to AUTH_SECRET (should be required)
- ❌ No cookie security flags visible (HttpOnly, Secure, SameSite)
- ❌ No CSRF protection configuration visible
- ❌ No rate limiting on `/api/auth/signin`

**Issues:**
1. **Missing Cookie Security** - NextAuth defaults may not be secure enough
2. **No Brute Force Protection** - Signin endpoint vulnerable
3. **Secret Management** - Fallback secret is risky

**Fixes:**
```typescript
// Add to authOptions
cookies: {
  sessionToken: {
    name: `__Secure-next-auth.session-token`,
    options: {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
    },
  },
},
```

---

#### 1.3 API Route Security

**Missing Protections:**
1. **No Request Validation** - No Zod/Yup/Joi
   - Injection risks from unvalidated input
   - Type safety gaps
   - **Fix:** Add `zod` package, create validation middleware

2. **No Rate Limiting**
   - Auth endpoints: brute force vulnerable
   - Capture endpoint: AI cost abuse
   - **Fix:** Add `@upstash/ratelimit` or Vercel Edge Config

3. **No Upload Size Limits**
   - `app/api/attachments/upload/route.ts` - no size check
   - `app/api/audio/upload/route.ts` - no size check
   - **Fix:** Add `maxRequestSize` in Next.js config, validate in routes

4. **Error Message Leakage**
   - Some routes return full error messages (`app/api/capture/route.ts:31`)
   - **Fix:** Sanitize errors, log details server-side only

5. **CORS Not Configured**
   - No explicit CORS policy
   - **Fix:** Add CORS middleware if needed for integrations

---

#### 1.4 Webhook Security

**Slack Webhook** (`app/api/integrations/slack/webhook/route.ts`):
- ❌ No signature verification
- ❌ No replay protection
- ❌ Tenant ID from unverified body

**Required Fix:**
```typescript
import crypto from 'crypto'

export async function verifySlackSignature(
  body: string,
  signature: string,
  timestamp: string,
  signingSecret: string
): Promise<boolean> {
  const hmac = crypto.createHmac('sha256', signingSecret)
  const [version, hash] = signature.split('=')
  const baseString = `${version}:${timestamp}:${body}`
  const computedHash = hmac.update(baseString).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(computedHash))
}
```

**Gmail/Notion Webhooks:** Similar issues likely exist.

---

#### 1.5 AI Security

**Prompt Injection Risks:**
- User input directly in prompts (`lib/services/classification.ts`)
- No output filtering for tool calls
- Agent actions can be triggered by user input

**Mitigations:**
1. Sanitize user input before prompt construction
2. Add output validation for agent actions
3. Require explicit approval for destructive actions
4. Rate limit AI calls per tenant

**RAG Grounding:**
- Embeddings stored per tenant ✅
- Semantic search scoped to tenant ✅
- No trust level boundaries (all sources treated equally)

---

#### 1.6 Secrets Management

**Current State:**
- Secrets in environment variables ✅
- No rotation strategy ❌
- API keys in code (read from env) ✅
- Risk of logging secrets ❌

**Recommendations:**
1. Use Vercel Environment Variables (encrypted at rest)
2. Implement secret rotation schedule
3. Add secret scanning to CI/CD
4. Never log API keys (add filter in logging)

---

#### 1.7 Supply Chain Security

**Current State:**
- `package-lock.json` present ✅
- No dependency audit visible ❌
- No SCA tooling ❌

**Recommendations:**
1. Add `npm audit` to CI/CD
2. Use Dependabot or Snyk
3. Pin dependency versions strictly
4. Review transitive dependencies

---

#### 1.8 Security Headers

**Missing:**
- Content-Security-Policy (CSP)
- Strict-Transport-Security (HSTS)
- X-Frame-Options
- Referrer-Policy

**Fix:** Add to `next.config.js`:
```javascript
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains',
        },
      ],
    },
  ]
}
```

---

### 2. STABILITY & RELIABILITY

#### 2.1 Error Handling

**Issues:**
- Inconsistent error handling across routes
- Some routes expose error details to client
- No centralized error handler
- No error tracking (Sentry, etc.)

**Recommendations:**
1. Create `lib/errors/app-error.ts` - Custom error classes
2. Create `lib/middleware/error-handler.ts` - Centralized handler
3. Add error tracking (Sentry)
4. Standardize error responses

---

#### 2.2 Prisma Connection Management

**Current** (`lib/db/index.ts`):
```typescript
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})
```

**Issues:**
- No connection pool configuration
- No timeout settings
- Risk of connection exhaustion on Vercel

**Fix:**
```typescript
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.PRISMA_DATABASE_URL,
    },
  },
})

// Add connection pool config via DATABASE_URL params:
// ?connection_limit=10&pool_timeout=20
```

---

#### 2.3 Retry Logic

**Missing:**
- AI API calls (OpenAI/Anthropic) - no retries
- Integration calls (Slack, Gmail, Notion) - no retries
- Database queries - no retries

**Recommendations:**
1. Add exponential backoff wrapper for AI calls
2. Add circuit breaker for integrations
3. Use Prisma's built-in retry for transient DB errors

**Example:**
```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  backoffMs = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      if (isRetryableError(error)) {
        await sleep(backoffMs * Math.pow(2, i))
        continue
      }
      throw error
    }
  }
  throw new Error('Max retries exceeded')
}
```

---

#### 2.4 Timeouts

**Missing:**
- AI call timeouts
- Integration call timeouts
- Database query timeouts

**Fix:**
- Add timeout to fetch calls
- Configure Prisma query timeout
- Set Vercel function timeout (already 30s ✅)

---

#### 2.5 Idempotency

**Issues:**
- Workflow executions not idempotent
- Agent actions can be duplicated
- Webhook processing can be retried multiple times

**Recommendations:**
1. Add idempotency keys to workflow executions
2. Check for duplicate agent actions before execution
3. Use webhook event ID as idempotency key

---

#### 2.6 Transaction Boundaries

**Issues:**
- Some operations span multiple repositories without transactions
- Risk of partial failures

**Example:** `lib/services/capture.ts:createRecord` - creates record, then generates embedding async. If embedding fails, record exists but no search capability.

**Fix:** Use Prisma transactions for critical operations.

---

#### 2.7 Cron Job Reliability

**Current:** Vercel Cron ✅ (better than node-cron)
**Issues:**
- CRON_SECRET check is optional
- No idempotency for digest generation
- No failure tracking

**Fixes:**
1. Require CRON_SECRET (fail if not set)
2. Add idempotency check (don't regenerate if exists for date)
3. Track failures in database

---

### 3. SCALABILITY & PERFORMANCE

#### 3.1 Database Query Patterns

**N+1 Query Risks:**
- Some repositories may have N+1 issues
- Need audit of all `findMany` with `include`

**Pagination:**
- No pagination limits enforced
- Large tenants could return thousands of records

**Recommendations:**
1. Add pagination to all list endpoints
2. Default limit: 50, max: 200
3. Use cursor-based pagination for large datasets

---

#### 3.2 Indexing Strategy

**Current:** Good indexes on `tenantId` ✅
**Missing:**
- Composite indexes on `(tenantId, status)` for filtered queries
- Indexes on `created_at` for ordering
- Indexes on foreign keys (e.g., `projectId` in Admin)

**Recommended Indexes:**
```prisma
// Add to schema.prisma
model Admin {
  // ... existing fields
  @@index([tenantId, status, archived])
  @@index([tenantId, dueDate, archived])
  @@index([tenantId, projectId])
}

model Project {
  // ... existing fields
  @@index([tenantId, status, archived])
}
```

---

#### 3.3 Caching

**Missing:**
- No caching layer
- Expensive queries run on every request
- AI responses not cached

**Recommendations:**
1. Add Redis (Upstash) for:
   - Rule settings (frequently accessed)
   - User profiles
   - Integration configs
2. Use Next.js cache for static data
3. Cache AI classification results (with TTL)

---

#### 3.4 AI Cost Scaling

**Issues:**
- No per-tenant rate limiting
- No token budgeting
- No model selection based on cost

**Recommendations:**
1. Add rate limiting per tenant (e.g., 1000 calls/day)
2. Track token usage (already done ✅)
3. Alert on high usage
4. Consider cheaper models for simple classifications

---

#### 3.5 Semantic Search

**Current:**
- Embeddings stored as JSON strings in PostgreSQL
- No vector similarity search indexing

**Recommendations:**
1. Migrate to `pgvector` extension
2. Add HNSW index for fast similarity search
3. Consider dedicated vector DB (Pinecone/Qdrant) for scale

---

#### 3.6 Audio Transcription

**Issues:**
- Synchronous processing (blocks request)
- No chunking for large files
- No async job queue

**Recommendations:**
1. Move to background job (Vercel Background Functions)
2. Use queue (Inngest or Vercel Queue)
3. Chunk large audio files

---

### 4. OBSERVABILITY & OPERATIONS

#### 4.1 Logging

**Current:**
- `console.log` / `console.error` only
- No structured logging
- No correlation IDs
- No tenant/user context in logs

**Recommendations:**
1. Add structured logging (Pino or Winston)
2. Add request ID middleware
3. Include tenantId, userId in all logs (sanitized)
4. Use Vercel Log Drains or external service (Datadog, Logtail)

**Example:**
```typescript
import pino from 'pino'

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
})

export function logWithContext(tenantId: string, userId: string, message: string, data?: any) {
  logger.info({
    tenantId,
    userId,
    ...data,
  }, message)
}
```

---

#### 4.2 Metrics

**Missing:**
- No application metrics
- No latency tracking
- No error rate tracking
- No AI call metrics (beyond token usage)

**Recommendations:**
1. Add metrics collection (Vercel Analytics or Datadog)
2. Track:
   - Request latency (p50, p95, p99)
   - Error rate by endpoint
   - AI call success/fail rate
   - Database query timing
   - Workflow execution metrics

---

#### 4.3 Tracing

**Missing:**
- No distributed tracing
- No correlation across services

**Recommendations:**
1. Add OpenTelemetry
2. Trace: API → Service → Repository → DB
3. Trace: API → AI Provider
4. Use Vercel's built-in tracing or external (Honeycomb, Datadog)

---

#### 4.4 Alerting

**Missing:**
- No alerting configuration
- No SLOs defined

**Recommendations:**
1. Set up alerts for:
   - Error rate > 1%
   - P95 latency > 2s
   - AI API failures
   - Database connection errors
   - Cron job failures
2. Use Vercel Alerts or external (PagerDuty, Opsgenie)

---

#### 4.5 Audit Logging

**Current:**
- `ActionHistory` table exists ✅
- `ClassificationAudit` exists ✅
- Not comprehensive

**Recommendations:**
1. Log all mutations (create/update/delete)
2. Include: who, what, when, tenant, IP
3. Store in separate audit table
4. Retain for compliance (7 years for enterprise)

---

### 5. CI/CD, TESTING, AND QUALITY GATES

#### 5.1 Testing

**Current:**
- ❌ No test files found
- ❌ No test coverage
- ❌ No integration tests

**Recommendations:**
1. Add unit tests for:
   - Repository methods (tenant isolation)
   - Service methods (business logic)
   - Auth utilities (tenant verification)
2. Add integration tests:
   - API routes (with test DB)
   - Webhook verification
   - Multi-tenant isolation
3. Add E2E tests (Playwright):
   - Critical user flows
   - Auth flows
4. Target: 70% coverage minimum

---

#### 5.2 CI/CD Pipeline

**Current:** GitHub Actions workflows exist ✅
**Missing:**
- Lint/typecheck steps
- Test execution
- Dependency audit
- Secret scanning

**Recommended Workflow:**
```yaml
name: CI
on: [push, pull_request]
jobs:
  lint:
    - Run ESLint
    - Run TypeScript typecheck
  test:
    - Run unit tests
    - Run integration tests (with Postgres service container)
  security:
    - npm audit
    - Secret scanning (truffleHog)
  build:
    - Prisma generate
    - Next.js build
```

---

#### 5.3 Release Strategy

**Missing:**
- No feature flags
- No canary deployments
- No staged rollouts

**Recommendations:**
1. Add feature flags (LaunchDarkly or custom)
2. Use Vercel preview deployments for testing
3. Gradual rollout: 10% → 50% → 100%

---

#### 5.4 Database Migrations

**Current:**
- Prisma migrations ✅
- No migration safety checks ❌

**Recommendations:**
1. Add migration checks to CI
2. Test migrations on preview DB
3. Require approval for production migrations
4. Add rollback procedures

---

## D) Prioritized Backlog Table

| Item | Severity | Effort | Impact | Owner | Where | Notes |
|------|----------|--------|--------|-------|-------|-------|
| Fix Slack webhook tenant spoofing | Critical | M | 5 | Backend | `app/api/integrations/slack/webhook/route.ts` | Add signature verification, lookup tenant from Integration table |
| Remove tenantId from API key body | Critical | S | 5 | Backend | `lib/auth/utils.ts:63-102` | Remove body.tenantId acceptance, require session |
| Add request validation (Zod) | Critical | M | 5 | Backend | All API routes | Install zod, create validation middleware |
| Require CRON_SECRET | High | S | 4 | Backend | `app/api/cron/*/route.ts` | Fail if CRON_SECRET not set |
| Add rate limiting | High | M | 4 | Backend | Auth + capture endpoints | Use @upstash/ratelimit |
| Configure Prisma connection pool | High | S | 4 | Backend | `lib/db/index.ts` | Add connection_limit, pool_timeout to DATABASE_URL |
| Add retry logic for AI calls | High | M | 4 | Backend | `lib/services/classification.ts` | Exponential backoff wrapper |
| Add structured logging | Medium | M | 3 | Backend | All services | Install pino, add request ID middleware |
| Add error tracking (Sentry) | Medium | S | 3 | Backend | Global error handler | Install @sentry/nextjs |
| Add security headers | Medium | S | 3 | Infra | `next.config.js` | CSP, HSTS, X-Frame-Options |
| Add pagination to list endpoints | Medium | M | 3 | Backend | All GET routes | Default limit 50, max 200 |
| Add database indexes | Medium | S | 3 | Data | `prisma/schema.prisma` | Composite indexes on (tenantId, status) |
| Add unit tests | Medium | L | 3 | Backend | New `/__tests__` dirs | Target 70% coverage |
| Add webhook signature verification | High | M | 4 | Backend | All webhook routes | Slack, Gmail, Notion |
| Add idempotency to workflows | Medium | M | 3 | Backend | `lib/services/workflows.ts` | Idempotency keys |
| Add caching layer | Medium | L | 3 | Backend | Redis (Upstash) | Cache rule settings, user profiles |
| Add CI/CD quality gates | Medium | M | 3 | Infra | `.github/workflows/` | Lint, test, audit, secret scan |
| Add metrics collection | Medium | M | 3 | Backend | Vercel Analytics or Datadog | Latency, error rate, AI metrics |
| Add timeout configuration | Medium | S | 3 | Backend | AI + integration calls | 30s timeout for external calls |
| Add audit logging | Low | M | 2 | Backend | New audit service | Log all mutations |

**Legend:**
- Severity: Critical / High / Medium / Low
- Effort: S (Small, <1 day) / M (Medium, 1-3 days) / L (Large, >3 days)
- Impact: 1-5 (5 = highest business impact)
- Owner: Backend / Frontend / Infra / Data

---

## E) Phased Roadmap

### Week 1-2: Critical Risk Reduction (STOP THE BLEEDING)

**Goal:** Fix security vulnerabilities that could lead to data breaches

1. **Day 1-2: Webhook Security**
   - Add Slack signature verification
   - Lookup tenant from Integration table (not body)
   - Apply same pattern to Gmail/Notion webhooks

2. **Day 3: API Key Security**
   - Remove tenantId from request body acceptance
   - Require session or verified integration lookup

3. **Day 4-5: Request Validation**
   - Install Zod
   - Create validation middleware
   - Add validation to critical routes (capture, auth, admin)

4. **Day 6-7: Rate Limiting**
   - Add @upstash/ratelimit
   - Protect auth endpoints (5 attempts/min)
   - Protect capture endpoint (100/hour per tenant)

5. **Day 8-10: Error Handling**
   - Centralize error handler
   - Sanitize error messages
   - Add Sentry for tracking

**Deliverable:** Secure, production-ready API layer

---

### Month 1: Foundational Hardening

**Goal:** Build reliability and observability foundations

**Week 3-4: Reliability**
- Configure Prisma connection pooling
- Add retry logic for AI calls (exponential backoff)
- Add timeout configuration
- Add idempotency to workflows
- Require CRON_SECRET

**Week 5-6: Observability**
- Add structured logging (Pino)
- Add request ID middleware
- Add metrics collection (Vercel Analytics)
- Set up basic alerts (error rate, latency)

**Week 7-8: Testing & CI/CD**
- Add unit tests (target 50% coverage)
- Add integration tests for tenant isolation
- Add CI/CD quality gates (lint, test, audit)
- Add secret scanning

**Deliverable:** Observable, testable, reliable system

---

### Quarter: Scale + Platform Maturity

**Goal:** Prepare for enterprise scale and multi-tenant growth

**Month 2: Performance**
- Add pagination to all list endpoints
- Add database indexes (composite on tenantId + filters)
- Add caching layer (Redis/Upstash)
- Optimize N+1 queries

**Month 3: Advanced Features**
- Add distributed tracing (OpenTelemetry)
- Add feature flags
- Add comprehensive audit logging
- Add AI cost controls (per-tenant rate limiting)

**Month 4: Enterprise Readiness**
- Add comprehensive test coverage (70%+)
- Add E2E tests (Playwright)
- Add migration safety checks
- Add staged rollout capability
- Add security headers (CSP, HSTS)
- Add dependency audit automation

**Deliverable:** Enterprise-grade, scalable platform

---

## Appendix: Code Examples

### Example: Secure Webhook Handler
```typescript
// app/api/integrations/slack/webhook/route.ts
import { verifySlackSignature } from '@/lib/integrations/slack-verification'
import { getIntegrationByProvider } from '@/lib/db/repositories/integrations'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const signature = request.headers.get('x-slack-signature')
  const timestamp = request.headers.get('x-slack-request-timestamp')
  
  // Verify signature
  if (!signature || !timestamp) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
  }
  
  const signingSecret = process.env.SLACK_SIGNING_SECRET
  if (!signingSecret) {
    return NextResponse.json({ error: 'Not configured' }, { status: 500 })
  }
  
  const bodyString = JSON.stringify(body)
  const isValid = verifySlackSignature(bodyString, signature, timestamp, signingSecret)
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }
  
  // Lookup tenant from Integration table (not body)
  const integration = await getIntegrationByProvider(null, 'slack', body.team_id)
  if (!integration) {
    return NextResponse.json({ error: 'Integration not found' }, { status: 404 })
  }
  
  const tenantId = integration.tenantId
  
  // Process event...
}
```

### Example: Request Validation Middleware
```typescript
// lib/middleware/validate-request.ts
import { z } from 'zod'
import { NextResponse } from 'next/server'

export function validateRequest<T extends z.ZodType>(schema: T) {
  return async (request: Request): Promise<{ data: z.infer<T> } | NextResponse> => {
    try {
      const body = await request.json()
      const data = schema.parse(body)
      return { data }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Validation failed', details: error.errors },
          { status: 400 }
        )
      }
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
  }
}

// Usage:
const captureSchema = z.object({
  message: z.string().min(1).max(10000),
})

export async function POST(request: NextRequest) {
  const validation = await validateRequest(captureSchema)(request)
  if (validation instanceof NextResponse) return validation
  const { data } = validation
  // Use data.message...
}
```

### Example: Retry Wrapper
```typescript
// lib/utils/retry.ts
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number
    initialBackoffMs?: number
    maxBackoffMs?: number
    retryable?: (error: any) => boolean
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialBackoffMs = 1000,
    maxBackoffMs = 10000,
    retryable = (error) => {
      // Retry on network errors, 5xx, rate limits
      if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') return true
      if (error.status >= 500 && error.status < 600) return true
      if (error.status === 429) return true
      return false
    },
  } = options

  let lastError: any
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (attempt === maxRetries || !retryable(error)) {
        throw error
      }
      const backoffMs = Math.min(
        initialBackoffMs * Math.pow(2, attempt),
        maxBackoffMs
      )
      await new Promise((resolve) => setTimeout(resolve, backoffMs))
    }
  }
  throw lastError
}

// Usage:
const result = await withRetry(() => 
  openai.chat.completions.create({ ... })
)
```

---

## Conclusion

This codebase has a solid foundation with good architectural patterns (repository pattern, service layer, multi-tenant design). However, **critical security vulnerabilities** must be addressed before production deployment. The most urgent issues are:

1. **Webhook tenant spoofing** (can inject data into any tenant)
2. **API key tenant spoofing** (can access any tenant's data)
3. **No request validation** (injection risks)

With focused effort over 2-3 weeks, these can be resolved, followed by a month of foundational hardening. The codebase is well-positioned for scale once these issues are addressed.

**Recommendation:** Block production deployment until Week 1-2 critical fixes are complete. Then proceed with Month 1 foundational work before accepting enterprise customers.
