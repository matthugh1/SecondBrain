import { getMetricsStats, getAllMetrics } from '@/lib/metrics'
import { getContextLogger } from '@/lib/logger/context'
import * as Sentry from '@sentry/nextjs'

/**
 * Alert thresholds
 */
export const ALERT_THRESHOLDS = {
  ERROR_RATE_PERCENT: 1, // Alert if error rate > 1%
  P95_LATENCY_MS: 2000, // Alert if p95 latency > 2s
  P99_LATENCY_MS: 5000, // Alert if p99 latency > 5s
  AI_FAILURE_RATE_PERCENT: 5, // Alert if AI failure rate > 5%
  DB_ERROR_RATE_PERCENT: 1, // Alert if DB error rate > 1%
  WORKFLOW_FAILURE_RATE_PERCENT: 10, // Alert if workflow failure rate > 10%
} as const

/**
 * Check error rate and alert if threshold exceeded
 */
export function checkErrorRate(): void {
  const httpErrors = getMetricsStats('http_errors_total')
  const httpRequests = getMetricsStats('http_requests_total')

  if (!httpErrors || !httpRequests) {
    return // Not enough data
  }

  const totalRequests = httpRequests.count
  const totalErrors = httpErrors.count
  const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0

  if (errorRate > ALERT_THRESHOLDS.ERROR_RATE_PERCENT) {
    const logger = getContextLogger()
    logger.error(
      {
        errorRate,
        threshold: ALERT_THRESHOLDS.ERROR_RATE_PERCENT,
        totalErrors,
        totalRequests,
      },
      '⚠️ ALERT: Error rate exceeded threshold'
    )

    // Send to Sentry as an alert
    Sentry.captureMessage(
      `Error rate ${errorRate.toFixed(2)}% exceeds threshold of ${ALERT_THRESHOLDS.ERROR_RATE_PERCENT}%`,
      {
        level: 'error',
        tags: {
          alert_type: 'error_rate',
          error_rate: errorRate.toFixed(2),
        },
        extra: {
          totalErrors,
          totalRequests,
          threshold: ALERT_THRESHOLDS.ERROR_RATE_PERCENT,
        },
      }
    )
  }
}

/**
 * Check latency and alert if threshold exceeded
 */
export function checkLatency(): void {
  const latencyStats = getMetricsStats('http_request_duration_ms')

  if (!latencyStats) {
    return // Not enough data
  }

  const logger = getContextLogger()

  // Check p95 latency
  if (latencyStats.p95 > ALERT_THRESHOLDS.P95_LATENCY_MS) {
    logger.warn(
      {
        p95: latencyStats.p95,
        threshold: ALERT_THRESHOLDS.P95_LATENCY_MS,
      },
      '⚠️ ALERT: P95 latency exceeded threshold'
    )

    Sentry.captureMessage(
      `P95 latency ${latencyStats.p95}ms exceeds threshold of ${ALERT_THRESHOLDS.P95_LATENCY_MS}ms`,
      {
        level: 'warning',
        tags: {
          alert_type: 'latency',
          metric: 'p95',
        },
        extra: {
          p95: latencyStats.p95,
          p99: latencyStats.p99,
          avg: latencyStats.avg,
          threshold: ALERT_THRESHOLDS.P95_LATENCY_MS,
        },
      }
    )
  }

  // Check p99 latency
  if (latencyStats.p99 > ALERT_THRESHOLDS.P99_LATENCY_MS) {
    logger.warn(
      {
        p99: latencyStats.p99,
        threshold: ALERT_THRESHOLDS.P99_LATENCY_MS,
      },
      '⚠️ ALERT: P99 latency exceeded threshold'
    )

    Sentry.captureMessage(
      `P99 latency ${latencyStats.p99}ms exceeds threshold of ${ALERT_THRESHOLDS.P99_LATENCY_MS}ms`,
      {
        level: 'warning',
        tags: {
          alert_type: 'latency',
          metric: 'p99',
        },
        extra: {
          p95: latencyStats.p95,
          p99: latencyStats.p99,
          avg: latencyStats.avg,
          threshold: ALERT_THRESHOLDS.P99_LATENCY_MS,
        },
      }
    )
  }
}

/**
 * Check AI call failure rate
 */
