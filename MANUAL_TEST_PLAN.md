# Manual Test Plan - Second Brain

## Overview
This test plan covers all new features implemented in Phase 5 (Advanced Agentic Features) and Phase 6 (Mobile & Capture Enhancements).

**Test Environment**: 
- Web Application: http://localhost:3000
- Browser Extension: Chrome/Firefox
- Mobile App: React Native (iOS/Android)

**Prerequisites**:
- User account created and logged in
- At least 5-10 items in each category (people, projects, ideas, admin)
- Some items with due dates, stale items, and relationships

---

## Phase 5: Advanced Agentic Features

### EPIC-014: Autonomous Agent Mode

#### Test Case 1.1: Agent Monitoring System
**Objective**: Verify agent monitors system state and identifies opportunities

**Steps**:
1. Navigate to `/agent` page
2. Click "Run Agent Cycle" button
3. Observe agent activity log

**Expected Results**:
- Agent cycle runs successfully
- Activity log shows monitoring results
- Identifies stale items (projects not updated in 30+ days)
- Identifies overdue tasks
- Identifies unlinked relationships
- Identifies pattern anomalies (ideas mentioned multiple times)

**Pass Criteria**: All monitoring types appear in activity log

---

#### Test Case 1.2: Proactive Action Suggestions
**Objective**: Verify agent generates actionable suggestions

**Steps**:
1. Navigate to `/agent` page
2. Run agent cycle
3. Review pending suggestions section
4. Check suggestion details (description, reasoning, confidence)

**Expected Results**:
- Suggestions appear in "Pending Suggestions" section
- Each suggestion includes:
  - Description of what was detected
  - Reasoning for the suggestion
  - Confidence score (0-100%)
  - Link to related item
- Suggestions are categorized by type (stale_item, overdue_task, etc.)

**Pass Criteria**: Suggestions appear with all required information

---

#### Test Case 1.3: Approve/Reject Suggestions
**Objective**: Verify user can approve or reject agent suggestions

**Steps**:
1. Navigate to `/agent` page
2. Find a pending suggestion
3. Click "Approve" button
4. Verify action was executed
5. Find another suggestion and click "Reject"

**Expected Results**:
- Approving a suggestion executes the action
- Suggestion status changes to "executed"
- Rejecting a suggestion changes status to "rejected"
- Activity log updates reflect the changes

**Pass Criteria**: Approve/reject actions work correctly

---

#### Test Case 1.4: Agent Settings Configuration
**Objective**: Verify agent behavior can be configured

**Steps**:
1. Navigate to `/agent` page
2. Review current agent settings
3. Update settings via API: `POST /api/agent/settings`
   - Set proactivity level to "high"
   - Set approval threshold to 0.7
   - Add auto-approve types: ["update"]
4. Run agent cycle again
5. Verify settings are respected

**Expected Results**:
- Settings are displayed on agent page
- Settings can be updated via API
- Higher proactivity shows more suggestions
- Lower threshold shows more suggestions
- Auto-approve types execute without manual approval

**Pass Criteria**: Settings affect agent behavior as expected

---

#### Test Case 1.5: Agent Activity Log Filtering
**Objective**: Verify activity log can be filtered

**Steps**:
1. Navigate to `/agent` page
2. Click filter buttons: "All", "Monitor", "Suggest", "Executed"
3. Verify filtered results

**Expected Results**:
- Each filter shows only relevant activities
- Filter buttons highlight when active
- Activity count updates per filter

**Pass Criteria**: All filters work correctly

---

### EPIC-015: Conversation Memory

#### Test Case 2.1: Conversation Storage
**Objective**: Verify conversations are stored when chatting

**Steps**:
1. Navigate to chat interface
2. Send 3-4 messages about a project
3. Send 3-4 messages about a person
4. Check API: `GET /api/conversations`

**Expected Results**:
- Conversations are created automatically
- Each conversation has a unique ID
- Messages are stored with role (user/assistant)
- Conversation metadata includes entities mentioned

