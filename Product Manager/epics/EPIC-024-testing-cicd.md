# Epic 024: Testing & CI/CD

**Phase**: 0 - Production Readiness  
**Priority**: P1 - HIGH  
**Timeline**: Month 1, Weeks 7-8  
**Story Points**: 34

## Description

Build testing infrastructure and CI/CD quality gates to prevent regressions and ensure code quality before deployment.

## Goals

- Add unit tests for critical components
- Add integration tests for tenant isolation
- Add CI/CD quality gates (lint, test, audit)
- Add secret scanning
- Achieve minimum test coverage

## User Stories

### US-024-001: Set Up Testing Infrastructure
**As a** developer  
**I want** testing framework and utilities set up  
**So that** I can write tests efficiently

**Priority**: P1 - HIGH  
**Story Points**: 5  
**Dependencies**: None

**Acceptance Criteria**:
- [ ] Testing framework installed (Jest or Vitest)
- [ ] Test database setup for integration tests
- [ ] Test utilities for common patterns
- [ ] Mock utilities for external services
- [ ] Test configuration files
- [ ] Test scripts in package.json
- [ ] CI/CD test execution

**Technical Notes**:
- Install `jest` or `vitest` + `@testing-library/react`
- Install `@testing-library/node` for API tests
- Create `__tests__/setup.ts` for test configuration
- Create `__tests__/utils/` for test utilities
- Create `__tests__/mocks/` for mocks
- Configure test database (separate from dev/prod)

**Files to Create**:
- `jest.config.js` or `vitest.config.ts`
- `__tests__/setup.ts`
- `__tests__/utils/test-db.ts`
- `__tests__/mocks/`

---

### US-024-002: Unit Tests for Auth Utilities
**As a** developer  
**I want** unit tests for authentication and tenant utilities  
**So that** tenant isolation is verified

**Priority**: P1 - HIGH  
**Story Points**: 8  
**Dependencies**: US-024-001

**Acceptance Criteria**:
- [ ] Tests for `requireTenant()` function
- [ ] Tests for `requireTenantOrApiKey()` function
- [ ] Tests for `verifyTenantAccess()` function
- [ ] Tests verify tenant isolation (cannot access other tenant)
- [ ] Tests verify API key security (no tenantId from body)
- [ ] Tests verify session requirements
- [ ] Test coverage > 90% for auth utilities

**Technical Notes**:
- Create `__tests__/lib/auth/utils.test.ts`
- Mock NextAuth session
- Test tenant isolation scenarios
- Test API key scenarios
- Test error cases

**Files to Create**:
- `__tests__/lib/auth/utils.test.ts`

---

### US-024-003: Unit Tests for Repositories
**As a** developer  
**I want** unit tests for repository methods  
**So that** tenant filtering is verified

**Priority**: P1 - HIGH  
**Story Points**: 8  
**Dependencies**: US-024-001

