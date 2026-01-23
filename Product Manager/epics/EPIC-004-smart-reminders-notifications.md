# Epic 004: Smart Reminders & Notifications

**Phase**: 2 - Proactive Intelligence  
**Priority**: P1  
**Timeline**: Weeks 5-6  
**Story Points**: 26

## Description

Provide context-aware reminders and notifications that help users stay on top of important items, follow-ups, and deadlines without being intrusive.

## Goals

- Context-aware reminders beyond simple due dates
- Browser push notifications
- Smart follow-up suggestions
- Stale item alerts

## User Stories

### US-004-001: Context-Aware Reminders
**As a** user  
**I want** reminders that consider context, not just dates  
**So that** I get notified about things that actually need attention

**Priority**: P1  
**Story Points**: 5  
**Dependencies**: None

**Acceptance Criteria**:
- [ ] Reminders consider:
  - Due dates (existing)
  - Last touched date
  - Project status changes
  - Relationship updates
- [ ] Reminders are contextual (e.g., "You haven't touched Project X in 30 days")
- [ ] Reminders can be snoozed or dismissed
- [ ] Reminders shown in dashboard and notifications
- [ ] User can configure reminder preferences

**Technical Notes**:
- Create reminders service
- Add reminder rules and logic
- Store reminders in database
- Display reminders in UI

---

### US-004-002: Browser Push Notifications
**As a** user  
**I want** to receive browser push notifications for important reminders  
**So that** I don't miss critical items even when not in the app

**Priority**: P1  
**Story Points**: 5  
**Dependencies**: US-004-001

**Acceptance Criteria**:
- [ ] User can enable/disable push notifications
- [ ] Notifications sent for:
  - Tasks due today/tomorrow
  - Stale items needing attention
  - Important follow-ups
- [ ] Notifications include actionable information
- [ ] Clicking notification opens relevant page
- [ ] Notifications respect user preferences (quiet hours, etc.)

**Technical Notes**:
- Implement browser Push API
- Service worker for background notifications
- Notification preferences in settings
- Queue notifications for delivery

---

### US-004-003: Follow-Up Reminders
**As a** user  
**I want** reminders to follow up with people  
**So that** I maintain relationships and don't forget important conversations

**Priority**: P1  
**Story Points**: 5  
**Dependencies**: US-004-001

**Acceptance Criteria**:
- [ ] System suggests follow-ups based on last_touched date
- [ ] "Sarah mentioned last week - time to follow up?" suggestions
- [ ] Follow-up reminders consider:
  - Time since last interaction
  - Importance of person (mentioned in projects)
  - User's typical follow-up patterns
- [ ] User can set custom follow-up intervals
- [ ] Follow-up reminders actionable (create task, send message)

**Technical Notes**:
- Analyze people.last_touched dates
- Calculate follow-up urgency
- Generate follow-up suggestions
- Link to action creation

---

### US-004-004: Stale Item Alerts
**As a** user  
**I want** alerts for items that haven't been touched in a while  
**So that** I can identify forgotten projects or ideas

**Priority**: P1  
**Story Points**: 5  
**Dependencies**: US-004-001

**Acceptance Criteria**:
- [ ] Alerts for projects not updated in 30+ days
- [ ] Alerts for ideas not touched in 60+ days
- [ ] Alerts consider item importance (linked to active items)
- [ ] Alerts suggest actions (archive, update, delete)
- [ ] User can configure alert thresholds

**Technical Notes**:
- Query items by last_touched date
- Calculate staleness based on thresholds
- Generate alerts for stale items
- Provide actions for stale items

---

### US-004-005: Reminder Preferences and Settings
**As a** user  
**I want** to control when and how I receive reminders  
**So that** reminders are helpful, not annoying

**Priority**: P2  
**Story Points**: 3  
**Dependencies**: US-004-001

**Acceptance Criteria**:
- [ ] Settings page for reminder preferences:
  - Enable/disable reminder types
  - Set quiet hours
  - Set reminder frequency
  - Choose notification channels (in-app, push, email)
- [ ] Preferences saved and respected
- [ ] Default preferences for new users
- [ ] Preferences can be reset

**Technical Notes**:
- Add reminder preferences to user settings
- Store preferences in database
- Respect preferences in reminder service
- Settings UI for preferences

---

### US-004-006: Reminder Dashboard
**As a** user  
**I want** to see all my reminders in one place  
**So that** I can manage what needs attention

**Priority**: P2  
**Story Points**: 3  
**Dependencies**: US-004-001

**Acceptance Criteria**:
- [ ] Reminders page/dashboard showing:
  - Due today/tomorrow
  - Follow-ups needed
  - Stale items
  - Overdue items
- [ ] Reminders grouped by type
- [ ] Actions available for each reminder
- [ ] Can mark reminders as done/snooze
- [ ] Reminders sorted by priority/urgency

**Technical Notes**:
- Create reminders dashboard page
- Query and display reminders
- Actions for reminder management
- Real-time updates

---

## Technical Architecture

### Components
- `lib/services/reminders.ts` - Reminder generation and management
- `lib/db/repositories/reminders.ts` - Reminder data access
- `app/reminders/page.tsx` - Reminders dashboard
- `components/ReminderNotification.tsx` - Notification component
- Service worker for push notifications

### Database Changes
```prisma
model Reminder {
  id              Int      @id @default(autoincrement())
  tenantId        String
  userId          String
  reminderType    String   // due_date, follow_up, stale_item, etc.
  itemType        String   // people, projects, ideas, admin
  itemId          Int
  title           String
  message         String
  dueDate         DateTime?
  priority        String   @default("medium") // low, medium, high
  status          String   @default("active") // active, snoozed, dismissed, completed
  snoozedUntil    DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  tenant          Tenant   @relation(fields: [tenantId], references: [id])
  user            User     @relation(fields: [userId], references: [id])
  
  @@index([tenantId, userId, status])
  @@index([tenantId, dueDate])
  @@index([tenantId, reminderType])
}

model ReminderPreference {
  id              Int      @id @default(autoincrement())
  tenantId        String
  userId          String
  reminderType    String
  enabled         Boolean  @default(true)
  quietHoursStart String? // HH:MM
  quietHoursEnd   String? // HH:MM
  frequency       String   @default("daily") // immediate, hourly, daily, weekly
  channels        String   @db.Text // JSON array: ["in_app", "push", "email"]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  tenant          Tenant   @relation(fields: [tenantId], references: [id])
  user            User     @relation(fields: [userId], references: [id])
  
  @@unique([tenantId, userId, reminderType])
}
```

### External Dependencies
- Browser Push API
- Service Worker API

## Success Metrics

- Reminder engagement rate > 40%
- User satisfaction with reminders > 75%
- Reduction in overdue items > 30%
- Follow-up completion rate > 50%