**Pass Criteria**: Conversations are stored correctly

---

#### Test Case 2.2: Context Retrieval
**Objective**: Verify past conversations are retrieved for context

**Steps**:
1. Have a conversation about "Project Alpha"
2. Start a new conversation
3. Type: "What did we discuss about Project Alpha?"
4. Check if previous context is included

**Expected Results**:
- System retrieves relevant past conversations
- Context is included in current conversation
- Context relevance is scored appropriately

**Pass Criteria**: Relevant context is retrieved

---

#### Test Case 2.3: "Remember When I Said" Functionality
**Objective**: Verify explicit conversation references work

**Steps**:
1. Have a conversation mentioning "Sarah needs follow-up"
2. In a new conversation, type: "Remember when I said Sarah needs follow-up?"
3. Verify system finds and references the conversation

**Expected Results**:
- System finds the relevant conversation
- System confirms what it remembers
- Context is used in current conversation

**Pass Criteria**: Explicit references work correctly

---

#### Test Case 2.4: Entity-Based Context Linking
**Objective**: Verify conversations are linked to entities

**Steps**:
1. Have conversations mentioning a specific person
2. Navigate to that person's detail page
3. Check if conversation history is visible
4. Search conversations by entity: `GET /api/conversations/search?entityType=people&entityId=1`

**Expected Results**:
- Conversations are linked to mentioned entities
- Entity pages show conversation history
- Search by entity returns relevant conversations

**Pass Criteria**: Entity linking works correctly

---

#### Test Case 2.5: Conversation Search
**Objective**: Verify conversations can be searched

**Steps**:
1. Create multiple conversations with different topics
2. Search: `GET /api/conversations/search?q=project`
3. Verify search results

**Expected Results**:
- Search returns relevant conversations
- Results include conversation summaries
- Search works across message content

**Pass Criteria**: Search functionality works

---

### EPIC-016: Predictive Suggestions

#### Test Case 3.1: Capture Prediction
**Objective**: Verify system predicts likely captures

**Steps**:
1. Capture items at different times of day
2. Check predictions: `GET /api/predictions/capture`
3. Verify predictions match patterns

**Expected Results**:
- Predictions are generated based on:
  - Time of day patterns
  - Day of week patterns
  - Recent captures
  - Active projects
- Each prediction includes category and confidence

**Pass Criteria**: Predictions are relevant and accurate

---

#### Test Case 3.2: Next Action Suggestions
**Objective**: Verify action suggestions are generated

**Steps**:
1. Create some overdue tasks
2. Create stale projects
3. Check suggestions: `GET /api/suggestions/actions`
4. Verify suggestions are prioritized

**Expected Results**:
- Suggestions include:
  - Overdue tasks
  - Stale projects
  - Follow-ups needed
- Suggestions are prioritized by urgency
- Suggestions are actionable (one-click to create task)

**Pass Criteria**: Action suggestions are relevant and prioritized

---

#### Test Case 3.3: Form Pre-filling
**Objective**: Verify forms are pre-filled based on history

**Steps**:
1. Capture several items in "projects" category
2. Start a new capture
3. Check form field predictions: `GET /api/predictions/form-fields?fieldType=category`
4. Verify pre-filled values match patterns

**Expected Results**:
- Category is pre-filled based on most common
- Tags are pre-filled based on frequency
- Related items are suggested based on recent

**Pass Criteria**: Pre-filling improves capture speed

---

#### Test Case 3.4: Smart Autocomplete
**Objective**: Verify autocomplete works for common values

**Steps**:
1. Type in capture field: "John"
2. Check autocomplete: `GET /api/autocomplete?q=John&types=person,project,tag`
3. Verify suggestions appear
4. Select a suggestion

**Expected Results**:
- Autocomplete suggests:
  - People names
  - Project names
  - Tags
- Suggestions are ranked by relevance/frequency
- Keyboard navigation works

