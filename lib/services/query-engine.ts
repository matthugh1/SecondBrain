import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import * as peopleRepo from '@/lib/db/repositories/people'
import * as projectsRepo from '@/lib/db/repositories/projects'
import * as ideasRepo from '@/lib/db/repositories/ideas'
import * as adminRepo from '@/lib/db/repositories/admin'
import { findSimilarItems } from '@/lib/services/semantic-search'
import type { Category } from '@/types'

// Simple in-memory cache for query results (can be replaced with Redis in production)
const queryCache = new Map<string, { results: QueryResult[]; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const MAX_CACHE_SIZE = 100

const aiProvider = process.env.AI_PROVIDER || 'openai'

export interface QueryResult {
  item_type: Category
  item_id: number
  title: string
  content: string
  relevance_score: number
  database: Category
}

export interface QueryResponse {
  results: QueryResult[]
  query: string
  total_results: number
}

/**
 * Parse natural language query to extract search terms and filters
 */
async function parseQuery(query: string): Promise<{
  searchTerms: string[]
  filters: {
    itemTypes?: Category[]
    dateFrom?: string
    dateTo?: string
    status?: string
    tags?: string[]
    fieldFilters?: {
      next_action?: null
      last_touched?: string | null
    }
  }
}> {
  const apiKey = aiProvider === 'anthropic' 
    ? process.env.ANTHROPIC_API_KEY 
    : process.env.OPENAI_API_KEY

  if (!apiKey) {
    // Fallback to simple keyword extraction
    return {
      searchTerms: query.split(/\s+/).filter(term => term.length > 2),
      filters: {},
    }
  }

  const now = new Date()
  const currentDate = now.toISOString().split('T')[0]
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const lastWeekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const lastMonthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const prompt = `Parse this natural language query into structured search parameters:

Query: "${query}"
Current Date: ${currentDate}

Extract:
1. Search terms (keywords to search for in names, content)
2. Item types to search (people, projects, ideas, admin)
3. Date filters (dateFrom, dateTo, relative dates like "30 days ago", "last week", "last month")
4. Status filters (Active, Waiting, Blocked, Someday, Done, Todo, In Progress, Completed)
5. Field filters (next_action empty/null, last_touched, etc.)
6. Tag filters

Date parsing rules:
- "30 days ago" or "in the last 30 days" → dateFrom: ${thirtyDaysAgo}
- "last week" → dateFrom: ${lastWeekStart}
- "last month" → dateFrom: ${lastMonthStart}
- "7 days ago" → dateFrom: ${sevenDaysAgo}
- "haven't touched" or "not touched" → filter by last_touched field

Field filters:
- "no next action" or "missing next action" → nextAction: null
- "active projects" → status: "Active"
- "completed" → status: "Done" or "Completed"

Return JSON:
{
  "searchTerms": ["keyword1", "keyword2"],
  "itemTypes": ["people", "projects"] or null for all,
  "dateFrom": "YYYY-MM-DD" or null,
  "dateTo": "YYYY-MM-DD" or null,
  "status": "Active" | "Waiting" | "Blocked" | "Someday" | "Done" | "Todo" | "In Progress" | "Completed" or null,
  "fieldFilters": {
    "next_action": null or undefined,
    "last_touched": "YYYY-MM-DD" or null
  } or null,
  "tags": ["tag1", "tag2"] or null
}`

  try {
    if (aiProvider === 'anthropic') {
      const anthropic = new Anthropic({ apiKey })
      const { retryAICall } = await import('@/lib/utils/retry')
      const { timeoutAICall } = await import('@/lib/utils/timeout')
      const response = await retryAICall(() =>
        timeoutAICall(
          anthropic.messages.create({
            model: 'claude-3-5-haiku-20241022',
            max_tokens: 512,
            messages: [{ role: 'user', content: prompt }],
          })
        )
      )

      const content = response.content[0]
      if (content.type === 'text') {
        let jsonStr = content.text.trim()
        if (jsonStr.startsWith('```')) {
          jsonStr = jsonStr.replace(/^```json\n?/, '').replace(/```$/, '').trim()
        }
        return JSON.parse(jsonStr)
      }
    } else {
      const openai = new OpenAI({ apiKey })
      const { retryAICall } = await import('@/lib/utils/retry')
      const { timeoutAICall } = await import('@/lib/utils/timeout')
      const response = await retryAICall(() =>
        timeoutAICall(
          openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
            temperature: 0.1,
          })
        )
      )

      const content = response.choices[0]?.message?.content
      if (content) {
        return JSON.parse(content)
      }
    }
  } catch (error) {
    console.error('Error parsing query:', error)
  }

  // Fallback - try to extract basic patterns
  const lowerQuery = query.toLowerCase()
  const filters: any = {}
  
  // Extract date patterns
  if (lowerQuery.includes('30 days') || lowerQuery.includes('last 30 days')) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    filters.dateFrom = thirtyDaysAgo
  }
  if (lowerQuery.includes('last week')) {
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    filters.dateFrom = lastWeek
  }
  
  // Extract field filters
  if (lowerQuery.includes('no next action') || lowerQuery.includes('missing next action')) {
    filters.fieldFilters = { next_action: null }
  }
  if (lowerQuery.includes("haven't touched") || lowerQuery.includes('not touched')) {
    filters.fieldFilters = { ...filters.fieldFilters, last_touched: null }
  }
  
  // Extract status
  if (lowerQuery.includes('active')) {
    filters.status = 'Active'
  } else if (lowerQuery.includes('completed') || lowerQuery.includes('done')) {
    filters.status = 'Done'
  }
  
  // Extract item types
  const itemTypes: Category[] = []
  if (lowerQuery.includes('project')) itemTypes.push('projects')
  if (lowerQuery.includes('people') || lowerQuery.includes('person')) itemTypes.push('people')
  if (lowerQuery.includes('idea')) itemTypes.push('ideas')
  if (lowerQuery.includes('admin') || lowerQuery.includes('task')) itemTypes.push('admin')
  if (itemTypes.length > 0) {
    filters.itemTypes = itemTypes
  }
  
  return {
    searchTerms: query.split(/\s+/).filter(term => term.length > 2),
    filters,
  }
}

