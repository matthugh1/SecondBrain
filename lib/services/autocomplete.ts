import * as peopleRepo from '@/lib/db/repositories/people'
import * as projectsRepo from '@/lib/db/repositories/projects'
import * as ideasRepo from '@/lib/db/repositories/ideas'
import * as tagsRepo from '@/lib/db/repositories/tags'

export interface AutocompleteResult {
  value: string
  type: 'person' | 'project' | 'idea' | 'tag'
  frequency?: number
}

/**
 * Get autocomplete suggestions for people
 */
export async function getPeopleAutocomplete(
  tenantId: string,
  query: string,
  limit: number = 10
): Promise<AutocompleteResult[]> {
  const people = await peopleRepo.getAllPeople(tenantId, false)
  
  return people
    .filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
    .slice(0, limit)
    .map(p => ({
      value: p.name,
      type: 'person' as const,
    }))
}

/**
 * Get autocomplete suggestions for projects
 */
export async function getProjectsAutocomplete(
  tenantId: string,
  query: string,
  limit: number = 10
): Promise<AutocompleteResult[]> {
  const projects = await projectsRepo.getAllProjects(tenantId, false)
  
  return projects
    .filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
    .slice(0, limit)
    .map(p => ({
      value: p.name,
      type: 'project' as const,
    }))
}

/**
 * Get autocomplete suggestions for tags
 */
export async function getTagsAutocomplete(
  tenantId: string,
  query: string,
  limit: number = 10
): Promise<AutocompleteResult[]> {
  try {
    const allTags = await tagsRepo.getAllTags(tenantId)
    const matchingTags = allTags
      .filter(tag => tag.name.toLowerCase().includes(query.toLowerCase()))
      .slice(0, limit)
      .map(tag => ({
        value: tag.name,
        type: 'tag' as const,
      }))
    return matchingTags
  } catch (error) {
    console.error('Error fetching tags for autocomplete:', error)
    return []
  }
}

/**
 * Get combined autocomplete suggestions
 */
export async function getAutocompleteSuggestions(
  tenantId: string,
  query: string,
  types: Array<'person' | 'project' | 'idea' | 'tag'> = ['person', 'project', 'tag'],
  limit: number = 10
): Promise<AutocompleteResult[]> {
  const results: AutocompleteResult[] = []

  if (types.includes('person')) {
    const people = await getPeopleAutocomplete(tenantId, query, 5)
    results.push(...people)
  }

  if (types.includes('project')) {
    const projects = await getProjectsAutocomplete(tenantId, query, 5)
    results.push(...projects)
  }

  if (types.includes('tag')) {
    const tags = await getTagsAutocomplete(tenantId, query, 5)
    results.push(...tags)
  }

  // Sort by frequency if available, then alphabetically
  return results
    .sort((a, b) => {
      if (a.frequency && b.frequency) {
        return b.frequency - a.frequency
      }
      return a.value.localeCompare(b.value)
    })
    .slice(0, limit)
}
