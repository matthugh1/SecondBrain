# Epic 022: Foundational Reliability

**Phase**: 0 - Production Readiness  
**Priority**: P1 - HIGH  
**Timeline**: Month 1, Weeks 3-4  
**Story Points**: 34

## Description

Build reliability foundations: connection pooling, retry logic, timeouts, and idempotency to prevent cascading failures and ensure system stability.

## Goals

- Configure Prisma connection pooling for Vercel serverless
- Add retry logic for external API calls
- Configure timeouts for all external calls
- Add idempotency to prevent duplicate operations
- Ensure cron jobs are reliable

## User Stories

### US-022-001: Configure Prisma Connection Pooling
**As a** platform engineer  
**I want** Prisma connection pooling configured for Vercel serverless  
**So that** database connections are managed efficiently

**Priority**: P1 - HIGH  
**Story Points**: 5  
**Dependencies**: None

**Acceptance Criteria**:
- [ ] Connection pool size configured (connection_limit=10)
- [ ] Pool timeout configured (pool_timeout=20)
- [ ] Connection string includes pool parameters
- [ ] Connection pool monitoring/logging
- [ ] Documentation updated with pool settings
- [ ] Tested under load

**Technical Notes**:
- Update `lib/db/index.ts` PrismaClient configuration
- Add connection pool params to DATABASE_URL:
  - `?connection_limit=10&pool_timeout=20`
- Add connection pool logging in development
- Document pool settings for Vercel Postgres

**Files to Modify**:
- `lib/db/index.ts`
- `.env.example` (documentation)
- `VERCEL_DEPLOYMENT.md`

---

### US-022-002: Add Retry Logic for AI Calls
**As a** developer  
**I want** AI API calls to retry on transient failures  
**So that** temporary network issues don't cause user-facing errors

**Priority**: P1 - HIGH  
**Story Points**: 8  
**Dependencies**: None

**Acceptance Criteria**:
- [ ] Retry utility function created with exponential backoff
- [ ] Retry logic applied to OpenAI calls
- [ ] Retry logic applied to Anthropic calls
- [ ] Retry on network errors (ECONNRESET, ETIMEDOUT)
- [ ] Retry on 5xx errors
- [ ] Retry on rate limits (429) with longer backoff
- [ ] Max retries: 3, initial backoff: 1s, max backoff: 10s
- [ ] Retry attempts logged

**Technical Notes**:
- Create `lib/utils/retry.ts` with `withRetry` function
- Wrap OpenAI calls in `lib/services/classification.ts`
- Wrap Anthropic calls in `lib/services/classification.ts`
- Wrap calls in `lib/services/digest.ts`
- Wrap calls in `lib/services/semantic-search.ts`
- Add jitter to backoff to prevent thundering herd

**Files to Create**:
- `lib/utils/retry.ts`

**Files to Modify**:
- `lib/services/classification.ts`
- `lib/services/digest.ts`
- `lib/services/semantic-search.ts`
- `lib/services/relationship-engine.ts`
- `lib/services/intent-detection.ts`

---

### US-022-003: Add Retry Logic for Integrations
**As a** developer  
**I want** integration API calls to retry on failures  
**So that** Slack, Gmail, and Notion integrations are reliable

**Priority**: P1 - HIGH  
**Story Points**: 5  
**Dependencies**: US-022-002

**Acceptance Criteria**:
- [ ] Retry logic applied to Slack API calls
- [ ] Retry logic applied to Gmail API calls
- [ ] Retry logic applied to Notion API calls
- [ ] Retry logic applied to Google Calendar calls
- [ ] Circuit breaker pattern for failing integrations
- [ ] Integration failure tracking

**Technical Notes**:
- Use `withRetry` from `lib/utils/retry.ts`
- Wrap Slack API calls in `lib/services/slack-integration.ts`
- Wrap Gmail calls in `lib/services/email-capture.ts`
- Wrap Notion calls in `lib/services/notion-integration.ts`
- Wrap Calendar calls in `lib/services/calendar-sync.ts`
- Add circuit breaker (fail fast after N failures)

**Files to Modify**:
- `lib/services/slack-integration.ts`
- `lib/services/email-capture.ts`
- `lib/services/notion-integration.ts`
- `lib/services/calendar-sync.ts`

---

### US-022-004: Configure Timeouts
**As a** platform engineer  
**I want** all external API calls to have timeouts  
**So that** hanging requests don't block resources

**Priority**: P1 - HIGH  
**Story Points**: 5  
**Dependencies**: None

