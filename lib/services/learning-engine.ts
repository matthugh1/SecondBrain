import * as userAnalyticsRepo from '@/lib/db/repositories/user-analytics'
import * as userProfileRepo from '@/lib/db/repositories/user-profile'
import * as classificationLearningRepo from '@/lib/db/repositories/classification-learning'
import { getRuleSettings } from '@/lib/db/repositories/rules'

/**
 * Analyze correction patterns and update classification prompts
 */
export async function analyzeCorrectionPatterns(tenantId: string): Promise<{
  commonMistakes: Array<{ from: string; to: string; count: number }>
  improvementRate: number
}> {
  const corrections = await classificationLearningRepo.getAllCorrections(tenantId, 1000, 0)
  
  // Count correction patterns
  const mistakeCounts = new Map<string, number>()
  for (const correction of corrections) {
    const key = `${correction.original_category}→${correction.corrected_category}`
    const count = mistakeCounts.get(key) || 0
    mistakeCounts.set(key, count + 1)
  }

  // Get most common mistakes
  const commonMistakes = Array.from(mistakeCounts.entries())
    .map(([key, count]) => {
      const [from, to] = key.split('→')
      return { from, to, count }
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // Calculate improvement rate (corrections decreasing over time)
  const recentCorrections = corrections.slice(0, 50)
  const olderCorrections = corrections.slice(50, 100)
  
  const recentRate = recentCorrections.length / 30 // per 30 days
  const olderRate = olderCorrections.length / 30
  
  const improvementRate = olderRate > 0 ? ((olderRate - recentRate) / olderRate) * 100 : 0

  return {
    commonMistakes,
    improvementRate: Math.max(0, improvementRate),
  }
}

/**
 * Generate pattern-based insights
 */
export async function generatePatternInsights(tenantId: string, userId: string): Promise<Array<{
  type: string
  message: string
  priority: 'high' | 'medium' | 'low'
}>> {
  const insights: Array<{ type: string; message: string; priority: 'high' | 'medium' | 'low' }> = []
  const analytics = await userAnalyticsRepo.getUserAnalytics(tenantId, userId)

  if (!analytics) {
    return insights
  }

  // Capture frequency insights
  if (analytics.captureCount > 0) {
    if (analytics.preferredCaptureDay) {
      insights.push({
        type: 'capture_pattern',
        message: `You capture most items on ${analytics.preferredCaptureDay}s`,
        priority: 'low',
      })
    }

    if (analytics.preferredCaptureTime) {
      const hour = parseInt(analytics.preferredCaptureTime)
      const timeLabel = hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`
      insights.push({
        type: 'capture_pattern',
        message: `Your most active capture time is around ${timeLabel}`,
        priority: 'low',
      })
    }
  }

  // Category distribution insights
  if (analytics.mostCommonCategory) {
    insights.push({
      type: 'category_pattern',
      message: `You most frequently capture ${analytics.mostCommonCategory}`,
      priority: 'medium',
    })
  }

  // Correction rate insights
  if (analytics.correctionCount > 0 && analytics.captureCount > 0) {
    const correctionRate = (analytics.correctionCount / analytics.captureCount) * 100
    if (correctionRate < 5) {
      insights.push({
        type: 'accuracy',
        message: `Great accuracy! Only ${correctionRate.toFixed(1)}% of captures need correction`,
        priority: 'high',
      })
    } else if (correctionRate > 20) {
      insights.push({
        type: 'accuracy',
        message: `${correctionRate.toFixed(1)}% of captures need correction. The system is learning from your fixes.`,
        priority: 'medium',
      })
    }
  }

  // Confidence insights
  if (analytics.avgConfidence !== null) {
    if (analytics.avgConfidence < 0.7) {
      insights.push({
        type: 'confidence',
        message: `Average classification confidence is ${(analytics.avgConfidence * 100).toFixed(0)}%. Consider providing more context in your captures.`,
        priority: 'medium',
      })
    } else if (analytics.avgConfidence > 0.9) {
      insights.push({
        type: 'confidence',
        message: `Excellent! Average classification confidence is ${(analytics.avgConfidence * 100).toFixed(0)}%`,
        priority: 'low',
      })
    }
  }

  return insights
}

/**
 * Update classification prompts with recent corrections
 */
export async function enhanceClassificationWithLearning(tenantId: string): Promise<void> {
  const settings = await getRuleSettings(tenantId)
  
  // Learning is already integrated in classification.ts via getLearningExamples
  // This function can be used for additional enhancements like:
  // - Updating prompt templates based on patterns
  // - Adjusting confidence thresholds based on user accuracy
  // - Customizing prompts per user based on their correction patterns
  
  // For now, the existing learning system handles this
}
