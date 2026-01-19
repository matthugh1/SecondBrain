# Deployment Guide - Multi-tenant Auth on Vercel

## Overview

This application has been migrated from SQLite to Vercel Postgres with Prisma, and includes multi-tenant authentication using Auth.js (NextAuth).

## Environment Variables

Add these environment variables in your Vercel project settings:

### Required

- `DATABASE_URL` - Vercel Postgres connection string (provided by Vercel)
- `DIRECT_URL` - Vercel Postgres direct connection string (for migrations, provided by Vercel)
- `AUTH_SECRET` - Secret key for NextAuth (generate with `openssl rand -base64 32`)
- `NEXTAUTH_URL` - Your app URL (e.g., `https://your-app.vercel.app`)

### Optional (existing)

- `AI_PROVIDER` - Either `openai` or `anthropic`
- `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` - Your AI provider API key
- `NEXT_PUBLIC_APP_URL` - Your app URL (same as NEXTAUTH_URL)
- `CRON_SECRET` - Secret for protecting cron endpoints

## Setup Steps

1. **Create Vercel Postgres Database**
   - In Vercel dashboard, go to Storage → Create Database → Postgres
   - Copy the `DATABASE_URL` and `DIRECT_URL` from the connection string

2. **Run Database Migrations**
   ```bash
   npm install
   npm run db:generate  # Generate Prisma client
   npm run db:push      # Push schema to database (or use migrate for production)
   ```

3. **Set Environment Variables**
   - Add all required environment variables in Vercel dashboard
   - For local development, create `.env.local` with the same variables

4. **Deploy**
   ```bash
   vercel deploy
   ```

## Database Schema

The Prisma schema includes:
- Auth.js models (User, Account, Session, VerificationToken)
- Multi-tenant models (Tenant, Membership, Invite)
- All domain models with `tenantId` for isolation

## Authentication

- Users can register at `/auth/register`
- Users can sign in at `/auth/signin`
- Each user gets a default tenant/workspace on registration
- Users can belong to multiple tenants via memberships

## Tenant Isolation

All data operations are scoped by `tenantId`:
- API routes require authentication and extract tenant from session
- Repositories filter all queries by `tenantId`
- Services accept `tenantId` as first parameter

## Runtime Configuration

- API routes use Node.js runtime (required for Prisma)
- Ensure `runtime = 'nodejs'` in `vercel.json` if needed

## Notes

- The first user to register becomes the owner of their default tenant
- Tenant switching UI is partially implemented (API route exists at `/api/tenants/switch`)
- Some features (tags, action history) may need additional tenant-aware updates
