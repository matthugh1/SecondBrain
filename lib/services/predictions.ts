import * as predictionsRepo from '@/lib/db/repositories/predictions'
import * as inboxLogRepo from '@/lib/db/repositories/inbox-log'
import * as projectsRepo from '@/lib/db/repositories/projects'
import { prisma } from '@/lib/db/index'

/**
 * Predict next capture based on patterns
 */
export async function predictNextCapture(
  tenantId: string,
  userId: string
): Promise<Array<{ category: string; text: string; confidence: number }>> {
  try {
    const now = new Date()
    const hour = now.getHours()
    const dayOfWeek = now.getDay()

    // Get recent captures
    const allLogs = await inboxLogRepo.getAllInboxLogs(tenantId)
    const recentLogs = allLogs.slice(0, 20)
    const recentCategories = recentLogs.map(log => log.filed_to)

    // Get active projects
    const activeProjects = await projectsRepo.getAllProjects(tenantId, false)
    const activeProjectNames = activeProjects
      .filter(p => p.status === 'Active')
      .map(p => p.name)
      .slice(0, 5)

    const predictions: Array<{ category: string; text: string; confidence: number }> = []

    // Pattern: Most common category at this time
    const categoryCounts: Record<string, number> = {}
    for (const log of recentLogs) {
      if (!log.created) continue
      const logDate = new Date(log.created)
      const logHour = logDate.getHours()
      if (Math.abs(logHour - hour) <= 1) {
        const category = log.filed_to
        categoryCounts[category] = (categoryCounts[category] || 0) + 1
      }
    }

    const mostCommonCategory = Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])[0]

    if (mostCommonCategory) {
      predictions.push({
        category: mostCommonCategory[0],
        text: `Update ${mostCommonCategory[0]} item`,
        confidence: Math.min(mostCommonCategory[1] / 5, 0.8),
      })
    }

    // Pattern: Active project updates
    if (activeProjectNames.length > 0) {
      const projectName = activeProjectNames[0]
      predictions.push({
        category: 'projects',
        text: `Update on ${projectName}`,
        confidence: 0.6,
      })
    }

    // Pattern: Day of week patterns
    if (dayOfWeek === 5) { // Friday
      predictions.push({
        category: 'ideas',
        text: 'Weekly idea capture',
        confidence: 0.5,
      })
    }

    return predictions.sort((a, b) => b.confidence - a.confidence).slice(0, 3)
  } catch (error: any) {
    console.error('Error in predictNextCapture:', error)
    // Return empty array on error instead of throwing
    return []
  }
}

/**
 * Predict form field values
 */
export async function predictFormFields(
  tenantId: string,
  userId: string,
  fieldType: 'category' | 'tags' | 'related'
): Promise<Array<{ value: string; confidence: number }>> {
  try {
    const allLogs = await inboxLogRepo.getAllInboxLogs(tenantId)
    const recentLogs = allLogs.slice(0, 50)

    if (fieldType === 'category') {
      // Most common category (filed_to)
      const categoryCounts: Record<string, number> = {}
      for (const log of recentLogs) {
        const category = log.filed_to
        categoryCounts[category] = (categoryCounts[category] || 0) + 1
      }

      return Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([category, count]) => ({
          value: category,
          confidence: Math.min(count / recentLogs.length, 0.9),
        }))
    }

    if (fieldType === 'tags') {
      // Most common tags - InboxLog doesn't have tags field, return empty for now
      // If tags are stored elsewhere, this would need to be updated
      return []
    }

    return []
  } catch (error: any) {
    console.error('Error in predictFormFields:', error)
    return []
  }
}

/**
 * Record prediction acceptance
 */
export async function recordPrediction(
  tenantId: string,
  userId: string,
  predictionType: predictionsRepo.PredictionType,
  predictedValue: any,
  confidence: number,
  accepted: boolean,
  context?: Record<string, any>
): Promise<void> {
  await predictionsRepo.createPrediction(tenantId, userId, {
    predictionType,
    predictedValue,
    confidence,
    context,
  })

  // Update acceptance if prediction already exists
  const recent = await predictionsRepo.getRecentPredictions(tenantId, userId, predictionType, 1)
  if (recent.length > 0) {
    await predictionsRepo.updatePredictionAcceptance(tenantId, userId, recent[0].id, accepted)
  }
}
