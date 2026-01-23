# Epic 015: Conversation Memory

**Phase**: 5 - Advanced Agentic Features  
**Priority**: P1  
**Timeline**: Weeks 18-19  
**Story Points**: 21

## Description

Enable the system to remember context across chat sessions, reference past conversations, and build long-term context for better assistance.

## Goals

- Remember context across sessions
- Reference past conversations
- Long-term context building
- "Remember when I said..." functionality

## User Stories

### US-015-001: Conversation Context Storage
**As a** system  
**I want** to store conversation context  
**So that** I can remember what was discussed

**Priority**: P1  
**Story Points**: 5  
**Dependencies**: None

**Acceptance Criteria**:
- [ ] Store conversation messages
- [ ] Store conversation metadata (date, topics, entities mentioned)
- [ ] Link conversations to entities (people, projects, etc.)
- [ ] Conversations searchable
- [ ] Conversations can be retrieved by context

**Technical Notes**:
- Conversation model
- Message storage
- Context extraction
- Search indexing

---

### US-015-002: Long-Term Context Retrieval
**As a** user  
**I want** the system to remember past conversations  
**So that** it can reference context in new conversations

**Priority**: P1  
**Story Points**: 8  
**Dependencies**: US-015-001

**Acceptance Criteria**:
- [ ] System retrieves relevant past conversations
- [ ] Context included in current conversation
- [ ] References to past conversations shown
- [ ] Context relevance scoring
- [ ] Context doesn't overwhelm current conversation

**Technical Notes**:
- Context retrieval logic
- Relevance scoring
- Context injection
- Context limits

---

### US-015-003: "Remember When I Said..." Functionality
**As a** user  
**I want** to reference past conversations explicitly  
**So that** I can build on previous discussions

**Priority**: P1  
**Story Points**: 5  
**Dependencies**: US-015-001

**Acceptance Criteria**:
- [ ] User can say "remember when I said..."
- [ ] System finds relevant past conversation
- [ ] System confirms what it remembers
- [ ] System uses that context in current conversation
- [ ] User can correct what system remembers

**Technical Notes**:
- Conversation search
- Context matching
- Confirmation UI
- Context correction

---

### US-015-004: Entity-Based Context Linking
**As a** user  
**I want** conversations linked to entities  
**So that** I can see conversation history with people/projects

**Priority**: P2  
**Story Points**: 3  
**Dependencies**: US-015-001

**Acceptance Criteria**:
- [ ] Conversations linked to mentioned entities
- [ ] View conversation history on entity pages
- [ ] Conversations grouped by entity
- [ ] Search conversations by entity

**Technical Notes**:
- Entity-conversation linking
- Conversation history display
- Entity-based filtering

---

## Technical Architecture

### Components
- `lib/services/conversation-memory.ts` - Conversation storage and retrieval
- `lib/services/context-retrieval.ts` - Context retrieval logic
- `lib/db/repositories/conversations.ts` - Conversation data access
- Enhance ChatInterface with context

### Database Changes
```prisma
model Conversation {
  id              Int      @id @default(autoincrement())
  tenantId        String
  userId          String
  title           String?  // Auto-generated or user-set
  summary         String?  @db.Text // AI-generated summary
  entities        String?  @db.Text // JSON array of mentioned entities
  topics          String?  @db.Text // JSON array of topics
  startedAt       DateTime @default(now())
  endedAt         DateTime?
  messageCount    Int      @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  tenant          Tenant   @relation(fields: [tenantId], references: [id])
  user            User     @relation(fields: [userId], references: [id])
  
  messages        ConversationMessage[]
  
  @@index([tenantId, userId])
  @@index([tenantId, startedAt])
  @@index([tenantId, entities]) // JSON index if supported
}

model ConversationMessage {
  id              Int      @id @default(autoincrement())
  tenantId        String
  conversationId  Int
  role            String   // user, assistant, system
  content         String   @db.Text
  entities        String?  @db.Text // JSON array of entities mentioned
  timestamp       DateTime  @default(now())
  conversation    Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  tenant          Tenant   @relation(fields: [tenantId], references: [id])
  
  @@index([tenantId, conversationId])
  @@index([tenantId, timestamp])
}

model ConversationEntity {
  id              Int      @id @default(autoincrement())
  tenantId        String
  conversationId  Int
  entityType      String   // people, projects, ideas, admin
  entityId        Int
  mentionCount    Int      @default(1)
  createdAt       DateTime @default(now())
  conversation    Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  tenant          Tenant   @relation(fields: [tenantId], references: [id])
  
  @@unique([tenantId, conversationId, entityType, entityId])
  @@index([tenantId, entityType, entityId])
}
```

## Success Metrics

- Context retrieval accuracy > 80%
- User satisfaction with memory > 75%
- Conversations stored per user > 50
- Context usage in conversations > 60%
