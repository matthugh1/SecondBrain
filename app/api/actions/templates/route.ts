import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/auth/utils'
import * as templateRepo from '@/lib/db/repositories/action-templates'
import { executeTemplate } from '@/lib/services/action-templates'

export async function GET(request: NextRequest) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }
    const { tenantId } = tenantCheck

    const templates = await templateRepo.getAllActionTemplates(tenantId)

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Error fetching templates:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }
    const { tenantId, userId } = tenantCheck

    const body = await request.json()
    const { name, description, actions, parameters, execute } = body

    if (!name || !actions || !Array.isArray(actions)) {
      return NextResponse.json(
        { error: 'name and actions array are required' },
        { status: 400 }
      )
    }

    const templateId = await templateRepo.createActionTemplate(tenantId, {
      name,
      description,
      actions,
      parameters,
    })

    // Execute template if requested
    if (execute) {
      const result = await executeTemplate(tenantId, templateId, userId, parameters)
      if (!result.success) {
        return NextResponse.json(
          { error: 'Template execution failed', errors: result.errors },
          { status: 500 }
        )
      }
    }

    const template = await templateRepo.getActionTemplateById(tenantId, templateId)

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Error creating template:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
