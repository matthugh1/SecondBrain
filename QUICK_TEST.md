# Quick Test Reference Card

## 🚀 Quick Start Tests (5 minutes)

### 1. Basic Capture (2 min)
```
Test Input → Expected Result
─────────────────────────────────────────────
"Sarah is looking for a new job" 
  → Filed to: people, Name: Sarah

"Project: Finish Q1 report by Friday"
  → Filed to: projects, Status: Active

"Idea: Add dark mode to the app"
  → Filed to: ideas

"Renew car registration next month"
  → Filed to: admin, Status: Todo
```

### 2. Fix Command (1 min)
```
After capturing "Sarah is looking for a new job":
Type: "fix: this should be projects"
  → Moves from People to Projects database
  → Inbox log shows "Fixed" status
```

### 3. Fix Button (1 min)
```
Go to Inbox Log → Click "Fix" on any item
  → Dropdown appears
  → Select new category
  → Item moves, list refreshes
```

### 4. Navigation (1 min)
```
Dashboard → Click each stat card
  → People, Projects, Ideas, Admin pages load
  → Click "View" on an item
  → Detail page shows all fields
```

---

## ✅ Success Criteria

After quick tests, verify:
- [ ] 4 items captured (one per category)
- [ ] All appear in correct databases
- [ ] Fix command works in chat
- [ ] Fix button works in inbox log
- [ ] Dashboard stats are accurate
- [ ] No console errors
- [ ] No crashes

---

## 🐛 Common Issues

**Issue:** "No previous capture found to fix"
- **Fix:** Make sure you capture something before using fix command

**Issue:** Items not appearing
- **Fix:** Check browser console, verify API calls succeed

**Issue:** Fix button not showing
- **Fix:** Item must have been captured (not manually created)

**Issue:** Low confidence classifications
- **Fix:** Normal behavior - items marked "Needs Review" can be fixed manually
