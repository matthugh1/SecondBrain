# Epic 009: Multi-Step Action Planner

**Phase**: 3 - Action Execution Layer  
**Priority**: P1  
**Timeline**: Weeks 11-12  
**Story Points**: 26

## Description

Break down complex user requests into multiple steps and execute them sequentially with user approval, enabling the system to handle complex tasks autonomously.

## Goals

- Parse complex requests into steps
- Plan action sequences
- Execute steps with approval
- Handle dependencies between steps

## User Stories

### US-009-001: Request Parsing and Planning
**As a** user  
**I want** to ask for complex tasks like "plan a project launch"  
**So that** the system breaks it down into steps

**Priority**: P1  
**Story Points**: 8  
**Dependencies**: Epic 007 (Action Framework)

**Acceptance Criteria**:
- [ ] System parses complex requests:
  - "Plan a project launch" → creates project, sets milestones, creates admin tasks
  - "Follow up with Sarah" → creates admin task, links to person, sets reminder
  - "Convert this idea to a project" → creates project, links idea, archives idea
- [ ] Request broken into steps
- [ ] Steps have dependencies identified
- [ ] Plan shown to user before execution
- [ ] User can modify plan

**Technical Notes**:
- Use LLM to parse requests into steps
- Define step schema
- Plan generation service
- Plan display UI

---

### US-009-002: Step Execution with Dependencies
**As a** system  
**I want** to execute steps in the correct order  
**So that** dependencies are handled properly

**Priority**: P1  
**Story Points**: 5  
**Dependencies**: US-009-001, Epic 007

**Acceptance Criteria**:
- [ ] Steps execute in dependency order
- [ ] Steps wait for dependencies to complete
- [ ] Failed steps stop execution (or continue based on plan)
- [ ] Step execution status tracked
- [ ] User can pause/resume execution
- [ ] User can skip steps

**Technical Notes**:
- Dependency graph building
- Step execution queue
- Status tracking
- Error handling

---

### US-009-003: Plan Approval and Modification
**As a** user  
**I want** to review and modify plans before execution  
**So that** I can ensure the plan is correct

**Priority**: P1  
**Story Points**: 5  
**Dependencies**: US-009-001

**Acceptance Criteria**:
- [ ] Plan displayed with all steps
- [ ] Steps show:
  - Action type and description
  - Dependencies
  - Estimated impact
- [ ] User can:
  - Approve plan as-is
  - Modify steps
  - Remove steps
  - Add steps
- [ ] Plan saved for future reference

**Technical Notes**:
- Plan display component
- Step editing UI
- Plan modification logic
- Plan storage

---

### US-009-004: Plan Templates
**As a** user  
**I want** to save common plans as templates  
**So that** I can reuse complex workflows

**Priority**: P2  
**Story Points**: 3  
**Dependencies**: US-009-001

**Acceptance Criteria**:
- [ ] Save plan as template
- [ ] Templates have names and descriptions
- [ ] Execute template with parameters
- [ ] Templates can be shared (future)
- [ ] Template library

**Technical Notes**:
- PlanTemplate model
- Template storage
- Template execution
- Template UI

---

### US-009-005: Plan Execution Monitoring
**As a** user  
**I want** to see progress of plan execution  
**So that** I know what's happening

**Priority**: P2  
**Story Points**: 3  
**Dependencies**: US-009-002

**Acceptance Criteria**:
- [ ] Real-time execution status
- [ ] Progress indicator (X of Y steps)
- [ ] Current step highlighted
- [ ] Completed steps shown
- [ ] Failed steps highlighted with errors
- [ ] Execution can be cancelled

**Technical Notes**:
- Real-time status updates (WebSocket or polling)
- Progress UI component
- Status tracking
- Error display

---

### US-009-006: Plan Rollback
**As a** user  
**I want** to rollback a plan if something goes wrong  
**So that** I can undo complex changes

**Priority**: P2  
**Story Points**: 2  
**Dependencies**: US-009-002, Epic 007 (Rollback)

**Acceptance Criteria**:
- [ ] Rollback entire plan
- [ ] Rollback individual steps
- [ ] Rollback restores previous state
- [ ] Rollback confirmation required
- [ ] Rollback history tracked

**Technical Notes**:
- Plan rollback logic
- Step rollback integration
- Rollback UI
- State restoration

---

## Technical Architecture

### Components
- `lib/services/action-planner.ts` - Plan generation and execution
- `lib/services/plan-executor.ts` - Step execution engine
- `lib/db/repositories/plans.ts` - Plan storage
- `components/PlanBuilder.tsx` - Plan display and editing
- `components/PlanExecution.tsx` - Execution monitoring

### Database Changes
```prisma
model Plan {
  id              Int      @id @default(autoincrement())
  tenantId        String
  userId          String
  name            String
  description     String?
  request         String   @db.Text // Original user request
  steps           String   @db.Text // JSON array of steps
  status          String   @default("draft") // draft, approved, executing, completed, failed, cancelled
  approvedAt      DateTime?
  startedAt       DateTime?
  completedAt     DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  tenant          Tenant   @relation(fields: [tenantId], references: [id])
  user            User     @relation(fields: [userId], references: [id])
  
  @@index([tenantId, userId, status])
  @@index([tenantId, createdAt])
}

model PlanStep {
  id              Int      @id @default(autoincrement())
  tenantId        String
  planId          Int
  stepOrder       Int
  actionType      String
  actionParams    String   @db.Text // JSON parameters
  dependencies    String?  @db.Text // JSON array of step IDs
  status          String   @default("pending") // pending, executing, completed, failed, skipped
  result          String?  @db.Text // JSON result
  errorMessage    String?  @db.Text
  executedAt      DateTime?
  plan            Plan     @relation(fields: [planId], references: [id], onDelete: Cascade)
  tenant          Tenant   @relation(fields: [tenantId], references: [id])
  
  @@index([tenantId, planId])
  @@index([tenantId, planId, stepOrder])
}
```

### External Dependencies
- LLM for plan generation (OpenAI/Anthropic)
- Job queue for step execution

## Success Metrics

- Plan generation accuracy > 80%
- Plan execution success rate > 90%
- User satisfaction with plans > 75%
- Average steps per plan > 3
