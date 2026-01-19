# Manual Testing Script

## Prerequisites
1. Start the development server: `npm run dev`
2. Open http://localhost:3000
3. Ensure your `.env.local` has a valid AI API key configured

---

## Test Suite 1: Basic Capture Scenarios

### Test 1.1: Capture a Person
**Action:**
- In the chat interface, type: `Sarah mentioned she's looking for a new job`

**Expected Outcome:**
- ✅ Message appears in chat
- ✅ Bot responds with: "Filed to people: Sarah (XX% confidence)"
- ✅ Link to view the person record appears
- ✅ In People database: New entry with name "Sarah", context about job search
- ✅ Inbox Log: Entry shows "Filed" status, filed_to = "people"

---

### Test 1.2: Capture a Project
**Action:**
- Type: `Project: Need to finish the Q1 report by Friday`

**Expected Outcome:**
- ✅ Filed to projects: "Q1 report" or similar
- ✅ Status = "Active"
- ✅ Projects database shows new entry
- ✅ Inbox Log entry created

---

### Test 1.3: Capture an Idea
**Action:**
- Type: `Idea: What if we added a dark mode to the app`

**Expected Outcome:**
- ✅ Filed to ideas: "dark mode to the app" or similar
- ✅ Ideas database shows new entry
- ✅ One-liner field populated

---

### Test 1.4: Capture Admin Task
**Action:**
- Type: `Remember to renew car registration by next month`

**Expected Outcome:**
- ✅ Filed to admin: "renew car registration" or similar
- ✅ Status = "Todo"
- ✅ Due date extracted if mentioned
- ✅ Admin database shows new entry

---

## Test Suite 2: Fix Command in Chat

### Test 2.1: Fix via Chat Command
**Prerequisites:** Complete Test 1.1 first

**Action:**
- Type: `fix: this should be projects`

**Expected Outcome:**
- ✅ Bot responds: "Fixed! Re-filed to projects: [name]"
- ✅ Original person record deleted
- ✅ New project record created
- ✅ Inbox Log: Status changed to "Fixed", filed_to updated
- ✅ Old record removed from People database
- ✅ New record appears in Projects database

---

### Test 2.2: Fix with Different Category
**Prerequisites:** Capture something first

**Action:**
- Capture: `Meeting with John tomorrow`
- Then type: `fix: this should be admin`

**Expected Outcome:**
- ✅ Successfully reclassified to admin
- ✅ Record moved to Admin database
- ✅ Inbox log updated

---

### Test 2.3: Invalid Fix Command
**Action:**
- Type: `fix: this should be invalidcategory`

**Expected Outcome:**
- ❌ Error message: "Could not determine category. Use: fix: this should be [people|projects|ideas|admin]"
- ✅ No changes made to database

---

### Test 2.4: Fix Without Previous Capture
**Action:**
- Clear chat or start fresh
- Type: `fix: this should be people`

**Expected Outcome:**
- ❌ Error: "No previous capture found to fix. Please capture something first."
- ✅ No errors in console

---

## Test Suite 3: Fix Button in Inbox Log

### Test 3.1: Fix from Inbox Log
**Prerequisites:** Have at least one captured item

**Action:**
1. Navigate to Inbox Log page
2. Find an item with "Fix" button
3. Click "Fix" button
4. Select a different category from dropdown

**Expected Outcome:**
- ✅ Dropdown appears with category options
- ✅ Current category is disabled/grayed out
- ✅ Selecting new category triggers fix
- ✅ Item moves to new database
- ✅ Inbox log refreshes automatically
- ✅ Status changes to "Fixed"

---

### Test 3.2: Fix Multiple Items
**Action:**
1. Capture 3 different items
2. Go to Inbox Log
3. Fix each one to different categories

**Expected Outcome:**
- ✅ All fixes work independently
- ✅ Each item moves to correct database
- ✅ Inbox log shows all as "Fixed"
- ✅ No conflicts or errors

---

## Test Suite 4: Fix Button on Item Pages

### Test 4.1: Fix from Item Detail Page
**Prerequisites:** Have a captured item