**Pass Criteria**: Autocomplete speeds up input

---

#### Test Case 3.5: Pattern-Based Recommendations
**Objective**: Verify pattern recommendations are shown

**Steps**:
1. Create patterns (e.g., always follow up with Sarah after project updates)
2. Check if recommendations appear in dashboard
3. Verify recommendations are actionable

**Expected Results**:
- Recommendations identify user patterns
- Recommendations are shown in dashboard
- Recommendations can be acted upon

**Pass Criteria**: Pattern recommendations are useful

---

## Phase 6: Mobile & Capture Enhancements

### EPIC-019: Voice & Multi-Modal Capture

#### Test Case 4.1: Browser Speech-to-Text
**Objective**: Verify voice input works in browser

**Steps**:
1. Navigate to chat interface
2. Click "Start Voice Input" button
3. Speak: "Create a task to review the quarterly report"
4. Verify transcription appears in real-time
5. Click "Stop Recording"
6. Verify transcribed text is in input field

**Expected Results**:
- Voice input button appears
- Recording starts when clicked
- Real-time transcription is shown
- Transcription is accurate
- Text is inserted into input field

**Pass Criteria**: Voice input works in supported browsers (Chrome, Edge)

---

#### Test Case 4.2: Voice Commands
**Objective**: Verify voice commands are parsed and executed

**Steps**:
1. Start voice input
2. Say: "Create a task to call Sarah tomorrow"
3. Verify command is parsed correctly
4. Verify task is created automatically

**Test Commands**:
- "Create a task to [description]"
- "Show me tasks due today"
- "What projects are active?"

**Expected Results**:
- Commands are parsed correctly
- Actions are executed automatically
- Command confirmation is shown

**Pass Criteria**: Voice commands work correctly

---

#### Test Case 4.3: Audio Note Recording
**Objective**: Verify audio notes can be recorded and attached

**Steps**:
1. Navigate to a project detail page
2. Use AudioRecorder component
3. Click "Record Audio Note"
4. Record a 10-second audio note
5. Click "Stop Recording"
6. Verify audio is uploaded

**Expected Results**:
- Recording starts when clicked
- Duration is shown during recording
- Audio is uploaded to server
- Audio note appears in item's audio notes list

**Pass Criteria**: Audio recording and upload works

---

#### Test Case 4.4: Audio Transcription
**Objective**: Verify audio notes are transcribed automatically

**Steps**:
1. Record an audio note
2. Upload with auto-transcribe enabled
3. Wait for transcription to complete
4. Verify transcription appears
5. Check transcription accuracy

**Expected Results**:
- Transcription is generated automatically
- Transcription text is stored
- Confidence score is shown
- Transcription is searchable

**Pass Criteria**: Transcription works with reasonable accuracy (>80%)

---

#### Test Case 4.5: Audio Note Playback
**Objective**: Verify audio notes can be played back

**Steps**:
1. Navigate to item with audio notes
2. Check API: `GET /api/audio/item/[itemType]/[itemId]`
3. Verify audio notes list
4. Play an audio note

**Expected Results**:
- Audio notes are listed
- Audio playback works
- Transcription is shown alongside audio
- Audio can be deleted

**Pass Criteria**: Audio playback works correctly

---

### EPIC-018: Browser Extension

#### Test Case 5.1: Extension Installation
**Objective**: Verify extension can be installed

**Steps**:
1. Open Chrome: `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `extension` directory
5. Verify extension appears in toolbar

**Expected Results**:
- Extension installs successfully
- Extension icon appears in toolbar
- No installation errors

**Pass Criteria**: Extension installs without errors

---

#### Test Case 5.2: Extension Authentication
**Objective**: Verify extension can authenticate

**Steps**:
1. Right-click extension icon → Options
2. Enter API base URL: `http://localhost:3000`
3. Enter auth token (from account settings)
4. Save settings
5. Verify authentication works

