import { OpenAI } from 'openai'
import * as actionsRepo from '@/lib/db/repositories/actions'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface PlanStep {
  stepOrder: number
  actionType: string
  actionParams: Record<string, any>
  dependencies?: number[]
  description: string
}

export interface Plan {
  name: string
  description?: string
  request: string
  steps: PlanStep[]
}

/**
 * Generate a plan from a user request using AI
 */
export async function generatePlan(request: string): Promise<Plan> {
  const prompt = `You are a task planning assistant. Break down the following user request into a sequence of actionable steps.

User Request: "${request}"

For each step, provide:
- stepOrder: sequential number (1, 2, 3...)
- actionType: one of: create, update, delete, link, notify, schedule
- actionParams: parameters needed for the action (as JSON object)
- dependencies: array of stepOrder numbers this step depends on (empty if none)
- description: human-readable description of what this step does

Return a JSON object with:
{
  "name": "Plan name",
  "description": "Brief description",
  "steps": [
    {
      "stepOrder": 1,
      "actionType": "create",
      "actionParams": {...},
      "dependencies": [],
      "description": "..."
    },
    ...
  ]
}

Available action types:
- create: Create new item (requires targetType: "people"|"projects"|"ideas"|"admin", and item data)
- update: Update existing item (requires targetType, targetId, and update data)
- delete: Delete item (requires targetType, targetId)
- link: Create relationship (requires sourceType, sourceId, targetType, targetId)
- notify: Send notification (requires title, message)
- schedule: Schedule reminder (requires reminderType, title, message, dueDate)

Be specific with actionParams. For example:
- Creating a person: {"targetType": "people", "name": "John Doe", "context": "..."}
- Creating a project: {"targetType": "projects", "name": "Project Name", "status": "Active"}
- Linking items: {"sourceType": "projects", "sourceId": 1, "targetType": "people", "targetId": 2}

Return ONLY valid JSON, no markdown formatting.`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful task planning assistant. Always return valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from AI')
    }

    const plan = JSON.parse(content) as Plan
    return plan
  } catch (error: any) {
    console.error('Error generating plan:', error)
    // Fallback to simple plan
    return {
      name: 'Simple Plan',
      description: 'Fallback plan',
      request,
      steps: [
        {
          stepOrder: 1,
          actionType: 'notify',
          actionParams: {
            title: 'Plan Generated',
            message: `Plan for: ${request}`,
          },
          dependencies: [],
          description: `Notify about plan: ${request}`,
        },
      ],
    }
  }
}
