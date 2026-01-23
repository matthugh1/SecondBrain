import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword } from '@/lib/auth/password'
import { validateRequest } from '@/lib/middleware/validate-request'
import { authRateLimit } from '@/lib/middleware/rate-limit'
import { registerSchema } from '@/lib/validation/schemas'

export async function POST(request: NextRequest) {
  // Rate limiting: 5 attempts per minute per IP
  const rateLimitCheck = await authRateLimit(request)
  if (rateLimitCheck) {
    return rateLimitCheck
  }

  try {
    // Check database connection
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL is not set')
      return NextResponse.json(
        { error: 'Database not configured. Please set DATABASE_URL in your environment variables.' },
        { status: 500 }
      )
    }

    // Validate request body
    const validation = await validateRequest(registerSchema, request)
    if (!validation.success) {
      return validation.response
    }

    const { data } = validation
    const { email, password, name } = data

    // Test database connection
    try {
      await prisma.$connect()
    } catch (dbError) {
      console.error('Database connection error:', dbError)
      return NextResponse.json(
        { error: 'Database connection failed. Please check your DATABASE_URL configuration.' },
        { status: 500 }
      )
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user and default tenant
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name: name || email.split('@')[0],
        },
      })

      const tenant = await tx.tenant.create({
        data: {
          name: `${user.name}'s Workspace`,
        },
      })

      await tx.membership.create({
        data: {
          userId: user.id,
          tenantId: tenant.id,
          role: 'owner',
        },
      })

      // Initialize default rule settings
      await tx.ruleSettings.create({
        data: {
          tenantId: tenant.id,
          confidenceThreshold: 0.7,
          defaultProjectStatus: 'Active',
          defaultAdminStatus: 'Todo',
          learningEnabled: 1,
          maxLearningExamples: 5,
          exampleTimeframeDays: 30,
        },
      })
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/03cc86a7-5004-44c5-8434-e4ab8f6d3441', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'register/route.ts:after-ruleSettings-create', message: 'Successfully created ruleSettings', data: { tenantId: tenant.id }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run3', hypothesisId: 'B' }) }).catch(() => { });
      // #endregion

      // Initialize default categories
      const defaultCategories = [
        {
          categoryKey: 'people',
          label: 'People',
          description: 'Information about a person, relationship update, something someone said',
          enabled: 1,
          fieldSchema: JSON.stringify({
            required: ['name'],
            fields: { name: 'string', context: 'string', follow_ups: 'string' },
          }),
          displayOrder: 1,
        },
        {
          categoryKey: 'projects',
          label: 'Projects',
          description: 'A project, task with multiple steps, ongoing work',
          enabled: 1,
          fieldSchema: JSON.stringify({
            required: ['name'],
            fields: { name: 'string', status: 'string', next_action: 'string', notes: 'string' },
          }),
          displayOrder: 2,
        },
        {
          categoryKey: 'ideas',
          label: 'Ideas',
          description: 'A thought, insight, concept, something to explore later',
          enabled: 1,
          fieldSchema: JSON.stringify({
            required: ['name'],
            fields: { name: 'string', one_liner: 'string', notes: 'string' },
          }),
          displayOrder: 3,
        },
        {
          categoryKey: 'admin',
          label: 'Admin',
          description: 'A simple errand, one-off task, something with a due date',
          enabled: 1,
          fieldSchema: JSON.stringify({
            required: ['name'],
            fields: { name: 'string', due_date: 'string', notes: 'string' },
          }),
          displayOrder: 4,
        },
      ]

      for (const category of defaultCategories) {
        await tx.ruleCategory.create({
          data: {
            tenantId: tenant.id,
            ...category,
          },
        })
      }

      // Initialize default prompt
      const defaultPrompt = `You are a classification system for a personal knowledge management system. Your job is to analyze the user's captured thought and return structured JSON.

CURRENT DATE CONTEXT:
Today is {currentDateReadable} ({currentDate}).
Use this date to calculate relative dates like "tomorrow", "next Friday", "in 3 days", etc.

INPUT:
{messageText}

INSTRUCTIONS:
1. Determine which category this belongs to:
- "people" - information about a person, relationship update, something someone said
- "projects" - a project, task with multiple steps, ongoing work
- "ideas" - a thought, insight, concept, something to explore later
- "admin" - a simple errand, one-off task, something with a due date

2. Extract relevant fields based on the category:
- For "people": name (required), context (how you know them), follow_ups (things to remember)
- For "projects": name (required), status (Active/Waiting/Blocked/Someday/Done), next_action, notes
- For "ideas": name (required), one_liner (core insight), notes
- For "admin": name (required), due_date (if mentioned), notes

3. Provide a confidence score between 0 and 1 (1 = very confident, 0 = uncertain)

4. Return ONLY valid JSON in this exact format:
{
  "category": "people|projects|ideas|admin",
  "fields": {
    "name": "...",
    ...other fields based on category
  },
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation of classification"
}

RULES:
- Be concise but accurate
- If uncertain, set confidence < {confidenceThreshold}
- Extract dates in ISO format (YYYY-MM-DD) if mentioned
- IMPORTANT: For relative dates like "tomorrow", "next Friday", "in 3 days", calculate the actual date based on today's date ({currentDate})
- If a person's name is mentioned, use that as the name field
- For projects, default status to "{defaultProjectStatus}" unless clearly stated otherwise
- For admin tasks, extract due dates if mentioned (e.g., "by Friday" = calculate date based on current date)`

      await tx.rulePrompt.create({
        data: {
          tenantId: tenant.id,
          name: 'classification',
          template: defaultPrompt,
          active: 1,
        },
      })

      // Initialize default daily digest prompt
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

      await tx.rulePrompt.create({
        data: {
          tenantId: tenant.id,
          name: 'daily-digest',
          template: defaultDailyDigestPrompt,
          active: 1,
        },
      })

      // Initialize default weekly review prompt
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

      await tx.rulePrompt.create({
        data: {
          tenantId: tenant.id,
          name: 'weekly-review',
          template: defaultWeeklyReviewPrompt,
          active: 1,
        },
      })

      // Initialize default routing rules
      const routingRules = [
        {
          categoryKey: 'people',
          destinationTable: 'people',
          fieldMapping: JSON.stringify({ name: 'name', context: 'context', follow_ups: 'follow_ups' }),
        },
        {
          categoryKey: 'projects',
          destinationTable: 'projects',
          fieldMapping: JSON.stringify({ name: 'name', status: 'status', next_action: 'next_action', notes: 'notes' }),
        },
        {
          categoryKey: 'ideas',
          destinationTable: 'ideas',
          fieldMapping: JSON.stringify({ name: 'name', one_liner: 'one_liner', notes: 'notes' }),
        },
        {
          categoryKey: 'admin',
          destinationTable: 'admin',
          fieldMapping: JSON.stringify({ name: 'name', due_date: 'due_date', notes: 'notes' }),
        },
      ]

      for (const rule of routingRules) {
        await tx.ruleRouting.create({
          data: {
            tenantId: tenant.id,
            ...rule,
          },
        })
      }

      // Create default service account for MCP server
      // This allows the MCP server to work immediately for new tenants
      const { generateServiceAccountToken, hashServiceAccountToken } = await import('@/lib/auth/service-account')
      const serviceAccountToken = generateServiceAccountToken()
      const tokenHash = hashServiceAccountToken(serviceAccountToken)
      
      await tx.serviceAccount.create({
        data: {
          tenantId: tenant.id,
          name: 'MCP Server',
          description: 'Default service account for MCP server authentication (created automatically)',
          tokenHash,
          createdBy: user.id,
        },
      })

      return { user, tenant }
    })

    return NextResponse.json({
      success: true,
      userId: result.user.id,
      tenantId: result.tenant.id,
    })
  } catch (error) {
    // Use centralized error handler
    const { handleError } = await import('@/lib/middleware/error-handler')
    return handleError(error, '/api/auth/register')
  }
}
