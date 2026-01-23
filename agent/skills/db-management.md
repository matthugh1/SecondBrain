---
name: db-management
description: Skill for managing Prisma migrations, client generation, and database seeding.
---

# Database Management Skill

This skill provides instructions for maintaining the project's SQLite database and Prisma ORM.

## Prerequisites

- Node.js and npm installed.
- Prisma CLI installed (usually via `devDependencies`).

## Common Commands

### 1. Generate Prisma Client
Always run this after changing `prisma/schema.prisma` to update the TypeScript types.
```bash
npm run db:generate
```

### 2. Create and Apply Migrations
Use this when you make schema changes that need to be reflected in the database.
```bash
npm run db:migrate
```

### 3. Push Schema (Dev Only)
Quickly push schema changes to the local database without creating a migration file.
```bash
npm run db:push
```

### 4. Seed Calendar Data
Specific to this project, use this to populate the calendar table.
```bash
npm run db:seed-calendar
```

### 5. Open Prisma Studio
Visualize and edit your data in the browser.
```bash
npm run db:studio
```

> [!WARNING]
> Be careful when running `db:push` or `db:migrate` on a database with existing data. Always ensure you have a backup if the changes are destructive.
