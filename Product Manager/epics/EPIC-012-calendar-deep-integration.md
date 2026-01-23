# Epic 012: Calendar Deep Integration

**Phase**: 4 - External Integrations  
**Priority**: P1  
**Timeline**: Week 15  
**Story Points**: 26

## Description

Deep integration with Google Calendar and Apple Calendar for two-way sync, meeting notes, and time blocking suggestions.

## Goals

- Two-way sync with Google Calendar/Apple Calendar
- Auto-create calendar events from admin tasks
- Meeting notes auto-linked to calendar events
- Time blocking suggestions

## User Stories

### US-012-001: Google Calendar OAuth Connection
**As a** user  
**I want** to connect my Google Calendar  
**So that** I can sync events and tasks

**Priority**: P1  
**Story Points**: 3  
**Dependencies**: Epic 010 (Integration Framework)

**Acceptance Criteria**:
- [ ] Google Calendar OAuth flow
- [ ] Request calendar read/write scopes
- [ ] Store tokens securely
- [ ] Connection status visible
- [ ] Disconnect functionality

**Technical Notes**:
- Google Calendar API OAuth
- Token management
- Connection UI

---

### US-012-002: Two-Way Calendar Sync
**As a** user  
**I want** calendar events and tasks to sync bidirectionally  
**So that** everything stays in sync

**Priority**: P1  
**Story Points**: 8  
**Dependencies**: US-012-001

**Acceptance Criteria**:
- [ ] Admin tasks with due dates sync to calendar
- [ ] Calendar events sync to Second Brain
- [ ] Changes in calendar update Second Brain
- [ ] Changes in Second Brain update calendar
- [ ] Sync runs periodically (every 15 minutes)
- [ ] Conflict resolution (last write wins or user choice)

**Technical Notes**:
- Calendar sync service
- Bidirectional sync logic
- Conflict handling
- Background sync job

---

### US-012-003: Auto-Create Calendar Events from Tasks
**As a** user  
**I want** admin tasks with due dates to appear in my calendar  
**So that** I can see them in my calendar view

**Priority**: P1  
**Story Points**: 5  
**Dependencies**: US-012-002

**Acceptance Criteria**:
- [ ] Tasks with due dates create calendar events
- [ ] Event title matches task name
- [ ] Event includes task notes
- [ ] Event updates when task updates
- [ ] Event deleted when task deleted
- [ ] User can disable auto-creation

**Technical Notes**:
- Task-to-calendar event mapping
- Event creation/update/delete
- User preferences

---

### US-012-004: Meeting Notes Auto-Linking
**As a** user  
**I want** captures during meetings to be linked to calendar events  
**So that** I can see meeting context with my notes

**Priority**: P1  
**Story Points**: 5  
**Dependencies**: US-012-001 (partial - can use existing calendar context)

**Acceptance Criteria**:
- [ ] Detect when user is in a meeting (existing feature)
- [ ] Link captures to current calendar event
- [ ] Show meeting context in captures
- [ ] View all captures for a meeting
- [ ] Meeting details shown with captures

**Technical Notes**:
- Enhance existing calendar context feature
- Link captures to calendar events
- Display meeting-linked captures

---

### US-012-005: Time Blocking Suggestions
**As a** user  
**I want** suggestions for time blocking based on my tasks  
**So that** I can schedule my work effectively

**Priority**: P2  
**Story Points**: 5  
**Dependencies**: US-012-002

**Acceptance Criteria**:
- [ ] Analyze tasks and suggest time blocks
- [ ] Consider:
  - Task due dates
  - Task priority
  - Estimated duration (if available)
  - Existing calendar events
- [ ] Suggest optimal time slots
- [ ] User can accept suggestions to create calendar events
- [ ] Suggestions respect working hours

**Technical Notes**:
- Time blocking algorithm
- Calendar availability checking
- Suggestion generation
- Calendar event creation from suggestions

---

## Technical Architecture

### Components
- `lib/integrations/google-calendar.ts` - Google Calendar integration
- `lib/services/calendar-sync.ts` - Sync service
- `lib/services/time-blocking.ts` - Time blocking suggestions
- Enhance existing `lib/services/calendar-context.ts`

### Database Changes
```prisma
model CalendarSync {
  id              Int      @id @default(autoincrement())
  tenantId        String
  integrationId   Int
  itemType        String   // admin, project, etc.
  itemId          Int
  calendarEventId String   // External calendar event ID
  syncDirection   String   // to_calendar, from_calendar, bidirectional
  lastSyncedAt    DateTime @default(now())
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  integration     Integration @relation(fields: [integrationId], references: [id], onDelete: Cascade)
  tenant          Tenant   @relation(fields: [tenantId], references: [id])
  
  @@unique([tenantId, integrationId, itemType, itemId])
  @@index([tenantId, calendarEventId])
}
```

### External Dependencies
- Google Calendar API
- Apple Calendar API (CalDAV)

## Success Metrics

- Calendar sync success rate > 95%
- % of users with calendar integration > 60%
- Tasks synced to calendar > 80% of tasks with due dates
- User satisfaction with sync > 80%
