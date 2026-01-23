import { getContextLogger } from '@/lib/logger/context'

/**
 * Metrics collection system
 * 
 * Tracks:
 * - Request latency (p50, p95, p99)
 * - Error rates by endpoint
 * - AI call success/fail rates
 * - Database query timing
 * - Workflow execution metrics
 */

export interface MetricPoint {
  timestamp: number
  value: number
  labels?: Record<string, string>
}

export interface Metric {
  name: string
  type: 'counter' | 'histogram' | 'gauge'
  points: MetricPoint[]
  labels?: Record<string, string>
}

// In-memory metrics store (can be replaced with external service)
class MetricsStore {
  private metrics: Map<string, Metric> = new Map()
  private readonly MAX_POINTS = 1000 // Keep last 1000 points per metric

  /**
   * Record a metric point
   */
  record(name: string, value: number, labels?: Record<string, string>): void {
    const key = this.getKey(name, labels)
    let metric = this.metrics.get(key)

    if (!metric) {
      metric = {
        name,
        type: 'histogram', // Default to histogram for timing metrics
        points: [],
        labels,
      }
      this.metrics.set(key, metric)
    }

    metric.points.push({
      timestamp: Date.now(),
      value,
      labels,
    })

    // Keep only last MAX_POINTS
    if (metric.points.length > this.MAX_POINTS) {
      metric.points = metric.points.slice(-this.MAX_POINTS)
    }
  }

  /**
   * Increment a counter metric
   */
  increment(name: string, labels?: Record<string, string>): void {
    const key = this.getKey(name, labels)
    let metric = this.metrics.get(key)

    if (!metric) {
      metric = {
        name,
        type: 'counter',
        points: [],
        labels,
      }
      this.metrics.set(key, metric)
    }

    // Increment last point or create new one
    if (metric.points.length > 0) {
      const lastPoint = metric.points[metric.points.length - 1]
      if (lastPoint.timestamp > Date.now() - 60000) {
        // Same minute, increment
        lastPoint.value += 1
        return
      }
    }

    // New point
    metric.points.push({
      timestamp: Date.now(),
      value: 1,
      labels,
    })

    if (metric.points.length > this.MAX_POINTS) {
      metric.points = metric.points.slice(-this.MAX_POINTS)
    }
  }

  /**
   * Get metric statistics
   */
  getStats(name: string, labels?: Record<string, string>): {
    count: number
    sum: number
    avg: number
    min: number
    max: number
    p50: number
    p95: number
    p99: number
  } | null {
    const key = this.getKey(name, labels)
    const metric = this.metrics.get(key)

    if (!metric || metric.points.length === 0) {
      return null
    }

    const values = metric.points.map(p => p.value).sort((a, b) => a - b)
    const count = values.length
    const sum = values.reduce((a, b) => a + b, 0)
    const avg = sum / count
    const min = values[0]
    const max = values[values.length - 1]
    const p50 = values[Math.floor(count * 0.5)]
    const p95 = values[Math.floor(count * 0.95)]
    const p99 = values[Math.floor(count * 0.99)]

    return { count, sum, avg, min, max, p50, p95, p99 }
  }

  /**
   * Get all metrics
   */
  getAll(): Metric[] {
    return Array.from(this.metrics.values())
  }

  /**
   * Clear old metrics (older than 1 hour)
   */
  clearOld(): void {
    const oneHourAgo = Date.now() - 3600000
    for (const metric of this.metrics.values()) {
      metric.points = metric.points.filter(p => p.timestamp > oneHourAgo)
      if (metric.points.length === 0) {
        this.metrics.delete(this.getKey(metric.name, metric.labels))
      }
    }
  }

  private getKey(name: string, labels?: Record<string, string>): string {
    if (!labels) return name
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(',')
    return `${name}{${labelStr}}`
  }
}

// Singleton instance
const metricsStore = new MetricsStore()

