import { prisma } from '@/lib/db/index'
import * as patternDetection from './pattern-detection'
import type { Pattern } from './pattern-detection'
import * as projectsRepo from '@/lib/db/repositories/projects'
import * as ideasRepo from '@/lib/db/repositories/ideas'
import * as relationshipsRepo from '@/lib/db/repositories/relationships'
import * as userAnalyticsRepo from '@/lib/db/repositories/user-analytics'

export interface Insight {
  id?: number
  insightType: string
  title: string
  message: string
  data?: Record<string, any>
  actionable: boolean
  actionType?: string
  actionTargetId?: number
  priority: 'low' | 'medium' | 'high'
}

/**
 * Generate daily insights
 */
export async function generateDailyInsights(
  tenantId: string,
  userId: string
): Promise<Insight[]> {
  const insights: Insight[] = []

  // Detect patterns first
  const patterns = await patternDetection.detectAllPatterns(tenantId, userId)

  // Generate insights from patterns
  for (const pattern of patterns) {
    switch (pattern.patternType) {
      case 'capture_frequency': {
        const data = pattern.patternData as any
        if (data.mostCommonDay) {
          insights.push({
            insightType: 'pattern',
            title: 'Capture Pattern Detected',
            message: `You capture most items on ${data.mostCommonDay}s`,
            data: pattern.patternData,
            actionable: false,
            priority: 'low',
          })
        }
        break
      }

      case 'category_distribution': {
        const data = pattern.patternData as any
        const currentDist = data.currentDistribution || {}
        const categories = Object.keys(currentDist)
        const maxCategory = categories.reduce((a, b) =>
          currentDist[a] > currentDist[b] ? a : b
        )

        insights.push({
          insightType: 'pattern',
          title: 'Category Distribution',
          message: `You're capturing more ${maxCategory} items this week`,
          data: pattern.patternData,
          actionable: false,
          priority: 'medium',
        })
        break
      }

      case 'project_stagnation': {
        const data = pattern.patternData as any
        insights.push({
          insightType: 'stagnation',
          title: 'Stagnant Projects',
          message: `${data.stagnantCount} active project${data.stagnantCount !== 1 ? 's' : ''} haven't been updated in 30+ days`,
          data: pattern.patternData,
          actionable: true,
          actionType: 'review_projects',
          priority: 'high',
        })
        break
      }
    }
  }

  // Generate stagnation insights (similar to reminders but as insights)
  const projects = await prisma.project.findMany({
    where: {
      tenantId,
      archived: 0,
      status: { in: ['Active', 'Waiting', 'Blocked'] },
    },
    select: {
      id: true,
      name: true,
      updatedAt: true,
      createdAt: true,
    },
  })

  const now = new Date()
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
  const stagnantProjects = projects.filter(p => {
    const updatedAt = p.updatedAt || p.createdAt
    return updatedAt < twoWeeksAgo
  })

  if (stagnantProjects.length > 0) {
    insights.push({
      insightType: 'stagnation',
      title: 'Projects Need Attention',
      message: `${stagnantProjects.length} project${stagnantProjects.length !== 1 ? 's' : ''} haven't moved in 2 weeks`,
      data: {
        projects: stagnantProjects.map(p => ({
          id: p.id,
          name: p.name,
        })),
      },
      actionable: true,
      actionType: 'review_projects',
      priority: 'medium',
    })
  }

  // Generate opportunity insights
  const ideas = await ideasRepo.getAllIdeas(tenantId, false)
  const opportunityIdeas: Array<{ id: number; name: string; score: number }> = []

  for (const idea of ideas) {
    if (!idea.id) continue
    let score = 0

    // Check if mentioned in relationships
    const relationships = await relationshipsRepo.getRelationshipsForSource(
      tenantId,
      'ideas',
      idea.id
    )
    if (relationships.length > 0) {
      score += relationships.length * 0.2
    }

    // Check if has detailed notes
    if (idea.notes && idea.notes.length > 100) {
      score += 0.3
    }

    // Check if relates to active projects
    const projectRelationships = relationships.filter(r => r.targetType === 'projects')
    if (projectRelationships.length > 0) {
      score += 0.5
    }

    if (score > 0.5) {
      opportunityIdeas.push({ id: idea.id, name: idea.name, score })
    }
  }

  if (opportunityIdeas.length > 0) {
    const topOpportunity = opportunityIdeas.sort((a, b) => b.score - a.score)[0]
    insights.push({
      insightType: 'opportunity',
      title: 'Idea Ready to Become Project',
      message: `"${topOpportunity.name}" might be ready to become a project (mentioned ${Math.round(topOpportunity.score * 10)} times, relates to active projects)`,
      data: {
        ideaId: topOpportunity.id,
        ideaName: topOpportunity.name,
        score: topOpportunity.score,
      },
      actionable: true,
      actionType: 'convert_to_project',
      actionTargetId: topOpportunity.id,
      priority: 'medium',
    })
  }

  // Limit to top 5 insights
  return insights
    .sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })
    .slice(0, 5)
}

