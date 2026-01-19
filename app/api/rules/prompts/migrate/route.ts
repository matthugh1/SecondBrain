import { NextResponse } from 'next/server'
import { requireTenant } from '@/lib/auth/utils'
import { getActiveRulePrompt, createRulePrompt } from '@/lib/db/repositories/rules'

export async function POST() {
  const tenantCheck = await requireTenant()
  if (tenantCheck instanceof NextResponse) {
    return tenantCheck
  }

  const { tenantId } = tenantCheck

  try {
    const migrated: string[] = []

    // Check if daily-digest prompt exists
    const existingDaily = await getActiveRulePrompt(tenantId, 'daily-digest')
    if (!existingDaily) {
      const defaultDailyDigestPrompt = `You are a personal productivity assistant generating a daily digest. Analyze the following data and generate a concise summary.

{context}

TOTAL CAPTURES TODAY: {inboxLogsCount}

INSTRUCTIONS:

Create a daily digest with EXACTLY this format. Keep it under 150 words total.

📋 **Daily Digest**

**Quick Stats:**
- Items captured: {inboxLogsCount}
- Breakdown: {categoryBreakdown}

**Top 3 Actions for Today:**
1. [Most important action from active projects or new captures]
2. [Second priority]
3. [Third priority]

**Items Needing Review:**
{itemsNeedingReview}

RULES:
- Be concise and actionable
- Focus on what matters most today
- If no captures, focus on active projects
- Keep language direct and clear`

      await createRulePrompt(tenantId, {
        name: 'daily-digest',
        template: defaultDailyDigestPrompt,
        active: 1,
      })
      migrated.push('daily-digest')
    }

    // Check if weekly-review prompt exists
    const existingWeekly = await getActiveRulePrompt(tenantId, 'weekly-review')
    if (!existingWeekly) {
      const defaultWeeklyReviewPrompt = `You are a personal productivity assistant conducting a weekly review. Analyze the following data and generate an insightful summary.

{context}

TOTAL CAPTURES THIS WEEK: {inboxLogsCount}

INSTRUCTIONS:

Create a weekly review with EXACTLY this format. Keep it under 250 words total.

💡 **Week in Review**

**Quick Stats:**
- Items captured: {inboxLogsCount}
- Breakdown: {categoryBreakdown}

**What Moved Forward:**
- [Project or area that made progress]
- [Another win or completion]

**Open Loops (needs attention):**
1. [Something blocked, stalled, or waiting too long]
2. [Another concern]

**Patterns I Notice:**
[One observation about themes, recurring topics, or where energy is going]

**Suggested Focus for Next Week:**
1. [Specific action for highest priority item]
2. [Second priority]
3. [Third priority]

**Items Needing Review:**
{itemsNeedingReview}

RULES:
- Be analytical, not motivational
- Call out projects that haven't had action in over a week
- Note if capture volume was unusually high or low
- Suggest concrete next actions, not vague intentions
- If something looks stuck, say so directly
- Keep language concise and actionable`

      await createRulePrompt(tenantId, {
        name: 'weekly-review',
        template: defaultWeeklyReviewPrompt,
        active: 1,
      })
      migrated.push('weekly-review')
    }

    return NextResponse.json({
      success: true,
      migrated,
      message: migrated.length > 0
        ? `Migrated ${migrated.length} prompt(s): ${migrated.join(', ')}`
        : 'All prompts already exist in database',
    })
  } catch (error) {
    console.error('Error migrating prompts:', error)
    return NextResponse.json(
      {
        error: 'Failed to migrate prompts',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
