---
name: vercel-deploy
description: Skill for pre-flight checks and deployment to Vercel.
---

# Vercel Deployment Skill

This skill guides the user through deploying the "Second Brain" application to Vercel.

## Pre-Flight Checklist

Before deploying, ensure the following are true:
- [ ] Local build succeeds: `npm run build`
- [ ] No linting errors: `npm run lint`
- [ ] Database schema is up to date: `npm run db:generate`
- [ ] `vercel.json` is configured correctly for Next.js.

## Deployment Commands

### 1. Deploy to Preview (Staging)
Use this to test changes in a Vercel environment before merging to production.
```bash
vercel
```

### 2. Promote to Production
Use this to deploy the current state of the main branch to production.
```bash
vercel --prod
```

## Important Considerations

- **Environment Variables**: Ensure all variables defined in `environment-setup.md` are also configured in the Vercel Project Settings.
- **Database**: Ensure your `DATABASE_URL` for production points to a managed database (like Neon, Supabase, or PlanetScale) since SQLite files are not persistent on Vercel's Serverless Functions.
