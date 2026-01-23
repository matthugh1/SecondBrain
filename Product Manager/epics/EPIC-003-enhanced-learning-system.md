# Epic 003: Enhanced Learning System

**Phase**: 1 - Foundation  
**Priority**: P1  
**Timeline**: Weeks 3-4  
**Story Points**: 21

## Description

Learn from user behavior, corrections, and preferences to improve classification accuracy and provide personalized experiences.

## Goals

- Track user patterns and preferences
- Improve classification based on corrections
- Build user profile for personalization
- Suggest improvements based on patterns

## User Stories

### US-003-001: User Pattern Tracking
**As a** system  
**I want** to track user capture patterns  
**So that** I can learn user preferences and work habits

**Priority**: P1  
**Story Points**: 5  
**Dependencies**: None

**Acceptance Criteria**:
- [ ] Track capture times (hour of day, day of week)
- [ ] Track most common categories per user
- [ ] Track frequently mentioned people/projects
- [ ] Track average confidence scores
- [ ] Track correction frequency and patterns
- [ ] Store patterns in user profile or analytics table

**Technical Notes**:
- Add analytics tracking to capture service
- Create user pattern aggregation jobs
- Store patterns in database (new table or extend existing)

---

### US-003-002: Learning from Corrections
**As a** user  
**I want** the system to learn from my corrections  
**So that** future classifications are more accurate

**Priority**: P1  
**Story Points**: 5  
**Dependencies**: US-003-001 (partial - can start in parallel)

**Acceptance Criteria**:
- [ ] System tracks when user fixes classifications
- [ ] Correction patterns analyzed (what was wrong, what was correct)
- [ ] Classification prompts updated with correction examples
- [ ] Classification accuracy improves over time
- [ ] User sees improvement metrics

**Technical Notes**:
- Enhance existing classification learning (may already exist)
- Store correction patterns more systematically
- Update classification prompts with recent corrections
- Track accuracy metrics per user

---

### US-003-003: User Profile Building
**As a** user  
**I want** the system to understand my work style  
**So that** it can provide personalized suggestions

**Priority**: P2  
**Story Points**: 5  
**Dependencies**: US-003-001

**Acceptance Criteria**:
- [ ] User profile includes:
  - Preferred capture times
  - Common categories
  - Frequent collaborators (people)
  - Active project focus areas
  - Communication style preferences
- [ ] Profile visible to user in settings
- [ ] Profile used for personalization
- [ ] Profile updates automatically

**Technical Notes**:
- Create UserProfile model or extend User
- Build profile from pattern data
- Display profile in settings page
- Use profile for suggestions and defaults

---

### US-003-004: Personalized Defaults
**As a** user  
**I want** the system to suggest defaults based on my history  
**So that** capturing is faster and more accurate

**Priority**: P2  
**Story Points**: 3  
**Dependencies**: US-003-003

**Acceptance Criteria**:
- [ ] System suggests likely category based on patterns
- [ ] System suggests related people/projects when typing
- [ ] System suggests tags based on similar items
- [ ] Defaults shown but can be overridden
- [ ] Defaults improve over time

**Technical Notes**:
- Use user profile for suggestions
- Implement autocomplete with suggestions
- Show suggestions in capture interface
- Learn from user acceptance/rejection of suggestions

---

### US-003-005: Pattern-Based Insights
**As a** user  
**I want** to see insights about my patterns  
**So that** I can understand my work habits better

**Priority**: P2  
**Story Points**: 3  
**Dependencies**: US-003-001

**Acceptance Criteria**:
- [ ] "You capture most ideas on Fridays" insights
- [ ] "You haven't touched Project X in 30 days" alerts
- [ ] "You usually follow up with Sarah after project updates" patterns
- [ ] Insights shown in digest or dashboard
- [ ] Insights are actionable

**Technical Notes**:
- Analyze patterns for insights
- Generate insights based on deviations
- Show insights in digest (Epic 005) or dashboard
- Make insights actionable with suggested actions

---

## Technical Architecture

### Components
- `lib/services/learning-engine.ts` - Pattern analysis and learning
- `lib/services/user-profile.ts` - User profile management
- `lib/db/repositories/user-analytics.ts` - Analytics data storage
- `app/settings/profile/page.tsx` - User profile display

### Database Changes
```prisma
model UserAnalytics {
  id              Int      @id @default(autoincrement())
  tenantId        String
  userId          String
  captureCount    Int      @default(0)
  avgConfidence   Float?
  mostCommonCategory String?
  preferredCaptureTime String? // hour of day
  preferredCaptureDay  String? // day of week
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  tenant          Tenant   @relation(fields: [tenantId], references: [id])
  user            User     @relation(fields: [userId], references: [id])
  
  @@unique([tenantId, userId])
  @@index([tenantId, userId])
}

model UserProfile {
  id              Int      @id @default(autoincrement())
  tenantId        String
  userId          String
  preferences     String   @db.Text // JSON preferences
  frequentPeople  String?  @db.Text // JSON array
  activeFocusAreas String? @db.Text // JSON array
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  tenant          Tenant   @relation(fields: [tenantId], references: [id])
  user            User     @relation(fields: [userId], references: [id])
  
  @@unique([tenantId, userId])
}
```

## Success Metrics

- Classification accuracy improvement > 15% over 30 days
- User satisfaction with suggestions > 70%
- Reduction in corrections > 20%
- Pattern detection accuracy > 80%