**Expected Results**:
- Settings page opens
- Settings are saved
- Authentication is validated

**Pass Criteria**: Extension authenticates successfully

---

#### Test Case 5.3: Quick Capture Popup
**Objective**: Verify quick capture popup works

**Steps**:
1. Click extension icon in toolbar
2. Popup opens
3. Type: "Meeting notes from today's standup"
4. Verify page context is shown (URL, title)
5. Click "Capture" button
6. Verify capture success message

**Expected Results**:
- Popup opens when icon is clicked
- Page context (URL, title) is displayed
- Capture form works
- Success message appears
- Popup closes after capture

**Pass Criteria**: Quick capture works end-to-end

---

#### Test Case 5.4: Highlight Text Capture
**Objective**: Verify selected text can be captured

**Steps**:
1. Navigate to any webpage
2. Select some text on the page
3. Right-click selected text
4. Click "Capture to Second Brain"
5. Verify capture notification appears

**Expected Results**:
- Context menu option appears
- Selected text is captured
- Page URL and title are included
- Notification confirms capture

**Pass Criteria**: Text selection capture works

---

#### Test Case 5.5: Context-Aware Capture
**Objective**: Verify captures include webpage context

**Steps**:
1. Capture text from a webpage
2. Check captured item in Second Brain
3. Verify context includes:
   - Page URL
   - Page title
   - Selected text
   - Timestamp

**Expected Results**:
- All context information is included
- Context is formatted clearly
- Links back to source page work

**Pass Criteria**: Context is captured correctly

---

### EPIC-017: Mobile App

#### Test Case 6.1: Mobile App Installation
**Objective**: Verify mobile app can be built and installed

**Steps**:
1. Navigate to `mobile` directory
2. Run: `npm install`
3. For iOS: `npm run ios`
4. For Android: `npm run android`
5. Verify app launches

**Expected Results**:
- Dependencies install successfully
- App builds without errors
- App launches on device/emulator

**Pass Criteria**: App installs and launches

---

#### Test Case 6.2: Mobile Authentication
**Objective**: Verify mobile app can authenticate

**Steps**:
1. Launch mobile app
2. Enter API base URL
3. Enter auth token
4. Verify authentication succeeds

**Expected Results**:
- Login screen appears
- Authentication works
- User is logged in

**Pass Criteria**: Authentication works

---

#### Test Case 6.3: Quick Capture on Mobile
**Objective**: Verify quick capture works on mobile

**Steps**:
1. Open mobile app
2. Navigate to Capture tab
3. Type a capture message
4. Click "Capture" button
5. Verify capture succeeds

**Expected Results**:
- Capture screen is accessible
- Input field works
- Capture button works
- Success message appears
- Capture is saved

**Pass Criteria**: Mobile capture works

---

#### Test Case 6.4: Offline Support
**Objective**: Verify offline capture and sync works

**Steps**:
1. Enable airplane mode (or disconnect network)
2. Capture an item
3. Verify "Offline" badge appears
4. Verify capture is saved locally
5. Reconnect network
6. Verify capture syncs automatically

**Expected Results**:
- Offline indicator appears
- Captures are stored locally
- Sync happens automatically when online
- No data loss

**Pass Criteria**: Offline support works correctly

---

#### Test Case 6.5: Mobile Views
**Objective**: Verify mobile-optimized views work

**Steps**:
1. Navigate to Dashboard tab
2. Verify stats are displayed
3. Navigate to Items tab
4. Verify list view works
5. Tap an item
6. Verify detail view works

**Expected Results**:
- Dashboard shows stats
- List views are touch-optimized
- Detail views show all information
- Navigation works smoothly

**Pass Criteria**: Mobile views are functional and optimized

---

## Integration Tests

### Test Case 7.1: Cross-Platform Capture
**Objective**: Verify captures from different platforms sync

**Steps**:
1. Capture from web app
2. Capture from browser extension
3. Capture from mobile app
4. Verify all captures appear in all platforms

