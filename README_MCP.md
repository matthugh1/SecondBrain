# MCP Server Setup

This document describes how to set up and use the Model Context Protocol (MCP) server for the SecondBrain application.

## Overview

The MCP server enables the chat interface to query and interact with admin tasks. It runs as a standalone Node.js process and communicates with the Next.js application via HTTP API routes.

## Architecture

```
Chat Client → MCP Server (stdio) → Next.js API Routes → Database
```

## Setup

### 1. Install Dependencies

The MCP server has its own `package.json` in the `mcp-server/` directory. Install its dependencies:

```bash
cd mcp-server
npm install
```

### 2. Configuration

Set the following environment variables:

- `MCP_SERVER_URL` - URL of your Next.js application (default: `http://localhost:3000`)
- `MCP_SERVICE_ACCOUNT_TOKEN` (recommended) - Service account token for secure authentication
- `MCP_API_KEY` (deprecated) - Legacy API key (requires active session, not recommended)

**Service Account Setup (Recommended):**

Service accounts are **automatically created** when a tenant is created. Each tenant gets a default "MCP Server" service account.

To get your service account token:

1. **Via API** (requires authenticated session):
   ```bash
   curl -X GET https://your-app.com/api/service-accounts \
     -H "Cookie: next-auth.session-token=<your-session>"
   ```
   Look for the service account named "MCP Server" and note its ID.

2. **Via Setup Script** (for local development):
   ```bash
   npx tsx scripts/create-service-account.ts
   ```
   This will create/retrieve a service account and automatically update `mcp-server/.env`.

3. **Set the token**:
   ```bash
   export MCP_SERVICE_ACCOUNT_TOKEN="sa_..."
   ```
   Or add it to `mcp-server/.env.local`:
   ```
   MCP_SERVICE_ACCOUNT_TOKEN=sa_...
   ```

**Note**: The token is only shown when the service account is first created. If you need a new token, create a new service account via the API.

The service account token securely includes tenant context - no need to set `MCP_TENANT_ID`

**Legacy API Key (Deprecated):**

The `MCP_API_KEY` method still works but requires an active user session and is less secure. It's recommended to migrate to service account tokens.

### 3. Running the Server

#### Development Mode

```bash
npm run mcp:dev
```

#### Production Mode

```bash
npm run mcp:start
```

Or directly:

```bash
cd mcp-server
tsx index.ts
```

## Available Tools

### `list_tasks_due_today`

Lists all admin tasks that are due today.

**Parameters:** None

**Returns:**
- `tasks`: Array of tasks with id, name, due_date, status, notes
- `navigationUrl`: URL to admin page with filter applied (e.g., `/admin?dueDate=2024-01-15`)
- `count`: Number of tasks found

### `list_tasks_due_on_date`

Lists all admin tasks due on a specific date.

**Parameters:**
- `date` (string, required): Date in YYYY-MM-DD format

**Returns:**
- `tasks`: Array of tasks with id, name, due_date, status, notes
- `navigationUrl`: URL to admin page with filter applied (e.g., `/admin?dueDate=2024-01-15`)
- `count`: Number of tasks found

## Integration with Chat Client

To use this MCP server with a chat client (like Cursor), configure it to run the server process:

```json
{
  "mcpServers": {
    "secondbrain": {
      "command": "npm",
      "args": ["run", "mcp:dev"],
      "cwd": "/path/to/SecondBrain"
    }
  }
}
```

## Authentication

The MCP server communicates with the Next.js API routes. Authentication is handled via:

1. **Service Account Token** (recommended): Secure, tenant-scoped token that doesn't require user sessions
   - Set `MCP_SERVICE_ACCOUNT_TOKEN` environment variable
   - Token format: `sa_<hex>` (e.g., `sa_a1b2c3d4...`)
   - Tokens can be revoked or expired
   - Automatically includes tenant context

2. **Legacy API Key** (deprecated): Requires active user session
   - Set `MCP_API_KEY` environment variable
   - Less secure, requires session management
   - Will be removed in a future version

## Troubleshooting

### Server won't start

- Ensure Node.js version 18+ is installed
- Check that dependencies are installed: `cd mcp-server && npm install`
- Verify `MCP_SERVER_URL` points to a running Next.js instance

### API requests failing

- Verify the Next.js app is running and accessible at `MCP_SERVER_URL`
- Check authentication (API key or session)
- Review server logs for detailed error messages

### Tools not appearing

- Ensure the Next.js API route `/api/mcp/tools` is accessible
- Check that the server can reach the Next.js application
- Verify authentication credentials are correct

## Future Enhancements

- Session-based authentication
- More tools (create task, update task, etc.)
- Support for other database types (people, projects, ideas)
- WebSocket transport option
- Auto-navigation option