// Clear old metrics every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    metricsStore.clearOld()
  }, 5 * 60 * 1000)
}

/**
 * Record a timing metric (in milliseconds)
 */
export function recordTiming(name: string, durationMs: number, labels?: Record<string, string>): void {
  metricsStore.record(name, durationMs, labels)
  
  // Also log slow operations
  const logger = getContextLogger()
  if (durationMs > 1000) {
    logger.warn({ durationMs, name, labels }, 'Slow operation detected')
  }
}

/**
 * Record an error metric
 */
export function recordError(endpoint: string, statusCode: number, labels?: Record<string, string>): void {
  metricsStore.increment('http_errors_total', {
    endpoint,
    status: statusCode.toString(),
    ...labels,
  })
}

/**
 * Record a success metric
 */
export function recordSuccess(endpoint: string, labels?: Record<string, string>): void {
  metricsStore.increment('http_requests_total', {
    endpoint,
    status: 'success',
    ...labels,
  })
}

/**
 * Record AI call metrics
 */
export function recordAICall(
  provider: 'openai' | 'anthropic',
  operation: string,
  success: boolean,
  durationMs: number,
  tokens?: number,
  labels?: Record<string, string>
): void {
  const baseLabels = {
    provider,
    operation,
    ...labels,
  }

  if (success) {
    metricsStore.increment('ai_calls_total', { ...baseLabels, status: 'success' })
    recordTiming('ai_call_duration_ms', durationMs, baseLabels)
    if (tokens) {
      metricsStore.record('ai_tokens_total', tokens, baseLabels)
    }
  } else {
    metricsStore.increment('ai_calls_total', { ...baseLabels, status: 'error' })
  }
}

/**
 * Record database query metrics
 */
export function recordDBQuery(
  operation: string,
  durationMs: number,
  success: boolean,
  labels?: Record<string, string>
): void {
  const baseLabels = {
    operation,
    ...labels,
  }

  if (success) {
    metricsStore.increment('db_queries_total', { ...baseLabels, status: 'success' })
    recordTiming('db_query_duration_ms', durationMs, baseLabels)
  } else {
    metricsStore.increment('db_queries_total', { ...baseLabels, status: 'error' })
  }

  // Log slow queries
  const logger = getContextLogger()
  if (durationMs > 500) {
    logger.warn({ durationMs, operation, labels }, 'Slow database query detected')
  }
}

/**
 * Record workflow execution metrics
 */
export function recordWorkflowExecution(
  workflowId: number,
  success: boolean,
  durationMs: number,
  actionsExecuted: number,
  labels?: Record<string, string>
): void {
  const baseLabels = {
    workflowId: workflowId.toString(),
    ...labels,
  }

  if (success) {
    metricsStore.increment('workflow_executions_total', { ...baseLabels, status: 'success' })
  } else {
    metricsStore.increment('workflow_executions_total', { ...baseLabels, status: 'error' })
  }

  recordTiming('workflow_duration_ms', durationMs, baseLabels)
  metricsStore.record('workflow_actions_executed', actionsExecuted, baseLabels)
}

/**
 * Get metrics statistics
 */
export function getMetricsStats(name: string, labels?: Record<string, string>) {
  return metricsStore.getStats(name, labels)
}

/**
 * Get all metrics (for export/dashboard)
 */
export function getAllMetrics(): Metric[] {
  return metricsStore.getAll()
}

/**
 * Helper to measure async function execution time
 */
export async function measureTiming<T>(
  name: string,
  fn: () => Promise<T>,
  labels?: Record<string, string>
): Promise<T> {
  const start = Date.now()
  try {
    const result = await fn()
    const duration = Date.now() - start
    recordTiming(name, duration, { ...labels, status: 'success' })
    return result
  } catch (error) {
    const duration = Date.now() - start
    recordTiming(name, duration, { ...labels, status: 'error' })
    throw error
  }
}
