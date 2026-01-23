# Epic 001: Natural Language Query Engine

**Phase**: 1 - Foundation  
**Priority**: P1  
**Timeline**: Weeks 1-2  
**Story Points**: 34

## Description

Enable users to ask complex questions in natural language and get intelligent answers across all their stored data. Expand beyond simple task queries to support relationship queries, pattern detection, and semantic search.

## Goals

- Users can query their data using natural language
- Queries work across all databases (people, projects, ideas, admin)
- Results are ranked by relevance and confidence
- Queries understand context and relationships

## User Stories

### US-001-001: Basic Natural Language Queries
**As a** user  
**I want** to ask questions like "show me all projects related to Sarah"  
**So that** I can quickly find information without navigating multiple pages

**Priority**: P1  
**Story Points**: 5  
**Dependencies**: None

**Acceptance Criteria**:
- [ ] User can type natural language queries in chat interface
- [ ] System detects query intent (not capture intent)
- [ ] Query searches across all databases (people, projects, ideas, admin)
- [ ] Results are returned with relevance scores
- [ ] Results show which database each item came from
- [ ] Results are clickable links to detail pages

**Technical Notes**:
- Extend intent detection to distinguish queries from captures
- Implement search across all repositories
- Add relevance scoring algorithm

---

### US-001-002: Semantic Search with Vector Embeddings
**As a** user  
**I want** to search for concepts, not just keywords  
**So that** I can find related information even if exact words don't match

**Priority**: P1  
**Story Points**: 8  
**Dependencies**: US-001-001

**Acceptance Criteria**:
- [ ] System generates embeddings for all stored text content
- [ ] Query is converted to embedding for semantic matching
- [ ] Results include semantically similar items
- [ ] Results show similarity scores
- [ ] Embeddings are stored efficiently (vector database or indexed)

**Technical Notes**:
- Use OpenAI/Anthropic embeddings API
- Store embeddings in database or vector DB
- Implement cosine similarity for matching

---

### US-001-003: Relationship-Based Queries
**As a** user  
**I want** to ask "what ideas haven't I touched in 30 days?"  
**So that** I can discover forgotten items that need attention

**Priority**: P1  
**Story Points**: 5  
**Dependencies**: US-001-001

**Acceptance Criteria**:
- [ ] Queries can filter by date ranges
- [ ] Queries can filter by last_touched field
- [ ] Queries can filter by status, tags, categories
- [ ] Results show when items were last touched
- [ ] Results are sorted by relevance/date

**Technical Notes**:
- Extend query parser to handle date filters
- Add date range queries to repositories
- Support relative dates ("30 days ago", "last week")

---

### US-001-004: Complex Multi-Criteria Queries
**As a** user  
**I want** to ask "show me active projects with no next action"  
**So that** I can identify projects that need attention

**Priority**: P2  
**Story Points**: 5  
**Dependencies**: US-001-001

**Acceptance Criteria**:
- [ ] Queries can combine multiple criteria
- [ ] System understands field names (status, next_action, etc.)
- [ ] Results match all specified criteria
- [ ] Query parsing handles AND/OR logic
- [ ] Error messages for invalid queries

**Technical Notes**:
- Build query parser for structured queries
- Map natural language to database fields
- Support boolean logic in queries

---

### US-001-005: Query History and Saved Queries
**As a** user  
**I want** to save frequently used queries  
**So that** I can quickly run them again without retyping

**Priority**: P2  
**Story Points**: 3  
**Dependencies**: US-001-001

**Acceptance Criteria**:
- [ ] Users can save queries with custom names
- [ ] Saved queries appear in quick access menu
- [ ] Query history shows recent queries
- [ ] Saved queries can be edited or deleted
- [ ] Saved queries work with current data

**Technical Notes**:
- Extend SavedSearch model to support query strings
- Add UI for managing saved queries
- Store query parameters, not just results

---

### US-001-006: Query Results Visualization
**As a** user  
**I want** to see query results in a clear, organized format  
**So that** I can quickly understand what was found

**Priority**: P2  
**Story Points**: 3  
**Dependencies**: US-001-001

**Acceptance Criteria**:
- [ ] Results grouped by database type
- [ ] Results show key information (name, status, dates)
- [ ] Results highlight matching terms
- [ ] Results show confidence/relevance scores
- [ ] Results can be filtered/sorted after query

**Technical Notes**:
- Create query results component
- Highlight matching text in results
- Support sorting and filtering UI

---

### US-001-007: Query Performance Optimization
**As a** user  
**I want** queries to return results quickly  
**So that** I don't wait for answers

**Priority**: P1  
**Story Points**: 5  
**Dependencies**: US-001-002

**Acceptance Criteria**:
- [ ] Queries return results in < 2 seconds
- [ ] Semantic search uses cached embeddings
- [ ] Database queries are optimized with indexes
- [ ] Large result sets are paginated
- [ ] Loading states shown during query execution

**Technical Notes**:
- Add database indexes for common query patterns
- Cache embeddings and frequent queries
- Implement pagination for large results
- Use background jobs for expensive queries

---

## Technical Architecture

### Components
- `lib/services/query-engine.ts` - Main query processing engine
- `lib/services/semantic-search.ts` - Vector embedding and similarity search
- `app/api/query/route.ts` - Query API endpoint
- `components/QueryInterface.tsx` - Query UI component

### Database Changes
- Add `embeddings` table for vector storage (or use external vector DB)
- Add indexes for common query fields
- Extend SavedSearch model for query storage

### External Dependencies
- OpenAI/Anthropic embeddings API
- Vector database (optional, can use PostgreSQL with pgvector)

## Success Metrics

- Query success rate > 90%
- Average query response time < 2 seconds
- User queries per day > 5
- Query accuracy (user satisfaction) > 80%
