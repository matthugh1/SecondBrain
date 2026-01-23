# Vercel CLI Deployment Pipeline Guide

This guide explains how to set up and use the **Vercel CLI-based** deployment pipeline for the SecondBrain application.

## Overview

This project uses **Vercel CLI** for all deployments, giving you full control over the deployment process. The deployment pipeline includes:

- **Vercel Configuration** (`vercel.json`) - Build settings, cron jobs, and function configurations
- **GitHub Actions Workflow** (`.github/workflows/vercel-deploy.yml`) - Automated CI/CD pipeline using Vercel CLI
- **NPM Scripts** - Convenient CLI commands for local deployments
- **Build Scripts** - Prisma client generation and Next.js build process

> **Note:** If you want to use CLI-only deployments and disable Vercel's automatic GitHub deployments, go to Vercel Dashboard → Your Project → Settings → Git → Disconnect the repository. Your GitHub Actions workflow will still deploy using Vercel CLI.

## Quick Start

### Option 1: GitHub Actions CI/CD Pipeline (Recommended)

The GitHub Actions workflow uses Vercel CLI to automatically deploy on every push. This is the recommended approach for production.

**Setup Steps:**

1. **Install Vercel CLI and Link Project** (one-time setup)
   ```bash
   # Install Vercel CLI globally
   npm i -g vercel
   
   # Login to Vercel
   vercel login
   
   # Link your project (creates .vercel/project.json)
   npm run vercel:link
   ```

2. **Get Vercel Credentials**
   - Get `VERCEL_TOKEN` from [Vercel Settings → Tokens](https://vercel.com/account/tokens)
   - Get `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` from `.vercel/project.json` after linking
   - See `VERCEL_CREDENTIALS.md` for detailed credential storage information

3. **Add GitHub Secrets**
   Go to your GitHub repository → Settings → Secrets and variables → Actions
   
   Add these secrets:
   - `VERCEL_TOKEN` - Your Vercel API token
   - `VERCEL_ORG_ID` - From `.vercel/project.json`
   - `VERCEL_PROJECT_ID` - From `.vercel/project.json`

4. **Configure Environment Variables in Vercel Dashboard**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard) → Your Project → Settings → Environment Variables
   - Add all required variables (see below)

5. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Setup Vercel CLI deployment pipeline"
   git push origin main
   ```

The workflow will automatically:
- Run linting and type checking
- Create preview deployments for pull requests
- Deploy to production on pushes to `main`/`master`

### Option 2: Manual Deployment via CLI

Use these commands for local deployments:

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Login to Vercel (if not already logged in)
vercel login

# Link project (first time only)
npm run vercel:link

# Pull environment variables
npm run vercel:pull

# Deploy preview
npm run vercel:deploy:preview

# Deploy to production
npm run vercel:deploy:production
```

**Available NPM Scripts:**

- `npm run vercel:link` - Link project to Vercel
- `npm run vercel:pull` - Pull environment variables (default: development)
- `npm run vercel:pull:preview` - Pull preview environment variables
- `npm run vercel:pull:production` - Pull production environment variables
- `npm run vercel:build` - Build project locally
- `npm run vercel:build:prod` - Build for production
- `npm run vercel:deploy` - Deploy preview (interactive)
- `npm run vercel:deploy:prod` - Deploy to production (interactive)
- `npm run vercel:deploy:preview` - Full preview deployment pipeline
- `npm run vercel:deploy:production` - Full production deployment pipeline

### Option 3: Direct Vercel CLI Commands

For more control, use Vercel CLI directly:

```bash
# Pull environment variables
vercel pull --yes --environment=preview
vercel pull --yes --environment=production

# Build project
vercel build                    # Preview build
vercel build --prod            # Production build

# Deploy
vercel deploy                   # Preview deployment
vercel deploy --prod           # Production deployment
vercel deploy --prebuilt --prod # Deploy pre-built artifacts
```

## Required Environment Variables

Set these in Vercel Dashboard → Settings → Environment Variables:

### Database
- `DATABASE_URL` - Vercel Postgres connection string (provided by Vercel)
- `DIRECT_URL` - Vercel Postgres direct connection string (for migrations)

### Authentication
- `AUTH_SECRET` - Secret key for NextAuth
  ```bash
  openssl rand -base64 32
  ```
- `NEXTAUTH_URL` - Your app URL (e.g., `https://your-app.vercel.app`)
- `NEXT_PUBLIC_APP_URL` - Same as NEXTAUTH_URL

### AI Provider (Optional)
- `AI_PROVIDER` - Either `openai` or `anthropic`
- `OPENAI_API_KEY` - If using OpenAI
- `ANTHROPIC_API_KEY` - If using Anthropic