**Expected Results**:
- All captures sync across platforms
- No duplicates
- Data consistency maintained

**Pass Criteria**: Cross-platform sync works

---

### Test Case 7.2: Voice Capture Integration
**Objective**: Verify voice capture works across features

**Steps**:
1. Use voice input in chat
2. Use voice commands
3. Record audio note
4. Verify all voice features work together

**Expected Results**:
- Voice input integrates with chat
- Voice commands execute actions
- Audio notes attach to items
- No conflicts between features

**Pass Criteria**: Voice features integrate correctly

---

## Regression Tests

### Test Case 8.1: Existing Features Still Work
**Objective**: Verify existing features weren't broken

**Steps**:
1. Test basic capture (text)
2. Test classification
3. Test relationships
4. Test search
5. Test filters

**Expected Results**:
- All existing features work as before
- No regressions introduced

**Pass Criteria**: No regressions found

---

## Performance Tests

### Test Case 9.1: Agent Cycle Performance
**Objective**: Verify agent cycle completes in reasonable time

**Steps**:
1. Run agent cycle
2. Measure time to complete
3. Verify with 100+ items

**Expected Results**:
- Agent cycle completes in < 30 seconds
- No timeouts
- Memory usage is reasonable

**Pass Criteria**: Performance is acceptable

---

### Test Case 9.2: Conversation Memory Performance
**Objective**: Verify conversation retrieval is fast

**Steps**:
1. Create 50+ conversations
2. Search conversations
3. Measure response time

**Expected Results**:
- Search completes in < 2 seconds
- No performance degradation

**Pass Criteria**: Performance is acceptable

---

## Security Tests

### Test Case 10.1: Authentication Required
**Objective**: Verify all new endpoints require authentication

**Steps**:
1. Try accessing endpoints without auth:
   - `/api/agent/*`
   - `/api/conversations/*`
   - `/api/predictions/*`
   - `/api/audio/*`
2. Verify 401/403 errors

**Expected Results**:
- All endpoints require authentication
- Unauthorized access is blocked

**Pass Criteria**: Security is maintained

---

## Test Execution Checklist

- [ ] Phase 5: EPIC-014 (Autonomous Agent Mode) - All test cases
- [ ] Phase 5: EPIC-015 (Conversation Memory) - All test cases
- [ ] Phase 5: EPIC-016 (Predictive Suggestions) - All test cases
- [ ] Phase 6: EPIC-019 (Voice & Multi-Modal Capture) - All test cases
- [ ] Phase 6: EPIC-018 (Browser Extension) - All test cases
- [ ] Phase 6: EPIC-017 (Mobile App) - All test cases
- [ ] Integration Tests - All test cases
- [ ] Regression Tests - All test cases
- [ ] Performance Tests - All test cases
- [ ] Security Tests - All test cases

---

## Known Issues & Limitations

1. **Voice Input**: Only works in Chrome/Edge (Web Speech API)
2. **Mobile App**: Requires React Native development environment setup
3. **Browser Extension**: Requires manual installation (not in stores yet)
4. **Audio Transcription**: Requires OpenAI API key and may take time
5. **Offline Sync**: May have conflicts if multiple devices capture offline simultaneously

---

## Test Environment Setup

### Web Application
```bash
npm install
npm run dev
# Access at http://localhost:3000
```

### Browser Extension
1. Load unpacked extension from `extension/` directory
2. Configure API URL and auth token in options

### Mobile App
```bash
cd mobile
npm install
npm run ios  # or npm run android
```

---

## Reporting Issues

When reporting issues, include:
1. Test case number
2. Steps to reproduce
3. Expected vs actual results
4. Browser/device information
5. Console errors (if any)
6. Screenshots/videos (if applicable)

---

**Last Updated**: [Current Date]
**Test Plan Version**: 1.0
**Coverage**: Phase 5 & Phase 6 Features
