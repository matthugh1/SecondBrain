# Database Migration Strategy for CI/CD

## Current Issues

⚠️ **Problem**: Your `package.json` build script uses `prisma db push` which:
- Is **NOT safe for production** (can cause data loss)
- Doesn't create migration history
- Can't be rolled back
- Doesn't work well with multiple environments

## Recommended Approach: Prisma Migrate

### Strategy Overview

1. **Development**: Create migrations locally with `prisma migrate dev`
2. **CI/CD**: Apply migrations automatically before deployment
3. **Production**: Use `prisma migrate deploy` (read-only, safe)
4. **Rollback**: Keep migration files for rollback capability

---

## Implementation Plan

### Phase 1: Set Up Proper Migration Workflow

#### 1. Update Build Script (Remove `db push`)

**Current (❌ Bad):**
```json
"build": "prisma generate && (prisma db push --skip-generate --accept-data-loss || echo 'Database push skipped') && next build"
```

**Recommended (✅ Good):**
```json
"build": "prisma generate && next build",
"db:migrate:deploy": "prisma migrate deploy",
"db:migrate:status": "prisma migrate status"
```

#### 2. Create Migration Job in GitHub Actions

Add a separate migration job that runs **before** deployment:

```yaml
migrate-database:
  name: Run Database Migrations
  runs-on: ubuntu-latest
  if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/master'
  
  steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Generate Prisma Client
      run: npm run db:generate

    - name: Check Migration Status
      run: npm run db:migrate:status
      env:
        DATABASE_URL: ${{ secrets.DATABASE_URL }}
        DIRECT_URL: ${{ secrets.DIRECT_URL }}
      continue-on-error: true

    - name: Deploy Migrations
      run: npm run db:migrate:deploy
      env:
        DATABASE_URL: ${{ secrets.DATABASE_URL }}
        DIRECT_URL: ${{ secrets.DIRECT_URL }}
      continue-on-error: false

    - name: Verify Migration Success
      run: npm run db:migrate:status
      env:
        DATABASE_URL: ${{ secrets.DATABASE_URL }}
        DIRECT_URL: ${{ secrets.DIRECT_URL }}
```

#### 3. Update Production Deployment Job

Make deployment depend on successful migration:

```yaml
deploy-production:
  name: Deploy Production (CLI)
  runs-on: ubuntu-latest
  needs: [lint-and-test, migrate-database]  # Add migrate-database dependency
  # ... rest of deployment steps
```

---

## Migration Workflow

### Development Workflow

1. **Make schema changes** in `prisma/schema.prisma`
2. **Create migration**:
   ```bash
   npm run db:migrate
   # This will:
   # - Create a migration file in prisma/migrations/
   # - Apply it to your local database
   # - Regenerate Prisma Client
   ```
3. **Commit migration files**:
   ```bash
   git add prisma/migrations/
   git add prisma/schema.prisma
   git commit -m "feat: add idempotencyKey to WorkflowExecution"
   ```

### CI/CD Workflow

1. **On push to main**:
   - Lint & test runs
   - **Migration job runs** (applies pending migrations)
   - If migration succeeds → deployment proceeds
   - If migration fails → deployment is blocked

2. **Preview environments**:
   - Can use `prisma db push` for quick testing (optional)
   - Or run migrations if you want to test migration process

---

## Safety Features

### 1. Migration Status Check

Before deploying, check if migrations are pending:

```bash
npm run db:migrate:status
```

This will show:
- ✅ Applied migrations
- ⚠️ Pending migrations
- ❌ Migration errors

### 2. Dry Run (Optional)

For critical migrations, test locally first:

```bash
# Test migration against production database (read-only)
DATABASE_URL="your-production-url" npx prisma migrate status
```

### 3. Backup Before Migration

For production migrations, consider:

```bash
# Backup database before migration
# (Vercel Postgres has automatic backups, but manual backup is extra safety)
```

### 4. Rollback Strategy

**Option A: Create Down Migration**
```bash
# Manually create rollback SQL in prisma/migrations/rollback/
```

**Option B: Use Vercel Postgres Point-in-Time Recovery**
- Vercel Postgres supports PITR
- Can restore to before migration

**Option C: Create Reverse Migration**
```bash
# Create a new migration that reverses changes
npm run db:migrate
# Edit the migration file to reverse changes
```

---

## Environment-Specific Configuration

### Production
- ✅ Use `prisma migrate deploy` (read-only, safe)
- ✅ Run migrations **before** code deployment
- ✅ Fail deployment if migrations fail
- ✅ Use `DIRECT_URL` for migrations (bypasses connection pooling)

### Preview/Staging
- ✅ Use `prisma migrate deploy` (same as production)
- ✅ Test migrations before production
- ✅ Can use separate database

### Development
- ✅ Use `prisma migrate dev` (creates migrations)
- ✅ Can use `prisma db push` for rapid prototyping (not committed)

---

## Updated package.json Scripts

```json
{
  "scripts": {
    "build": "prisma generate && next build",
    "postinstall": "prisma generate",
    
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:migrate:deploy": "prisma migrate deploy",
    "db:migrate:status": "prisma migrate status",
    "db:push": "prisma db push",
    "db:studio": "prisma studio",
    "db:seed-calendar": "tsx prisma/seed-calendar.ts",
    
    "db:migrate:reset": "prisma migrate reset",
    "db:migrate:resolve": "prisma migrate resolve"
  }
}
```

