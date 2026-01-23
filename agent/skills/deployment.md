---
name: deployment
description: Comprehensive deployment guide for SecondBrain application. Covers CI/CD via GitHub Actions, database migrations, pre-deployment checks, environment management, and rollback procedures. Use when deploying, releasing, or making production changes.
---

# Deployment Skill

This skill provides comprehensive guidance for deploying the SecondBrain application to production, including CI/CD workflows, database migrations, environment management, and safety procedures.

## When to Use

Trigger this skill when:
- User asks to "deploy", "release", or "ship to production"
- User wants to push changes that require database migrations
- User needs to verify deployment readiness
- User asks about CI/CD, GitHub Actions, or deployment pipeline
- User needs to rollback a deployment
- User asks about environment variables or secrets management

## Deployment Architecture

### Current Setup

- **Platform**: Vercel (hosting)
- **CI/CD**: GitHub Actions (`.github/workflows/vercel-deploy.yml`)
- **Database**: PostgreSQL via Prisma
- **Migrations**: Prisma Migrate (automated in CI/CD)
- **Environments**: Preview (PRs) and Production (main branch)

### Deployment Flow

```
1. Code Push → GitHub
2. GitHub Actions Triggered
3. Lint & Test Job
4. Database Migration Job (production only)
5. Build & Deploy Job
6. Vercel Deployment
```

## Pre-Deployment Checklist

Before deploying, verify:

### 1. Code Quality
- [ ] All TypeScript errors resolved (`npm run build` succeeds)
- [ ] Linting passes (`npm run lint`)
- [ ] Tests pass (if applicable)
- [ ] No console errors or warnings

### 2. Database Schema
- [ ] Schema changes committed to `prisma/schema.prisma`
- [ ] Migration files created (`npm run db:migrate`)
- [ ] Migration SQL reviewed for safety
- [ ] Migration files committed to git

### 3. Environment Variables
- [ ] Required secrets set in GitHub Secrets:
  - `DATABASE_URL` (pooled connection)
  - `DIRECT_URL` (direct connection for migrations)
  - `VERCEL_TOKEN`
  - `VERCEL_ORG_ID`
  - `VERCEL_PROJECT_ID`
- [ ] Environment variables set in Vercel Dashboard
- [ ] No sensitive data in code or config files

### 4. Dependencies
- [ ] `package.json` and `package-lock.json` in sync
- [ ] No missing dependencies
- [ ] Prisma Client generated (`npm run db:generate`)

## Deployment Methods

### Method 1: GitHub Actions (Recommended)

**Automatic Deployment:**
- Push to `main` branch → Production deployment
- Create PR → Preview deployment

**Manual Deployment:**
1. Go to GitHub Actions → "Vercel CLI Deployment Pipeline"
2. Click "Run workflow"
3. Select environment (preview/production)
4. Select branch (optional)
5. Run workflow

**What Happens:**
1. `lint-and-test` job runs (linting, type checking)
2. `migrate-database` job runs (for production, applies pending migrations)
3. `deploy-production` or `deploy-preview` job runs (builds and deploys)

### Method 2: Vercel CLI (Local)

**For Quick Testing:**
```bash
# Preview deployment
vercel deploy

# Production deployment
vercel deploy --prod
```

**Note**: This bypasses CI/CD checks and migrations. Use only for testing.

## Database Migrations

### ⚠️ CRITICAL: Never Use `prisma db push` in Production

**Why:**
- Can cause data loss
- No migration history
- Can't be rolled back
- Not safe for production

### Migration Workflow

#### Development

1. **Make schema changes** in `prisma/schema.prisma`

2. **Create migration**:
   ```bash
   npm run db:migrate
   # This creates a migration file and applies it locally
   ```

3. **Review migration SQL**:
   ```bash
   # Check the generated SQL in prisma/migrations/[timestamp]_[name]/migration.sql
   cat prisma/migrations/*/migration.sql
   ```

4. **Commit migration files**:
   ```bash
   git add prisma/migrations/
   git add prisma/schema.prisma
   git commit -m "feat: add new field to model"
   ```

#### CI/CD (Automatic)

When you push to `main`:
1. GitHub Actions detects pending migrations
2. Runs `npm run db:migrate:status` to check status
3. If pending migrations exist, runs `npm run db:migrate:deploy`
4. Verifies migration success
5. Proceeds with deployment only if migrations succeed

