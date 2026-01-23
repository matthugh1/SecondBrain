---
name: vercel-deploy
description: Deploy the SecondBrain application to Vercel using CLI. Use when user asks to deploy, publish, or push to production/preview. Handles pre-flight checks, environment setup, building, and deployment via Vercel CLI commands. Supports both preview and production deployments.
---

# Vercel Deployment Skill

Execute deployments to Vercel using the CLI-based pipeline. This skill handles the complete deployment workflow from pre-flight checks to final deployment.

## When to Use

Trigger this skill when the user:
- Asks to "deploy", "publish", or "push to production"
- Wants to deploy to "preview" or "staging"
- Requests a deployment without specifying method
- Asks to "ship" or "release" the application

## Pre-Flight Checklist

Before deploying, verify these conditions:

1. **Build Success**: Run `npm run build` and confirm it completes without errors
2. **Linting**: Run `npm run lint` (warnings are acceptable, but fix critical errors)
3. **Type Checking**: Run `npx tsc --noEmit` to ensure no TypeScript errors
4. **Database Schema**: Run `npm run db:generate` to ensure Prisma client is up to date
5. **Vercel Link**: Ensure project is linked (`vercel link` has been run, `.vercel/project.json` exists)
6. **Environment Variables**: Verify required variables are set in Vercel Dashboard

## Deployment Workflow

### Step 1: Determine Deployment Target

Ask the user or infer from context:
- **Preview**: For testing, PRs, or staging environments
- **Production**: For live/production deployments

If unclear, default to **preview** for safety.

### Step 2: Pre-Flight Checks

Execute these checks in order:

```bash
# 1. Generate Prisma Client
npm run db:generate

# 2. Run build (this will fail fast if there are issues)
npm run build

# 3. Type check (optional but recommended)
npx tsc --noEmit || echo "Type check completed with warnings"
```

**If any check fails**: Stop deployment, report the error, and ask user if they want to proceed anyway.

### Step 3: Pull Environment Variables

Pull the appropriate environment configuration:

**For Preview:**
```bash
npm run vercel:pull:preview
```

**For Production:**
```bash
npm run vercel:pull:production
```

This ensures local environment matches Vercel's configuration.

### Step 4: Build Project

Build the project using Vercel CLI:

**For Preview:**
```bash
npm run vercel:build
```

**For Production:**
```bash
npm run vercel:build:prod
```

### Step 5: Deploy

Execute the deployment:

**For Preview:**
```bash
npm run vercel:deploy:preview
```

**For Production:**
```bash
npm run vercel:deploy:production
```

### Step 6: Report Results

After deployment completes:
1. Extract and display the deployment URL from the output
2. Confirm deployment status (success/failure)
3. Provide link to view deployment in Vercel Dashboard

## Quick Commands Reference

### Preview Deployment (Full Pipeline)
```bash
npm run vercel:deploy:preview
```

### Production Deployment (Full Pipeline)
```bash
npm run vercel:deploy:production
```

### Step-by-Step (if needed)
```bash
# Pull environment
npm run vercel:pull:preview  # or :production

# Build
npm run vercel:build  # or :build:prod

# Deploy
npm run vercel:deploy  # or :deploy:prod
```

## Error Handling

### Common Issues

**"Project not linked"**
- Solution: Run `npm run vercel:link` or `vercel link`
- Verify `.vercel/project.json` exists

**"Authentication required"**
- Solution: Run `vercel login`
- Verify with `vercel whoami`

**"Build failed"**
- Check build logs for specific errors
- Common causes: TypeScript errors, missing dependencies, Prisma issues
- Fix errors before retrying deployment

**"Environment variables missing"**
- Verify variables are set in Vercel Dashboard
- Check variable names match exactly (case-sensitive)
- Ensure variables are set for correct environment (preview/production)

**"Database connection failed"**
- Verify `DATABASE_URL` and `DIRECT_URL` are set correctly
- Check database is accessible from Vercel
- For migrations, ensure `DIRECT_URL` is used

## Deployment Options

### Via GitHub Actions (Alternative)

If user prefers GitHub-based deployment:
1. Push changes to GitHub
2. Preview: Create a pull request (auto-deploys)
3. Production: Push to `main` branch (auto-deploys)

### Manual GitHub Workflow

For deploying specific commits/branches:
1. Go to GitHub Actions → "Vercel CLI Manual Deployment"
2. Select environment and branch
3. Run workflow

## Important Notes

- **Database Migrations**: Always run migrations before deploying schema changes
- **Environment Variables**: Production and preview use separate environments
- **Build Time**: First deployment may take longer due to dependency installation
- **Rollback**: Use Vercel Dashboard to promote previous deployment if needed

## Verification

After deployment, verify:
1. Deployment URL is accessible
2. Application loads correctly
3. Database connections work
4. Environment variables are loaded
5. API routes respond correctly

## Related Skills

- `build-and-commit`: For building and committing before deployment
- `environment-setup`: For verifying environment configuration
- `db-management`: For database migrations before deployment
