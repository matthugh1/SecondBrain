---
name: code-audit
description: Skill for maintaining code health, linting, and removing debug artifacts.
---

# Code Health Skill

This skill assists in keeping the codebase clean, readable, and free of temporary development artifacts.

## Regular Maintenance

### 1. Linting
Run the linter to catch syntax issues and style violations.
```bash
npm run lint
```

### 2. Log Removal
Search for and remove unnecessary `console.log` or `console.dir` statements that were used during debugging.

### 3. Debug File Cleanup
Ensure temporary files like `jwt-debug.ts` or local test scripts are not staged for commit unless explicitly intended.

### 4. Dependency Check
Periodically check for unused dependencies in `package.json`.

## Security & Quality Checks

Before committing, verify:

### 1. API Route Security
- [ ] All routes use `requireTenant()` or `requireTenantOrApiKey()`
- [ ] No `tenantId` accepted from request body
- [ ] Rate limiting applied to expensive/auth endpoints
- [ ] Request validation with Zod schemas (POST/PATCH/PUT)
- [ ] Error handling with `handleError()` in catch blocks
- [ ] Webhook endpoints verify signatures
- [ ] Cron endpoints require CRON_SECRET

**Reference**: See `api-route-security.md` skill

### 2. Multi-Tenant Security
- [ ] All database queries include `tenantId` filter
- [ ] Repository methods require `tenantId` parameter
- [ ] Service methods accept `tenantId` as first parameter
- [ ] Related data queries filter by `tenantId`

**Reference**: See `multi-tenant-security.md` skill

### 3. Request Validation
- [ ] Zod schemas created for all POST/PATCH/PUT routes
- [ ] `validateRequest` called before processing
- [ ] Validated data used (not raw body)
- [ ] String fields have min/max length
- [ ] Numeric fields have range validation

**Reference**: See `request-validation.md` skill

### 4. Error Handling
- [ ] All routes wrapped in try/catch
- [ ] `handleError` used in catch blocks
- [ ] No raw error messages sent to client
- [ ] No stack traces in responses

**Reference**: See `error-handling.md` skill

## Best Practices

- **Descriptive Commits**: Use conventional commits (feat:, fix:, chore:).
- **Small PRs**: Keep changes focused on a single feature or bug fix.
- **Documentation**: Update `README.md` and `SKILLS` if your changes introduce new workflows.
- **Security First**: Always follow security patterns - see skills above.

> [!NOTE]
> Consistency is key. Following these steps before every `build-and-commit` cycle ensures high code quality and security.
