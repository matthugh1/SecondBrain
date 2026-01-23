import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/auth/utils'
import * as workflowsRepo from '@/lib/db/repositories/workflows'
import { validateRequest } from '@/lib/middleware/validate-request'
import { handleError } from '@/lib/middleware/error-handler'
import { createWorkflowSchema } from '@/lib/validation/schemas'

export async function GET(request: NextRequest) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }
    const { tenantId } = tenantCheck

    const searchParams = request.nextUrl.searchParams
    const enabledOnly = searchParams.get('enabled') === 'true'

    const workflows = await workflowsRepo.getAllWorkflows(tenantId, enabledOnly)

    return NextResponse.json({ workflows })
  } catch (error) {
    return handleError(error, '/api/workflows')
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantCheck = await requireTenant()
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }
    const { tenantId } = tenantCheck

    // Validate request body
    const validation = await validateRequest(createWorkflowSchema, request)
    if (!validation.success) {
      return validation.response
    }

    const { data } = validation
    const { name, description, trigger, actions, priority, enabled } = data

    const workflowId = await workflowsRepo.createWorkflow(tenantId, {
      name,
      description,
      trigger,
      actions,
      priority: priority || 0,
      enabled: enabled ?? true,
    })

    const workflow = await workflowsRepo.getWorkflowById(tenantId, workflowId)

    return NextResponse.json({ workflow })
  } catch (error) {
    return handleError(error, '/api/workflows')
  }
}
