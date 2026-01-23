---
name: code-audit
description: Skill for maintaining code health, linting, and removing debug artifacts.
---

# Code Health Skill

This skill assists in keeping the codebase clean, readable, and free of temporary development artifacts.

## Regular Maintenance

### 1. Linting
Run the linter to catch syntax issues and style violations.
```bash
npm run lint
```

### 2. Log Removal
Search for and remove unnecessary `console.log` or `console.dir` statements that were used during debugging.

### 3. Debug File Cleanup
Ensure temporary files like `jwt-debug.ts` or local test scripts are not staged for commit unless explicitly intended.

### 4. Dependency Check
Periodically check for unused dependencies in `package.json`.

## Best Practices

- **Descriptive Commits**: Use conventional commits (feat:, fix:, chore:).
- **Small PRs**: Keep changes focused on a single feature or bug fix.
- **Documentation**: Update `README.md` and `SKILLS` if your changes introduce new workflows.

> [!NOTE]
> Consistency is key. Following these steps before every `build-and-commit` cycle ensures high code quality.
