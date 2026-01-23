# Epic 006: Goal Tracking & OKRs

**Phase**: 2 - Proactive Intelligence  
**Priority**: P1  
**Timeline**: Weeks 7-8  
**Story Points**: 26

## Description

Enable users to set goals, track progress, and align projects and ideas with objectives to measure productivity and outcomes.

## Goals

- Set and track goals
- Link goals to projects/ideas
- Track progress toward goals
- Weekly goal reviews

## User Stories

### US-006-001: Goal Creation and Management
**As a** user  
**I want** to create goals and track progress  
**So that** I can measure outcomes, not just activity

**Priority**: P1  
**Story Points**: 5  
**Dependencies**: None

**Acceptance Criteria**:
- [ ] Create goals with:
  - Name and description
  - Target date
  - Progress tracking (0-100%)
  - Status (active, completed, paused)
- [ ] Edit and delete goals
- [ ] Goals page showing all goals
- [ ] Goals sorted by status and target date
- [ ] Visual progress indicators

**Technical Notes**:
- Add Goal model to schema
- Create goals CRUD API
- Build goals page UI
- Progress calculation logic

---

### US-006-002: Link Goals to Projects and Ideas
**As a** user  
**I want** to link projects and ideas to goals  
**So that** I can see how my work contributes to objectives

**Priority**: P1  
**Story Points**: 5  
**Dependencies**: US-006-001

**Acceptance Criteria**:
- [ ] Link projects to goals (many-to-many)
- [ ] Link ideas to goals
- [ ] View all items linked to a goal
- [ ] View all goals linked to an item
- [ ] Link items when creating/editing goals
- [ ] Link goals when creating/editing items

**Technical Notes**:
- Add goal relationships to schema
- Update item detail pages to show goals
- Update goal detail pages to show items
- Link UI in forms

---

### US-006-003: Automatic Progress Calculation
**As a** user  
**I want** goal progress to update automatically  
**So that** I can see real-time progress without manual updates

**Priority**: P1  
**Story Points**: 5  
**Dependencies**: US-006-002

**Acceptance Criteria**:
- [ ] Progress calculated based on:
  - Linked project status (Done = progress)
  - Linked idea conversions to projects
  - Manual progress updates
- [ ] Progress updates when linked items change
- [ ] Progress shown as percentage and visual indicator
- [ ] Progress history tracked over time

**Technical Notes**:
- Calculate progress from linked items
- Update progress on item status changes
- Store progress history
- Background job for progress updates

---

### US-006-004: Goal Dashboard and Visualization
**As a** user  
**I want** to see all my goals in a dashboard  
**So that** I can quickly understand my progress

**Priority**: P1  
**Story Points**: 5  
**Dependencies**: US-006-001

**Acceptance Criteria**:
- [ ] Goals dashboard showing:
  - Active goals with progress
  - Completed goals
  - Goals by status
  - Goals approaching target date
- [ ] Visual progress bars/charts
- [ ] Filter by status, date, progress
- [ ] Click goal to see details and linked items

**Technical Notes**:
- Create goals dashboard page
- Visual progress components
- Filtering and sorting
- Goal detail modal/page

---

### US-006-005: Weekly Goal Reviews
**As a** user  
**I want** goal progress included in weekly reviews  
**So that** I can reflect on progress toward objectives

**Priority**: P2  
**Story Points**: 3  
**Dependencies**: US-006-001, Epic 005 (Digests)

**Acceptance Criteria**:
- [ ] Weekly review includes:
  - Goals progress summary
  - Goals completed this week
  - Goals at risk (behind schedule)
  - Recommendations for next week
- [ ] Goals section in weekly digest
- [ ] Actionable insights about goals

**Technical Notes**:
- Integrate goals into digest generation
- Analyze goal progress trends
- Generate goal insights
- Format for digest display

---

### US-006-006: Goal Templates and OKR Framework
**As a** user  
**I want** to use OKR framework for goals  
**So that** I can structure objectives and key results

**Priority**: P2  
**Story Points**: 3  
**Dependencies**: US-006-001

**Acceptance Criteria**:
- [ ] Support OKR structure:
  - Objectives (high-level goals)
  - Key Results (measurable outcomes)
- [ ] Key Results linked to projects/ideas
- [ ] OKR templates for common goal types
- [ ] OKR view showing objectives and key results

**Technical Notes**:
- Extend Goal model for OKR structure
- Add KeyResult model
- Create OKR templates
- OKR-specific UI views

---

## Technical Architecture

### Components
- `lib/services/goals.ts` - Goal management and progress calculation
- `lib/db/repositories/goals.ts` - Goal data access
- `app/goals/page.tsx` - Goals dashboard
- `components/GoalCard.tsx` - Goal display component
- `components/GoalProgress.tsx` - Progress visualization

### Database Changes
```prisma
model Goal {
  id              Int      @id @default(autoincrement())
  tenantId        String
  name            String
  description     String?  @db.Text
  targetDate      DateTime?
  status          String   @default("active") // active, completed, paused, cancelled
  progress        Float    @default(0) // 0-100
  progressMethod  String   @default("manual") // manual, auto_from_items
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  tenant          Tenant   @relation(fields: [tenantId], references: [id])
  
  linkedProjects  GoalProject[]
  linkedIdeas     GoalIdea[]
  progressHistory GoalProgress[]
  
  @@index([tenantId, status])
  @@index([tenantId, targetDate])
}

model GoalProject {
  id              Int      @id @default(autoincrement())
  tenantId        String
  goalId          Int
  projectId       Int
  weight          Float    @default(1.0) // Contribution weight
  createdAt       DateTime @default(now())
  goal            Goal     @relation(fields: [goalId], references: [id], onDelete: Cascade)
  project         Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  tenant          Tenant   @relation(fields: [tenantId], references: [id])
  
  @@unique([tenantId, goalId, projectId])
  @@index([tenantId, goalId])
  @@index([tenantId, projectId])
}

model GoalIdea {
  id              Int      @id @default(autoincrement())
  tenantId        String
  goalId          Int
  ideaId          Int
  weight          Float    @default(1.0)
  createdAt       DateTime @default(now())
  goal            Goal     @relation(fields: [goalId], references: [id], onDelete: Cascade)
  idea            Idea     @relation(fields: [ideaId], references: [id], onDelete: Cascade)
  tenant          Tenant   @relation(fields: [tenantId], references: [id])
  
  @@unique([tenantId, goalId, ideaId])
  @@index([tenantId, goalId])
  @@index([tenantId, ideaId])
}

model GoalProgress {
  id              Int      @id @default(autoincrement())
  tenantId        String
  goalId          Int
  progress        Float
  recordedAt      DateTime @default(now())
  goal            Goal     @relation(fields: [goalId], references: [id], onDelete: Cascade)
  tenant          Tenant   @relation(fields: [tenantId], references: [id])
  
  @@index([tenantId, goalId, recordedAt])
}
```

## Success Metrics

- % of users with at least one goal > 60%
- Average goals per user > 3
- Goal completion rate > 40%
- User engagement with goals > 50%
