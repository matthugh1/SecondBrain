---
name: testing-guide
description: Provides a structured approach to manual testing based on existing project scripts.
---

# Testing Guide Skill

This skill assists in verifying the application's functionality through structured manual testing. It leverages the existing `TESTING.md` and `QUICK_TEST.md` files.

## Testing Layers

### 1. Quick Test (Smoke Test)
Used for rapid verification of core features (approx. 5 minutes).
Refer to [QUICK_TEST.md](file:///Users/matthewhughes/Documents/App_Folder/SecondBrain/QUICK_TEST.md) for the fast-track checklist.

### 2. Full Manual Test Suite
Used for comprehensive regression testing of all features.
Refer to [TESTING.md](file:///Users/matthewhughes/Documents/App_Folder/SecondBrain/TESTING.md) for detailed scenarios.

## Execution Steps

### Step 1: Prepare Environment
1. Ensure `.env.local` has a valid AI API key.
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000) (or the relevant port).

### Step 2: Core Feature Verification
Verify the main "Capture" and "Fix" workflows:
- **Capture**: Input text in chat (e.g., "Sarah is looking for a new job").
- **Verify**: Check if it's filed to the correct category (People, Projects, Ideas, Admin).
- **Fix**: Test the `fix:` command in chat or the "Fix" button in the Inbox Log.

### Step 3: UI & Statistics Verification
- Navigate through all database pages (People, Projects, Ideas, Admin).
- Check that dashboard statistics reflect the latest changes.

## Verification Checklist
- [ ] Application starts without errors.
- [ ] Basic capture workflows succeed.
- [ ] Fix commands/buttons update database state correctly.
- [ ] Dashboard stats are accurate.
- [ ] No console errors in the browser.

> [!IMPORTANT]
> If any test fails, check the server logs and browser console for detailed error messages before proceeding with a commit.