### Cron Jobs (Optional)
- `CRON_SECRET` - Secret for protecting cron endpoints

## Initial Project Setup

### First-Time Setup

**Quick Setup (Recommended):**
```bash
# Run the automated setup script
npm run vercel:setup
```

This script will:
- Check/install Vercel CLI
- Verify authentication
- Link your project to Vercel
- Provide next steps for GitHub secrets and environment variables

**Manual Setup:**

1. **Create Vercel Project** (if not already created)
   ```bash
   # Install and login
   npm i -g vercel
   vercel login
   
   # Link or create project
   vercel link
   # Follow prompts to:
   # - Select or create organization
   # - Select or create project
   # - Link to existing project or create new one
   ```

2. **Set Up Database**
   - In Vercel Dashboard → Storage → Create Database → Postgres
   - Copy `DATABASE_URL` and `DIRECT_URL` connection strings
   - Add them as environment variables in Vercel Dashboard

3. **Configure Environment Variables**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add all required variables (see "Required Environment Variables" section)
   - Set them for all environments (Production, Preview, Development)

4. **Run Database Migrations**
   ```bash
   # Pull production environment variables
   npm run vercel:pull:production
   
   # Generate Prisma Client
   npm run db:generate
   
   # Push schema to database
   npm run db:push
   
   # Or run migrations
   npx prisma migrate deploy
   ```

## GitHub Actions Setup

The GitHub Actions workflow uses Vercel CLI for all deployments. To enable it:

1. **Get Vercel Credentials**
   ```bash
   # Install Vercel CLI and login
   npm i -g vercel
   vercel login
   
   # Link your project (creates .vercel/project.json)
   vercel link
   ```

2. **Extract Credentials**
   ```bash
   # View project configuration
   cat .vercel/project.json
   # You'll see:
   # {
   #   "orgId": "your-org-id",
   #   "projectId": "your-project-id"
   # }
   ```

