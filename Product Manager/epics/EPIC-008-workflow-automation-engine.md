# Epic 008: Workflow Automation Engine

**Phase**: 3 - Action Execution Layer  
**Priority**: P1  
**Timeline**: Weeks 10-11  
**Story Points**: 34

## Description

Enable users to create if/then automation rules that trigger actions based on conditions, making the system proactive and reducing manual work.

## Goals

- If/then rule builder UI
- Rule execution engine
- Workflow templates
- Rule testing and debugging

## User Stories

### US-008-001: Workflow Rule Model
**As a** developer  
**I want** a data model for workflow rules  
**So that** users can define automation rules

**Priority**: P1  
**Story Points**: 5  
**Dependencies**: Epic 007 (Action Framework)

**Acceptance Criteria**:
- [ ] Workflow model includes:
  - Name and description
  - Trigger conditions (JSON)
  - Action sequence (JSON)
  - Enabled/disabled status
- [ ] Rules stored in database
- [ ] Rules can be created, updated, deleted
- [ ] Rules have priority/execution order

**Technical Notes**:
- Add Workflow model to schema
- Define trigger condition schema
- Define action sequence schema
- CRUD API for workflows

---

### US-008-002: Rule Builder UI
**As a** user  
**I want** a visual interface to build automation rules  
**So that** I can create workflows without coding

**Priority**: P1  
**Story Points**: 8  
**Dependencies**: US-008-001

**Acceptance Criteria**:
- [ ] Visual rule builder with:
  - Trigger selection (if conditions)
  - Condition builder (field, operator, value)
  - Action selection (then actions)
  - Action parameter configuration
- [ ] Support multiple conditions (AND/OR)
- [ ] Support multiple actions
- [ ] Rule preview before saving
- [ ] Rule validation

**Technical Notes**:
- Build rule builder component
- Condition builder UI
- Action selector
- Rule validation logic

---

### US-008-003: Rule Execution Engine
**As a** system  
**I want** to evaluate rules and execute actions when conditions are met  
**So that** workflows run automatically

**Priority**: P1  
**Story Points**: 8  
**Dependencies**: US-008-001, Epic 007

**Acceptance Criteria**:
- [ ] Rule evaluation on relevant events:
  - Item created/updated/deleted
  - Status changes
  - Date-based triggers (scheduled)
- [ ] Conditions evaluated correctly
- [ ] Actions executed when conditions match
- [ ] Rules execute in priority order
- [ ] Failed rules logged with errors
- [ ] Rules can be disabled without deletion

**Technical Notes**:
- Rule evaluation engine
- Event listeners for triggers
- Condition evaluation logic
- Action execution integration
- Error handling

---

### US-008-004: Workflow Templates Library
**As a** user  
**I want** pre-built workflow templates  
**So that** I can quickly set up common automations

**Priority**: P1  
**Story Points**: 5  
**Dependencies**: US-008-001

**Acceptance Criteria**:
- [ ] Template library with common workflows:
  - "If project status = Done, archive after 7 days"
  - "If person mentioned in 3+ projects, suggest creating contact"
  - "If admin task due tomorrow, send reminder today"
  - "If idea mentioned 5+ times, suggest converting to project"
- [ ] Templates can be customized
- [ ] Templates can be saved as user workflows
- [ ] Template descriptions explain what they do

**Technical Notes**:
- Create template library
- Template data structure
- Template customization UI
- Template import/export

---

### US-008-005: Rule Testing and Debugging
**As a** user  
**I want** to test rules before enabling them  
**So that** I can verify they work correctly

**Priority**: P2  
**Story Points**: 5  
**Dependencies**: US-008-003

**Acceptance Criteria**:
- [ ] Test mode for rules
- [ ] Test with sample data
- [ ] Show which conditions matched/failed
- [ ] Show what actions would execute
- [ ] Rule execution log
- [ ] Debug mode with detailed logging

**Technical Notes**:
- Rule testing framework
- Test data generation
- Execution simulation
- Debug logging

---

### US-008-006: Scheduled Workflows
**As a** user  
**I want** workflows that run on a schedule  
**So that** I can automate periodic tasks

**Priority**: P2  
**Story Points**: 3  
**Dependencies**: US-008-003

**Acceptance Criteria**:
- [ ] Rules can have schedule triggers:
  - Daily at specific time
  - Weekly on specific day
  - Monthly on specific date
- [ ] Schedule configuration UI
- [ ] Scheduled rules execute automatically
- [ ] Schedule can be paused/resumed

**Technical Notes**:
- Extend trigger types for schedules
- Cron job integration
- Schedule management
- Timezone handling

---

## Technical Architecture

### Components
- `lib/services/workflows.ts` - Workflow execution engine
- `lib/services/rule-evaluator.ts` - Condition evaluation
- `lib/db/repositories/workflows.ts` - Workflow data access
- `app/workflows/page.tsx` - Workflow management UI
- `components/RuleBuilder.tsx` - Visual rule builder
- `components/WorkflowTemplates.tsx` - Template library

### Database Changes
```prisma
model Workflow {
  id              Int      @id @default(autoincrement())
  tenantId        String
  name            String
  description     String?
  trigger         String   @db.Text // JSON trigger condition
  actions         String   @db.Text // JSON action sequence
  priority        Int      @default(0) // Higher = executes first
  enabled         Boolean  @default(true)
  executionCount  Int      @default(0)
  lastExecutedAt  DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  tenant          Tenant   @relation(fields: [tenantId], references: [id])
  
  @@index([tenantId, enabled])
  @@index([tenantId, priority])
}

model WorkflowExecution {
  id              Int      @id @default(autoincrement())
  tenantId        String
  workflowId      Int
  status          String   // success, failed, skipped
  triggerData     String?  @db.Text // JSON data that triggered
  executedActions String?  @db.Text // JSON actions executed
  errorMessage    String?  @db.Text
  executedAt      DateTime @default(now())
  workflow        Workflow @relation(fields: [workflowId], references: [id], onDelete: Cascade)
  tenant          Tenant   @relation(fields: [tenantId], references: [id])
  
  @@index([tenantId, workflowId])
  @@index([tenantId, executedAt])
}
```

### External Dependencies
- Cron scheduler (node-cron or Bull)
- Event system for triggers

## Success Metrics

- % of users with at least one workflow > 40%
- Average workflows per user > 2
- Workflow execution success rate > 95%
- User satisfaction with workflows > 75%
