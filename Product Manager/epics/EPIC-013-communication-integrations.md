# Epic 013: Communication Integrations

**Phase**: 4 - External Integrations  
**Priority**: P1  
**Timeline**: Week 16  
**Story Points**: 34

## Description

Integrate with Slack and Notion to capture from messages, sync databases, and post updates.

## Goals

- Slack integration for capture and notifications
- Notion bidirectional sync
- Capture from Slack messages
- Post updates to Slack channels

## User Stories

### US-013-001: Slack OAuth Connection
**As a** user  
**I want** to connect my Slack workspace  
**So that** I can capture from Slack and receive notifications

**Priority**: P1  
**Story Points**: 3  
**Dependencies**: Epic 010 (Integration Framework)

**Acceptance Criteria**:
- [ ] Slack OAuth flow
- [ ] Request appropriate scopes (read messages, post messages)
- [ ] Store Slack tokens securely
- [ ] Connection status visible
- [ ] Disconnect functionality

**Technical Notes**:
- Slack OAuth implementation
- Token storage
- Connection UI

---

### US-013-002: Capture from Slack Messages
**As a** user  
**I want** to capture Slack messages by mentioning the bot  
**So that** I can quickly save important information

**Priority**: P1  
**Story Points**: 8  
**Dependencies**: US-013-001

**Acceptance Criteria**:
- [ ] Slack bot listens for mentions
- [ ] Bot responds to capture commands
- [ ] Messages captured and classified
- [ ] Capture confirmation sent to Slack
- [ ] Thread context included in capture
- [ ] User can configure capture channels

**Technical Notes**:
- Slack bot setup
- Message event handling
- Capture integration
- Thread context extraction

---

### US-013-003: Post Updates to Slack
**As a** user  
**I want** important updates posted to Slack channels  
**So that** my team stays informed

**Priority**: P1  
**Story Points**: 5  
**Dependencies**: US-013-001

**Acceptance Criteria**:
- [ ] Post updates when:
  - Project status changes
  - Tasks completed
  - Important captures
- [ ] User configures which channels
- [ ] User configures what to post
- [ ] Rich formatting in Slack messages
- [ ] Links back to Second Brain

**Technical Notes**:
- Slack message posting
- Event triggers
- User configuration
- Message formatting

---

### US-013-004: Notion OAuth Connection
**As a** user  
**I want** to connect my Notion workspace  
**So that** I can sync databases

**Priority**: P1  
**Story Points**: 3  
**Dependencies**: Epic 010

**Acceptance Criteria**:
- [ ] Notion OAuth flow
- [ ] Request appropriate scopes
- [ ] Store Notion tokens securely
- [ ] Connection status visible
- [ ] Disconnect functionality

**Technical Notes**:
- Notion API OAuth
- Token management
- Connection UI

---

### US-013-005: Notion Database Sync
**As a** user  
**I want** to sync Second Brain data with Notion databases  
**So that** I can use Notion as a view/editor

**Priority**: P1  
**Story Points**: 8  
**Dependencies**: US-013-004

**Acceptance Criteria**:
- [ ] Map Second Brain categories to Notion databases
- [ ] Sync items to Notion (create/update)
- [ ] Sync changes from Notion back to Second Brain
- [ ] Field mapping configuration
- [ ] Conflict resolution
- [ ] Sync runs periodically

**Technical Notes**:
- Notion API integration
- Database mapping
- Bidirectional sync
- Field mapping logic

---

### US-013-006: Notion Page Creation
**As a** user  
**I want** to create Notion pages from captures  
**So that** I can expand on ideas in Notion

**Priority**: P2  
**Story Points**: 5  
**Dependencies**: US-013-004

**Acceptance Criteria**:
- [ ] Create Notion page from capture
- [ ] Page includes capture content
- [ ] Page linked back to Second Brain
- [ ] User configures target Notion database/page
- [ ] Rich formatting in Notion

**Technical Notes**:
- Notion page creation API
- Content formatting
- Link management

---

### US-013-007: Slack Commands
**As a** user  
**I want** to query Second Brain from Slack  
**So that** I can check tasks and projects without leaving Slack

**Priority**: P2  
**Story Points**: 2  
**Dependencies**: US-013-001

**Acceptance Criteria**:
- [ ] Slack slash commands:
  - `/secondbrain tasks` - list tasks
  - `/secondbrain projects` - list projects
  - `/secondbrain search <query>` - search
- [ ] Commands return formatted results
- [ ] Results include links to Second Brain

**Technical Notes**:
- Slack slash command handling
- Query execution
- Result formatting

---

## Technical Architecture

### Components
- `lib/integrations/slack.ts` - Slack integration
- `lib/integrations/notion.ts` - Notion integration
- `lib/services/slack-bot.ts` - Slack bot service
- `lib/services/notion-sync.ts` - Notion sync service

### Database Changes
```prisma
model SlackMessage {
  id              Int      @id @default(autoincrement())
  tenantId        String
  integrationId  Int
  messageId       String   // Slack message ID
  channelId       String
  channelName     String?
  userId          String   // Slack user ID
  userName        String?
  text            String   @db.Text
  threadTs        String?  // Thread timestamp
  capturedAs      String?  // people, projects, ideas, admin
  linkedItemId    Int?
  createdAt       DateTime @default(now())
  integration     Integration @relation(fields: [integrationId], references: [id], onDelete: Cascade)
  tenant          Tenant   @relation(fields: [tenantId], references: [id])
  
  @@unique([tenantId, integrationId, messageId])
  @@index([tenantId, userId])
  @@index([tenantId, createdAt])
}

model NotionSync {
  id              Int      @id @default(autoincrement())
  tenantId        String
  integrationId   Int
  itemType        String
  itemId          Int
  notionPageId    String
  notionDatabaseId String?
  syncDirection   String   // to_notion, from_notion, bidirectional
  lastSyncedAt    DateTime @default(now())
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  integration     Integration @relation(fields: [integrationId], references: [id], onDelete: Cascade)
  tenant          Tenant   @relation(fields: [tenantId], references: [id])
  
  @@unique([tenantId, integrationId, itemType, itemId])
  @@index([tenantId, notionPageId])
}
```

### External Dependencies
- Slack API
- Notion API

## Success Metrics

- Slack capture success rate > 90%
- Notion sync success rate > 95%
- % of users with Slack integration > 40%
- % of users with Notion integration > 30%
