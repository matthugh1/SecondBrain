# Epic 019: Voice & Multi-Modal Capture

**Phase**: 6 - Mobile & Capture Enhancements  
**Priority**: P2  
**Timeline**: Week 23-24  
**Story Points**: 21

## Description

Enable voice input, voice commands, audio note attachments, and transcription for multi-modal capture.

## Goals

- Browser speech-to-text
- Voice commands
- Audio note attachments
- Transcription service integration

## User Stories

### US-019-001: Browser Speech-to-Text
**As a** user  
**I want** to capture thoughts using voice  
**So that** I can capture hands-free

**Priority**: P1  
**Story Points**: 5  
**Dependencies**: None

**Acceptance Criteria**:
- [ ] Voice input button in capture interface
- [ ] Browser Speech Recognition API integration
- [ ] Real-time transcription shown
- [ ] Stop/start recording
- [ ] Transcription sent as capture
- [ ] Works in Chrome, Firefox, Safari

**Technical Notes**:
- Web Speech API
- Browser compatibility
- UI for voice input
- Error handling

---

### US-019-002: Voice Commands
**As a** user  
**I want** to use voice commands  
**So that** I can control the system hands-free

**Priority**: P2  
**Story Points**: 5  
**Dependencies**: US-019-001

**Acceptance Criteria**:
- [ ] Voice commands like:
  - "Create a task to..."
  - "Show me tasks due today"
  - "What projects are active?"
- [ ] Commands parsed and executed
- [ ] Command confirmation
- [ ] Command history

**Technical Notes**:
- Command parsing
- Intent detection
- Command execution
- Command UI

---

### US-019-003: Audio Note Attachments
**As a** user  
**I want** to attach audio notes to items  
**So that** I can add voice context

**Priority**: P2  
**Story Points**: 5  
**Dependencies**: None

**Acceptance Criteria**:
- [ ] Record audio note
- [ ] Attach audio to item (people, projects, ideas, admin)
- [ ] Play audio notes
- [ ] Audio stored securely
- [ ] Audio transcription available (optional)

**Technical Notes**:
- Audio recording
- Audio storage
- Audio playback
- File upload handling

---

### US-019-004: Transcription Service Integration
**As a** user  
**I want** audio notes transcribed automatically  
**So that** I can search audio content

**Priority**: P2  
**Story Points**: 5  
**Dependencies**: US-019-003

**Acceptance Criteria**:
- [ ] Audio transcribed using service (OpenAI Whisper, etc.)
- [ ] Transcription stored with audio
- [ ] Transcription searchable
- [ ] Transcription editable
- [ ] Transcription confidence shown

**Technical Notes**:
- Transcription API integration
- Background transcription job
- Transcription storage
- Search integration

---

### US-019-005: Multi-Modal Capture UI
**As a** user  
**I want** a unified interface for text, voice, and audio capture  
**So that** I can choose the best input method

**Priority**: P2  
**Story Points**: 1  
**Dependencies**: US-019-001, US-019-003

**Acceptance Criteria**:
- [ ] Unified capture interface
- [ ] Toggle between text/voice/audio
- [ ] Combined capture (text + audio)
- [ ] Capture method indicator
- [ ] Smooth transitions

**Technical Notes**:
- Unified UI component
- Mode switching
- Combined capture handling

---

## Technical Architecture

### Components
- `lib/services/voice-capture.ts` - Voice input service
- `lib/services/audio-transcription.ts` - Transcription service
- `components/VoiceInput.tsx` - Voice input component
- `components/AudioRecorder.tsx` - Audio recording component

### Database Changes
```prisma
model AudioNote {
  id              Int      @id @default(autoincrement())
  tenantId        String
  itemType        String
  itemId          Int
  filename        String
  filepath        String
  duration        Int?     // seconds
  transcription   String?  @db.Text
  transcriptionConfidence Float?
  transcribedAt   DateTime?
  createdAt       DateTime @default(now())
  tenant          Tenant   @relation(fields: [tenantId], references: [id])
  
  @@index([tenantId, itemType, itemId])
}
```

### External Dependencies
- Web Speech API (browser)
- Transcription service (OpenAI Whisper, Google Speech-to-Text, etc.)
- Audio storage (S3, etc.)

## Success Metrics

- Voice capture usage > 20% of users
- Audio notes per user > 2 per week
- Transcription accuracy > 90%
- User satisfaction with voice > 75%
