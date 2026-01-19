import { NextRequest, NextResponse } from 'next/server'
import { requireTenantOrApiKey } from '@/lib/auth/utils'
import * as adminRepo from '@/lib/db/repositories/admin'

export async function GET(request: NextRequest) {
  // Allow unauthenticated access to list tools, but require auth for execution
  return NextResponse.json({
    tools: [
      {
        name: 'list_tasks_due_today',
        description: 'Lists all admin tasks that are due today and provides a navigation URL to view them on the admin page',
        parameters: {},
      },
      {
        name: 'list_tasks_due_on_date',
        description: 'Lists all admin tasks due on a specific date and provides a navigation URL to view them on the admin page',
        parameters: {
          date: {
            type: 'string',
            description: 'Date in YYYY-MM-DD format',
            required: true,
          },
        },
      },
    ],
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tool, parameters, tenantId: bodyTenantId } = body
    
    // Check authentication (pass body to allow tenantId from request)
    const tenantCheck = await requireTenantOrApiKey(request, { tenantId: bodyTenantId })
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }

    const { tenantId } = tenantCheck

    if (!tool) {
      return NextResponse.json(
        { error: 'Tool name is required' },
        { status: 400 }
      )
    }

    let tasks: any[] = []
    let navigationUrl = '/admin'

    switch (tool) {
      case 'list_tasks_due_today': {
        const today = new Date().toISOString().split('T')[0]
        tasks = await adminRepo.getAdminTasksDueOnDate(tenantId, today)
        navigationUrl = `/admin?dueDate=${today}`
        break
      }

      case 'list_tasks_due_on_date': {
        const { date } = parameters || {}
        if (!date) {
          return NextResponse.json(
            { error: 'Date parameter is required' },
            { status: 400 }
          )
        }
        // Validate date format (YYYY-MM-DD)
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
          return NextResponse.json(
            { error: 'Invalid date format. Expected YYYY-MM-DD' },
            { status: 400 }
          )
        }
        tasks = await adminRepo.getAdminTasksDueOnDate(tenantId, date)
        navigationUrl = `/admin?dueDate=${date}`
        break
      }

      default:
        return NextResponse.json(
          { error: `Unknown tool: ${tool}` },
          { status: 400 }
        )
    }

    return NextResponse.json({
      tasks,
      navigationUrl,
      count: tasks.length,
    })
  } catch (error) {
    console.error('Error executing MCP tool:', error)
    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
