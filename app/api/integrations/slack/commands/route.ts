import { NextRequest, NextResponse } from 'next/server'
import * as integrationsRepo from '@/lib/db/repositories/integrations'
import * as adminRepo from '@/lib/db/repositories/admin'
import * as projectsRepo from '@/lib/db/repositories/projects'
import { executeQuery } from '@/lib/services/query-engine'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { command, text, user_id, team_id } = body

    // Map Slack team ID to tenant (simplified - would need proper mapping)
    const tenantId = team_id

    if (command === '/secondbrain') {
      const subcommand = text?.split(' ')[0]?.toLowerCase()

      switch (subcommand) {
        case 'tasks':
        case 'task': {
          const tasks = await adminRepo.getAllAdmin(tenantId, false)
          const activeTasks = tasks.filter(t => !t.due_date || new Date(t.due_date) >= new Date())
          const taskList = activeTasks.slice(0, 10).map(t => `• ${t.name}${t.due_date ? ` (due ${new Date(t.due_date).toLocaleDateString()})` : ''}`).join('\n')
          return NextResponse.json({
            response_type: 'ephemeral',
            text: `*Your Tasks:*\n${taskList || 'No active tasks'}`,
          })
        }

        case 'projects': {
          const projects = await projectsRepo.getAllProjects(tenantId, false)
          const activeProjects = projects.filter(p => p.status !== 'Done')
          const projectList = activeProjects.slice(0, 10).map(p => `• ${p.name} (${p.status})`).join('\n')
          return NextResponse.json({
            response_type: 'ephemeral',
            text: `*Your Projects:*\n${projectList || 'No active projects'}`,
          })
        }

        case 'search': {
          const query = text?.substring(subcommand.length + 1) || ''
          if (!query) {
            return NextResponse.json({
              response_type: 'ephemeral',
              text: 'Usage: /secondbrain search <query>',
            })
          }

          const results = await executeQuery(tenantId, query, true, 5)
          const resultList = results.results.slice(0, 5).map(r => 
            `• ${r.title} (${r.item_type})`
          ).join('\n')

          return NextResponse.json({
            response_type: 'ephemeral',
            text: `*Search Results for "${query}":*\n${resultList || 'No results found'}`,
          })
        }

        default:
          return NextResponse.json({
            response_type: 'ephemeral',
            text: 'Available commands: tasks, projects, search <query>',
          })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error handling Slack command:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
