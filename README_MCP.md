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
- `MCP_API_KEY` (optional) - API key for authentication if not using sessions
- `MCP_TENANT_ID` (optional) - Default tenant ID to use when making API requests

You can set these in your `.env` file or as environment variables when running the server.

**Note:** If using API key authentication, you must either:
- Set `MCP_TENANT_ID` environment variable, OR
- Pass `tenantId` in the tool arguments

If neither is provided and no session is available, API requests will fail.

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

1. **API Key** (if `MCP_API_KEY` is set): The server sends the API key in the `Authorization` header
2. **Session-based** (future): Pass session tokens from the chat client

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
