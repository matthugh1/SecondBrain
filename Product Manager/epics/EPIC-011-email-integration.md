# Epic 011: Email Integration

**Phase**: 4 - External Integrations  
**Priority**: P1  
**Timeline**: Week 14  
**Story Points**: 34

## Description

Integrate with Gmail/Outlook to capture emails, auto-classify them, create tasks from emails, and link emails to people/projects.

## Goals

- Connect Gmail/Outlook accounts
- Capture emails automatically
- Auto-classify emails
- Create tasks from emails
- Link emails to people/projects

## User Stories

### US-011-001: Gmail OAuth Connection
**As a** user  
**I want** to connect my Gmail account  
**So that** I can capture emails automatically

**Priority**: P1  
**Story Points**: 5  
**Dependencies**: Epic 010 (Integration Framework)

**Acceptance Criteria**:
- [ ] Gmail OAuth flow
- [ ] Request appropriate scopes (read, send)
- [ ] Store Gmail tokens securely
- [ ] Connection status visible
- [ ] Disconnect Gmail functionality

**Technical Notes**:
- Gmail API OAuth setup
- Token storage
- Connection UI

---

### US-011-002: Email Capture from Gmail
**As a** user  
**I want** emails forwarded to a specific address to be captured  
**So that** I can capture important emails easily

**Priority**: P1  
**Story Points**: 8  
**Dependencies**: US-011-001

**Acceptance Criteria**:
- [ ] Email forwarding setup instructions
- [ ] Receive emails at capture address
- [ ] Parse email content (subject, body, sender, attachments)
- [ ] Create capture from email
- [ ] Store email metadata
- [ ] Email attachments handled

**Technical Notes**:
- Email receiving service (SendGrid, Mailgun, or custom)
- Email parsing
- Capture integration
- Attachment handling

---

### US-011-003: Auto-Classification of Emails
**As a** user  
**I want** emails to be automatically classified  
**So that** they're organized correctly

**Priority**: P1  
**Story Points**: 5  
**Dependencies**: US-011-002

**Acceptance Criteria**:
- [ ] Email content analyzed for classification
- [ ] Emails classified into categories (people, projects, ideas, admin)
- [ ] Sender extracted and linked to people
- [ ] Due dates extracted from email
- [ ] Classification confidence shown

**Technical Notes**:
- Use existing classification service
- Extract email-specific fields
- Link to people by email address

---

### US-011-004: Create Tasks from Emails
**As a** user  
**I want** to create admin tasks from emails  
**So that** I can track action items from emails

**Priority**: P1  
**Story Points**: 5  
**Dependencies**: US-011-002

**Acceptance Criteria**:
- [ ] Detect action items in emails
- [ ] Create admin tasks from action items
- [ ] Link tasks to email
- [ ] Extract due dates from emails
- [ ] Task includes email context

**Technical Notes**:
- Action item detection (LLM)
- Task creation from emails
- Email-task linking

---

### US-011-005: Email-People Linking
**As a** user  
**I want** emails to be linked to people records  
**So that** I can see email history with contacts

**Priority**: P1  
**Story Points**: 5  
**Dependencies**: US-011-002

**Acceptance Criteria**:
- [ ] Extract sender email address
- [ ] Match to existing people by email
- [ ] Create person if not exists
- [ ] Link email to person
- [ ] Show email history on person page

**Technical Notes**:
- Email address matching
- Person creation from emails
- Email-person linking
- Email history display

---

### US-011-006: Outlook Integration
**As a** user  
**I want** to connect my Outlook account  
**So that** I can capture emails from Outlook too

**Priority**: P2  
**Story Points**: 5  
**Dependencies**: US-011-001

**Acceptance Criteria**:
- [ ] Outlook OAuth flow
- [ ] Same features as Gmail
- [ ] Support both Gmail and Outlook simultaneously
- [ ] Unified email capture interface

**Technical Notes**:
- Microsoft Graph API
- Outlook OAuth
- Unified email handling

---

### US-011-007: Email Search and Filtering
**As a** user  
**I want** to search and filter captured emails  
**So that** I can find specific emails

**Priority**: P2  
**Story Points**: 1  
**Dependencies**: US-011-002

**Acceptance Criteria**:
- [ ] Search emails by subject, sender, content
- [ ] Filter by date, sender, category
- [ ] Email list view
- [ ] Email detail view

**Technical Notes**:
- Email search functionality
- Filtering UI
- Email list component

---

## Technical Architecture

### Components
- `lib/integrations/gmail.ts` - Gmail integration
- `lib/integrations/outlook.ts` - Outlook integration
- `lib/services/email-capture.ts` - Email capture service
- `app/integrations/email/page.tsx` - Email integration settings

### Database Changes
```prisma
model Email {
  id              Int      @id @default(autoincrement())
  tenantId        String
  integrationId  Int
  messageId       String   // Email message ID
  subject         String
  body            String   @db.Text
  senderEmail     String
  senderName      String?
  recipientEmail  String
  receivedAt      DateTime
  classifiedAs    String?  // people, projects, ideas, admin
  linkedPersonId  Int?
  linkedProjectId Int?
  linkedAdminId   Int?
  attachments     String?  @db.Text // JSON array
  createdAt       DateTime @default(now())
  integration     Integration @relation(fields: [integrationId], references: [id], onDelete: Cascade)
  tenant          Tenant   @relation(fields: [tenantId], references: [id])
  
  @@unique([tenantId, integrationId, messageId])
  @@index([tenantId, senderEmail])
  @@index([tenantId, receivedAt])
  @@index([tenantId, classifiedAs])
}
```

### External Dependencies
- Gmail API
- Microsoft Graph API (Outlook)
- Email receiving service (SendGrid, Mailgun, or AWS SES)

## Success Metrics

- Email capture success rate > 95%
- Email classification accuracy > 80%
- % of users with email integration > 50%
- Emails captured per user per week > 10
