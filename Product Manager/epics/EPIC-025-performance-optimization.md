# Epic 025: Performance Optimization

**Phase**: 0 - Production Readiness (Scale)  
**Priority**: P2 - MEDIUM  
**Timeline**: Quarter, Month 2  
**Story Points**: 34

## Description

Optimize performance for scale: pagination, database indexes, caching, and query optimization to handle large tenants and high traffic.

## Goals

- Add pagination to all list endpoints
- Add composite database indexes
- Implement caching layer
- Optimize N+1 queries
- Improve query performance

## User Stories

### US-025-001: Add Pagination to List Endpoints
**As a** user  
**I want** paginated results for large datasets  
**So that** pages load quickly

**Priority**: P2 - MEDIUM  
**Story Points**: 8  
**Dependencies**: None

**Acceptance Criteria**:
- [ ] All GET list endpoints support pagination
- [ ] Default limit: 50 items
- [ ] Maximum limit: 200 items
- [ ] Cursor-based pagination for large datasets
- [ ] Pagination metadata in response (total, hasMore, nextCursor)
- [ ] Pagination UI components
- [ ] Backward compatibility (no limit = default)

**Technical Notes**:
- Update `app/api/[database]/route.ts`
- Update repository methods to accept limit/offset or cursor
- Add pagination utilities in `lib/utils/pagination.ts`
- Update frontend components to handle pagination
- Use cursor-based pagination for better performance

**Files to Create**:
- `lib/utils/pagination.ts`

**Files to Modify**:
- `app/api/[database]/route.ts`
- `lib/db/repositories/people.ts`
- `lib/db/repositories/projects.ts`
- `lib/db/repositories/ideas.ts`
- `lib/db/repositories/admin.ts`
- Frontend list components

---

### US-025-002: Add Composite Database Indexes
**As a** database engineer  
**I want** composite indexes on frequently queried columns  
**So that** queries are fast

**Priority**: P2 - MEDIUM  
**Story Points**: 5  
**Dependencies**: None

**Acceptance Criteria**:
- [ ] Composite index on (tenantId, status, archived) for Admin
- [ ] Composite index on (tenantId, dueDate, archived) for Admin
- [ ] Composite index on (tenantId, projectId) for Admin
- [ ] Composite index on (tenantId, status, archived) for Project
- [ ] Composite index on (tenantId, createdAt) for all tables
- [ ] Indexes verified with EXPLAIN queries
- [ ] Migration created and tested

**Technical Notes**:
- Update `prisma/schema.prisma` with composite indexes
- Create migration: `npx prisma migrate dev`
- Test query performance before/after
- Use `@@index([tenantId, status, archived])` syntax

**Files to Modify**:
- `prisma/schema.prisma`

---

### US-025-003: Implement Caching Layer
**As a** platform engineer  
**I want** caching for frequently accessed data  
**So that** database load is reduced

**Priority**: P2 - MEDIUM  
**Story Points**: 8  
**Dependencies**: None

**Acceptance Criteria**:
- [ ] Redis/Upstash configured
- [ ] Cache rule settings (TTL: 1 hour)
- [ ] Cache user profiles (TTL: 30 minutes)
- [ ] Cache integration configs (TTL: 1 hour)
- [ ] Cache invalidation on updates
- [ ] Cache key naming convention
- [ ] Cache hit/miss metrics

**Technical Notes**:
- Install `@upstash/redis` or `ioredis`
- Create `lib/cache/index.ts` for cache utilities
- Cache `getRuleSettings` results
- Cache `getUserProfile` results
- Cache `getIntegrationByProvider` results
- Invalidate cache on updates

**Files to Create**:
- `lib/cache/index.ts`

**Files to Modify**:
- `lib/db/repositories/rules.ts`
- `lib/db/repositories/user-profile.ts`
- `lib/db/repositories/integrations.ts`

---

### US-025-004: Optimize N+1 Queries
**As a** developer  
**I want** queries optimized to prevent N+1 problems  
**So that** pages load quickly

**Priority**: P2 - MEDIUM  
**Story Points**: 5  
**Dependencies**: None

**Acceptance Criteria**:
- [ ] Audit all repository methods for N+1 queries
- [ ] Use Prisma `include` for related data
- [ ] Batch queries where possible
- [ ] Query performance improved
- [ ] No N+1 queries in critical paths

**Technical Notes**:
- Audit repository methods
- Use `include` for relations (e.g., `include: { project: true }`)
- Use `findMany` with `include` instead of multiple `findUnique`
- Add query logging to identify N+1 issues

**Files to Modify**:
- All repository files (audit and fix)

---

### US-025-005: Add Query Performance Monitoring
**As a** platform engineer  
**I want** query performance monitoring  
**So that** I can identify slow queries

**Priority**: P2 - MEDIUM  
**Story Points**: 5  
**Dependencies**: EPIC-023

**Acceptance Criteria**:
- [ ] Log queries > 1 second
- [ ] Track query duration metrics
- [ ] Alert on slow queries (>2 seconds)
- [ ] Query performance dashboard
- [ ] Identify top slow queries

**Technical Notes**:
- Add query timing to Prisma client
- Log slow queries in structured logger
- Track metrics in metrics system
- Create slow query report

**Files to Modify**:
- `lib/db/index.ts` (add query logging)
- `lib/metrics/index.ts` (add query metrics)

---

### US-025-006: Optimize Semantic Search
**As a** developer  
**I want** optimized semantic search  
**So that** search is fast and scalable

**Priority**: P2 - MEDIUM  
**Story Points**: 3  
**Dependencies**: None

**Acceptance Criteria**:
- [ ] Consider pgvector extension for vector search
- [ ] Add HNSW index for similarity search
- [ ] Cache search results (TTL: 5 minutes)
- [ ] Limit search results (max 100)
- [ ] Search performance < 500ms

**Technical Notes**:
- Evaluate pgvector vs current JSON storage
- Migrate embeddings to pgvector if beneficial
- Add HNSW index for fast similarity search
- Cache search results

**Files to Modify**:
- `lib/services/semantic-search.ts`
- `prisma/schema.prisma` (if migrating to pgvector)

---

## Technical Architecture

### Components
- `lib/utils/pagination.ts` - Pagination utilities
- `lib/cache/index.ts` - Caching layer (Redis/Upstash)

### External Dependencies
- `@upstash/redis` or `ioredis` - Caching
- `pgvector` (optional) - Vector similarity search

### Database Changes
```prisma
// Add composite indexes
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

## Success Metrics

- List endpoint response time < 200ms (p95)
- Database query time < 100ms (p95)
- Cache hit rate > 80%
- Zero N+1 queries in critical paths
- Search response time < 500ms

## Performance Checklist

- [ ] Pagination on all list endpoints
- [ ] Composite indexes added
- [ ] Caching layer implemented
- [ ] N+1 queries eliminated
- [ ] Query performance monitored
- [ ] Semantic search optimized
