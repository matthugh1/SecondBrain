# Epic 007: Action Framework

**Phase**: 3 - Action Execution Layer  
**Priority**: P1  
**Timeline**: Weeks 9-10  
**Story Points**: 34

## Description

Build a framework for executing actions autonomously with user approval workflows, action history, and rollback capabilities.

## Goals

- Define action types and execution framework
- Implement action queue system
- User approval workflows
- Action history and rollback

## User Stories

### US-007-001: Action Type Definitions
**As a** developer  
**I want** a framework for defining and executing actions  
**So that** the system can perform tasks autonomously

**Priority**: P1  
**Story Points**: 5  
**Dependencies**: None

**Acceptance Criteria**:
- [ ] Action types defined:
  - create (create new item)
  - update (update existing item)
  - delete (delete item)
  - link (create relationship)
  - notify (send notification)
  - schedule (create reminder)
- [ ] Action schema includes:
  - Action type
  - Target type and ID
  - Parameters (JSON)
  - Status (pending, approved, executed, rejected)
- [ ] Actions stored in database
- [ ] Action execution service

**Technical Notes**:
- Create Action model
- Define action type enum
- Build action execution engine
- Store actions in database

---

### US-007-002: Action Queue System
**As a** system  
**I want** actions to be queued and processed asynchronously  
**So that** actions don't block user interactions

**Priority**: P1  
**Story Points**: 8  
**Dependencies**: US-007-001

**Acceptance Criteria**:
- [ ] Actions added to queue
- [ ] Queue processes actions in order
- [ ] Failed actions retried with backoff
- [ ] Queue status visible (pending, processing, completed)
- [ ] Actions can be cancelled before execution
- [ ] Queue handles errors gracefully

**Technical Notes**:
- Use Bull/BullMQ for job queue
- Create queue workers
- Implement retry logic
- Error handling and logging

---

### US-007-003: User Approval Workflow
**As a** user  
**I want** to approve actions before they execute  
**So that** I maintain control over what happens

**Priority**: P1  
**Story Points**: 5  
**Dependencies**: US-007-001

**Acceptance Criteria**:
- [ ] Actions requiring approval marked as such
- [ ] Approval UI showing action details
- [ ] User can approve or reject actions
- [ ] Approved actions execute immediately
- [ ] Rejected actions logged with reason
- [ ] Approval preferences (auto-approve certain types)

**Technical Notes**:
- Action approval status
- Approval UI component
- Approval API endpoints
- User preferences for auto-approval

---

### US-007-004: Action History and Audit Trail
**As a** user  
**I want** to see history of all actions taken  
**So that** I can audit what happened and rollback if needed

**Priority**: P1  
**Story Points**: 5  
**Dependencies**: US-007-001

**Acceptance Criteria**:
- [ ] All actions logged with:
  - Action type and details
  - Timestamp
  - User who approved/executed
  - Result/status
- [ ] Action history page showing all actions
- [ ] Filter by type, status, date
- [ ] Action details view
- [ ] Export action history

**Technical Notes**:
- Extend ActionHistory model (may exist)
- Store action details
- Action history UI
- Filtering and search

---

### US-007-005: Action Rollback
**As a** user  
**I want** to rollback actions that were mistakes  
**So that** I can undo unwanted changes

**Priority**: P1  
**Story Points**: 5  
**Dependencies**: US-007-004

**Acceptance Criteria**:
- [ ] Rollback available for executed actions
- [ ] Rollback restores previous state
- [ ] Rollback creates new action (undo action)
- [ ] Rollback confirmation required
- [ ] Rollback history tracked
- [ ] Some actions cannot be rolled back (e.g., permanent deletes)

**Technical Notes**:
- Store state before action execution
- Implement rollback logic per action type
- Rollback UI
- Handle cascading rollbacks

---

### US-007-006: Action Execution API
**As a** developer  
**I want** an API to execute actions programmatically  
**So that** workflows and agents can trigger actions

**Priority**: P1  
**Story Points**: 3  
**Dependencies**: US-007-001

**Acceptance Criteria**:
- [ ] API endpoint for action execution
- [ ] API validates action parameters
- [ ] API handles errors and returns status
- [ ] API supports batch actions
- [ ] API documentation

**Technical Notes**:
- Create action execution API
- Parameter validation
- Error handling
- Batch processing support

---

### US-007-007: Action Templates
**As a** user  
**I want** to save common action sequences as templates  
**So that** I can reuse complex actions

**Priority**: P2  
**Story Points**: 3  
**Dependencies**: US-007-001

**Acceptance Criteria**:
- [ ] Save action sequence as template
- [ ] Templates have names and descriptions
- [ ] Execute template with parameters
- [ ] Edit and delete templates
- [ ] Template library showing available templates

**Technical Notes**:
- ActionTemplate model
- Template storage
- Template execution engine
- Template UI

---

## Technical Architecture

### Components
- `lib/services/actions.ts` - Action execution engine
- `lib/services/action-queue.ts` - Queue management
- `lib/db/repositories/actions.ts` - Action data access
- `app/actions/page.tsx` - Action history/approval UI
- `components/ActionApproval.tsx` - Approval component

### Database Changes
```prisma
model AgentAction {
  id              Int      @id @default(autoincrement())
  tenantId        String
  userId          String?
  actionType      String   // create, update, delete, link, notify, schedule
  targetType      String?  // people, projects, ideas, admin
  targetId        Int?
  parameters      String   @db.Text // JSON parameters
  status          String   @default("pending") // pending, approved, executing, executed, rejected, failed
  requiresApproval Boolean @default(true)
  approvedBy      String?
  approvedAt      DateTime?
  executedAt      DateTime?
  result          String?  @db.Text // JSON result
  errorMessage    String?  @db.Text
  rollbackData    String?  @db.Text // JSON state before action
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  tenant          Tenant   @relation(fields: [tenantId], references: [id])
  approver        User?    @relation(fields: [approvedBy], references: [id])
  
  @@index([tenantId, status])
  @@index([tenantId, userId])
  @@index([tenantId, actionType])
  @@index([tenantId, createdAt])
}

model ActionTemplate {
  id              Int      @id @default(autoincrement())
  tenantId        String
  name            String
  description     String?
  actions         String   @db.Text // JSON array of actions
  parameters      String?  @db.Text // JSON parameter schema
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  tenant          Tenant   @relation(fields: [tenantId], references: [id])
  
  @@index([tenantId])
}
```

### External Dependencies
- Bull/BullMQ for job queue
- Redis for queue backend

## Success Metrics

- Action execution success rate > 95%
- Average action execution time < 5 seconds
- User approval rate > 80%
- Rollback usage < 5% (low error rate)
