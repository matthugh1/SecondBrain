import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/auth/utils'
import { runAgentCycle } from '@/lib/services/agent'

export async function POST(request: NextRequest) {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/03cc86a7-5004-44c5-8434-e4ab8f6d3441',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/agent/run/route.ts:6',message:'POST /api/agent/run - Entry',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
  // #endregion
  try {
    const tenantCheck = await requireTenant()
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/03cc86a7-5004-44c5-8434-e4ab8f6d3441',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/agent/run/route.ts:9',message:'After requireTenant',data:{isNextResponse:tenantCheck instanceof NextResponse},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    if (tenantCheck instanceof NextResponse) {
      return tenantCheck
    }
    const { tenantId, userId } = tenantCheck
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/03cc86a7-5004-44c5-8434-e4ab8f6d3441',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/agent/run/route.ts:13',message:'Before runAgentCycle',data:{tenantId,userId,userIdType:typeof userId,userIdIsNull:userId===null,userIdIsUndefined:userId===undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

    const result = await runAgentCycle(tenantId, userId!)
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/03cc86a7-5004-44c5-8434-e4ab8f6d3441',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/agent/run/route.ts:16',message:'After runAgentCycle - Success',data:{suggestions:result.suggestions,executed:result.executed},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion

    return NextResponse.json({
      success: true,
      suggestions: result.suggestions,
      executed: result.executed,
    })
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/03cc86a7-5004-44c5-8434-e4ab8f6d3441',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/agent/run/route.ts:26',message:'Error caught',data:{errorMessage:error instanceof Error?error.message:'unknown',errorStack:error instanceof Error?error.stack:'',errorName:error instanceof Error?error.name:'unknown'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    console.error('Error running agent cycle:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
