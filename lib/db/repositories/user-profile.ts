import { prisma } from '../index'
import * as relationshipsRepo from '@/lib/db/repositories/relationships'
import * as peopleRepo from '@/lib/db/repositories/people'
import * as projectsRepo from '@/lib/db/repositories/projects'
import * as userAnalyticsRepo from '@/lib/db/repositories/user-analytics'

export interface UserProfileData {
  preferences: Record<string, any>
  frequentPeople: string[]
  activeFocusAreas: string[]
}

/**
 * Get or create user profile
 */
export async function getUserProfile(
  tenantId: string,
  userId: string
): Promise<UserProfileData> {
  const profile = await prisma.userProfile.findUnique({
    where: {
      tenantId_userId: {
        tenantId,
        userId,
      },
    },
  })

  if (profile) {
    return {
      preferences: profile.preferences ? JSON.parse(profile.preferences) : {},
      frequentPeople: profile.frequentPeople ? JSON.parse(profile.frequentPeople) : [],
      activeFocusAreas: profile.activeFocusAreas ? JSON.parse(profile.activeFocusAreas) : [],
    }
  }

  // Create default profile
  return {
    preferences: {},
    frequentPeople: [],
    activeFocusAreas: [],
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  tenantId: string,
  userId: string,
  updates: Partial<UserProfileData>
): Promise<void> {
  const existing = await prisma.userProfile.findUnique({
    where: {
      tenantId_userId: {
        tenantId,
        userId,
      },
    },
  })

  const currentProfile = existing
    ? {
        preferences: existing.preferences ? JSON.parse(existing.preferences) : {},
        frequentPeople: existing.frequentPeople ? JSON.parse(existing.frequentPeople) : [],
        activeFocusAreas: existing.activeFocusAreas ? JSON.parse(existing.activeFocusAreas) : [],
      }
    : {
        preferences: {},
        frequentPeople: [],
        activeFocusAreas: [],
      }

  const updatedProfile = {
    preferences: JSON.stringify(updates.preferences || currentProfile.preferences),
    frequentPeople: updates.frequentPeople !== undefined ? JSON.stringify(updates.frequentPeople) : existing?.frequentPeople || null,
    activeFocusAreas: updates.activeFocusAreas !== undefined ? JSON.stringify(updates.activeFocusAreas) : existing?.activeFocusAreas || null,
  }

  await prisma.userProfile.upsert({
    where: {
      tenantId_userId: {
        tenantId,
        userId,
      },
    },
    create: {
      tenantId,
      userId,
      ...updatedProfile,
    },
    update: updatedProfile,
  })
}

/**
 * Build user profile from analytics and relationships
 */
export async function buildUserProfile(tenantId: string, userId: string): Promise<void> {
  // Get frequent people from relationships
  const relationships = await relationshipsRepo.getAllRelationshipsForGraph(tenantId, ['people'], 0.3)
  const peopleMentionCounts = new Map<number, number>()

  for (const rel of relationships) {
    if (rel.sourceType === 'people') {
      const count = peopleMentionCounts.get(rel.sourceId) || 0
      peopleMentionCounts.set(rel.sourceId, count + rel.mentionCount)
    }
    if (rel.targetType === 'people') {
      const count = peopleMentionCounts.get(rel.targetId) || 0
      peopleMentionCounts.set(rel.targetId, count + rel.mentionCount)
    }
  }

  // Get top 10 most mentioned people
  const topPeople = Array.from(peopleMentionCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(async ([personId]) => {
      const person = await peopleRepo.getPersonById(tenantId, personId)
      return person?.name
    })

  const frequentPeopleNames = (await Promise.all(topPeople)).filter(Boolean) as string[]

  // Get active focus areas (active projects)
  const activeProjects = await projectsRepo.getActiveProjects(tenantId)
  const activeFocusAreas = activeProjects.slice(0, 5).map(p => p.name)

  // Update profile
  await updateUserProfile(tenantId, userId, {
    frequentPeople: frequentPeopleNames,
    activeFocusAreas,
  })
}

/**
 * Get personalized suggestions based on profile
 */
export async function getPersonalizedSuggestions(
  tenantId: string,
  userId: string,
  inputText: string
): Promise<{
  suggestedCategory?: string
  suggestedPeople?: string[]
  suggestedProjects?: string[]
  suggestedTags?: string[]
}> {
  const profile = await getUserProfile(tenantId, userId)
  const analytics = await userAnalyticsRepo.getUserAnalytics(tenantId, userId)

  const suggestions: any = {}

  // Suggest category based on most common
  if (analytics?.mostCommonCategory) {
    suggestions.suggestedCategory = analytics.mostCommonCategory
  }

  // Suggest frequent people
  if (profile.frequentPeople.length > 0) {
    // Check if any frequent people are mentioned in input
    const mentionedPeople = profile.frequentPeople.filter(person =>
      inputText.toLowerCase().includes(person.toLowerCase())
    )
    if (mentionedPeople.length > 0) {
      suggestions.suggestedPeople = mentionedPeople
    } else {
      suggestions.suggestedPeople = profile.frequentPeople.slice(0, 3)
    }
  }

  // Suggest active projects
  if (profile.activeFocusAreas.length > 0) {
    suggestions.suggestedProjects = profile.activeFocusAreas.slice(0, 3)
  }

  return suggestions
}
