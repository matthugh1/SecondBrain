---
name: build-and-commit
description: Automates the process of building the application and committing changes to GitHub.
---

# Build and Commit Skill

This skill provides instructions for ensuring a successful build before committing and pushing changes to the repository.

## Prerequisites

- Git must be installed and configured.
- The project must have a `build` script in `package.json`.

## Instructions

### 1. Run the Build

Execute the build command to ensure there are no compilation errors or linting issues.

```bash
npm run build
```

### 2. Verify Build Success

Check the output of the build command. If the build fails (non-zero exit code), **do not proceed** with committing changes. Fix the issues and return to step 1.

### 3. Stage and Commit Changes

If the build is successful, stage your changes and create a descriptive commit message.

```bash
git add .
git commit -m "feat: [describe your changes]"
```

### 4. Push to GitHub

Push the committed changes to the remote repository.

```bash
git push origin [branch-name]
```

> [!TIP]
> Always verify which branch you are on using `git branch` before pushing.
