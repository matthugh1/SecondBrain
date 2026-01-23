# Deployment Control Guide

This document explains all the ways you can control deployments in this project.

## ✅ What Control You Have

### 1. **Full CLI Control**
- Deploy from your local machine using Vercel CLI
- Control exactly when deployments happen
- Deploy any branch or commit
- No dependency on GitHub integration

### 2. **Manual GitHub Actions Triggers**
- Deploy from GitHub UI without pushing code
- Choose environment (preview/production)
- Deploy specific branches or commits
- Option to skip tests

### 3. **Automatic Deployments (Optional)**
- Can be enabled/disabled as needed
- Automatic previews for PRs
- Automatic production on push to main
- Can require approval before production deploys

### 4. **Deployment Protection**
- Require manual approval before production deployments
- Protect specific environments
- Control who can approve deployments

## 🎛️ Control Options

### Option 1: Full Manual Control (Maximum Control)

**Disable automatic deployments:**
1. Edit `.github/workflows/vercel-deploy.yml`
2. Comment out the `push` trigger
3. Only use manual workflows or CLI

**Deploy only when you want:**
- Use `vercel-deploy-manual.yml` workflow from GitHub UI
- Or use CLI commands: `npm run vercel:deploy:production`

**Benefits:**
- Complete control over when deployments happen
- No accidental deployments
- Deploy specific commits/branches easily

### Option 2: Automatic with Approval (Balanced)

**Keep automatic deployments but require approval:**
1. Keep automatic triggers enabled
2. Set up GitHub Environment protection:
   - Settings → Environments → production
   - Enable "Required reviewers"
   - Add yourself as reviewer

**Benefits:**
- Automatic previews for testing
- Production requires your approval
- Still get automation benefits

### Option 3: Automatic Deployments (Maximum Automation)

**Keep everything automatic:**
- Preview deployments on PRs (automatic)
- Production deployments on push to main (automatic)
- No manual intervention needed

**Benefits:**
- Fastest deployment cycle
- Less manual work
- Good for continuous deployment

## 📋 Deployment Methods Comparison

| Method | Control Level | Speed | Use Case |
|--------|--------------|-------|----------|
| **Local CLI** | ⭐⭐⭐⭐⭐ | Fast | Full control, testing, emergency deploys |
| **Manual GitHub Workflow** | ⭐⭐⭐⭐⭐ | Medium | Deploy specific commits, rollbacks |
| **Automatic with Approval** | ⭐⭐⭐⭐ | Medium | Production safety with automation |
| **Fully Automatic** | ⭐⭐ | Fastest | Continuous deployment |

## 🚀 Quick Reference

### Deploy from Local Machine
```bash
# Preview
npm run vercel:deploy:preview

# Production
npm run vercel:deploy:production
```

### Deploy from GitHub UI
1. Go to Actions tab
2. Select "Vercel CLI Manual Deployment"
3. Choose environment and branch
4. Click "Run workflow"

### Deploy Specific Commit
```bash
# From GitHub UI - Manual workflow
# Set branch field to: commit SHA (e.g., abc123def)

# Or from CLI
git checkout <commit-sha>
npm run vercel:deploy:production
```

### Rollback Deployment
1. Find previous deployment in Vercel Dashboard
2. Click "Promote to Production"
3. Or use manual workflow with previous commit SHA

## 🔒 Security & Best Practices

1. **Never commit secrets** - Use GitHub Secrets and Vercel environment variables
2. **Require approval for production** - Set up environment protection
3. **Test in preview first** - Always test before production
4. **Monitor deployments** - Check Vercel Dashboard after deployments
5. **Use branches** - Deploy feature branches to preview before merging

## 🛠️ Customization

### Change Deployment Branch
Edit `.github/workflows/vercel-deploy.yml`:
```yaml
on:
  push:
    branches:
      - main
      - your-branch  # Add your branch
```

### Add Deployment Gates
Add custom checks before deployment:
```yaml
- name: Custom Check
  run: |
    # Your custom validation
    if [ "$SOME_CONDITION" != "true" ]; then
      echo "Deployment blocked"
      exit 1
    fi
```

### Deploy to Multiple Environments
Create additional workflows for staging, QA, etc.

## 📞 Need Help?

- See `VERCEL_DEPLOYMENT.md` for detailed setup instructions
- Check Vercel Dashboard for deployment logs
- Review GitHub Actions logs for workflow issues
