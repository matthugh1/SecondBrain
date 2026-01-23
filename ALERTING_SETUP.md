# Alerting Setup Guide

This document describes the alerting system for the SecondBrain application.

## Overview

The alerting system monitors key metrics and automatically sends alerts when thresholds are exceeded. Alerts are sent to Sentry, which can forward them to various notification channels (email, Slack, PagerDuty, etc.).

## Alert Thresholds

Default thresholds (configurable in `lib/alerts/index.ts`):

- **Error Rate**: > 1% of requests
- **P95 Latency**: > 2 seconds
- **P99 Latency**: > 5 seconds
- **AI Failure Rate**: > 5% of AI calls
- **Database Error Rate**: > 1% of queries
- **Workflow Failure Rate**: > 10% of executions

## Alert Types

### 1. Error Rate Alert
Triggers when the overall HTTP error rate exceeds 1%.

**Check**: `checkErrorRate()`
**Threshold**: `ALERT_THRESHOLDS.ERROR_RATE_PERCENT`

### 2. Latency Alert
Triggers when P95 or P99 latency exceeds thresholds.

**Check**: `checkLatency()`
**Thresholds**: 
- P95: `ALERT_THRESHOLDS.P95_LATENCY_MS`
- P99: `ALERT_THRESHOLDS.P99_LATENCY_MS`

### 3. AI Failure Rate Alert
Triggers when AI API call failure rate exceeds threshold.

**Check**: `checkAIFailureRate()`
**Threshold**: `ALERT_THRESHOLDS.AI_FAILURE_RATE_PERCENT`

### 4. Database Error Rate Alert
Triggers when database query error rate exceeds threshold.

**Check**: `checkDBErrorRate()`
**Threshold**: `ALERT_THRESHOLDS.DB_ERROR_RATE_PERCENT`

### 5. Workflow Failure Rate Alert
Triggers when workflow execution failure rate exceeds threshold.

**Check**: `checkWorkflowFailureRate()`
**Threshold**: `ALERT_THRESHOLDS.WORKFLOW_FAILURE_RATE_PERCENT`

## Running Alert Checks

### Manual Check
```bash
# Via API endpoint (requires authentication)
curl -X POST https://your-app.com/api/alerts/check \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Automated Check (Cron Job)
Set up a cron job to call the alert check endpoint every 5 minutes:

```bash
# Vercel Cron Job configuration
# vercel.json or Vercel Dashboard
{
  "crons": [
    {
      "path": "/api/cron/alert-check",
      "schedule": "*/5 * * * *"  // Every 5 minutes
    }
  ]
}
```

Or use Vercel Cron Jobs:
1. Go to Vercel Dashboard → Project → Cron Jobs
2. Add new cron job:
   - Path: `/api/cron/alert-check`
   - Schedule: `*/5 * * * *` (every 5 minutes)
   - Authorization: Set `CRON_SECRET` header

## Sentry Alert Configuration

### Setting Up Alert Rules in Sentry

1. **Go to Sentry Dashboard** → Your Project → Alerts

2. **Create Alert Rules**:

   **Error Rate Alert:**
   - Condition: Issue count > 10 in 5 minutes
   - Filter: `tags[alert_type] = error_rate`
   - Action: Send notification

   **Latency Alert:**
   - Condition: Issue count > 5 in 5 minutes
   - Filter: `tags[alert_type] = latency`
   - Action: Send notification

   **AI Failure Alert:**
   - Condition: Issue count > 3 in 5 minutes
   - Filter: `tags[alert_type] = ai_failure_rate`
   - Action: Send notification

   **Database Error Alert:**
   - Condition: Issue count > 5 in 5 minutes
   - Filter: `tags[alert_type] = db_error_rate`
   - Action: Send notification

   **Workflow Failure Alert:**
   - Condition: Issue count > 3 in 5 minutes
   - Filter: `tags[alert_type] = workflow_failure_rate`
   - Action: Send notification

3. **Configure Notification Channels**:
   - Email: Add team email addresses
   - Slack: Connect Slack workspace
   - PagerDuty: Connect PagerDuty integration
   - Webhook: Send to custom endpoint

### Alert Filtering

Alerts are automatically tagged with:
- `alert_type`: Type of alert (error_rate, latency, ai_failure_rate, etc.)
- `error_rate`: Current error rate (for error rate alerts)
- `metric`: Metric name (p95, p99 for latency alerts)

Use these tags to filter and route alerts appropriately.

## Customizing Thresholds

Edit `lib/alerts/index.ts` to adjust thresholds:

```typescript
export const ALERT_THRESHOLDS = {
  ERROR_RATE_PERCENT: 1,        // Change to desired percentage
  P95_LATENCY_MS: 2000,        // Change to desired milliseconds
  P99_LATENCY_MS: 5000,        // Change to desired milliseconds
  AI_FAILURE_RATE_PERCENT: 5,  // Change to desired percentage
  DB_ERROR_RATE_PERCENT: 1,    // Change to desired percentage
  WORKFLOW_FAILURE_RATE_PERCENT: 10, // Change to desired percentage
} as const
```

## Testing Alerts

### Test Error Rate Alert
```bash
# Trigger multiple errors to exceed threshold
for i in {1..20}; do
  curl -X POST https://your-app.com/api/invalid-endpoint
done

# Then run alert check
curl -X POST https://your-app.com/api/alerts/check \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Latency Alert
```bash
# Add artificial delay to an endpoint, then call alert check
```

## Monitoring Alert Health

Check alert system health:
```bash
# View recent alerts in Sentry dashboard
# Or check metrics:
curl https://your-app.com/api/metrics?name=http_errors_total
```

## Best Practices

1. **Set Appropriate Thresholds**: Start conservative and adjust based on actual metrics
2. **Use Multiple Channels**: Don't rely on a single notification channel
3. **Review Alerts Regularly**: Tune thresholds to reduce false positives
4. **Document Alert Procedures**: Create runbooks for common alert scenarios
5. **Test Alerting**: Periodically test that alerts are working correctly

## Troubleshooting

### Alerts Not Firing
1. Check that `CRON_SECRET` is set correctly
2. Verify Sentry DSN is configured
3. Check Sentry alert rules are active
4. Verify notification channels are configured

### Too Many Alerts
1. Increase thresholds in `ALERT_THRESHOLDS`
2. Add filters in Sentry alert rules
3. Use alert rate limiting in Sentry

### Missing Alerts
1. Check alert check cron job is running
2. Verify metrics are being collected
3. Check Sentry alert rules are configured correctly
