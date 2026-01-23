# Epic 016: Predictive Suggestions

**Phase**: 5 - Advanced Agentic Features  
**Priority**: P2  
**Timeline**: Weeks 19-20  
**Story Points**: 21

## Description

Predict what users will capture next, suggest next actions based on patterns, and pre-fill forms to speed up capture.

## Goals

- Predict next captures
- Suggest next actions
- Pre-fill forms based on history
- Learn from user patterns

## User Stories

### US-016-001: Capture Prediction
**As a** user  
**I want** the system to predict what I'll capture next  
**So that** capture is faster

**Priority**: P2  
**Story Points**: 5  
**Dependencies**: Epic 003 (Learning System)

**Acceptance Criteria**:
- [ ] System predicts likely captures based on:
  - Time of day
  - Day of week
  - Recent captures
  - Active projects
- [ ] Predictions shown as suggestions
- [ ] User can accept predictions
- [ ] Predictions improve over time

**Technical Notes**:
- Prediction algorithm
- Pattern analysis
- Suggestion display
- Learning from acceptance

---

### US-016-002: Next Action Suggestions
**As a** user  
**I want** suggestions for next actions  
**So that** I know what to work on

**Priority**: P2  
**Story Points**: 5  
**Dependencies**: Epic 005 (Insights)

**Acceptance Criteria**:
- [ ] Suggest next actions based on:
  - Overdue tasks
  - Stale projects
  - Follow-ups needed
  - User patterns
- [ ] Suggestions prioritized by urgency/importance
- [ ] Suggestions actionable (one-click to create task)
- [ ] User can dismiss suggestions

**Technical Notes**:
- Action suggestion logic
- Prioritization algorithm
- Suggestion UI
- Action creation from suggestions

---

### US-016-003: Form Pre-filling
**As a** user  
**I want** forms to be pre-filled based on my history  
**So that** capture is faster

**Priority**: P2  
**Story Points**: 5  
**Dependencies**: Epic 003 (Learning System)

**Acceptance Criteria**:
- [ ] Pre-fill:
  - Category (based on patterns)
  - Related people/projects (based on recent)
  - Tags (based on similar items)
  - Status (based on defaults)
- [ ] Pre-filled values can be changed
- [ ] Pre-filling improves over time
- [ ] User can disable pre-filling

**Technical Notes**:
- Pre-fill logic
- Form enhancement
- User preferences
- Learning from changes

---

### US-016-004: Pattern-Based Recommendations
**As a** user  
**I want** recommendations based on my patterns  
**So that** I can discover useful actions

**Priority**: P2  
**Story Points**: 3  
**Dependencies**: US-016-001

**Acceptance Criteria**:
- [ ] Recommendations like:
  - "You usually follow up with Sarah after project updates"
  - "You always capture ideas on Fridays"
  - "This project pattern matches 3 similar projects"
- [ ] Recommendations shown in dashboard
- [ ] Recommendations actionable
- [ ] User feedback on recommendations

**Technical Notes**:
- Pattern analysis
- Recommendation generation
- Recommendation display
- Feedback learning

---

### US-016-005: Smart Autocomplete
**As a** user  
**I want** smart autocomplete when typing  
**So that** I can quickly select common values

**Priority**: P2  
**Story Points**: 3  
**Dependencies**: US-016-003

**Acceptance Criteria**:
- [ ] Autocomplete for:
  - People names
  - Project names
  - Tags
  - Categories
- [ ] Autocomplete ranked by relevance/frequency
- [ ] Autocomplete learns from usage
- [ ] Keyboard navigation support

**Technical Notes**:
- Autocomplete service
- Ranking algorithm
- UI component
- Learning from selections

---

## Technical Architecture

### Components
- `lib/services/predictions.ts` - Prediction engine
- `lib/services/suggestions.ts` - Suggestion generation
- `lib/services/autocomplete.ts` - Autocomplete service
- Enhance capture forms with pre-filling

### Database Changes
```prisma
model Prediction {
  id              Int      @id @default(autoincrement())
  tenantId        String
  userId          String
  predictionType  String   // capture, action, form_field
  predictedValue  String   @db.Text // JSON predicted value
  confidence      Float
  context         String?  @db.Text // JSON context
  accepted        Boolean?
  createdAt       DateTime @default(now())
  tenant          Tenant   @relation(fields: [tenantId], references: [id])
  user            User     @relation(fields: [userId], references: [id])
  
  @@index([tenantId, userId])
  @@index([tenantId, predictionType])
}
```

## Success Metrics

- Prediction accuracy > 60%
- Suggestion acceptance rate > 40%
- Form pre-fill accuracy > 70%
- User satisfaction with suggestions > 70%
