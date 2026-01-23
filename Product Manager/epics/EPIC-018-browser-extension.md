# Epic 018: Browser Extension

**Phase**: 6 - Mobile & Capture Enhancements  
**Priority**: P1  
**Timeline**: Week 22-23  
**Story Points**: 34

## Description

Build browser extensions (Chrome/Firefox) to capture thoughts from any webpage with context awareness.

## Goals

- Capture from any webpage
- Highlight text → capture
- Quick capture popup
- Context-aware capture

## User Stories

### US-018-001: Browser Extension Foundation
**As a** developer  
**I want** a browser extension structure  
**So that** we can build capture features

**Priority**: P1  
**Story Points**: 5  
**Dependencies**: None

**Acceptance Criteria**:
- [ ] Chrome extension setup
- [ ] Firefox extension setup (or shared codebase)
- [ ] Manifest configuration
- [ ] API integration
- [ ] Authentication flow
- [ ] Extension store preparation

**Technical Notes**:
- Extension manifest
- Content scripts
- Background scripts
- API client

---

### US-018-002: Quick Capture Popup
**As a** user  
**I want** a quick capture popup from the extension  
**So that** I can capture without leaving the page

**Priority**: P1  
**Story Points**: 8  
**Dependencies**: US-018-001

**Acceptance Criteria**:
- [ ] Extension icon in toolbar
- [ ] Click icon opens capture popup
- [ ] Popup shows capture form
- [ ] Capture button sends to Second Brain
- [ ] Capture confirmation
- [ ] Popup closes after capture

**Technical Notes**:
- Popup UI
- Capture form
- API integration
- UX optimization

---

### US-018-003: Highlight Text Capture
**As a** user  
**I want** to capture highlighted text from a webpage  
**So that** I can save interesting content

**Priority**: P1  
**Story Points**: 8  
**Dependencies**: US-018-001

**Acceptance Criteria**:
- [ ] Right-click on selected text shows "Capture to Second Brain"
- [ ] Context menu option
- [ ] Selected text pre-filled in capture
- [ ] Page URL included as context
- [ ] Page title included
- [ ] Capture with one click

**Technical Notes**:
- Content script for text selection
- Context menu API
- Text extraction
- Context capture

---

### US-018-004: Context-Aware Capture
**As a** user  
**I want** captures to include webpage context  
**So that** I remember where I found information

**Priority**: P1  
**Story Points**: 5  
**Dependencies**: US-018-002

**Acceptance Criteria**:
- [ ] Capture includes:
  - Page URL
  - Page title
  - Selected text (if any)
  - Timestamp
- [ ] Context shown in capture
- [ ] Context linkable back to page
- [ ] User can edit context

**Technical Notes**:
- Context extraction
- Context display
- Link generation

---

### US-018-005: Extension Settings
**As a** user  
**I want** to configure extension settings  
**So that** it works how I prefer

**Priority**: P2  
**Story Points**: 3  
**Dependencies**: US-018-001

**Acceptance Criteria**:
- [ ] Settings page for extension
- [ ] Configure:
  - Default category
  - Auto-capture options
  - Notification preferences
- [ ] Settings saved locally
- [ ] Settings sync across devices (future)

**Technical Notes**:
- Settings storage
- Settings UI
- Configuration management

---

### US-018-006: Extension Store Deployment
**As a** user  
**I want** to install the extension from stores  
**So that** I can use it easily

**Priority**: P1  
**Story Points**: 5  
**Dependencies**: US-018-001 through US-018-004

**Acceptance Criteria**:
- [ ] Chrome Web Store submission
- [ ] Firefox Add-ons submission
- [ ] Store assets (screenshots, descriptions)
- [ ] Privacy policy
- [ ] Extension approved and published

**Technical Notes**:
- Store submission process
- Compliance requirements
- Marketing assets

---

## Technical Architecture

### Components
- `extension/` - Extension codebase
- `extension/manifest.json` - Extension manifest
- `extension/popup/` - Popup UI
- `extension/content/` - Content scripts
- `extension/background/` - Background scripts

### Technology Stack
- Vanilla JavaScript or React
- Chrome Extension API
- Firefox WebExtensions API
- API client for Second Brain

### External Dependencies
- Chrome Web Store account
- Firefox Add-ons account
- Store review process

## Success Metrics

- Extension installs > 500 in first month
- Daily active extension users > 20% of total users
- Captures from extension > 3 per user per week
- Extension store rating > 4.0
