import { prisma } from '@/lib/db/index'
import * as userAnalyticsRepo from '@/lib/db/repositories/user-analytics'
import * as inboxLogRepo from '@/lib/db/repositories/inbox-log'

export interface Pattern {
  patternType: string
  patternData: Record<string, any>
  confidence: number
}

/**
 * Detect capture frequency patterns
 */
export async function detectCaptureFrequencyPattern(
  tenantId: string,
  userId: string
): Promise<Pattern | null> {
  const analytics = await userAnalyticsRepo.getUserAnalytics(tenantId, userId)
  if (!analytics || analytics.captureCount < 10) {
    return null
  }

  // Get recent captures from inbox log
  const recentLogs = await prisma.inboxLog.findMany({
    where: {
      tenantId,
      // Note: inbox_log doesn't have userId, so we analyze at tenant level
      // In production, you'd want to track userId in inbox_log
    },
    orderBy: { created: 'desc' },
    take: 100,
    select: { created: true },
  })

  // Analyze day of week patterns
  const dayCounts: Record<string, number> = {}
  for (const log of recentLogs) {
    const day = new Date(log.created).toLocaleDateString('en-US', { weekday: 'long' })
    dayCounts[day] = (dayCounts[day] || 0) + 1
  }

  // Find most common day
  let maxCount = 0
  let mostCommonDay = ''
  for (const [day, count] of Object.entries(dayCounts)) {
    if (count > maxCount) {
      maxCount = count
      mostCommonDay = day
    }
  }

  if (maxCount > recentLogs.length * 0.3) {
    // If one day accounts for >30% of captures, it's a pattern
    return {
      patternType: 'capture_frequency',
      patternData: {
        mostCommonDay,
        dayDistribution: dayCounts,
        totalCaptures: recentLogs.length,
      },
      confidence: Math.min(maxCount / recentLogs.length, 1),
    }
  }

  return null
}

/**
 * Detect category distribution patterns
 */
export async function detectCategoryDistributionPattern(
  tenantId: string,
  userId: string
): Promise<Pattern | null> {
  const analytics = await userAnalyticsRepo.getUserAnalytics(tenantId, userId)
  if (!analytics) {
    return null
  }

  // Get recent captures
  const recentLogs = await prisma.inboxLog.findMany({
    where: {
      tenantId,
    },
    orderBy: { created: 'desc' },
    take: 50,
    select: { filedTo: true, created: true },
  })

  // Count categories
  const categoryCounts: Record<string, number> = {}
  for (const log of recentLogs) {
    categoryCounts[log.filedTo] = (categoryCounts[log.filedTo] || 0) + 1
  }

  // Check if distribution changed significantly
  const mostCommon = analytics.mostCommonCategory
  if (mostCommon && categoryCounts[mostCommon]) {
    const currentRatio = categoryCounts[mostCommon] / recentLogs.length
    // If current ratio differs significantly from historical, it's a change pattern
    return {
      patternType: 'category_distribution',
      patternData: {
        currentDistribution: categoryCounts,
        historicalMostCommon: mostCommon,
        changeDetected: true,
      },
      confidence: 0.7,
    }
  }

  return null
}

/**
 * Detect project stagnation patterns
 */
export async function detectProjectStagnationPattern(
  tenantId: string,
  userId: string
): Promise<Pattern | null> {
  const projects = await prisma.project.findMany({
    where: {
      tenantId,
      archived: 0,
      status: { in: ['Active', 'Waiting', 'Blocked'] },
    },
    select: {
      id: true,
      name: true,
      status: true,
      updatedAt: true,
      createdAt: true,
    },
  })

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const stagnantProjects = projects.filter(p => {
    const updatedAt = p.updatedAt || p.createdAt
    return updatedAt < thirtyDaysAgo
  })

  if (stagnantProjects.length > 0) {
    return {
      patternType: 'project_stagnation',
      patternData: {
        stagnantCount: stagnantProjects.length,
        totalActiveProjects: projects.length,
        stagnantProjects: stagnantProjects.map(p => ({
          id: p.id,
          name: p.name,
          daysSinceUpdate: Math.floor((now.getTime() - (p.updatedAt || p.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
        })),
      },
      confidence: Math.min(stagnantProjects.length / projects.length, 1),
    }
  }

  return null
}

/**
 * Detect all patterns for a user
 */
export async function detectAllPatterns(
  tenantId: string,
  userId: string
): Promise<Pattern[]> {
  const patterns: Pattern[] = []

  const [frequencyPattern, categoryPattern, stagnationPattern] = await Promise.all([
    detectCaptureFrequencyPattern(tenantId, userId),
    detectCategoryDistributionPattern(tenantId, userId),
    detectProjectStagnationPattern(tenantId, userId),
  ])

  if (frequencyPattern) patterns.push(frequencyPattern)
  if (categoryPattern) patterns.push(categoryPattern)
  if (stagnationPattern) patterns.push(stagnationPattern)

  // Store patterns
  for (const pattern of patterns) {
    await prisma.pattern.create({
      data: {
        tenantId,
        userId,
        patternType: pattern.patternType,
        patternData: JSON.stringify(pattern.patternData),
        confidence: pattern.confidence,
      },
    }).catch(err => console.error('Error storing pattern:', err))
  }

  return patterns
}