3. **Add GitHub Secrets**
   Go to your GitHub repository → Settings → Secrets and variables → Actions
   
   Add these secrets:
   - `VERCEL_TOKEN` - Get from [Vercel Settings → Tokens](https://vercel.com/account/tokens)
   - `VERCEL_ORG_ID` - From `.vercel/project.json` (`orgId` field)
   - `VERCEL_PROJECT_ID` - From `.vercel/project.json` (`projectId` field)

4. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Setup Vercel CLI deployment pipeline"
   git push origin main
   ```

The workflow will automatically:
- Run linting and type checking on every push/PR
- Create preview deployments for pull requests (using `vercel deploy`)
- Deploy to production on pushes to `main`/`master` (using `vercel deploy --prod`)
- Comment on PRs with preview deployment URLs

## Database Setup

### 1. Create Vercel Postgres Database

1. In Vercel Dashboard → Storage → Create Database → Postgres
2. Copy the `DATABASE_URL` and `DIRECT_URL` connection strings
3. Add them as environment variables

### 2. Run Migrations

**Option A: Using Vercel CLI (Recommended)**
```bash
# Set environment variables locally
export DATABASE_URL="your-database-url"
export DIRECT_URL="your-direct-url"

# Generate Prisma Client
npm run db:generate

# Push schema to database
npm run db:push

# Or run migrations (for production)
npx prisma migrate deploy
```

**Option B: Using Prisma Studio**
```bash
npm run db:studio
```

**Option C: Using Vercel Postgres Dashboard**
- Use the SQL editor in Vercel Dashboard

## Build Process

The build process automatically:
1. Installs dependencies (`npm install`)
2. Generates Prisma Client (`prisma generate` via `postinstall` script)
3. Builds Next.js application (`next build`)

### Build Configuration

The `vercel.json` file includes:
- **Build Command**: `npm run build` (includes Prisma generation)
- **Framework**: Next.js (auto-detected)
- **Regions**: `iad1` (US East)
- **Function Timeout**: 30 seconds for API routes
- **Cron Jobs**: Daily digest (9 AM) and weekly review (4 PM Sunday)

## Cron Jobs

The application includes two scheduled cron jobs:

1. **Daily Digest** (`/api/cron/daily-digest`)
   - Schedule: `0 9 * * *` (9:00 AM daily)
   - Protected by `CRON_SECRET` environment variable

2. **Weekly Review** (`/api/cron/weekly-review`)
   - Schedule: `0 16 * * 0` (4:00 PM every Sunday)
   - Protected by `CRON_SECRET` environment variable

To protect cron endpoints, add `CRON_SECRET` to your environment variables and verify it in your cron route handlers.

## Deployment Control & Options

You have **full control** over deployments with multiple options:

### 1. Automatic Deployments (GitHub Actions)

**Preview Deployments:**
- Automatically created for pull requests
- Uses `vercel deploy` command via CLI
- Preview URL is commented on the PR

**Production Deployments:**
- Automatically deployed on push to `main`/`master`
- Uses `vercel deploy --prod` command via CLI
- Can require approval (see "Deployment Protection" below)
- Deployment summary is added to workflow run

### 2. Manual Deployments via GitHub UI

**From Main Workflow:**
- Go to Actions → "Vercel CLI Deployment Pipeline" → "Run workflow"
- Choose environment (preview/production)
- Optionally specify a branch
- Click "Run workflow"

**From Manual Deployment Workflow (Full Control):**
- Go to Actions → "Vercel CLI Manual Deployment" → "Run workflow"
- Choose environment (preview/production)
- Specify branch or commit SHA
- Optionally skip tests
- Click "Run workflow"

This gives you complete control to:
- Deploy any branch or commit
- Deploy to production without pushing to main
- Skip tests if needed
- Deploy specific commits for rollbacks

### 3. Local CLI Deployments

**Preview Deployment:**
```bash
# Quick preview deployment
npm run vercel:deploy:preview

# Or step by step
npm run vercel:pull:preview
npm run vercel:build
npm run vercel:deploy
```

**Production Deployment:**
```bash
# Full production deployment pipeline
npm run vercel:deploy:production

# Or step by step
npm run vercel:pull:production
npm run vercel:build:prod
npm run vercel:deploy:prod
```

### 4. Deployment Protection

To require manual approval for production deployments:

1. Go to GitHub repository → Settings → Environments
2. Create or edit "production" environment
3. Enable "Required reviewers"
4. Add yourself or team members as reviewers

Now production deployments will pause and wait for approval before deploying.

### 5. Disabling Automatic Deployments

To disable automatic deployments and only deploy manually:

**Option A: Comment out triggers in workflow**
Edit `.github/workflows/vercel-deploy.yml` and comment out the `push` trigger:
```yaml
on:
  # push:  # Disabled - use manual deployments only
  #   branches:
  #     - main
  #     - master
  pull_request:
    branches:
      - main
      - master
  workflow_dispatch:
```

**Option B: Use only manual workflow**
Use `.github/workflows/vercel-deploy-manual.yml` exclusively and disable the main workflow.

### Development
```bash
npm run dev
```

**Important:** Always ensure database migrations are run before deploying code changes that require schema updates.

## Troubleshooting

### Build Failures

**Prisma Client Not Generated**
- Ensure `postinstall` script runs: `npm run db:generate`
- Check that `DATABASE_URL` is set correctly

**Type Errors**
- Run `npm run db:generate` locally
- Ensure TypeScript types are up to date

**Environment Variables Missing**
- Verify all required variables are set in Vercel Dashboard
- Check variable names match exactly (case-sensitive)

### Database Connection Issues

**Connection Timeout**
- Verify `DATABASE_URL` and `DIRECT_URL` are correct
- Check Vercel Postgres database is active
- Ensure IP allowlist includes Vercel IPs (usually automatic)

**Migration Failures**
- Use `DIRECT_URL` for migrations (not `DATABASE_URL`)
- Run migrations manually if needed: `npx prisma migrate deploy`

### Cron Job Issues

**Cron Jobs Not Running**
- Verify cron configuration in `vercel.json`
- Check `CRON_SECRET` is set if your endpoints require it
- Review Vercel cron logs in dashboard

## Monitoring

- **Deployments**: View in Vercel Dashboard → Deployments
- **Logs**: View in Vercel Dashboard → Logs
- **Analytics**: Enable in Vercel Dashboard → Analytics
- **Database**: Monitor in Vercel Dashboard → Storage → Your Database

## Best Practices

1. **Environment Variables**
   - Never commit `.env` files
   - Use Vercel Dashboard for production variables
   - Use `.env.local` for local development

2. **Database Migrations**
   - Run migrations before deploying code changes
   - Use `prisma migrate deploy` for production
   - Test migrations in preview deployments first

3. **Deployment Strategy**
   - Use preview deployments for testing
   - Deploy to production during low-traffic periods
   - Monitor deployments for errors

4. **Security**
   - Rotate `AUTH_SECRET` and `CRON_SECRET` regularly
   - Use strong, unique secrets
   - Enable Vercel's DDoS protection

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)
- [GitHub Actions](https://docs.github.com/en/actions)

## Support

For issues or questions:
1. Check Vercel deployment logs
2. Review GitHub Actions workflow runs
3. Check application logs in Vercel Dashboard
