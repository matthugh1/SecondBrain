import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import type { ClassificationResult, Category } from '@/types'
import { createClassificationAudit } from '@/lib/db/repositories/classification-audit'
import { getActiveRulePrompt, getEnabledRuleCategories, getRuleSettings } from '@/lib/db/repositories/rules'
import { getRecentCorrections } from '@/lib/db/repositories/classification-learning'
import { createTokenUsage } from '@/lib/db/repositories/token-usage'
import { getCurrentMeetingContext } from './calendar-context'
import { retryAICall } from '@/lib/utils/retry'
import { timeoutAICall } from '@/lib/utils/timeout'

const aiProvider = process.env.AI_PROVIDER || 'openai'

function recordClassificationAudit(tenantId: string, payload: Parameters<typeof createClassificationAudit>[1]): void {
  try {
    createClassificationAudit(tenantId, payload)
  } catch (error) {
    console.error('Failed to record classification audit:', error)
  }
}

async function getLearningExamples(tenantId: string, settings: any): Promise<string> {
  // Check if learning is enabled
  if (settings?.learning_enabled === 0) {
    return ''
  }

  try {
    const maxExamples = settings?.max_learning_examples || 5
    const daysBack = settings?.example_timeframe_days || 30
    
    const corrections = await getRecentCorrections(tenantId, maxExamples, daysBack)
    
    if (corrections.length === 0) {
      return ''
    }

    const examples = corrections.map(correction => {
      return `- INPUT: "${correction.message_text}" → CORRECT CATEGORY: "${correction.corrected_category}" (was incorrectly classified as "${correction.original_category}")`
    }).join('\n')

    return `\n\nLEARNING FROM PAST CORRECTIONS:
The user has corrected these classifications:
${examples}

Please learn from these examples when classifying similar messages.\n`
  } catch (error) {
    console.error('Failed to retrieve learning examples:', error)
    return ''
  }
}

async function getClassificationPrompt(tenantId: string, messageText: string): Promise<string> {
  // Get active prompt from database
  let prompt = null
  let settings = null
  
  try {
    prompt = await getActiveRulePrompt(tenantId, 'classification')
    settings = await getRuleSettings(tenantId)
    console.log('🔍 Prompt lookup result:', { 
      found: !!prompt, 
      promptId: prompt?.id, 
      promptName: prompt?.name, 
      promptActive: prompt?.active,
      templateLength: prompt?.template?.length 
    })
  } catch (error) {
    console.warn('❌ Error loading rules from database, using defaults:', error)
  }
  
  // Get learning examples
  const learningExamples = await getLearningExamples(tenantId, settings)

  // Get calendar context (current meeting)
  let calendarContext: string | null = null
  try {
    calendarContext = await getCurrentMeetingContext(tenantId)
  } catch (error) {
    console.warn('Failed to get calendar context:', error)
  }

  // Get current date for relative date calculations
  const now = new Date()
  const currentDate = now.toISOString().split('T')[0] // YYYY-MM-DD
  const currentDateReadable = now.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })

  if (!prompt) {
    console.log('📝 Using CLASSIFICATION PROMPT from CODE (fallback)')
    // Fallback to default if no prompt found
    const calendarContextStr = calendarContext ? `\n\nCALENDAR CONTEXT:\n${calendarContext}\n` : ''
    return `You are a classification system for a personal knowledge management system. Your job is to analyze the user's captured thought and return structured JSON.${learningExamples}

CURRENT DATE CONTEXT:
Today is ${currentDateReadable} (${currentDate}).
Use this date to calculate relative dates like "tomorrow", "next Friday", "in 3 days", etc.${calendarContextStr}
INPUT:
${messageText}

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
- If uncertain, set confidence < ${settings?.confidence_threshold || 0.7}
- Extract dates in ISO format (YYYY-MM-DD) if mentioned
- IMPORTANT: For relative dates like "tomorrow", "next Friday", "in 3 days", calculate the actual date based on today's date (${currentDate})
- If a person's name is mentioned, use that as the name field
- For projects, default status to "${settings?.default_project_status || 'Active'}" unless clearly stated otherwise
- For admin tasks, extract due dates if mentioned (e.g., "by Friday" = calculate date based on current date)`
  }
  
  console.log('📝 Using CLASSIFICATION PROMPT from DATABASE')
  console.log('📋 Prompt template (first 500 chars):', prompt.template.substring(0, 500))
  
  // Replace placeholders in template
  const confidenceThreshold = settings?.confidence_threshold || 0.7
  const defaultProjectStatus = settings?.default_project_status || 'Active'
  
  let finalPrompt = prompt.template
    .replace(/{messageText}/g, messageText)
    .replace(/{confidenceThreshold}/g, confidenceThreshold.toString())
    .replace(/{defaultProjectStatus}/g, defaultProjectStatus)
    .replace(/{currentDate}/g, currentDate)
    .replace(/{currentDateReadable}/g, currentDateReadable)
  
  // Always add current date context if not already present
  const dateContext = `CURRENT DATE CONTEXT:\nToday is ${currentDateReadable} (${currentDate}).\nUse this date to calculate relative dates like "tomorrow", "next Friday", "in 3 days", etc.\n\n`
  
  if (!finalPrompt.includes('CURRENT DATE CONTEXT') && !finalPrompt.includes('Today is')) {
    // Insert date context before INPUT section or at the beginning
    if (finalPrompt.includes('INPUT:')) {
      finalPrompt = finalPrompt.replace('INPUT:', dateContext + 'INPUT:')
    } else {
      finalPrompt = dateContext + finalPrompt
    }
  }

  // Add calendar context if available
  if (calendarContext) {
    const calendarContextStr = `\n\nCALENDAR CONTEXT:\n${calendarContext}\n`
    // Insert before INPUT section if it exists
    if (finalPrompt.includes('INPUT:')) {
      finalPrompt = finalPrompt.replace('INPUT:', calendarContextStr + 'INPUT:')
    } else {
      // Otherwise append before the message text
      finalPrompt = finalPrompt + calendarContextStr
    }
  }
  
  // Insert learning examples before the INPUT section or at the beginning if no INPUT section
  if (learningExamples) {
    // Try to insert before INPUT: section
    if (finalPrompt.includes('INPUT:')) {
      finalPrompt = finalPrompt.replace('INPUT:', learningExamples + '\n\nINPUT:')
    } else {
      // If no INPUT section, prepend to the prompt
      finalPrompt = learningExamples + '\n\n' + finalPrompt
    }
  }
  
  console.log('📤 Final prompt being sent to LLM (first 500 chars):', finalPrompt.substring(0, 500))
  
  return finalPrompt
}

