# Epic 023: Observability & Monitoring

**Phase**: 0 - Production Readiness  
**Priority**: P1 - HIGH  
**Timeline**: Month 1, Weeks 5-6  
**Story Points**: 34

## Description

Build observability foundations: structured logging, metrics collection, and basic alerting to enable production operations and debugging.

## Goals

- Implement structured logging with correlation IDs
- Add metrics collection for key operations
- Set up basic alerting for critical issues
- Integrate error tracking (Sentry)
- Add request tracing

## User Stories

### US-023-001: Add Structured Logging
**As a** platform engineer  
**I want** structured logging with correlation IDs  
**So that** I can trace requests across services and debug issues

**Priority**: P1 - HIGH  
**Story Points**: 8  
**Dependencies**: None

**Acceptance Criteria**:
- [ ] Structured logging library installed (Pino)
- [ ] Request ID middleware created
- [ ] All logs include: requestId, tenantId, userId (sanitized)
- [ ] Log levels: error, warn, info, debug
- [ ] Logs formatted as JSON
- [ ] Logs include timestamps and context
- [ ] Logs exclude sensitive data (API keys, passwords)
- [ ] Logging utility functions created

**Technical Notes**:
- Install `pino` and `pino-pretty` (dev)
- Create `lib/logger/index.ts` with logger instance
- Create `lib/middleware/request-id.ts` to generate/attach request IDs
- Create `lib/logger/context.ts` for tenant/user context
- Update all `console.log` to use structured logger
- Add request ID to response headers (X-Request-ID)

**Files to Create**:
- `lib/logger/index.ts`
- `lib/logger/context.ts`
- `lib/middleware/request-id.ts`

**Files to Modify**:
- All service files (replace console.log)
- All API route files (add request ID)
- `middleware.ts` (add request ID middleware)

---

### US-023-002: Add Metrics Collection
**As a** platform engineer  
**I want** metrics for latency, error rates, and AI usage  
**So that** I can monitor system health and costs

**Priority**: P1 - HIGH  
**Story Points**: 8  
**Dependencies**: US-023-001

**Acceptance Criteria**:
- [ ] Metrics library integrated (Vercel Analytics or custom)
- [ ] Track request latency (p50, p95, p99)
- [ ] Track error rate by endpoint
- [ ] Track AI call success/fail rate
- [ ] Track AI token usage (already exists, enhance)
- [ ] Track database query timing
- [ ] Track workflow execution metrics
- [ ] Metrics dashboard or export

**Technical Notes**:
- Use Vercel Analytics or add custom metrics
- Create `lib/metrics/index.ts` for metrics collection
- Add timing middleware for API routes
- Track metrics in `lib/services/classification.ts` (AI calls)
- Track metrics in repositories (DB queries)
- Export metrics to Vercel Analytics or external service

**Files to Create**:
- `lib/metrics/index.ts`
- `lib/middleware/metrics.ts`

**Files to Modify**:
- `lib/services/classification.ts`
- `lib/db/repositories/*.ts` (add query timing)
- `middleware.ts` (add metrics middleware)

---

### US-023-003: Integrate Error Tracking (Sentry)
**As a** developer  
**I want** error tracking with Sentry  
**So that** I can quickly identify and fix production errors

**Priority**: P1 - HIGH  
**Story Points**: 5  
**Dependencies**: US-023-001

**Acceptance Criteria**:
- [ ] Sentry installed and configured
- [ ] Errors automatically captured
- [ ] Errors include: requestId, tenantId, userId, stack trace
- [ ] Errors exclude sensitive data
- [ ] Error grouping and deduplication
- [ ] Error alerts configured
- [ ] Source maps for production errors

**Technical Notes**:
- Install `@sentry/nextjs`
- Configure in `next.config.js` or `sentry.client.config.ts`
- Add Sentry to error handler middleware
- Add Sentry context (tenantId, userId)
- Configure error filtering (exclude 404s, etc.)
- Set up Sentry project and alerts

