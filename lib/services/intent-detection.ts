import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'

const aiProvider = process.env.AI_PROVIDER || 'openai'

export interface TaskQueryIntent {
  isQuery: boolean
  type?: 'today' | 'date' | null
  date?: string
}

async function detectIntentWithOpenAI(messageText: string): Promise<TaskQueryIntent> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured')
  }

  const openai = new OpenAI({ apiKey })
  const now = new Date()
  const currentDate = now.toISOString().split('T')[0]
  const currentDateReadable = now.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
  const tomorrowDate = getTomorrowDate()
  const mondayDate = getNextMondayDate()

  const prompt = `You are an intent detection system for a task management app. Analyze the user's message and determine their intent.

CURRENT DATE CONTEXT:
Today is ${currentDateReadable} (${currentDate}).
Tomorrow is ${tomorrowDate}.

USER MESSAGE: "${messageText}"

INTENT TYPES:
1. QUERY - User is asking to LIST/SHOW existing tasks (e.g., "what tasks are due today", "show me tasks due tomorrow", "list my tasks")
2. CREATE - User is creating/recording a NEW task (e.g., "remember to call John", "I need to finish the report")

CRITICAL DISTINCTION:
- Questions starting with "what", "which", "list", "show", "get", "tell me" about tasks = QUERY
- Statements about things to remember or do = CREATE

Return ONLY valid JSON:
{
  "isQuery": boolean,
  "type": "today" | "date" | null,
  "date": "YYYY-MM-DD" | null
}

RULES:
- If message asks about existing tasks → isQuery: true
- If message creates a new task → isQuery: false  
- If isQuery is true and asks about "today" → type: "today", date: null
- If isQuery is true and asks about a date → type: "date", date: "YYYY-MM-DD"
- If isQuery is false → type: null, date: null

EXAMPLES:
"what tasks are due today" → {"isQuery": true, "type": "today", "date": null}
"what tasks are due tomorrow" → {"isQuery": true, "type": "date", "date": "${tomorrowDate}"}
"tasks due on Monday" → {"isQuery": true, "type": "date", "date": "${mondayDate}"}
"remember to call John tomorrow" → {"isQuery": false, "type": null, "date": null}
"I need to finish the report" → {"isQuery": false, "type": null, "date": null}`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    })

    const responseText = response.choices[0]?.message?.content
    if (!responseText) {
      return { isQuery: false }
    }

    const result = JSON.parse(responseText.trim()) as TaskQueryIntent
    
    // Validate result structure
    if (typeof result.isQuery !== 'boolean') {
      console.warn('Invalid intent result from OpenAI:', result)
      return { isQuery: false }
    }
    
    console.log('🤖 OpenAI intent detection:', result)
    return result
  } catch (error) {
    console.error('Error detecting intent with OpenAI:', error)
    return { isQuery: false }
  }
}

async function detectIntentWithAnthropic(messageText: string): Promise<TaskQueryIntent> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured')
  }

  const anthropic = new Anthropic({ apiKey })
  const now = new Date()
  const currentDate = now.toISOString().split('T')[0]
  const currentDateReadable = now.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
  const tomorrowDate = getTomorrowDate()
  const mondayDate = getNextMondayDate()

  const prompt = `You are an intent detection system for a task management app. Analyze the user's message and determine their intent.

CURRENT DATE CONTEXT:
Today is ${currentDateReadable} (${currentDate}).
Tomorrow is ${tomorrowDate}.

USER MESSAGE: "${messageText}"

INTENT TYPES:
1. QUERY - User is asking to LIST/SHOW existing tasks (e.g., "what tasks are due today", "show me tasks due tomorrow", "list my tasks")
2. CREATE - User is creating/recording a NEW task (e.g., "remember to call John", "I need to finish the report")

CRITICAL DISTINCTION:
- Questions starting with "what", "which", "list", "show", "get", "tell me" about tasks = QUERY
- Statements about things to remember or do = CREATE

Return ONLY valid JSON:
{
  "isQuery": boolean,
  "type": "today" | "date" | null,
  "date": "YYYY-MM-DD" | null
}

RULES:
- If message asks about existing tasks → isQuery: true
- If message creates a new task → isQuery: false  
- If isQuery is true and asks about "today" → type: "today", date: null
- If isQuery is true and asks about a date → type: "date", date: "YYYY-MM-DD"
- If isQuery is false → type: null, date: null

EXAMPLES:
"what tasks are due today" → {"isQuery": true, "type": "today", "date": null}
"what tasks are due tomorrow" → {"isQuery": true, "type": "date", "date": "${tomorrowDate}"}
"tasks due on Monday" → {"isQuery": true, "type": "date", "date": "${mondayDate}"}
"remember to call John tomorrow" → {"isQuery": false, "type": null, "date": null}
"I need to finish the report" → {"isQuery": false, "type": null, "date": null}`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      return { isQuery: false }
    }

    let jsonStr = content.text.trim()
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```json\n?/, '').replace(/```$/, '').trim()
    }

    const result = JSON.parse(jsonStr) as TaskQueryIntent
    
    // Validate result structure
    if (typeof result.isQuery !== 'boolean') {
      console.warn('Invalid intent result from Anthropic:', result)
      return { isQuery: false }
    }
    
    console.log('🤖 Anthropic intent detection:', result)
    return result
  } catch (error) {
    console.error('Error detecting intent with Anthropic:', error)
    return { isQuery: false }
  }
}

function getTomorrowDate(): string {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow.toISOString().split('T')[0]
}

function getNextMondayDate(): string {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7 || 7
  const monday = new Date(today)
  monday.setDate(today.getDate() + daysUntilMonday)
  return monday.toISOString().split('T')[0]
}

export async function detectTaskQueryIntent(messageText: string): Promise<TaskQueryIntent> {
  if (aiProvider === 'anthropic') {
    return detectIntentWithAnthropic(messageText)
  } else {
    return detectIntentWithOpenAI(messageText)
  }
}
