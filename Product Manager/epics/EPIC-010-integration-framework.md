# Epic 010: Integration Framework

**Phase**: 4 - External Integrations  
**Priority**: P1  
**Timeline**: Week 13  
**Story Points**: 21

## Description

Build a framework for integrating with external services (Gmail, Slack, Notion, etc.) with OAuth, webhooks, and bidirectional sync capabilities.

## Goals

- OAuth-based authentication for integrations
- Integration management system
- Webhook system for events
- Integration status dashboard

## User Stories

### US-010-001: Integration Framework Foundation
**As a** developer  
**I want** a framework for managing integrations  
**So that** we can add new integrations easily

**Priority**: P1  
**Story Points**: 5  
**Dependencies**: None

**Acceptance Criteria**:
- [ ] Integration model with:
  - Provider name (gmail, slack, notion, etc.)
  - OAuth configuration
  - Status (active, error, disconnected)
  - Last sync timestamp
- [ ] Integration CRUD API
- [ ] Integration status tracking
- [ ] Error handling and logging

**Technical Notes**:
- Add Integration model to schema
- Create integration service
- OAuth flow implementation
- Status management

---

### US-010-002: OAuth Integration Flow
**As a** user  
**I want** to connect external services using OAuth  
**So that** I can authorize access securely

**Priority**: P1  
**Story Points**: 8  
**Dependencies**: US-010-001

**Acceptance Criteria**:
- [ ] OAuth flow for each provider:
  - Redirect to provider
  - Handle callback
  - Store tokens securely
  - Refresh tokens automatically
- [ ] Support multiple providers
- [ ] Token encryption at rest
- [ ] Revoke access functionality
- [ ] Connection status visible

**Technical Notes**:
- OAuth 2.0 implementation
- Token storage and encryption
- Token refresh logic
- Provider-specific OAuth configs

---

### US-010-003: Integration Status Dashboard
**As a** user  
**I want** to see status of all my integrations  
**So that** I can monitor connections and troubleshoot issues

**Priority**: P1  
**Story Points**: 5  
**Dependencies**: US-010-001

**Acceptance Criteria**:
- [ ] Integrations page showing:
  - All connected integrations
  - Connection status (active, error, disconnected)
  - Last sync time
  - Error messages if any
- [ ] Connect/disconnect buttons
- [ ] Reconnect failed integrations
- [ ] Integration settings

**Technical Notes**:
- Integrations dashboard page
- Status display
- Connection management UI
- Error display

---

### US-010-004: Webhook System
**As a** system  
**I want** to receive webhooks from external services  
**So that** I can react to external events in real-time

**Priority**: P2  
**Story Points**: 3  
**Dependencies**: US-010-001

**Acceptance Criteria**:
- [ ] Webhook endpoint for each integration
- [ ] Webhook signature verification
- [ ] Webhook event processing
- [ ] Webhook event logging
- [ ] Retry failed webhooks

**Technical Notes**:
- Webhook API endpoints
- Signature verification
- Event processing queue
- Webhook logging

---

## Technical Architecture

### Components
- `lib/services/integrations.ts` - Integration management
- `lib/services/oauth.ts` - OAuth flow handling
- `lib/db/repositories/integrations.ts` - Integration data access
- `app/integrations/page.tsx` - Integrations dashboard
- `app/api/integrations/[provider]/route.ts` - Provider-specific endpoints

### Database Changes
```prisma
model Integration {
  id              Int      @id @default(autoincrement())
  tenantId        String
  provider        String   // gmail, slack, notion, google_calendar, etc.
  config          String   @db.Text // JSON config (encrypted tokens, settings)
  status          String   @default("disconnected") // active, error, disconnected
  lastSync        DateTime?
  lastError       String?  @db.Text
  errorCount      Int      @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  tenant          Tenant   @relation(fields: [tenantId], references: [id])
  
  @@unique([tenantId, provider])
  @@index([tenantId, status])
}

model WebhookEvent {
  id              Int      @id @default(autoincrement())
  tenantId        String
  integrationId   Int
  eventType       String
  payload         String   @db.Text // JSON payload
  status          String   @default("pending") // pending, processed, failed
  processedAt     DateTime?
  errorMessage    String?  @db.Text
  createdAt       DateTime @default(now())
  integration     Integration @relation(fields: [integrationId], references: [id], onDelete: Cascade)
  tenant          Tenant   @relation(fields: [tenantId], references: [id])
  
  @@index([tenantId, integrationId])
  @@index([tenantId, status])
  @@index([tenantId, createdAt])
}
```

### External Dependencies
- OAuth providers (Google, Slack, Notion, etc.)
- Encryption library for tokens

## Success Metrics

- Integration connection success rate > 90%
- Integration uptime > 95%
- Average integrations per user > 2
- Webhook processing success rate > 98%