async function classifyWithOpenAI(tenantId: string, messageText: string): Promise<ClassificationResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured')
  }

  const openai = new OpenAI({ apiKey })

  const model = 'gpt-4o-mini'
  const prompt = await getClassificationPrompt(tenantId, messageText)
  console.log('🤖 Classifying message:', { messageText, promptLength: prompt.length })
  let responseText: string | undefined
  let result: ClassificationResult | undefined

  try {
    // Apply retry and timeout to AI API call
    const response = await retryAICall(() =>
      timeoutAICall(
        openai.chat.completions.create({
          model,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
        })
      )
    )

    responseText = response.choices[0]?.message?.content || undefined
    if (!responseText) {
      throw new Error('No response from OpenAI')
    }

    // Parse JSON response (may be wrapped in markdown code blocks)
    let jsonStr = responseText.trim()
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```json\n?/, '').replace(/```$/, '').trim()
    }

    result = JSON.parse(jsonStr) as ClassificationResult
    
    console.log('📊 Classification result (OpenAI):', { category: result.category, confidence: result.confidence, reasoning: result.reasoning })

    // Validate result against enabled categories from database
    try {
      const enabledCategories = await getEnabledRuleCategories(tenantId)
      const validCategoryKeys = enabledCategories.map(c => c.category_key)

      if (!result.category || !validCategoryKeys.includes(result.category)) {
        throw new Error(`Invalid category: ${result.category}. Must be one of: ${validCategoryKeys.join(', ')}`)
      }
    } catch (error) {
      // Fallback to hardcoded categories if database query fails
      const validCategoryKeys = ['people', 'projects', 'ideas', 'admin']
      if (!result.category || !validCategoryKeys.includes(result.category)) {
        throw new Error(`Invalid category: ${result.category}. Must be one of: ${validCategoryKeys.join(', ')}`)
      }
    }

    if (typeof result.confidence !== 'number' || result.confidence < 0 || result.confidence > 1) {
      result.confidence = 0.5 // Default if invalid
    }

    recordClassificationAudit(tenantId, {
      message_text: messageText,
      provider: 'openai',
      model,
      prompt,
      response_text: responseText,
      parsed_result: result,
      status: 'success',
    })

    // Record token usage (non-blocking)
    if (response.usage) {
      console.log('📊 OpenAI token usage:', response.usage)
      createTokenUsage(tenantId, {
        tenantId, // Include tenantId in the record
        provider: 'openai',
        model,
        operationType: 'classification',
        promptTokens: response.usage.prompt_tokens || 0,
        completionTokens: response.usage.completion_tokens || 0,
        totalTokens: response.usage.total_tokens || 0,
      }).catch((err) => {
        console.error('Failed to record token usage:', err)
      })
    } else {
      console.warn('⚠️ OpenAI response missing usage data')
    }

    return result
  } catch (error) {
    recordClassificationAudit(tenantId, {
      message_text: messageText,
      provider: 'openai',
      model,
      prompt,
      response_text: responseText,
      parsed_result: result,
      status: 'error',
      error_message: error instanceof Error ? error.message : 'Unknown error occurred',
    })
    throw error
  }
}

