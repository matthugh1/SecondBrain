import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { getInboxLogsByDateRange } from '@/lib/db/repositories/inbox-log'
import { getActiveProjects } from '@/lib/db/repositories/projects'
import * as digestsRepo from '@/lib/db/repositories/digests'
import { createTokenUsage } from '@/lib/db/repositories/token-usage'
import { getActiveRulePrompt } from '@/lib/db/repositories/rules'

const aiProvider = process.env.AI_PROVIDER || 'openai'

async function generateDigestWithAI(tenantId: string, prompt: string, operationType: 'daily' | 'weekly' | 'custom'): Promise<string> {
  if (aiProvider === 'anthropic') {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured')
    }

    const anthropic = new Anthropic({ apiKey })
    const model = 'claude-3-5-haiku-20241022'
    const response = await anthropic.messages.create({
      model,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Anthropic')
    }

    // Record token usage (non-blocking)
    if (response.usage) {
      console.log('📊 Anthropic digest token usage:', response.usage)
      createTokenUsage(tenantId, {
        tenantId, // Include tenantId in the record
        provider: 'anthropic',
        model,
        operationType: 'digest',
        promptTokens: response.usage.input_tokens || 0,
        completionTokens: response.usage.output_tokens || 0,
        totalTokens: (response.usage.input_tokens || 0) + (response.usage.output_tokens || 0),
      }).catch((err) => {
        console.error('Failed to record token usage:', err)
      })
    } else {
      console.warn('⚠️ Anthropic digest response missing usage data')
    }

    return content.text
  } else {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not configured')
    }

    const openai = new OpenAI({ apiKey })
    const model = 'gpt-4o-mini'
    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
    })

    // Record token usage (non-blocking)
    if (response.usage) {
      console.log('📊 OpenAI digest token usage:', response.usage)
      createTokenUsage(tenantId, {
        tenantId, // Include tenantId in the record
        provider: 'openai',
        model,
        operationType: 'digest',
        promptTokens: response.usage.prompt_tokens || 0,
        completionTokens: response.usage.completion_tokens || 0,
        totalTokens: response.usage.total_tokens || 0,
      }).catch((err) => {
        console.error('Failed to record token usage:', err)
      })
    } else {
      console.warn('⚠️ OpenAI digest response missing usage data')
    }

    return response.choices[0]?.message?.content || 'No response generated'
  }
}

function formatInboxLogsForContext(logs: any[]): string {
  let context = '=== ITEMS CAPTURED ===\n\n'
  
  logs.forEach((item, i) => {
    const originalText = item.original_text || 'No text'
    const filedTo = item.filed_to || 'Unknown'
    const destName = item.destination_name || originalText.substring(0, 50)
    const status = item.status || ''
    
    context += `${i + 1}. [${filedTo}] ${destName}\n`
    if (status === 'Needs Review') {
      context += '  ⚠️ NEEDS REVIEW\n'
    }
    context += '\n'
  })

  return context
}

function formatProjectsForContext(projects: any[]): string {
  let context = '\n=== ACTIVE PROJECTS STATUS ===\n\n'
  
  projects.forEach((p, i) => {
    const name = p.name || 'Untitled'
    const status = p.status || 'Unknown'
    const nextAction = p.next_action || 'None specified'
    
    context += `${i + 1}. ${name}\n`
    context += `   Status: ${status}\n`
    context += `   Next: ${nextAction}\n\n`
  })

  return context
}

function formatCategoryBreakdown(categoryCounts: Record<string, number>): string {
  return Object.entries(categoryCounts).map(([k, v]) => `${v} ${k}`).join(', ')
}

function formatItemsNeedingReview(inboxLogs: any[]): string {
  const needsReview = inboxLogs.filter((l) => l.status === 'Needs Review')
  if (needsReview.length === 0) {
    return 'None - all items filed successfully!'
  }
  return needsReview.map((l) => `- ${l.original_text.substring(0, 50)}`).join('\n')
}

async function getDigestPrompt(
  tenantId: string,
  promptName: 'daily-digest' | 'weekly-review',
  templateVars: {
    context: string
    inboxLogsCount: number
    categoryBreakdown: string
    itemsNeedingReview: string
    timeframe: string
  }
): Promise<string> {
  // Try to get prompt from database
  let prompt = null
  try {
    prompt = await getActiveRulePrompt(tenantId, promptName)
  } catch (error) {
    console.warn(`Error loading ${promptName} prompt from database, using fallback:`, error)
  }

  // If no database prompt, use hardcoded fallback
  if (!prompt) {
    console.log(`📝 Using ${promptName.toUpperCase()} PROMPT from CODE (fallback)`)
    
    if (promptName === 'daily-digest') {
      return `You are a personal productivity assistant generating a daily digest. Analyze the following data and generate a concise summary.

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
    } else {
      return `You are a personal productivity assistant conducting a weekly review. Analyze the following data and generate an insightful summary.

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
    }
  }

  console.log(`📝 Using ${promptName.toUpperCase()} PROMPT from DATABASE`)
  
  // Replace template variables in database prompt
  let finalPrompt = prompt.template
    .replace(/{context}/g, templateVars.context)
    .replace(/{inboxLogsCount}/g, templateVars.inboxLogsCount.toString())
    .replace(/{categoryBreakdown}/g, templateVars.categoryBreakdown)
    .replace(/{itemsNeedingReview}/g, templateVars.itemsNeedingReview)
    .replace(/{timeframe}/g, templateVars.timeframe)

  return finalPrompt
}