**Acceptance Criteria**:
- [ ] Tests for all repository methods
- [ ] Tests verify tenant filtering (cannot access other tenant's data)
- [ ] Tests verify CRUD operations
- [ ] Tests verify error handling
- [ ] Test coverage > 80% for repositories

**Technical Notes**:
- Create `__tests__/lib/db/repositories/*.test.ts` for each repository
- Use test database
- Test tenant isolation for each method
- Test CRUD operations
- Test edge cases

**Files to Create**:
- `__tests__/lib/db/repositories/people.test.ts`
- `__tests__/lib/db/repositories/projects.test.ts`
- `__tests__/lib/db/repositories/ideas.test.ts`
- `__tests__/lib/db/repositories/admin.test.ts`
- (and other repositories)

---

### US-024-004: Integration Tests for API Routes
**As a** developer  
**I want** integration tests for API routes  
**So that** end-to-end flows are verified

**Priority**: P1 - HIGH  
**Story Points**: 8  
**Dependencies**: US-024-001

**Acceptance Criteria**:
- [ ] Tests for critical API routes:
  - Capture endpoint
  - Auth endpoints
  - CRUD endpoints
  - Query endpoint
- [ ] Tests verify tenant isolation
- [ ] Tests verify request validation
- [ ] Tests verify error handling
- [ ] Tests use real database (test DB)

**Technical Notes**:
- Create `__tests__/api/*.test.ts` for each route
- Use test database with test data
- Test happy paths
- Test error cases
- Test tenant isolation
- Test request validation

**Files to Create**:
- `__tests__/api/capture.test.ts`
- `__tests__/api/auth/signin.test.ts`
- `__tests__/api/[database].test.ts`
- `__tests__/api/query.test.ts`

---

### US-024-005: Integration Tests for Webhooks
**As a** security engineer  
**I want** integration tests for webhook security  
**So that** signature verification is verified

**Priority**: P1 - HIGH  
**Story Points**: 5  
**Dependencies**: US-024-001, EPIC-021

**Acceptance Criteria**:
- [ ] Tests for Slack webhook signature verification
- [ ] Tests verify invalid signatures are rejected
- [ ] Tests verify tenant lookup from Integration table
- [ ] Tests verify replay protection
- [ ] Tests for Gmail webhook (if exists)
- [ ] Tests for Notion webhook (if exists)

**Technical Notes**:
- Create `__tests__/api/integrations/slack/webhook.test.ts`
- Mock Slack signature verification
- Test valid signatures
- Test invalid signatures
- Test tenant lookup
- Test replay protection

**Files to Create**:
- `__tests__/api/integrations/slack/webhook.test.ts`
- `__tests__/api/integrations/gmail/webhook.test.ts` (if exists)
- `__tests__/api/integrations/notion/webhook.test.ts` (if exists)

---

### US-024-006: CI/CD Quality Gates
**As a** platform engineer  
**I want** CI/CD pipeline with quality gates  
**So that** only quality code is deployed

**Priority**: P1 - HIGH  
**Story Points**: 5  
**Dependencies**: US-024-001

**Acceptance Criteria**:
- [ ] Lint step (ESLint)
- [ ] Typecheck step (TypeScript)
- [ ] Unit test execution
- [ ] Integration test execution
- [ ] Test coverage check (>70%)
- [ ] Dependency audit (npm audit)
- [ ] Secret scanning (truffleHog or similar)
- [ ] Build step (Next.js build)
- [ ] Fail pipeline on any failure

**Technical Notes**:
- Update `.github/workflows/vercel-deploy.yml`
- Add lint step: `npm run lint`
- Add typecheck step: `tsc --noEmit`
- Add test step: `npm test`
- Add coverage step: `npm run test:coverage`
- Add audit step: `npm audit --audit-level=moderate`
- Add secret scan: `trufflehog filesystem .`
- Configure coverage threshold

**Files to Modify**:
- `.github/workflows/vercel-deploy.yml`
- `.github/workflows/vercel-deploy-manual.yml`
- `package.json` (add test scripts)

---

### US-024-007: Test Coverage Reporting
**As a** developer  
**I want** test coverage reports  
**So that** I can track coverage progress

**Priority**: P2 - MEDIUM  
**Story Points**: 3  
**Dependencies**: US-024-001

**Acceptance Criteria**:
- [ ] Coverage reports generated
- [ ] Coverage threshold: 70% minimum
- [ ] Coverage reports in CI/CD
- [ ] Coverage badges (optional)
- [ ] Coverage by file/directory

**Technical Notes**:
- Configure Jest/Vitest coverage
- Set coverage threshold in config
- Generate coverage reports
- Upload to CI/CD (optional: Codecov, Coveralls)

**Files to Modify**:
- `jest.config.js` or `vitest.config.ts` (coverage config)
- `.github/workflows/` (coverage upload)

---

## Technical Architecture

### Components
- `__tests__/setup.ts` - Test configuration
- `__tests__/utils/test-db.ts` - Test database utilities
- `__tests__/mocks/` - Mock utilities
- Test files in `__tests__/` directories

### External Dependencies
- `jest` or `vitest` - Testing framework
- `@testing-library/react` - React testing utilities
- `@testing-library/node` - Node.js testing utilities
- `trufflehog` or similar - Secret scanning

### Database Changes
- Test database (separate from dev/prod)
- Test data seeding utilities

## Success Metrics

- Test coverage > 70%
- All critical paths have tests
- Tenant isolation verified in tests
- CI/CD pipeline passes all quality gates
- Zero secrets in codebase
- Zero high/critical vulnerabilities

## Testing Checklist

- [ ] Testing framework installed
- [ ] Unit tests for auth utilities
- [ ] Unit tests for repositories
- [ ] Integration tests for API routes
- [ ] Integration tests for webhooks
- [ ] CI/CD quality gates configured
- [ ] Test coverage > 70%
- [ ] Secret scanning active
- [ ] Dependency audit active