**Action:**
1. Go to any database (People, Projects, Ideas, Admin)
2. Click "View" on an item
3. If "Fix" button is visible, click it
4. Select new category

**Expected Outcome:**
- ✅ Fix button appears if item was captured (has logId)
- ✅ Dropdown works correctly
- ✅ Item moves to new database
- ✅ Page refreshes or redirects appropriately

---

## Test Suite 5: Dashboard and Navigation

### Test 5.1: View All Databases
**Action:**
- Click through each database link: People, Projects, Ideas, Admin

**Expected Outcome:**
- ✅ All pages load without errors
- ✅ Tables display correctly
- ✅ Empty states show appropriate messages
- ✅ "View" links work for items

---

### Test 5.2: Statistics Update
**Action:**
1. Capture several items
2. Return to dashboard
3. Check statistics cards

**Expected Outcome:**
- ✅ Stats update to reflect new captures
- ✅ Numbers match actual database counts
- ✅ All stat cards clickable and navigate correctly

---

## Test Suite 6: Edge Cases

### Test 6.1: Low Confidence Classification
**Action:**
- Type: `asdfghjkl random text`

**Expected Outcome:**
- ⚠️ Status = "Needs Review"
- ⚠️ Confidence < 70%
- ✅ Inbox Log shows "Needs Review" status
- ✅ No record created in databases
- ✅ Message indicates low confidence

---

### Test 6.2: Empty Message
**Action:**
- Try to send empty message or just spaces

**Expected Outcome:**
- ❌ Send button disabled
- ✅ No API call made
- ✅ No errors

---

### Test 6.3: Very Long Message
**Action:**
- Type a very long message (500+ characters)

**Expected Outcome:**
- ✅ Message processes successfully
- ✅ Classification works
- ✅ All text stored correctly
- ✅ No truncation issues

---

### Test 6.4: Special Characters
**Action:**
- Type: `Meeting with John O'Brien @ 3pm - bring notes!`

**Expected Outcome:**
- ✅ Processes correctly
- ✅ Special characters preserved
- ✅ Classification works
- ✅ Text displays correctly in UI

---

## Test Suite 7: Inbox Log Filtering

### Test 7.1: Filter by Status
**Action:**
1. Capture several items (some will be Filed, some Needs Review)
2. Go to Inbox Log
3. Click each filter: All, Filed, Needs Review, Fixed

**Expected Outcome:**
- ✅ Filters work correctly
- ✅ Only matching items shown
- ✅ Counts update appropriately
- ✅ No errors

---

## Test Suite 8: Database Operations

### Test 8.1: View Item Details
**Action:**
1. Capture an item
2. Go to its database
3. Click "View" on the item

**Expected Outcome:**
- ✅ Detail page loads
- ✅ All fields displayed correctly
- ✅ Formatting is readable
- ✅ Back link works

---

### Test 8.2: Multiple Captures Same Category
**Action:**
- Capture 3 people-related items in a row

**Expected Outcome:**
- ✅ All create separate records
- ✅ No duplicates unless exact same text
- ✅ All appear in People database
- ✅ All logged in Inbox Log

---

## Test Suite 9: Chat Interface

### Test 9.1: Message History
**Action:**
1. Send 5-10 messages
2. Scroll through chat

**Expected Outcome:**
- ✅ All messages visible
- ✅ Scroll works smoothly
- ✅ Auto-scrolls to bottom on new message
- ✅ Timestamps display correctly

---

### Test 9.2: Loading States
**Action:**
- Send a message and watch the loading indicator

**Expected Outcome:**
- ✅ Loading dots appear immediately
- ✅ Disappear when response received
- ✅ Input disabled during loading
- ✅ No double submissions

---

## Test Suite 10: Error Handling

### Test 10.1: API Error Simulation
**Action:**
- Temporarily break API endpoint or remove API key
- Try to capture a message

**Expected Outcome:**
- ✅ Error message displayed in chat
- ✅ No crash or blank screen
- ✅ User-friendly error message
- ✅ App remains functional

---

## Quick Test Checklist