**Acceptance Criteria**:
- [ ] AI API calls timeout after 30 seconds
- [ ] Integration API calls timeout after 15 seconds
- [ ] Database queries timeout after 10 seconds
- [ ] Timeout errors are handled gracefully
- [ ] Timeout values configurable
- [ ] Timeout errors logged

**Technical Notes**:
- Add timeout to fetch calls (AbortController)
- Configure Prisma query timeout
- Create timeout wrapper utility
- Update all external API calls
- Document timeout values

**Files to Create**:
- `lib/utils/timeout.ts`

**Files to Modify**:
- `lib/services/classification.ts`
- `lib/services/slack-integration.ts`
- `lib/services/email-capture.ts`
- `lib/db/index.ts` (Prisma timeout)

---

### US-022-005: Add Idempotency to Workflows
**As a** developer  
**I want** workflow executions to be idempotent  
**So that** duplicate triggers don't cause duplicate actions

**Priority**: P1 - HIGH  
**Story Points**: 5  
**Dependencies**: None

**Acceptance Criteria**:
- [ ] Workflow executions check for existing execution with same trigger
- [ ] Idempotency key based on workflow ID + trigger data hash
- [ ] Duplicate executions return existing result
- [ ] Idempotency window: 1 hour
- [ ] Idempotency tracked in database
- [ ] Idempotency tests

**Technical Notes**:
- Add idempotency check to `lib/services/workflows.ts`
- Create idempotency key from workflow ID + trigger hash
- Store idempotency keys in WorkflowExecution table
- Check for existing execution before creating new one
- Return existing result if found

**Files to Modify**:
- `lib/services/workflows.ts`
- `prisma/schema.prisma` (add idempotencyKey to WorkflowExecution)

---

### US-022-006: Add Idempotency to Cron Jobs
**As a** developer  
**I want** cron jobs to be idempotent  
**So that** duplicate runs don't create duplicate digests

**Priority**: P1 - HIGH  
**Story Points**: 3  
**Dependencies**: None

**Acceptance Criteria**:
- [ ] Daily digest checks if already generated for today
- [ ] Weekly review checks if already generated for week
- [ ] Duplicate runs return existing digest
- [ ] Idempotency based on date/week
- [ ] Idempotency logged

**Technical Notes**:
- Update `app/api/cron/daily-digest/route.ts`
- Update `app/api/cron/weekly-review/route.ts`
- Check for existing digest before generating
- Use date/week as idempotency key
- Return existing digest if found

**Files to Modify**:
- `app/api/cron/daily-digest/route.ts`
- `app/api/cron/weekly-review/route.ts`
- `lib/services/digest.ts`

---

### US-022-007: Add Transaction Boundaries
**As a** developer  
**I want** critical operations to use database transactions  
**So that** partial failures don't leave data inconsistent

**Priority**: P2 - MEDIUM  
**Story Points**: 3  
**Dependencies**: None

**Acceptance Criteria**:
- [ ] Capture operation uses transaction (create record + inbox log)
- [ ] Workflow execution uses transaction
- [ ] Agent action execution uses transaction
- [ ] Transaction rollback on errors
- [ ] Transaction tests

**Technical Notes**:
- Use Prisma `$transaction` for multi-step operations
- Update `lib/services/capture.ts:captureMessage`
- Update `lib/services/workflows.ts`
- Update `lib/services/actions.ts`
- Ensure rollback on any error

**Files to Modify**:
- `lib/services/capture.ts`
- `lib/services/workflows.ts`
- `lib/services/actions.ts`

---

## Technical Architecture

### Components
- `lib/utils/retry.ts` - Retry utility with exponential backoff
- `lib/utils/timeout.ts` - Timeout wrapper utility
- `lib/db/index.ts` - Prisma connection pool configuration

### Database Changes
```prisma
model WorkflowExecution {
  // ... existing fields
  idempotencyKey String? @unique // Add idempotency key
  @@index([idempotencyKey])
}
```

### External Dependencies
None (uses existing Prisma and fetch APIs)

## Success Metrics

- Database connection pool utilization < 80%
- AI call success rate > 99% (with retries)
- Integration call success rate > 95% (with retries)
- Zero duplicate workflow executions
- Zero duplicate digests
- All external calls have timeouts

## Reliability Checklist

- [ ] Connection pooling configured
- [ ] Retry logic for all external calls
- [ ] Timeouts on all external calls
- [ ] Idempotency for workflows
- [ ] Idempotency for cron jobs
- [ ] Transactions for critical operations
- [ ] Error handling for all failure modes
