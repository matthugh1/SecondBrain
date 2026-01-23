#!/usr/bin/env node

// Load environment variables from .env file
import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { existsSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load .env.local first (if exists), then .env
const envLocalPath = resolve(__dirname, '.env.local')
const envPath = resolve(__dirname, '.env')

if (existsSync(envLocalPath)) {
  config({ path: envLocalPath })
} else if (existsSync(envPath)) {
  config({ path: envPath })
}

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js'

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:3000'
// Use service account token (preferred) or legacy API key
const MCP_SERVICE_ACCOUNT_TOKEN = process.env.MCP_SERVICE_ACCOUNT_TOKEN
const MCP_API_KEY = process.env.MCP_API_KEY // Legacy, deprecated

async function callApiEndpoint(endpoint: string, body: any): Promise<any> {
  const url = `${MCP_SERVER_URL}${endpoint}`
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  // Use service account token (preferred) or legacy API key
  if (MCP_SERVICE_ACCOUNT_TOKEN) {
    headers['Authorization'] = `Bearer ${MCP_SERVICE_ACCOUNT_TOKEN}`
  } else if (MCP_API_KEY) {
    // Legacy API key support (deprecated)
    console.warn('⚠️  Using legacy MCP_API_KEY. Please migrate to MCP_SERVICE_ACCOUNT_TOKEN')
    headers['Authorization'] = `Bearer ${MCP_API_KEY}`
  } else {
    throw new Error('MCP_SERVICE_ACCOUNT_TOKEN or MCP_API_KEY must be set')
  }

  // SECURITY: Service account token includes tenantId, no need to send in body
  const requestBody = { ...body }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`API request failed: ${response.status} ${errorText}`)
  }

  return response.json()
}

async function main() {
  const server = new Server(
    {
      name: 'secondbrain-mcp-server',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  )

  const transport = new StdioServerTransport()
  await server.connect(transport)

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    try {
      const headers: Record<string, string> = {}
      if (MCP_SERVICE_ACCOUNT_TOKEN) {
        headers['Authorization'] = `Bearer ${MCP_SERVICE_ACCOUNT_TOKEN}`
      } else if (MCP_API_KEY) {
        headers['Authorization'] = `Bearer ${MCP_API_KEY}`
      }

      const response = await fetch(`${MCP_SERVER_URL}/api/mcp/tools`, {
        method: 'GET',
        headers,
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch tools: ${response.status}`)
      }

      const data = await response.json()
      return {
        tools: data.tools.map((tool: any) => ({
          name: tool.name,
          description: tool.description,
          inputSchema: {
            type: 'object',
            properties: Object.entries(tool.parameters || {}).reduce(
              (acc, [key, value]: [string, any]) => {
                acc[key] = {
                  type: value.type || 'string',
                  description: value.description || '',
                }
                return acc
              },
              {} as Record<string, any>
            ),
            required: Object.entries(tool.parameters || {})
              .filter(([, value]: [string, any]) => value.required)
              .map(([key]) => key),
          },
        })),
      }
    } catch (error) {
      console.error('Error listing tools:', error)
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to list tools: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  })

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params

    try {
      // SECURITY: Service account token includes tenantId securely
      // No need to pass tenantId in request body
      const result = await callApiEndpoint(
        '/api/mcp/tools',
        {
          tool: name,
          parameters: args || {},
        }
      )

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                tasks: result.tasks,
                count: result.count,
                navigationUrl: result.navigationUrl,
              },
              null,
              2
            ),
          },
        ],
      }
    } catch (error) {
      console.error(`Error calling tool ${name}:`, error)
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to execute tool: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  })

  console.error('SecondBrain MCP Server running on stdio')
}

main().catch((error) => {
  console.error('Fatal error in MCP server:', error)
  process.exit(1)
})