/**
 * Search across all databases
 */
async function searchAllDatabases(
  tenantId: string,
  searchTerms: string[],
  filters: {
    itemTypes?: Category[]
    dateFrom?: string
    dateTo?: string
    status?: string
    tags?: string[]
    fieldFilters?: {
      next_action?: null
      last_touched?: string | null
    }
  }
): Promise<QueryResult[]> {
  const results: QueryResult[] = []
  const itemTypes: Category[] = filters.itemTypes || ['people', 'projects', 'ideas', 'admin']

  // Search people
  if (itemTypes.includes('people')) {
    const people = await peopleRepo.getAllPeople(tenantId, true)
    for (const person of people) {
      if (!person.id) continue
      const score = calculateRelevance(person.name, [person.context, person.follow_ups].filter(Boolean).join(' '), searchTerms)
      if (score > 0) {
        results.push({
          item_type: 'people',
          item_id: person.id,
          title: person.name,
          content: [person.context, person.follow_ups].filter(Boolean).join(' '),
          relevance_score: score,
          database: 'people',
        })
      }
    }
  }

  // Search projects
  if (itemTypes.includes('projects')) {
    const projects = await projectsRepo.getAllProjects(tenantId, true)
    for (const project of projects) {
      if (!project.id) continue
      // Apply status filter if specified
      if (filters.status && project.status !== filters.status) {
        continue
      }
      // Apply field filters
      if (filters.fieldFilters?.next_action === null && project.next_action) {
        continue // Skip if we want projects with no next action but this one has one
      }
      if (filters.fieldFilters?.next_action !== undefined && filters.fieldFilters.next_action === null && project.next_action) {
        continue
      }
      const score = calculateRelevance(
        project.name,
        [project.status, project.next_action, project.notes].filter(Boolean).join(' '),
        searchTerms
      )
      if (score > 0 || (filters.fieldFilters?.next_action === null && !project.next_action)) {
        results.push({
          item_type: 'projects',
          item_id: project.id,
          title: project.name,
          content: [project.status, project.next_action, project.notes].filter(Boolean).join(' '),
          relevance_score: score || 0.1, // Give a small score even if no keyword match for field filters
          database: 'projects',
        })
      }
    }
  }

  // Search ideas
  if (itemTypes.includes('ideas')) {
    const ideas = await ideasRepo.getAllIdeas(tenantId, true)
    for (const idea of ideas) {
      if (!idea.id) continue
      // Apply date filter if specified (for last_touched)
      if (filters.dateFrom && idea.last_touched) {
        try {
          const lastTouched = new Date(idea.last_touched)
          const dateFrom = new Date(filters.dateFrom)
          if (lastTouched < dateFrom) {
            continue
          }
        } catch (e) {
          // Skip date filter if parsing fails
        }
      }
      // Apply field filter for last_touched
      if (filters.fieldFilters?.last_touched !== undefined) {
        if (filters.fieldFilters.last_touched === null && idea.last_touched) {
          continue // Want items with no last_touched but this one has it
        }
        if (filters.fieldFilters.last_touched && idea.last_touched) {
          try {
            const lastTouched = new Date(idea.last_touched)
            const filterDate = new Date(filters.fieldFilters.last_touched)
            if (lastTouched < filterDate) {
              continue
            }
          } catch (e) {
            // Skip if parsing fails
          }
        }
      }
      const score = calculateRelevance(
        idea.name,
        [idea.one_liner, idea.notes].filter(Boolean).join(' '),
        searchTerms
      )
      if (score > 0 || (filters.fieldFilters?.last_touched === null && !idea.last_touched)) {
        results.push({
          item_type: 'ideas',
          item_id: idea.id,
          title: idea.name,
          content: [idea.one_liner, idea.notes].filter(Boolean).join(' '),
          relevance_score: score || 0.1, // Give a small score even if no keyword match for field filters
          database: 'ideas',
        })
      }
    }
  }

  // Search admin
  if (itemTypes.includes('admin')) {
    const adminItems = await adminRepo.getAllAdmin(tenantId, true)
    for (const item of adminItems) {
      if (!item.id) continue
      // Apply status filter if specified
      if (filters.status && item.status !== filters.status) {
        continue
      }
      const score = calculateRelevance(
        item.name,
        [item.status, item.notes].filter(Boolean).join(' '),
        searchTerms
      )
      if (score > 0) {
        results.push({
          item_type: 'admin',
          item_id: item.id,
          title: item.name,
          content: [item.status, item.notes].filter(Boolean).join(' '),
          relevance_score: score,
          database: 'admin',
        })
      }
    }
  }

  // Sort by relevance score
  return results.sort((a, b) => b.relevance_score - a.relevance_score)
}