export async function generateDailyDigest(tenantId: string): Promise<void> {
  try {
    // Get items from last 24 hours
    const now = new Date()
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const startDate = yesterday.toISOString()
    const endDate = now.toISOString()

    const inboxLogs = await getInboxLogsByDateRange(tenantId, startDate, endDate)
    const activeProjects = await getActiveProjects(tenantId)

    if (inboxLogs.length === 0 && activeProjects.length === 0) {
      // No items to digest
      return
    }

    // Count by category
    const categoryCounts: Record<string, number> = {}
    inboxLogs.forEach((item) => {
      const cat = item.filed_to || 'Unknown'
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
    })

    let context = formatInboxLogsForContext(inboxLogs)
    context += formatProjectsForContext(activeProjects)
    context += '\n=== CAPTURE SUMMARY ===\n'
    for (const [cat, count] of Object.entries(categoryCounts)) {
      context += `${cat}: ${count}\n`
    }

    const prompt = await getDigestPrompt(tenantId, 'daily-digest', {
      context,
      inboxLogsCount: inboxLogs.length,
      categoryBreakdown: formatCategoryBreakdown(categoryCounts),
      itemsNeedingReview: formatItemsNeedingReview(inboxLogs),
      timeframe: 'today',
    })

    const digest = await generateDigestWithAI(tenantId, prompt, 'daily')

    // Store digest in database
    await digestsRepo.createDigest(tenantId, {
      type: 'daily',
      content: digest,
    })
  } catch (error) {
    console.error('Error generating daily digest:', error)
    throw error
  }
}

export async function generateWeeklyReview(tenantId: string): Promise<void> {
  try {
    // Get items from last 7 days
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const startDate = weekAgo.toISOString()
    const endDate = now.toISOString()

    const inboxLogs = await getInboxLogsByDateRange(tenantId, startDate, endDate)
    const activeProjects = await getActiveProjects(tenantId)

    // Count by category
    const categoryCounts: Record<string, number> = {}
    inboxLogs.forEach((item) => {
      const cat = item.filed_to || 'Unknown'
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1
    })

    let context = formatInboxLogsForContext(inboxLogs)
    context += formatProjectsForContext(activeProjects)
    context += '\n=== CAPTURE SUMMARY ===\n'
    for (const [cat, count] of Object.entries(categoryCounts)) {
      context += `${cat}: ${count}\n`
    }

    const prompt = await getDigestPrompt(tenantId, 'weekly-review', {
      context,
      inboxLogsCount: inboxLogs.length,
      categoryBreakdown: formatCategoryBreakdown(categoryCounts),
      itemsNeedingReview: formatItemsNeedingReview(inboxLogs),
      timeframe: 'this week',
    })

    const review = await generateDigestWithAI(tenantId, prompt, 'weekly')

    // Store digest in database
    await digestsRepo.createDigest(tenantId, {
      type: 'weekly',
      content: review,
    })
  } catch (error) {
    console.error('Error generating weekly review:', error)
    throw error
  }
}

export async function generateCustomDigestContent(tenantId: string, userPrompt: string): Promise<string> {
  // Get all recent items for context (last 30 days)
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const startDate = thirtyDaysAgo.toISOString()
  const endDate = now.toISOString()

  const inboxLogs = await getInboxLogsByDateRange(tenantId, startDate, endDate)
  const activeProjects = await getActiveProjects(tenantId)

  // Build context from all available data
  let context = formatInboxLogsForContext(inboxLogs)
  context += formatProjectsForContext(activeProjects)

  // Create a comprehensive prompt that includes the user's custom prompt
  const fullPrompt = `You are a personal knowledge management assistant. The user has requested a custom digest with the following prompt:

"${userPrompt}"

Here is the context of all items captured in the system:

${context}

Please generate a digest that addresses the user's prompt. Be thorough, insightful, and organized. Focus on what the user specifically asked for while providing relevant context from the data above.`

  const digestContent = await generateDigestWithAI(tenantId, fullPrompt, 'custom')
  return digestContent
}