async function classifyWithAnthropic(tenantId: string, messageText: string): Promise<ClassificationResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured')
  }

  const anthropic = new Anthropic({ apiKey })

  const model = 'claude-3-5-haiku-20241022'
  const prompt = await getClassificationPrompt(tenantId, messageText)
  let responseText: string | undefined
  let result: ClassificationResult | undefined

  try {
    // Apply retry and timeout to AI API call
    const response = await retryAICall(() =>
      timeoutAICall(
        anthropic.messages.create({
          model,
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        })
      )
    )

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Anthropic')
    }

    responseText = content.text.trim()
    // Parse JSON response (may be wrapped in markdown code blocks)
    let jsonStr = responseText
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```json\n?/, '').replace(/```$/, '').trim()
    }

    result = JSON.parse(jsonStr) as ClassificationResult

    // Validate result against enabled categories from database
    try {
      const enabledCategories = await getEnabledRuleCategories(tenantId)
      const validCategoryKeys = enabledCategories.map(c => c.category_key)

      if (!result.category || !validCategoryKeys.includes(result.category)) {
        throw new Error(`Invalid category: ${result.category}. Must be one of: ${validCategoryKeys.join(', ')}`)
      }
    } catch (error) {
      // Fallback to hardcoded categories if database query fails
      const validCategoryKeys = ['people', 'projects', 'ideas', 'admin']
      if (!result.category || !validCategoryKeys.includes(result.category)) {
        throw new Error(`Invalid category: ${result.category}. Must be one of: ${validCategoryKeys.join(', ')}`)
      }
    }

    if (typeof result.confidence !== 'number' || result.confidence < 0 || result.confidence > 1) {
      result.confidence = 0.5 // Default if invalid
    }

    recordClassificationAudit(tenantId, {
      message_text: messageText,
      provider: 'anthropic',
      model,
      prompt,
      response_text: responseText,
      parsed_result: result,
      status: 'success',
    })

    // Record token usage (non-blocking)
    if (response.usage) {
      console.log('📊 Anthropic token usage:', response.usage)
      createTokenUsage(tenantId, {
        tenantId, // Include tenantId in the record
        provider: 'anthropic',
        model,
        operationType: 'classification',
        promptTokens: response.usage.input_tokens || 0,
        completionTokens: response.usage.output_tokens || 0,
        totalTokens: (response.usage.input_tokens || 0) + (response.usage.output_tokens || 0),
      }).catch((err) => {
        console.error('Failed to record token usage:', err)
      })
    } else {
      console.warn('⚠️ Anthropic response missing usage data')
    }

    return result
  } catch (error) {
    recordClassificationAudit(tenantId, {
      message_text: messageText,
      provider: 'anthropic',
      model,
      prompt,
      response_text: responseText,
      parsed_result: result,
      status: 'error',
      error_message: error instanceof Error ? error.message : 'Unknown error occurred',
    })
    throw error
  }
}

export async function classifyMessage(tenantId: string, messageText: string): Promise<ClassificationResult> {
  if (aiProvider === 'anthropic') {
    return classifyWithAnthropic(tenantId, messageText)
  } else {
    return classifyWithOpenAI(tenantId, messageText)
  }
}