/**
 * Store insights in database
 */
export async function storeInsights(
  tenantId: string,
  userId: string,
  insights: Insight[]
): Promise<void> {
  for (const insight of insights) {
    await prisma.insight.create({
      data: {
        tenantId,
        userId,
        insightType: insight.insightType,
        title: insight.title,
        message: insight.message,
        data: insight.data ? JSON.stringify(insight.data) : null,
        actionable: insight.actionable,
        actionType: insight.actionType || null,
        actionTargetId: insight.actionTargetId || null,
        priority: insight.priority,
        status: 'active',
      },
    }).catch(err => console.error('Error storing insight:', err))
  }
}

/**
 * Get active insights for a user
 */
export async function getActiveInsights(
  tenantId: string,
  userId: string,
  limit: number = 10
): Promise<Insight[]> {
  const insights = await prisma.insight.findMany({
    where: {
      tenantId,
      userId,
      status: 'active',
    },
    orderBy: [
      { priority: 'desc' },
      { createdAt: 'desc' },
    ],
    take: limit,
  })

  return insights.map(insight => ({
    id: insight.id,
    insightType: insight.insightType,
    title: insight.title,
    message: insight.message,
    data: insight.data ? JSON.parse(insight.data) : undefined,
    actionable: insight.actionable,
    actionType: insight.actionType || undefined,
    actionTargetId: insight.actionTargetId || undefined,
    priority: insight.priority as 'low' | 'medium' | 'high',
  }))
}

/**
 * Generate weekly insights summary
 */
export async function generateWeeklyInsights(
  tenantId: string,
  userId: string
): Promise<{
  summary: string
  patterns: Pattern[]
  recommendations: string[]
}> {
  const analytics = await userAnalyticsRepo.getUserAnalytics(tenantId, userId)
  const patterns = await patternDetection.detectAllPatterns(tenantId, userId)

  const summaryParts: string[] = []
  const recommendations: string[] = []

  // Capture frequency summary
  if (analytics) {
    summaryParts.push(`Captured ${analytics.captureCount} items total`)
    if (analytics.mostCommonCategory) {
      summaryParts.push(`Most common category: ${analytics.mostCommonCategory}`)
    }
  }

  // Pattern summaries
  for (const pattern of patterns) {
    switch (pattern.patternType) {
      case 'capture_frequency': {
        const data = pattern.patternData as any
        if (data.mostCommonDay) {
          summaryParts.push(`Most active capture day: ${data.mostCommonDay}`)
        }
        break
      }
      case 'project_stagnation': {
        const data = pattern.patternData as any
        if (data.stagnantCount > 0) {
          recommendations.push(`Review ${data.stagnantCount} stagnant project${data.stagnantCount !== 1 ? 's' : ''}`)
        }
        break
      }
    }
  }

  return {
    summary: summaryParts.join('. ') || 'No patterns detected yet.',
    patterns,
    recommendations,
  }
}