**Migration Job Details:**
- Uses `DIRECT_URL` for migrations (bypasses connection pooling)
- Baselines existing databases (marks initial migration as applied if needed)
- Fails deployment if migrations fail
- Runs before code deployment

### Migration Best Practices

1. **Always test migrations locally first**
   ```bash
   npm run db:migrate
   npm run db:migrate:status
   ```

2. **Use descriptive migration names**
   ```bash
   npm run db:migrate -- --name add_idempotency_key_to_workflows
   ```

3. **Review generated SQL** before committing

4. **For breaking changes**, use multi-step migrations:
   - Add new column → Migrate data → Remove old column

5. **For large migrations**, consider:
   - Splitting into multiple migrations
   - Running during low-traffic periods
   - Using background jobs for data migrations

## Environment Variables

### GitHub Secrets (CI/CD)

Required secrets in GitHub repository settings:

- `DATABASE_URL`: Pooled database connection (for app)
- `DIRECT_URL`: Direct database connection (for migrations)
- `PRISMA_DATABASE_URL`: Same as `DATABASE_URL` (for Prisma)
- `POSTGRES_URL`: Same as `DIRECT_URL` (for Prisma)
- `VERCEL_TOKEN`: Vercel API token
- `VERCEL_ORG_ID`: Vercel organization ID
- `VERCEL_PROJECT_ID`: Vercel project ID

**To add secrets:**
```bash
gh secret set DATABASE_URL --body "your-connection-string"
gh secret set DIRECT_URL --body "your-direct-connection-string"
# ... etc
```

### Vercel Environment Variables

Set in Vercel Dashboard → Project → Settings → Environment Variables

**Required for Production:**
- All database connection strings
- API keys (OpenAI, Anthropic, etc.)
- NextAuth secrets
- Integration tokens (Slack, Gmail, etc.)
- `NEXT_PUBLIC_APP_URL`

**Environment-Specific:**
- Preview: Can use test/staging values
- Production: Must use production values

## Deployment Process

### Step-by-Step Guide

1. **Verify Pre-Deployment Checklist** (see above)

2. **Commit and Push Changes**:
   ```bash
   git add .
   git commit -m "feat: your feature description"
   git push origin main
   ```

3. **Monitor GitHub Actions**:
   - Go to: https://github.com/[org]/[repo]/actions
   - Watch workflow execution
   - Check for failures

4. **Verify Deployment**:
   - Check deployment URL
   - Test critical functionality
   - Monitor error logs

### Deployment Jobs

#### 1. lint-and-test
- Runs on all pushes and PRs
- Generates Prisma Client
- Runs linter (warnings allowed)
- Type checks TypeScript
- **Must pass** for deployment to proceed

#### 2. migrate-database
- Runs only on `main` branch (production)
- Checks for pending migrations
- Baselines existing databases if needed
- Applies pending migrations
- Verifies migration success
- **Must pass** for production deployment

#### 3. deploy-preview
- Runs on pull requests
- Builds preview deployment
- Deploys to Vercel preview
- Comments PR with preview URL

#### 4. deploy-production
- Runs on `main` branch
- Requires `lint-and-test` and `migrate-database` to pass
- Builds production deployment
- Deploys to Vercel production
- Creates deployment summary

## Rollback Procedures

### Quick Rollback (Code Only)

1. **Revert code commit**:
   ```bash
   git revert [commit-hash]
   git push origin main
   ```

2. **Or redeploy previous version**:
   - Go to Vercel Dashboard → Deployments
   - Find previous successful deployment
   - Click "Promote to Production"

### Database Rollback

**Option 1: Create Reverse Migration**
```bash
# 1. Create new migration that reverses changes
npm run db:migrate -- --name rollback_previous_migration

# 2. Edit migration.sql to reverse changes
# 3. Commit and push
# 4. CI/CD will apply reverse migration
```

**Option 2: Point-in-Time Recovery (Vercel Postgres)**
1. Go to Vercel Dashboard → Storage → Your Database
2. Use "Restore" feature
3. Select point in time before migration
4. Restore database

**Option 3: Manual SQL Rollback**
```bash
# Connect to database and manually reverse changes
# Only if you know exactly what to reverse
```

### Emergency Rollback

1. **Stop new deployments** (if needed):
   - Disable GitHub Actions workflow temporarily
   - Or add a check that prevents deployment

2. **Revert code**:
   ```bash
   git revert [bad-commit]
   git push origin main
   ```