**Files to Create**:
- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`

**Files to Modify**:
- `lib/middleware/error-handler.ts` (add Sentry)
- `next.config.js` (Sentry config)

---

### US-023-004: Add Request Tracing
**As a** platform engineer  
**I want** request tracing across API → Service → Repository  
**So that** I can identify performance bottlenecks

**Priority**: P2 - MEDIUM  
**Story Points**: 5  
**Dependencies**: US-023-001

**Acceptance Criteria**:
- [ ] Trace spans for API routes
- [ ] Trace spans for service calls
- [ ] Trace spans for repository calls
- [ ] Trace spans for external API calls
- [ ] Trace correlation with request ID
- [ ] Trace duration logging
- [ ] Slow query detection (>1s)

**Technical Notes**:
- Add trace spans using logger or OpenTelemetry
- Create `lib/tracing/index.ts` for trace utilities
- Add spans to API routes, services, repositories
- Log trace duration
- Identify slow operations (>1s threshold)

**Files to Create**:
- `lib/tracing/index.ts`

**Files to Modify**:
- API routes (add trace spans)
- Service files (add trace spans)
- Repository files (add trace spans)

---

### US-023-005: Set Up Basic Alerting
**As a** platform engineer  
**I want** alerts for critical issues  
**So that** I can respond quickly to problems

**Priority**: P1 - HIGH  
**Story Points**: 5  
**Dependencies**: US-023-002, US-023-003

**Acceptance Criteria**:
- [ ] Alert on error rate > 1%
- [ ] Alert on p95 latency > 2s
- [ ] Alert on AI API failures
- [ ] Alert on database connection errors
- [ ] Alert on cron job failures
- [ ] Alert channel configured (email, Slack, PagerDuty)
- [ ] Alert thresholds configurable

**Technical Notes**:
- Use Sentry alerts for errors
- Use Vercel Alerts for infrastructure
- Or integrate with external service (Datadog, New Relic)
- Configure alert rules
- Set up notification channels

**Files to Create**:
- `lib/alerts/index.ts` (if custom alerts)

**Configuration**:
- Sentry alert rules
- Vercel alert configuration
- External monitoring service (if used)

---

### US-023-006: Add Audit Logging
**As a** security engineer  
**I want** comprehensive audit logs for all mutations  
**So that** I can track who did what and when

**Priority**: P2 - MEDIUM  
**Story Points**: 3  
**Dependencies**: US-023-001

**Acceptance Criteria**:
- [ ] Log all create/update/delete operations
- [ ] Log includes: who, what, when, tenant, IP
- [ ] Audit logs stored in database
- [ ] Audit logs searchable
- [ ] Audit logs retained for 7 years (compliance)
- [ ] Audit log export capability

**Technical Notes**:
- Enhance existing `ActionHistory` table
- Add audit logging middleware
- Log all mutations automatically
- Store in `ActionHistory` or new `AuditLog` table
- Add search/filter UI (future)

**Files to Modify**:
- `lib/middleware/audit-log.ts` (new or enhance)
- Repository files (add audit logging)
- `prisma/schema.prisma` (enhance ActionHistory if needed)

---

## Technical Architecture

### Components
- `lib/logger/index.ts` - Structured logger (Pino)
- `lib/logger/context.ts` - Log context utilities
- `lib/middleware/request-id.ts` - Request ID middleware
- `lib/metrics/index.ts` - Metrics collection
- `lib/middleware/metrics.ts` - Metrics middleware
- `lib/tracing/index.ts` - Request tracing utilities
- `lib/alerts/index.ts` - Alert utilities (if custom)

### External Dependencies
- `pino` - Structured logging
- `@sentry/nextjs` - Error tracking
- Vercel Analytics (or external metrics service)

### Database Changes
```prisma
// Enhance ActionHistory or create AuditLog
model AuditLog {
  id        Int      @id @default(autoincrement())
  tenantId  String
  userId    String?
  action    String   // create, update, delete
  resource  String   // people, projects, etc.
  resourceId Int?
  details   String   @db.Text // JSON
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())
  
  @@index([tenantId, createdAt])
  @@index([userId, createdAt])
  @@index([action, createdAt])
}
```

## Success Metrics

- 100% of logs are structured
- Request tracing covers all critical paths
- Error tracking captures all production errors
- Metrics available for all key operations
- Alerts fire within 1 minute of issues
- Audit logs capture all mutations

## Observability Checklist

- [ ] Structured logging implemented
- [ ] Request IDs in all logs
- [ ] Metrics collection active
- [ ] Error tracking integrated
- [ ] Request tracing implemented
- [ ] Alerts configured
- [ ] Audit logging comprehensive
- [ ] Logs exclude sensitive data
