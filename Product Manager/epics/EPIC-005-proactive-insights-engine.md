# Epic 005: Proactive Insights Engine

**Phase**: 2 - Proactive Intelligence  
**Priority**: P1  
**Timeline**: Weeks 6-7  
**Story Points**: 21

## Description

Detect patterns, surface insights, and provide actionable recommendations to help users understand their work patterns and improve productivity.

## Goals

- Detect patterns in user behavior
- Surface insights proactively
- Provide actionable recommendations
- Help users understand their work habits

## User Stories

### US-005-001: Pattern Detection System
**As a** system  
**I want** to detect patterns in user behavior  
**So that** I can surface meaningful insights

**Priority**: P1  
**Story Points**: 5  
**Dependencies**: Epic 003 (Enhanced Learning System)

**Acceptance Criteria**:
- [ ] System detects patterns:
  - Capture frequency trends
  - Category distribution changes
  - Project stagnation patterns
  - Relationship patterns
  - Time-based patterns (day/time)
- [ ] Patterns stored for analysis
- [ ] Patterns updated regularly
- [ ] Patterns compared to historical data

**Technical Notes**:
- Build pattern detection algorithms
- Analyze data over time windows
- Store patterns in database
- Background job for pattern analysis

---

### US-005-002: Daily Insights Generation
**As a** user  
**I want** to see daily insights about my work  
**So that** I can understand what's happening and what needs attention

**Priority**: P1  
**Story Points**: 5  
**Dependencies**: US-005-001

**Acceptance Criteria**:
- [ ] Daily insights include:
  - "You're capturing more admin tasks than projects this week"
  - "3 projects haven't moved in 2 weeks"
  - "You always capture ideas on Fridays"
- [ ] Insights shown in daily digest
- [ ] Insights are actionable
- [ ] Insights respect user preferences (don't overwhelm)

**Technical Notes**:
- Generate insights from patterns
- Format insights for display
- Integrate with digest system
- Limit insights per day (3-5 max)

---

### US-005-003: Stagnation Detection
**As a** user  
**I want** to be alerted when projects or ideas are stagnant  
**So that** I can decide whether to revive or archive them

**Priority**: P1  
**Story Points**: 5  
**Dependencies**: US-005-001

**Acceptance Criteria**:
- [ ] Detect projects not updated in X days (configurable)
- [ ] Detect ideas not touched in X days
- [ ] Consider project status (Active vs Waiting)
- [ ] Alert includes:
  - How long stagnant
  - Last activity
  - Suggested actions (archive, update, delete)
- [ ] Alerts shown in insights or reminders

**Technical Notes**:
- Query items by last update date
- Calculate stagnation period
- Generate alerts for stagnant items
- Link to actions

---

### US-005-004: Opportunity Detection
**As a** user  
**I want** to be notified when ideas could become projects  
**So that** I don't miss opportunities to act on good ideas

**Priority**: P2  
**Story Points**: 3  
**Dependencies**: US-005-001

**Acceptance Criteria**:
- [ ] Detect ideas that:
  - Are mentioned multiple times
  - Relate to active projects
  - Have detailed notes
  - Are frequently accessed
- [ ] Suggest converting idea to project
- [ ] Show related context (why it's an opportunity)
- [ ] One-click conversion to project

**Technical Notes**:
- Analyze idea characteristics
- Score ideas for project potential
- Generate opportunity insights
- Provide conversion action

---

### US-005-005: Weekly Insights Summary
**As a** user  
**I want** a weekly summary of insights and patterns  
**So that** I can reflect on my work and make improvements

**Priority**: P2  
**Story Points**: 3  
**Dependencies**: US-005-002

**Acceptance Criteria**:
- [ ] Weekly insights include:
  - Overall patterns for the week
  - Comparison to previous weeks
  - Notable changes or trends
  - Recommendations for next week
- [ ] Insights shown in weekly review digest
- [ ] Insights are comprehensive but concise
- [ ] Insights include visualizations (charts, graphs)

**Technical Notes**:
- Aggregate weekly patterns
- Compare to historical data
- Generate weekly insights
- Integrate with weekly review digest
- Add simple visualizations

---

## Technical Architecture

### Components
- `lib/services/insights.ts` - Insight generation engine
- `lib/services/pattern-detection.ts` - Pattern analysis
- `lib/db/repositories/insights.ts` - Insight storage
- `components/InsightsDashboard.tsx` - Insights display

### Database Changes
```prisma
model Insight {
  id              Int      @id @default(autoincrement())
  tenantId        String
  userId          String
  insightType     String   // pattern, stagnation, opportunity, trend
  title           String
  message         String   @db.Text
  data            String?  @db.Text // JSON data for insights
  actionable      Boolean  @default(true)
  actionType      String?  // convert_to_project, archive, update, etc.
  actionTargetId  Int?
  priority        String   @default("medium")
  status          String   @default("active") // active, dismissed, acted_upon
  createdAt       DateTime @default(now())
  tenant          Tenant   @relation(fields: [tenantId], references: [id])
  user            User     @relation(fields: [userId], references: [id])
  
  @@index([tenantId, userId, status])
  @@index([tenantId, insightType])
  @@index([tenantId, createdAt])
}

model Pattern {
  id              Int      @id @default(autoincrement())
  tenantId        String
  userId          String
  patternType     String   // capture_frequency, category_distribution, etc.
  patternData     String   @db.Text // JSON pattern data
  detectedAt      DateTime @default(now())
  confidence      Float    @default(0.5)
  tenant          Tenant   @relation(fields: [tenantId], references: [id])
  user            User     @relation(fields: [userId], references: [id])
  
  @@index([tenantId, userId, patternType])
}
```

## Success Metrics

- Insight accuracy (user agrees) > 70%
- User engagement with insights > 50%
- Actions taken from insights > 30%
- User satisfaction with insights > 75%