/**
 * Calculate relevance score based on keyword matching
 */
function calculateRelevance(title: string, content: string, searchTerms: string[]): number {
  if (searchTerms.length === 0) return 0

  const text = `${title} ${content}`.toLowerCase()
  let score = 0

  for (const term of searchTerms) {
    const lowerTerm = term.toLowerCase()
    // Title matches are worth more
    if (title.toLowerCase().includes(lowerTerm)) {
      score += 3
    }
    // Content matches
    if (content.toLowerCase().includes(lowerTerm)) {
      score += 1
    }
    // Exact word matches
    const wordRegex = new RegExp(`\\b${lowerTerm}\\b`, 'i')
    if (wordRegex.test(text)) {
      score += 2
    }
  }

  // Normalize score (0-1 range)
  const maxScore = searchTerms.length * 5
  return Math.min(score / maxScore, 1)
}

/**
 * Main query function
 */
export async function executeQuery(tenantId: string, query: string, useSemanticSearch: boolean = true, limit: number = 50): Promise<QueryResponse> {
  // Check cache first
  const cacheKey = `${tenantId}:${query}`
  const cached = queryCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return {
      results: cached.results.slice(0, limit),
      query,
      total_results: cached.results.length,
    }
  }

  const parsed = await parseQuery(query)
  
  // Try semantic search first if enabled
  if (useSemanticSearch && parsed.searchTerms.length > 0) {
    try {
      const semanticResults = await findSimilarItems(
        tenantId,
        query,
        parsed.filters.itemTypes,
        50
      )

      // Convert semantic results to QueryResult format
      const semanticQueryResults: QueryResult[] = []
      
      for (const semanticResult of semanticResults) {
        // Fetch the actual item to get title and content
        let title = ''
        let content = ''
        
        try {
          switch (semanticResult.itemType) {
            case 'people': {
              const item = await peopleRepo.getPersonById(tenantId, semanticResult.itemId)
              if (item) {
                title = item.name
                content = [item.context, item.follow_ups].filter(Boolean).join(' ')
              }
              break
            }
            case 'projects': {
              const item = await projectsRepo.getProjectById(tenantId, semanticResult.itemId)
              if (item) {
                title = item.name
                content = [item.status, item.next_action, item.notes].filter(Boolean).join(' ')
              }
              break
            }
            case 'ideas': {
              const item = await ideasRepo.getIdeaById(tenantId, semanticResult.itemId)
              if (item) {
                title = item.name
                content = [item.one_liner, item.notes].filter(Boolean).join(' ')
              }
              break
            }
            case 'admin': {
              const item = await adminRepo.getAdminById(tenantId, semanticResult.itemId)
              if (item) {
                title = item.name
                content = [item.status, item.notes].filter(Boolean).join(' ')
              }
              break
            }
          }
        } catch (error) {
          console.error(`Error fetching item ${semanticResult.itemType}:${semanticResult.itemId}:`, error)
          continue
        }

        if (title) {
          semanticQueryResults.push({
            item_type: semanticResult.itemType,
            item_id: semanticResult.itemId,
            title,
            content,
            relevance_score: semanticResult.similarity,
            database: semanticResult.itemType,
          })
        }
      }

      // If we have semantic results, return them (they're already sorted by similarity)
      if (semanticQueryResults.length > 0) {
        const limitedResults = semanticQueryResults.slice(0, limit)
        
        // Cache results
        if (queryCache.size >= MAX_CACHE_SIZE) {
          // Remove oldest entry
          const oldestKey = queryCache.keys().next().value
          if (oldestKey) {
            queryCache.delete(oldestKey)
          }
        }
        queryCache.set(cacheKey, {
          results: semanticQueryResults,
          timestamp: Date.now(),
        })

        return {
          results: limitedResults,
          query,
          total_results: semanticQueryResults.length,
        }
      }
    } catch (error) {
      console.error('Error in semantic search, falling back to keyword search:', error)
      // Fall through to keyword search
    }
  }

  // Fall back to keyword-based search
  const results = await searchAllDatabases(tenantId, parsed.searchTerms, parsed.filters)

  // Cache results
  if (queryCache.size >= MAX_CACHE_SIZE) {
    // Remove oldest entry
    const oldestKey = queryCache.keys().next().value
    if (oldestKey) {
      queryCache.delete(oldestKey)
    }
  }
  queryCache.set(cacheKey, {
    results,
    timestamp: Date.now(),
  })

  const limitedResults = results.slice(0, limit)

  return {
    results: limitedResults,
    query,
    total_results: results.length,
  }
}
