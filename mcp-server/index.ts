#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js'

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || 'http://localhost:3000'
const MCP_API_KEY = process.env.MCP_API_KEY
const MCP_TENANT_ID = process.env.MCP_TENANT_ID

async function callApiEndpoint(endpoint: string, body: any, tenantId?: string): Promise<any> {
  const url = `${MCP_SERVER_URL}${endpoint}`
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  // Add API key if provided
  if (MCP_API_KEY) {
    headers['Authorization'] = `Bearer ${MCP_API_KEY}`
  }

  // Add tenantId to request body if provided (for API key auth)
  const requestBody = { ...body }
  if (tenantId || MCP_TENANT_ID) {
    requestBody.tenantId = tenantId || MCP_TENANT_ID
  }

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
      const response = await fetch(`${MCP_SERVER_URL}/api/mcp/tools`, {
        method: 'GET',
        headers: MCP_API_KEY
          ? { Authorization: `Bearer ${MCP_API_KEY}` }
          : {},
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
      // Get tenantId from arguments if provided, otherwise use env variable
      const tenantId = (args as any)?.tenantId || MCP_TENANT_ID
      
      const result = await callApiEndpoint(
        '/api/mcp/tools',
        {
          tool: name,
          parameters: args || {},
        },
        tenantId
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
