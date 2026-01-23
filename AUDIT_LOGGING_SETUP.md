# Audit Logging Setup Guide

This document describes the comprehensive audit logging system for the SecondBrain application.

## Overview

The audit logging system automatically logs all create, update, and delete operations with full context including who performed the action, when, from where, and what changed.

## Database Schema

The `ActionHistory` table has been enhanced with audit fields:

- `user_id` - Who performed the action (sanitized)
- `request_id` - Request correlation ID
- `ip_address` - IP address of requester
- `user_agent` - User agent string
- `details` - Additional JSON context

## Features

### Automatic Audit Logging
- All mutations (create/update/delete) are automatically logged
- Includes full context: who, what, when, tenant, IP, user agent
- Request correlation via request ID
- Non-blocking: audit logging failures don't fail the operation

### Audit Log Contents
Each audit log entry includes:
- **Who**: userId (sanitized)
- **What**: actionType (create/update/delete), resource type, resource ID
- **When**: timestamp
- **Where**: IP address, user agent
- **Context**: requestId, old data, new data, additional details

### Searchable Audit Logs
- Search by userId, actionType, resource, resourceId
- Filter by date range
- Pagination support
- Statistics by action, resource, user

### Compliance
- 7-year retention (configured via data retention policies)
- Export capability (JSON/CSV)
- Immutable logs (no updates/deletes)

## Usage

### Automatic Logging

Audit logging is automatically integrated into repositories:

```typescript
// In lib/db/repositories/people.ts
export async function createPerson(tenantId: string, person: Person): Promise<number> {
  const result = await prisma.person.create({ /* ... */ })
  
  // Automatically logs with context
  await auditCreate(tenantId, 'people', result.id, person)
  
  return result.id
}
```

### Manual Audit Logging

For custom operations:

```typescript
import { auditLog, auditCreate, auditUpdate, auditDelete } from '@/lib/middleware/audit-log'

// Log a custom operation
await auditLog(tenantId, {
  action: 'create',
  resource: 'custom_resource',
  resourceId: 123,
  newData: { /* ... */ },
  details: { customField: 'value' },
})

// Or use helpers
await auditCreate(tenantId, 'people', personId, personData)
await auditUpdate(tenantId, 'projects', projectId, oldData, newData)
await auditDelete(tenantId, 'ideas', ideaId, oldData)
```

## API Endpoints

### GET /api/audit-logs
Search audit logs with filters.

**Query Parameters:**
- `userId` - Filter by user ID
- `actionType` - Filter by action type (create/update/delete)
- `resource` - Filter by resource type (people/projects/ideas/admin)
- `resourceId` - Filter by specific resource ID
- `startDate` - Start date (ISO 8601)
- `endDate` - End date (ISO 8601)
- `limit` - Results limit (1-1000, default: 100)
- `offset` - Pagination offset
- `includeStats` - Include statistics (true/false)

**Example:**
```bash
GET /api/audit-logs?actionType=delete&startDate=2024-01-01T00:00:00Z&limit=50
```

### GET /api/audit-logs/export
Export audit logs for compliance.

**Query Parameters:**
- `startDate` - Start date (ISO 8601, required)
- `endDate` - End date (ISO 8601, required)
- `format` - Export format: 'json' (default) or 'csv'

**Example:**
```bash
GET /api/audit-logs/export?startDate=2024-01-01T00:00:00Z&endDate=2024-12-31T23:59:59Z&format=csv
```

## Integration Points

### Repositories
Audit logging is integrated into:
- `lib/db/repositories/people.ts` - People CRUD operations
- `lib/db/repositories/projects.ts` - Projects CRUD operations
- (More repositories can be added incrementally)

### Request Context
Audit logs automatically include request context from `lib/logger/context.ts`:
- Request ID
- Tenant ID
- User ID
- IP Address
- User Agent

## Data Retention

### 7-Year Retention Policy
For compliance (e.g., SOC 2, GDPR), audit logs should be retained for 7 years.

**Implementation Options:**

1. **Database Retention** (Recommended):
   - Keep all logs in database
   - Archive old logs (> 1 year) to cold storage
   - Use database partitioning for performance

2. **External Archival**:
   - Export logs older than 1 year
   - Store in S3/Google Cloud Storage
   - Keep metadata in database for search

3. **Automated Cleanup** (Not Recommended):
   - Only if compliance doesn't require 7-year retention
   - Use `clearOldHistory()` function carefully

## Security Considerations

### Data Sanitization
- User IDs are sanitized (first 8 chars + '...')
- Tenant IDs are sanitized
- Sensitive data in oldData/newData should be redacted before logging

### Access Control
- Audit logs are tenant-isolated
- Users can only view their own tenant's audit logs
- Admin users may have broader access (future enhancement)

### Immutability
- Audit logs are never updated or deleted
- Only new entries are created
- This ensures audit trail integrity

## Performance

### Indexing
The following indexes are created for performance:
- `(tenantId, timestamp)` - Fast tenant queries by time
- `(userId, timestamp)` - Fast user activity queries
- `(actionType, timestamp)` - Fast action type queries
- `(requestId)` - Request correlation

### Query Optimization
- Use date ranges to limit query scope
- Use pagination for large result sets
- Consider archiving old logs (> 1 year) for better performance

## Future Enhancements

- [ ] UI for viewing audit logs
- [ ] Real-time audit log streaming
- [ ] Audit log alerts (suspicious activity detection)
- [ ] Integration with external SIEM systems
- [ ] Automated compliance reporting

## Related Files

- `lib/middleware/audit-log.ts` - Audit logging utilities
- `lib/db/repositories/actionHistory.ts` - ActionHistory repository
- `lib/db/repositories/audit-logs.ts` - Audit log search/export
- `app/api/audit-logs/route.ts` - Audit log API endpoint
- `app/api/audit-logs/export/route.ts` - Export endpoint
- `prisma/schema.prisma` - Database schema
