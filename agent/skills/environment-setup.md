---
name: environment-setup
description: Skill for verifying and setting up the project environment variables.
---

# Environment Setup Skill

This skill ensures the development environment is correctly configured with necessary API keys and database strings.

## Required Environment Variables

Check your `.env.local` file for the following keys:

| Variable | Description | Source |
|----------|-------------|--------|
| `DATABASE_URL` | SQLite connection string | `file:./data/secondbrain.db` |
| `OPENAI_API_KEY` | Key for OpenAI models | OpenAI Dashboard |
| `ANTHROPIC_API_KEY`| Key for Claude models | Anthropic Console |
| `NEXTAUTH_SECRET` | Secret for auth encryption | Generate via openssl |
| `NEXTAUTH_URL` | Base URL of the app | `http://localhost:3000` |

## Setup Steps

### 1. Initialize `.env.local`
If `.env.local` is missing, copy it from the example:
```bash
cp .env.local.copy.example .env.local
```

### 2. Validate AI API Keys
Ensure that at least one of `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` is present and valid for the classification logic to work.

### 3. Check Database Path
Ensure the `DATABASE_URL` points to a valid writable directory (default: `./data/secondbrain.db`).

> [!IMPORTANT]
> Never commit `.env` or `.env.local` files to GitHub. They are already included in `.gitignore`.
