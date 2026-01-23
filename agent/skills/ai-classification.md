---
name: ai-classification
description: Skill for testing and debugging the AI classification logic.
---

# AI Classification Skill

This skill provides strategies for ensuring the AI accurately categorizes inbox entries into People, Projects, Ideas, or Admin.

## Classification Categories

- **People**: Names, meeting notes with individuals, contact info.
- **Projects**: Tasks with scope, goals, or multi-step activities.
- **Ideas**: Insights, future "spark" thoughts, research topics.
- **Admin**: Tasks, reminders, errands, logistics.

## Debugging Workflows

### 1. Test Case Simulation
If the AI is consistently misfiling an item, try simulating it in the chat:
- Input: `Testing: [Your ambiguous text]`
- Observe the confidence score and category assigned.

### 2. Prompt Tuning
The classification logic is likely driven by a system prompt in `lib/` or `app/api/`.
- Locate the prompt template.
- Add specific examples for the failing category to the "one-shot" or "few-shot" examples in the prompt.

### 3. Log Inspection
Check the `Inbox Log` table using `npm run db:studio` to see the exact `confidence` and `json` output from the AI for failed captures.

> [!TIP]
> Use the `fix:` command in chat to re-categorize items. This not only fixes the data but also provides a signal that the prompt might need adjustment for that specific type of input.
