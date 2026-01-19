# Vercel Deployment Pipeline Guide

This guide explains how to set up and use the Vercel deployment pipeline for the SecondBrain application.

## Overview

The deployment pipeline includes:
- **Vercel Configuration** (`vercel.json`) - Build settings, cron jobs, and function configurations
- **GitHub Actions Workflow** (`.github/workflows/vercel-deploy.yml`) - Automated CI/CD pipeline
- **Build Scripts** - Prisma client generation and Next.js build process

## Quick Start

### Option 1: Automatic Deployment via Vercel Dashboard (Recommended)

1. **Connect Your Repository**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will automatically detect Next.js and configure the project

2. **Configure Environment Variables**
   - In Vercel project settings, go to "Environment Variables"
   - Add all required variables (see below)

3. **Deploy**
   - Vercel will automatically deploy on every push to `main`/`master`
   - Preview deployments are created for pull requests

### Option 2: Manual Deployment via CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (follow prompts)
vercel

# Deploy to production
vercel --prod
```

### Option 3: GitHub Actions CI/CD Pipeline

The GitHub Actions workflow provides automated testing and deployment.

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

## GitHub Actions Setup

To enable the CI/CD pipeline:

1. **Get Vercel Credentials**
   ```bash
   # Install Vercel CLI and login
   npm i -g vercel
   vercel login
   
   # Link your project
   vercel link
   
   # Get your tokens (or from Vercel dashboard)
   ```

2. **Add GitHub Secrets**
   Go to your GitHub repository → Settings → Secrets and variables → Actions
   
   Add these secrets:
   - `VERCEL_TOKEN` - Get from [Vercel Settings → Tokens](https://vercel.com/account/tokens)
   - `VERCEL_ORG_ID` - Found in `.vercel/project.json` after running `vercel link`
   - `VERCEL_PROJECT_ID` - Found in `.vercel/project.json` after running `vercel link`

3. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Add Vercel deployment pipeline"
   git push origin main
   ```

The workflow will:
- Run linting and type checking on every push/PR
- Create preview deployments for pull requests
- Deploy to production on pushes to `main`/`master`

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

## Deployment Workflow

### Development
```bash
npm run dev
```

### Preview Deployment
- Automatically created for pull requests
- Or manually: `vercel`

### Production Deployment
- Automatically deployed on push to `main`/`master`
- Or manually: `vercel --prod`

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