export function checkAIFailureRate(): void {
  const aiCalls = getAllMetrics().filter(m => m.name === 'ai_calls_total')
  
  if (aiCalls.length === 0) {
    return // No AI calls yet
  }

  let totalCalls = 0
  let failedCalls = 0

  for (const metric of aiCalls) {
    const stats = getMetricsStats(metric.name, metric.labels)
    if (stats) {
      totalCalls += stats.count
      // Check for error status
      if (metric.labels?.status === 'error') {
        failedCalls += stats.count
      }
    }
  }

  if (totalCalls === 0) {
    return
  }

  const failureRate = (failedCalls / totalCalls) * 100

  if (failureRate > ALERT_THRESHOLDS.AI_FAILURE_RATE_PERCENT) {
    const logger = getContextLogger()
    logger.error(
      {
        failureRate,
        threshold: ALERT_THRESHOLDS.AI_FAILURE_RATE_PERCENT,
        failedCalls,
        totalCalls,
      },
      '⚠️ ALERT: AI failure rate exceeded threshold'
    )

    Sentry.captureMessage(
      `AI failure rate ${failureRate.toFixed(2)}% exceeds threshold of ${ALERT_THRESHOLDS.AI_FAILURE_RATE_PERCENT}%`,
      {
        level: 'error',
        tags: {
          alert_type: 'ai_failure_rate',
        },
        extra: {
          failureRate,
          failedCalls,
          totalCalls,
          threshold: ALERT_THRESHOLDS.AI_FAILURE_RATE_PERCENT,
        },
      }
    )
  }
}

/**
 * Check database error rate
 */
export function checkDBErrorRate(): void {
  const dbQueries = getAllMetrics().filter(m => m.name === 'db_queries_total')
  
  if (dbQueries.length === 0) {
    return // No DB queries yet
  }

  let totalQueries = 0
  let failedQueries = 0

  for (const metric of dbQueries) {
    const stats = getMetricsStats(metric.name, metric.labels)
    if (stats) {
      totalQueries += stats.count
      if (metric.labels?.status === 'error') {
        failedQueries += stats.count
      }
    }
  }

  if (totalQueries === 0) {
    return
  }

  const errorRate = (failedQueries / totalQueries) * 100

  if (errorRate > ALERT_THRESHOLDS.DB_ERROR_RATE_PERCENT) {
    const logger = getContextLogger()
    logger.error(
      {
        errorRate,
        threshold: ALERT_THRESHOLDS.DB_ERROR_RATE_PERCENT,
        failedQueries,
        totalQueries,
      },
      '⚠️ ALERT: Database error rate exceeded threshold'
    )

    Sentry.captureMessage(
      `Database error rate ${errorRate.toFixed(2)}% exceeds threshold of ${ALERT_THRESHOLDS.DB_ERROR_RATE_PERCENT}%`,
      {
        level: 'error',
        tags: {
          alert_type: 'db_error_rate',
        },
        extra: {
          errorRate,
          failedQueries,
          totalQueries,
          threshold: ALERT_THRESHOLDS.DB_ERROR_RATE_PERCENT,
        },
      }
    )
  }
}

/**
 * Check workflow failure rate
 */
export function checkWorkflowFailureRate(): void {
  const workflowExecutions = getAllMetrics().filter(m => m.name === 'workflow_executions_total')
  
  if (workflowExecutions.length === 0) {
    return // No workflow executions yet
  }

  let totalExecutions = 0
  let failedExecutions = 0

  for (const metric of workflowExecutions) {
    const stats = getMetricsStats(metric.name, metric.labels)
    if (stats) {
      totalExecutions += stats.count
      if (metric.labels?.status === 'error') {
        failedExecutions += stats.count
      }
    }
  }

  if (totalExecutions === 0) {
    return
  }

  const failureRate = (failedExecutions / totalExecutions) * 100

  if (failureRate > ALERT_THRESHOLDS.WORKFLOW_FAILURE_RATE_PERCENT) {
    const logger = getContextLogger()
    logger.warn(
      {
        failureRate,
        threshold: ALERT_THRESHOLDS.WORKFLOW_FAILURE_RATE_PERCENT,
        failedExecutions,
        totalExecutions,
      },
      '⚠️ ALERT: Workflow failure rate exceeded threshold'
    )

    Sentry.captureMessage(
      `Workflow failure rate ${failureRate.toFixed(2)}% exceeds threshold of ${ALERT_THRESHOLDS.WORKFLOW_FAILURE_RATE_PERCENT}%`,
      {
        level: 'warning',
        tags: {
          alert_type: 'workflow_failure_rate',
        },
        extra: {
          failureRate,
          failedExecutions,
          totalExecutions,
          threshold: ALERT_THRESHOLDS.WORKFLOW_FAILURE_RATE_PERCENT,
        },
      }
    )
  }
}

/**
 * Run all alert checks
 * Call this periodically (e.g., every minute) to check thresholds
 */
export function runAlertChecks(): void {
  try {
    checkErrorRate()
    checkLatency()
    checkAIFailureRate()
    checkDBErrorRate()
    checkWorkflowFailureRate()
  } catch (error) {
    const logger = getContextLogger()
    logger.error({ error }, 'Error running alert checks')
  }
}
