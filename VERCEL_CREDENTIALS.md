# Vercel CLI Credentials Storage Guide

This document explains where Vercel CLI credentials are stored and how to manage them.

## Credential Types

There are three types of credentials needed for Vercel CLI deployments:

1. **Authentication Token** (`VERCEL_TOKEN`) - For API access
2. **Organization ID** (`VERCEL_ORG_ID`) - Your Vercel organization
3. **Project ID** (`VERCEL_PROJECT_ID`) - Your specific project

## Storage Locations

### 1. Local Development (Your Machine)

#### Authentication Token
**Location**: Stored automatically by Vercel CLI in your home directory
- **macOS/Linux**: `~/.vercel/auth.json`
- **Windows**: `%USERPROFILE%\.vercel\auth.json`

**How it's created**: Automatically when you run `vercel login`

**View current user**:
```bash
vercel whoami
```

**Re-authenticate if needed**:
```bash
vercel logout
vercel login
```

#### Project Configuration
**Location**: `.vercel/project.json` (in your project directory)

**Contents**:
```json
{
  "orgId": "your-org-id",
  "projectId": "your-project-id"
}
```

**How it's created**: When you run `vercel link` or `npm run vercel:link`

**Status**: Already in `.gitignore` - **DO NOT commit this file**

**View credentials**:
```bash
cat .vercel/project.json
```

### 2. GitHub Actions (CI/CD)

**Location**: GitHub Repository Secrets

**Path**: Repository → Settings → Secrets and variables → Actions

**Required Secrets**:
- `VERCEL_TOKEN` - Get from [Vercel Account → Tokens](https://vercel.com/account/tokens)
- `VERCEL_ORG_ID` - From `.vercel/project.json` (`orgId` field)
- `VERCEL_PROJECT_ID` - From `.vercel/project.json` (`projectId` field)

**How to add**:
1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add each secret with the exact names above

**Security**: These secrets are encrypted and only accessible to GitHub Actions workflows

### 3. Optional: Local Environment Variables

If you want to use credentials in local scripts (not recommended for most cases):

**Location**: `.env.local` (already in `.gitignore`)

**Example**:
```bash
VERCEL_TOKEN=your-token-here
VERCEL_ORG_ID=your-org-id
VERCEL_PROJECT_ID=your-project-id
```

**Note**: This is usually unnecessary since `vercel login` handles authentication automatically.

## Getting Your Credentials

### Step 1: Get VERCEL_TOKEN

1. Go to [Vercel Account → Tokens](https://vercel.com/account/tokens)
2. Click "Create Token"
3. Give it a name (e.g., "GitHub Actions")
4. Copy the token immediately (you won't see it again)
5. Store it in GitHub Secrets as `VERCEL_TOKEN`

### Step 2: Get VERCEL_ORG_ID and VERCEL_PROJECT_ID

**Option A: From linked project** (Recommended)
```bash
# Link your project (if not already linked)
npm run vercel:link

# View the credentials
cat .vercel/project.json
```

**Option B: From Vercel Dashboard**
1. Go to your project in [Vercel Dashboard](https://vercel.com/dashboard)
2. Go to Settings → General
3. Scroll down to find:
   - **Team ID** = `VERCEL_ORG_ID`
   - **Project ID** = `VERCEL_PROJECT_ID`

## Security Best Practices

### ✅ DO:
- Keep `.vercel/` directory in `.gitignore` (already done)
- Store GitHub Secrets securely
- Use separate tokens for different purposes
- Rotate tokens periodically
- Use environment-specific tokens when possible

### ❌ DON'T:
- Commit `.vercel/project.json` to git
- Commit `VERCEL_TOKEN` to git
- Share tokens in chat/email
- Use the same token for multiple projects
- Store tokens in code comments

## Credential Management

### For Local Development

**Automatic (Recommended)**:
- Just run `vercel login` once
- Credentials are stored securely by Vercel CLI
- No manual management needed

**Manual (If needed)**:
- Store in `.env.local` (not recommended)
- Or pass via command line: `vercel --token=your-token`

### For GitHub Actions

**Required Setup**:
1. Create token in Vercel Dashboard
2. Add to GitHub Secrets
3. Workflow automatically uses them

**Viewing Secrets**:
- GitHub doesn't allow viewing secret values (security feature)
- If you forget, create a new token and update the secret

### Rotating Credentials

**If token is compromised**:
1. Go to [Vercel Account → Tokens](https://vercel.com/account/tokens)
2. Delete the old token
3. Create a new token
4. Update GitHub Secrets with new token

**If project is re-linked**:
```bash
# Remove old link
rm -rf .vercel

# Re-link project
npm run vercel:link

# Update GitHub Secrets with new IDs if they changed
```

## Troubleshooting

### "Authentication required"
```bash
vercel login
```

### "Project not linked"
```bash
npm run vercel:link
```

### "Invalid token" in GitHub Actions
1. Verify token exists in Vercel Dashboard
2. Check token hasn't expired
3. Verify secret name is exactly `VERCEL_TOKEN` (case-sensitive)
4. Create new token and update secret

### "Organization/Project not found"
1. Verify `VERCEL_ORG_ID` matches your team ID
2. Verify `VERCEL_PROJECT_ID` matches your project ID
3. Check you have access to the organization/project
4. Re-link project: `npm run vercel:link`

## Quick Reference

| Credential | Local Storage | GitHub Storage | How to Get |
|------------|--------------|----------------|------------|
| `VERCEL_TOKEN` | `~/.vercel/auth.json` (auto) | GitHub Secrets | Vercel Dashboard → Tokens |
| `VERCEL_ORG_ID` | `.vercel/project.json` | GitHub Secrets | From `.vercel/project.json` |
| `VERCEL_PROJECT_ID` | `.vercel/project.json` | GitHub Secrets | From `.vercel/project.json` |

## Verification

**Check local authentication**:
```bash
vercel whoami
```

**Check project link**:
```bash
cat .vercel/project.json
```

**Test deployment**:
```bash
npm run vercel:deploy:preview
```

**Check GitHub Secrets** (via GitHub UI):
- Repository → Settings → Secrets and variables → Actions
- Should see: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