3. **Rollback database** (if needed):
   - Use one of the methods above

4. **Verify rollback**:
   - Test application functionality
   - Check error logs
   - Monitor metrics

## Troubleshooting

### Common Issues

#### "Build Failed"
- **Cause**: TypeScript errors, missing dependencies, Prisma issues
- **Fix**: Run `npm run build` locally, fix errors, commit and push

#### "Migration Failed"
- **Cause**: Database connection issues, migration conflicts, schema mismatch
- **Fix**: 
  - Check `DIRECT_URL` is correct
  - Verify database is accessible
  - Review migration SQL for issues
  - Check migration status: `npm run db:migrate:status`

#### "Environment Variable Not Found"
- **Cause**: Missing secret in GitHub or Vercel
- **Fix**: Add missing variable to GitHub Secrets or Vercel Dashboard

#### "Vercel Authentication Failed"
- **Cause**: Invalid `VERCEL_TOKEN`, `VERCEL_ORG_ID`, or `VERCEL_PROJECT_ID`
- **Fix**: Regenerate token in Vercel Dashboard, update GitHub Secrets

#### "Database Connection Failed"
- **Cause**: Incorrect `DATABASE_URL`, network issues, connection pool exhausted
- **Fix**: 
  - Verify connection strings
  - Check database is running
  - Review connection pool settings

### Debugging Deployment

1. **Check GitHub Actions logs**:
   - Go to Actions → Failed workflow → Failed job → View logs

2. **Check Vercel logs**:
   - Go to Vercel Dashboard → Deployments → Failed deployment → View logs

3. **Test locally**:
   ```bash
   npm run build
   npm run db:migrate:status
   ```

4. **Verify environment variables**:
   ```bash
   # Check GitHub Secrets are set
   gh secret list
   
   # Check Vercel environment variables
   vercel env ls
   ```

## Safety Features

### 1. Migration Safety
- Migrations run **before** code deployment
- Deployment fails if migrations fail
- Uses `DIRECT_URL` to avoid connection pool issues
- Baselines existing databases automatically

### 2. Build Safety
- TypeScript type checking
- Linting (warnings allowed, errors block)
- Prisma Client generation verified

### 3. Deployment Safety
- Preview deployments for PRs (non-destructive)
- Production deployments require `main` branch
- Manual workflow dispatch available for control

## Best Practices

### 1. Always Test Locally First
```bash
npm run build
npm run db:migrate:status
npm run lint
```

### 2. Use Descriptive Commit Messages
```bash
git commit -m "feat: add idempotency key to workflows"
git commit -m "fix: resolve TypeScript error in capture service"
```

### 3. Review Migration SQL
Always review `prisma/migrations/*/migration.sql` before committing.

### 4. Monitor Deployments
- Watch GitHub Actions workflow
- Check Vercel deployment logs
- Verify application after deployment

### 5. Use Feature Flags
For risky changes, use feature flags to enable/disable gradually.

### 6. Document Breaking Changes
If a migration or code change is breaking, document it clearly.

## Related Skills

- `vercel-deploy`: CLI-based deployment (for local testing)
- `db-management`: Database operations and migrations
- `environment-setup`: Environment variable management
- `build-and-commit`: Pre-deployment build and commit workflow

## Quick Reference

### Deployment Commands
```bash
# Create migration
npm run db:migrate -- --name migration_name

# Check migration status
npm run db:migrate:status

# Build locally
npm run build

# Deploy via GitHub (push to main)
git push origin main

# Deploy via Vercel CLI (testing only)
vercel deploy --prod
```

### GitHub Actions Workflow
- **File**: `.github/workflows/vercel-deploy.yml`
- **Triggers**: Push to main, PRs, manual dispatch
- **Jobs**: lint-and-test, migrate-database, deploy-preview, deploy-production

### Migration Files
- **Location**: `prisma/migrations/`
- **Format**: `[timestamp]_[name]/migration.sql`
- **Baseline**: `prisma/migrations/*_initial_schema_baseline/`

## Summary

✅ **Do:**
- Use GitHub Actions for deployments
- Create migrations for schema changes
- Test locally before deploying
- Review migration SQL
- Monitor deployment logs
- Use descriptive commit messages

❌ **Don't:**
- Use `prisma db push` in production
- Skip migration testing
- Deploy without reviewing changes
- Commit sensitive data
- Deploy during high-traffic periods (for risky changes)
