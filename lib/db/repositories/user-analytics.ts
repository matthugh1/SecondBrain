import { prisma } from '../index'

export interface UserAnalyticsData {
  captureCount: number
  avgConfidence: number | null
  mostCommonCategory: string | null
  preferredCaptureTime: string | null
  preferredCaptureDay: string | null
  correctionCount: number
}

/**
 * Get or create user analytics
 */
export async function getUserAnalytics(
  tenantId: string,
  userId: string
): Promise<UserAnalyticsData | null> {
  const analytics = await prisma.userAnalytics.findUnique({
    where: {
      tenantId_userId: {
        tenantId,
        userId,
      },
    },
  })

  if (!analytics) {
    return null
  }

  return {
    captureCount: analytics.captureCount,
    avgConfidence: analytics.avgConfidence,
    mostCommonCategory: analytics.mostCommonCategory,
    preferredCaptureTime: analytics.preferredCaptureTime,
    preferredCaptureDay: analytics.preferredCaptureDay,
    correctionCount: analytics.correctionCount,
  }
}

/**
 * Record a capture event
 */
export async function recordCapture(
  tenantId: string,
  userId: string,
  category: string,
  confidence: number,
  hourOfDay: number,
  dayOfWeek: string
): Promise<void> {
  const analytics = await prisma.userAnalytics.upsert({
    where: {
      tenantId_userId: {
        tenantId,
        userId,
      },
    },
    create: {
      tenantId,
      userId,
      captureCount: 1,
      avgConfidence: confidence,
      mostCommonCategory: category,
      preferredCaptureTime: hourOfDay.toString(),
      preferredCaptureDay: dayOfWeek,
    },
    update: {
      captureCount: { increment: 1 },
      // Update average confidence
      avgConfidence: await calculateAverageConfidence(tenantId, userId, confidence),
      // Update most common category
      mostCommonCategory: await calculateMostCommonCategory(tenantId, userId, category),
      // Update preferred capture time (most frequent hour)
      preferredCaptureTime: await calculatePreferredTime(tenantId, userId, hourOfDay),
      // Update preferred capture day
      preferredCaptureDay: await calculatePreferredDay(tenantId, userId, dayOfWeek),
    },
  })
}

/**
 * Record a correction
 */
export async function recordCorrection(tenantId: string, userId: string): Promise<void> {
  await prisma.userAnalytics.upsert({
    where: {
      tenantId_userId: {
        tenantId,
        userId,
      },
    },
    create: {
      tenantId,
      userId,
      correctionCount: 1,
      captureCount: 0,
    },
    update: {
      correctionCount: { increment: 1 },
    },
  })
}

/**
 * Calculate average confidence
 */
async function calculateAverageConfidence(
  tenantId: string,
  userId: string,
  newConfidence: number
): Promise<number> {
  const analytics = await prisma.userAnalytics.findUnique({
    where: {
      tenantId_userId: {
        tenantId,
        userId,
      },
    },
    select: {
      avgConfidence: true,
      captureCount: true,
    },
  })

  if (!analytics || analytics.captureCount === 0) {
    return newConfidence
  }

  const currentAvg = analytics.avgConfidence || 0
  const totalCaptures = analytics.captureCount + 1
  const newAvg = (currentAvg * analytics.captureCount + newConfidence) / totalCaptures

  return newAvg
}

/**
 * Calculate most common category
 */
async function calculateMostCommonCategory(
  tenantId: string,
  userId: string,
  newCategory: string
): Promise<string> {
  // Get recent captures from inbox log to determine most common category
  const recentCaptures = await prisma.inboxLog.findMany({
    where: {
      tenantId,
      // Note: inbox_log doesn't have userId, so we'll use tenant-level stats
      // This is a limitation - ideally we'd track per-user captures
    },
    orderBy: { created: 'desc' },
    take: 100,
    select: { filedTo: true },
  })

  const categoryCounts = new Map<string, number>()
  for (const capture of recentCaptures) {
    const count = categoryCounts.get(capture.filedTo) || 0
    categoryCounts.set(capture.filedTo, count + 1)
  }

  // Add the new category
  const newCount = categoryCounts.get(newCategory) || 0
  categoryCounts.set(newCategory, newCount + 1)

  // Find most common
  let maxCount = 0
  let mostCommon = newCategory
  for (const [category, count] of categoryCounts.entries()) {
    if (count > maxCount) {
      maxCount = count
      mostCommon = category
    }
  }

  return mostCommon
}

/**
 * Calculate preferred capture time (hour of day)
 */
async function calculatePreferredTime(
  tenantId: string,
  userId: string,
  newHour: number
): Promise<string> {
  // Simple approach: track the hour that appears most frequently
  // In a full implementation, we'd track all hours and find the mode
  const analytics = await prisma.userAnalytics.findUnique({
    where: {
      tenantId_userId: {
        tenantId,
        userId,
      },
    },
    select: {
      preferredCaptureTime: true,
      captureCount: true,
    },
  })

  // For now, use the new hour if we don't have enough data
  // In production, we'd track hour distribution
  if (!analytics || analytics.captureCount < 10) {
    return newHour.toString()
  }

  // Keep existing if we have enough data, otherwise update
  return analytics.preferredCaptureTime || newHour.toString()
}

/**
 * Calculate preferred capture day
 */
async function calculatePreferredDay(
  tenantId: string,
  userId: string,
  newDay: string
): Promise<string> {
  // Similar to preferred time
  const analytics = await prisma.userAnalytics.findUnique({
    where: {
      tenantId_userId: {
        tenantId,
        userId,
      },
    },
    select: {
      preferredCaptureDay: true,
      captureCount: true,
    },
  })

  if (!analytics || analytics.captureCount < 7) {
    return newDay
  }

  return analytics.preferredCaptureDay || newDay
}
