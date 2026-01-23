import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import * as peopleRepo from '@/lib/db/repositories/people'
import * as projectsRepo from '@/lib/db/repositories/projects'
import * as ideasRepo from '@/lib/db/repositories/ideas'
import * as adminRepo from '@/lib/db/repositories/admin'
import * as relationshipsRepo from '@/lib/db/repositories/relationships'
import type { Category } from '@/types'

const aiProvider = process.env.AI_PROVIDER || 'openai'

/**
 * Extract entity mentions from text using AI
 */
export async function extractEntityMentions(
  tenantId: string,
  text: string
): Promise<Array<{ name: string; type: Category }>> {
  const apiKey = aiProvider === 'anthropic' 
    ? process.env.ANTHROPIC_API_KEY 
    : process.env.OPENAI_API_KEY

  if (!apiKey) {
    return []
  }

  // Get all existing entities to help with matching
  const [people, projects, ideas, adminItems] = await Promise.all([
    peopleRepo.getAllPeople(tenantId, true),
    projectsRepo.getAllProjects(tenantId, true),
    ideasRepo.getAllIdeas(tenantId, true),
    adminRepo.getAllAdmin(tenantId, true),
  ])

  const entityNames = {
    people: people.map(p => p.name),
    projects: projects.map(p => p.name),
    ideas: ideas.map(i => i.name),
    admin: adminItems.map(a => a.name),
  }

  const prompt = `Extract entity mentions from this text. Match them to existing entities if possible.

Text: "${text}"

Existing entities:
People: ${entityNames.people.slice(0, 50).join(', ')}
Projects: ${entityNames.projects.slice(0, 50).join(', ')}
Ideas: ${entityNames.ideas.slice(0, 50).join(', ')}
Admin Tasks: ${entityNames.admin.slice(0, 50).join(', ')}

Return JSON array of mentioned entities:
[
  {"name": "Entity Name", "type": "people" | "projects" | "ideas" | "admin"}
]

Only include entities that are actually mentioned in the text. Match names as closely as possible to existing entities.`

  try {
    if (aiProvider === 'anthropic') {
      const anthropic = new Anthropic({ apiKey })
      const response = await anthropic.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      })

      const content = response.content[0]
      if (content.type === 'text') {
        let jsonStr = content.text.trim()
        if (jsonStr.startsWith('```')) {
          jsonStr = jsonStr.replace(/^```json\n?/, '').replace(/```$/, '').trim()
        }
        const mentions = JSON.parse(jsonStr)
        return Array.isArray(mentions) ? mentions : []
      }
    } else {
      const openai = new OpenAI({ apiKey })
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      })

      const content = response.choices[0]?.message?.content
      if (content) {
        const parsed = JSON.parse(content)
        // Handle both array and object with 'mentions' key
        const mentions = Array.isArray(parsed) ? parsed : (parsed.mentions || [])
        return mentions
      }
    }
  } catch (error) {
    console.error('Error extracting entity mentions:', error)
  }

  return []
}

/**
 * Find entity ID by name and type
 */
async function findEntityId(
  tenantId: string,
  name: string,
  type: Category
): Promise<number | null> {
  switch (type) {
    case 'people': {
      const person = await peopleRepo.getPersonByName(tenantId, name)
      return person?.id || null
    }
    case 'projects': {
      const project = await projectsRepo.getProjectByName(tenantId, name)
      return project?.id || null
    }
    case 'ideas': {
      const idea = await ideasRepo.getIdeaByName(tenantId, name)
      return idea?.id || null
    }
    case 'admin': {
      // Admin doesn't have getByName, need to search
      const adminItems = await adminRepo.getAllAdmin(tenantId, true)
      const match = adminItems.find(item => item.name.toLowerCase() === name.toLowerCase())
      return match?.id || null
    }
    default:
      return null
  }
}

/**
 * Calculate relationship strength based on mention count, recency, and context
 */
function calculateRelationshipStrength(
  mentionCount: number,
  daysSinceLastMention: number,
  contextSimilarity: number = 0.5
): number {
  // Base strength from mention count (logarithmic scale)
  const countScore = Math.min(Math.log(mentionCount + 1) / Math.log(10), 1)
  
  // Recency score (more recent = higher score)
  const recencyScore = Math.max(0, 1 - daysSinceLastMention / 90) // Decay over 90 days
  
  // Combine scores
  const strength = (countScore * 0.4 + recencyScore * 0.4 + contextSimilarity * 0.2)
  
  return Math.min(Math.max(strength, 0), 1) // Clamp between 0 and 1
}

/**
 * Detect and create relationships for a newly created item
 */
export async function detectRelationshipsForItem(
  tenantId: string,
  itemType: Category,
  itemId: number,
  itemText: string
): Promise<void> {
  // Extract entity mentions from the item text
  const mentions = await extractEntityMentions(tenantId, itemText)

  // Create relationships for each mention
  for (const mention of mentions) {
    const targetId = await findEntityId(tenantId, mention.name, mention.type)
    
    if (targetId && targetId !== itemId) {
      // Calculate initial strength
      const strength = calculateRelationshipStrength(1, 0, 0.5)
      
      // Create relationship
      await relationshipsRepo.upsertRelationship(
        tenantId,
        itemType,
        itemId,
        mention.type,
        targetId,
        'mentioned_in',
        strength
      )
    }
  }
}

/**
 * Update relationship strengths for all relationships
 */
export async function updateRelationshipStrengths(tenantId: string): Promise<void> {
  // Get all relationships
  const relationships = await relationshipsRepo.getAllRelationshipsForGraph(tenantId, undefined, 0)

  for (const rel of relationships) {
    const daysSinceLastMention = Math.floor(
      (Date.now() - rel.lastMentioned.getTime()) / (1000 * 60 * 60 * 24)
    )
    
    const strength = calculateRelationshipStrength(
      rel.mentionCount,
      daysSinceLastMention,
      0.5 // Context similarity would require embedding comparison
    )

    await relationshipsRepo.updateRelationshipStrength(
      tenantId,
      rel.sourceType,
      rel.sourceId,
      rel.targetType,
      rel.targetId,
      strength
    )
  }
}