---

## GitHub Actions Workflow Update

### Full Migration Job Example

```yaml
migrate-database:
  name: Run Database Migrations
  runs-on: ubuntu-latest
  if: |
    (github.ref == 'refs/heads/main' || github.ref == 'refs/heads/master') &&
    github.event_name != 'pull_request'
  
  steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Generate Prisma Client
      run: npm run db:generate

    - name: Check for pending migrations
      id: check-migrations
      run: |
        STATUS=$(npm run db:migrate:status 2>&1 || true)
        echo "$STATUS"
        if echo "$STATUS" | grep -q "Database schema is up to date"; then
          echo "has_pending=false" >> $GITHUB_OUTPUT
        else
          echo "has_pending=true" >> $GITHUB_OUTPUT
        fi
      env:
        DATABASE_URL: ${{ secrets.DATABASE_URL }}
        DIRECT_URL: ${{ secrets.DIRECT_URL }}

    - name: Deploy migrations
      if: steps.check-migrations.outputs.has_pending == 'true'
      run: npm run db:migrate:deploy
      env:
        DATABASE_URL: ${{ secrets.DATABASE_URL }}
        DIRECT_URL: ${{ secrets.DIRECT_URL }}

    - name: Verify migration success
      run: npm run db:migrate:status
      env:
        DATABASE_URL: ${{ secrets.DATABASE_URL }}
        DIRECT_URL: ${{ secrets.DIRECT_URL }}
```

---

## Migration Best Practices

### 1. Always Test Migrations Locally First

```bash
# 1. Create migration locally
npm run db:migrate

# 2. Test against local database
npm run db:migrate:status

# 3. Test rollback (if needed)
# Edit migration file or create reverse migration

# 4. Commit migration files
git add prisma/migrations/
git commit -m "feat: add new field"
```

### 2. Use Descriptive Migration Names

```bash
# Good
prisma migrate dev --name add_idempotency_key_to_workflows

# Bad
prisma migrate dev --name update_schema
```

### 3. Review Migration SQL

Always review the generated SQL in `prisma/migrations/*/migration.sql` before committing.

### 4. Handle Breaking Changes Carefully

For breaking changes:
- Create migration in multiple steps
- Add new column → migrate data → remove old column
- Use feature flags if possible

### 5. Monitor Migration Performance

For large migrations:
- Test on staging first
- Monitor execution time
- Consider running during low-traffic periods
- Use `--skip-generate` if needed

---

## Vercel-Specific Considerations

### 1. Use DIRECT_URL for Migrations

Vercel provides two connection strings:
- `DATABASE_URL`: Pooled connection (for app)
- `DIRECT_URL`: Direct connection (for migrations)

**Always use `DIRECT_URL` for migrations** to avoid connection pool issues.

### 2. Migration Timeout

Vercel Postgres migrations should complete quickly. For long-running migrations:
- Consider splitting into multiple migrations
- Use background jobs for data migrations
- Use Vercel's database dashboard for manual operations

### 3. Environment Variables

Ensure these are set in GitHub Secrets:
- `DATABASE_URL` (for app)
- `DIRECT_URL` (for migrations)

---

## Rollback Procedures

### Quick Rollback (Last Migration)

1. **Identify the migration to rollback**:
   ```bash
   npm run db:migrate:status
   ```

2. **Create reverse migration**:
   ```bash
   npm run db:migrate
   # Edit the generated migration file to reverse changes
   ```

3. **Apply reverse migration**:
   ```bash
   npm run db:migrate:deploy
   ```

### Emergency Rollback (Vercel Postgres)

1. **Use Point-in-Time Recovery**:
   - Go to Vercel Dashboard → Storage → Your Database
   - Use "Restore" feature to restore to before migration

2. **Redeploy previous code version**:
   - Revert code deployment
   - Database will be at previous state

---

## Migration Checklist

Before deploying a migration:

- [ ] Migration tested locally
- [ ] Migration SQL reviewed
- [ ] Migration name is descriptive
- [ ] Migration files committed to git
- [ ] Backup considered (for production)
- [ ] Rollback plan documented
- [ ] Team notified (for production migrations)
- [ ] Migration tested on staging (if available)

---

## Example: Current Migration (idempotencyKey)

For the `idempotencyKey` field you just added:

```bash
# 1. Create migration
npm run db:migrate --name add_idempotency_key_to_workflow_executions

# 2. Review generated SQL in prisma/migrations/[timestamp]_add_idempotency_key_to_workflow_executions/migration.sql

# 3. Commit migration
git add prisma/migrations/
git commit -m "feat: add idempotencyKey to WorkflowExecution"

# 4. Push to GitHub (CI/CD will apply migration)
git push origin main
```

---

## Summary

✅ **Do:**
- Use `prisma migrate dev` for development
- Use `prisma migrate deploy` for production
- Run migrations **before** code deployment
- Commit migration files to git
- Test migrations locally first
- Use `DIRECT_URL` for migrations

❌ **Don't:**
- Use `prisma db push` in production
- Skip migration testing
- Deploy code before migrations
- Forget to commit migration files
- Run migrations manually in production (use CI/CD)

---

## Next Steps

1. **Update package.json** (remove `db push` from build)
2. **Create initial migration** for current schema state
3. **Add migration job** to GitHub Actions
4. **Test migration workflow** on staging/preview
5. **Document rollback procedures** for your team
