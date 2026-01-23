# Epic 002: Relationship Graph Engine

**Phase**: 1 - Foundation  
**Priority**: P1  
**Timeline**: Weeks 2-3  
**Story Points**: 29

## Description

Track and visualize relationships between entities (people, projects, ideas, admin tasks) to help users understand connections and discover related information automatically.

## Goals

- Automatically detect relationships between entities
- Visualize relationship graph in UI
- Surface related items when viewing any entity
- Track relationship strength and types

## User Stories

### US-002-001: Relationship Detection and Storage
**As a** user  
**I want** the system to automatically detect when I mention a person in a project  
**So that** relationships are tracked without manual effort

**Priority**: P1  
**Story Points**: 8  
**Dependencies**: None

**Acceptance Criteria**:
- [ ] System extracts entity mentions from text during capture
- [ ] Relationships are created automatically (e.g., person mentioned in project)
- [ ] Relationships stored in database with source/target types and IDs
- [ ] Relationship types tracked (mentioned_in, related_to, blocks, etc.)
- [ ] Relationship strength calculated (0-1 confidence score)
- [ ] Duplicate relationships prevented

**Technical Notes**:
- Add Relationship model to schema
- Extract entity names during classification
- Match extracted names to existing entities
- Create relationships in background job

---

### US-002-002: Related Items Display
**As a** user  
**I want** to see related items when viewing any entity  
**So that** I can discover connections I might have forgotten

**Priority**: P1  
**Story Points**: 5  
**Dependencies**: US-002-001

**Acceptance Criteria**:
- [ ] Related items section on detail pages
- [ ] Shows related people, projects, ideas, admin tasks
- [ ] Related items sorted by relationship strength
- [ ] Shows relationship type (e.g., "Mentioned in 3 projects")
- [ ] Clicking related item navigates to its detail page
- [ ] Related items count shown (e.g., "5 related items")

**Technical Notes**:
- Create RelatedItems component (may already exist)
- Query relationships by source/target
- Display related items with relationship context

---

### US-002-003: Relationship Graph Visualization
**As a** user  
**I want** to see a visual graph of relationships  
**So that** I can understand how my information is connected

**Priority**: P1  
**Story Points**: 8  
**Dependencies**: US-002-001

**Acceptance Criteria**:
- [ ] Graph visualization shows entities as nodes
- [ ] Relationships shown as edges between nodes
- [ ] Graph is interactive (zoom, pan, click nodes)
- [ ] Clicking node shows entity details
- [ ] Graph filters by entity type (show only people/projects)
- [ ] Graph shows relationship strength visually (edge thickness)
- [ ] Graph loads efficiently (< 3 seconds for 100 nodes)

**Technical Notes**:
- Use D3.js, Cytoscape.js, or React Flow for visualization
- Generate graph data from relationships
- Implement efficient rendering for large graphs
- Add filtering and search in graph view

---

### US-002-004: Manual Relationship Creation
**As a** user  
**I want** to manually create relationships between items  
**So that** I can link items that weren't automatically detected

**Priority**: P2  
**Story Points**: 3  
**Dependencies**: US-002-001

**Acceptance Criteria**:
- [ ] "Link to..." button on detail pages
- [ ] Search/select related item to link
- [ ] Choose relationship type from dropdown
- [ ] Relationship created immediately
- [ ] Success message shown
- [ ] Can remove relationships

**Technical Notes**:
- Add UI for manual relationship creation
- Search component for finding items to link
- API endpoint for creating/deleting relationships

---

### US-002-005: Relationship Strength Calculation
**As a** user  
**I want** the system to prioritize stronger relationships  
**So that** the most relevant connections are shown first

**Priority**: P2  
**Story Points**: 3  
**Dependencies**: US-002-001

**Acceptance Criteria**:
- [ ] Relationship strength calculated based on:
  - Number of mentions
  - Recency of mentions
  - Context similarity
- [ ] Strength scores updated over time
- [ ] Stronger relationships shown first in lists
- [ ] Strength visible in graph visualization

**Technical Notes**:
- Algorithm for calculating relationship strength
- Background job to update strengths periodically
- Consider mention frequency, recency, context overlap

---

### US-002-006: Relationship-Based Insights
**As a** user  
**I want** to see insights based on relationships  
**So that** I can discover patterns in my data

**Priority**: P2  
**Story Points**: 2  
**Dependencies**: US-002-001, US-002-002

**Acceptance Criteria**:
- [ ] "This person is mentioned in 5 active projects" insights
- [ ] "This idea relates to 3 projects" notifications
- [ ] "You haven't linked this project to any people" suggestions
- [ ] Insights shown in digest or on detail pages

**Technical Notes**:
- Analyze relationship patterns
- Generate insights based on relationship data
- Integrate with insights engine (Epic 005)

---

## Technical Architecture

### Components
- `lib/services/relationship-engine.ts` - Relationship detection and management
- `lib/db/repositories/relationships.ts` - Relationship data access
- `components/RelationshipGraph.tsx` - Graph visualization component
- `components/RelatedItems.tsx` - Related items display (may exist)

### Database Changes
```prisma
model Relationship {
  id              Int      @id @default(autoincrement())
  tenantId        String
  sourceType      String   // people, projects, ideas, admin
  sourceId        Int
  targetType      String
  targetId        Int
  relationshipType String  // mentioned_in, related_to, blocks, etc.
  strength        Float    @default(0.5)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  tenant          Tenant   @relation(fields: [tenantId], references: [id])
  
  @@unique([tenantId, sourceType, sourceId, targetType, targetId])
  @@index([tenantId, sourceType, sourceId])
  @@index([tenantId, targetType, targetId])
}
```

### External Dependencies
- Graph visualization library (D3.js, Cytoscape.js, or React Flow)

## Success Metrics

- % of entities with at least one relationship > 60%
- Average relationships per entity > 2
- User engagement with related items > 30%
- Graph visualization usage > 20% of users