Use this for rapid testing:

- [ ] Capture person → appears in People
- [ ] Capture project → appears in Projects  
- [ ] Capture idea → appears in Ideas
- [ ] Capture admin → appears in Admin
- [ ] Fix via chat command → moves to new category
- [ ] Fix via inbox log button → works correctly
- [ ] Fix via item page → works correctly
- [ ] Dashboard stats update → numbers correct
- [ ] Inbox log filters → work correctly
- [ ] Low confidence items → marked for review
- [ ] Empty message → prevented
- [ ] Long messages → handled correctly
- [ ] Special characters → preserved
- [ ] Navigation → all links work
- [ ] Error handling → graceful failures

---

## Expected Database State After Full Test

After running all tests, you should have:
- Multiple entries in each database (People, Projects, Ideas, Admin)
- Inbox Log with mix of Filed, Needs Review, and Fixed statuses
- Some items that were fixed and moved between categories
- Dashboard showing accurate counts

---

---

## Test Suite 6: Search & Discovery Features

### Test 6.1: Global Search
**Action:**
- On the dashboard, use the global search bar
- Type a search term that appears in multiple databases (e.g., a person's name or project name)

**Expected Outcome:**
- ✅ Search results appear grouped by database type
- ✅ Results show title, content preview, and tags
- ✅ Clicking a result navigates to the item detail page
- ✅ Search is case-insensitive and matches partial words

---

### Test 6.2: Smart Filters
**Action:**
- Navigate to any database page (e.g., `/people`, `/projects`)
- Click "Show Filters"
- Apply filters: status, date range, tags, archived

**Expected Outcome:**
- ✅ Filter panel appears with options
- ✅ Table updates to show only filtered results
- ✅ Multiple filters can be combined
- ✅ "Clear all filters" button resets filters
- ✅ Active filter indicator shows when filters are applied

---

### Test 6.3: Tag System
**Action:**
- Navigate to an item detail page
- Click "+ Add Tag" and add a new tag
- Add another tag using an existing tag name
- Remove a tag by clicking the × button

**Expected Outcome:**
- ✅ Tags appear as chips on the item
- ✅ New tags are created automatically
- ✅ Existing tags can be reused
- ✅ Tags persist after page refresh
- ✅ Tags appear in filter options

---

### Test 6.4: Related Items
**Action:**
- Add the same tag to multiple items across different databases
- View one of those items

**Expected Outcome:**
- ✅ "Related Items" section appears on detail page
- ✅ Shows items with shared tags
- ✅ Displays shared tag count
- ✅ Links navigate to related items
- ✅ Items sorted by number of shared tags

---

### Test 6.5: Timeline View
**Action:**
- Navigate to `/timeline`
- Apply filters (types, date range)
- Click on an item in the timeline

**Expected Outcome:**
- ✅ Timeline shows all items chronologically
- ✅ Items grouped by date
- ✅ Filters work correctly
- ✅ Items show type, title, content preview, and tags
- ✅ Clicking navigates to item detail page

---

### Test 6.6: Saved Searches
**Action:**
- Perform a search with filters
- Click "Save Current" in Saved Searches panel
- Enter a name and save
- Click the saved search to run it again
- Delete a saved search

**Expected Outcome:**
- ✅ Saved search appears in the list
- ✅ Running saved search applies the same filters
- ✅ Saved searches persist after page refresh
- ✅ Delete removes the saved search

---

### Test 6.7: Search Index Sync
**Action:**
- Create a new item via chat
- Update an existing item's name or content
- Delete an item

**Expected Outcome:**
- ✅ New items appear in search results immediately
- ✅ Updated items reflect changes in search
- ✅ Deleted items no longer appear in search
- ✅ Tags sync correctly with search index

---

## Notes

- If a test fails, check browser console for errors
- Check server logs for API errors
- Verify database is being created in `./data/secondbrain.db`
- Ensure AI API key is valid and has credits
- Search uses SQLite FTS5 - ensure better-sqlite3 supports FTS5
- Tags are normalized - old comma-separated tags are migrated automatically on first run
