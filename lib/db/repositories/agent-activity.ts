import { prisma } from '../index'
import type { Category } from '@/types'

export type ActivityType = 'monitor' | 'suggest' | 'execute' | 'learn'
export type ActivityStatus = 'pending' | 'approved' | 'executed' | 'rejected'
export type UserFeedback = 'positive' | 'negative' | 'neutral'

export interface AgentActivity {
  id: number
  tenantId: string
  userId: string
  activityType: ActivityType
  actionType?: string
  targetType?: Category
  targetId?: number
  description: string
  status: ActivityStatus
  userFeedback?: UserFeedback
  confidence?: number
  createdAt: Date
}

/**
 * Create agent activity
 */
export async function createAgentActivity(
  tenantId: string,
  userId: string,
  activity: {
    activityType: ActivityType
    actionType?: string
    targetType?: Category
    targetId?: number
    description: string
    status?: ActivityStatus
    confidence?: number
  }
): Promise<number> {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/03cc86a7-5004-44c5-8434-e4ab8f6d3441',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/db/repositories/agent-activity.ts:38',message:'createAgentActivity - Entry',data:{tenantId,userId,activityType:activity.activityType,targetType:activity.targetType,targetTypeType:typeof activity.targetType},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  try {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/03cc86a7-5004-44c5-8434-e4ab8f6d3441',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/db/repositories/agent-activity.ts:41',message:'Before prisma.agentActivity.create',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    const result = await prisma.agentActivity.create({
      data: {
        tenantId,
        userId,
        activityType: activity.activityType,
        actionType: activity.actionType || null,
        targetType: activity.targetType || null,
        targetId: activity.targetId || null,
        description: activity.description,
        status: activity.status || 'pending',
        confidence: activity.confidence || null,
      },
    })
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/03cc86a7-5004-44c5-8434-e4ab8f6d3441',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/db/repositories/agent-activity.ts:55',message:'After prisma.agentActivity.create - Success',data:{id:result.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    return result.id
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/03cc86a7-5004-44c5-8434-e4ab8f6d3441',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/db/repositories/agent-activity.ts:58',message:'Error in createAgentActivity',data:{errorMessage:error instanceof Error?error.message:'unknown',errorStack:error instanceof Error?error.stack:'',errorName:error instanceof Error?error.name:'unknown'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    throw error
  }
}

/**
 * Get agent activities
 */
export async function getAgentActivities(
  tenantId: string,
  userId: string,
  options: {
    activityType?: ActivityType
    status?: ActivityStatus
    limit?: number
  } = {}
): Promise<AgentActivity[]> {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/03cc86a7-5004-44c5-8434-e4ab8f6d3441',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/db/repositories/agent-activity.ts:74',message:'getAgentActivities - Entry',data:{tenantId,userId,hasAgentActivity:!!prisma.agentActivity},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  const activities = await prisma.agentActivity.findMany({
    where: {
      tenantId,
      userId,
      ...(options.activityType ? { activityType: options.activityType } : {}),
      ...(options.status ? { status: options.status } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: options.limit || 100,
  })

  return activities.map(activity => ({
    id: activity.id,
    tenantId: activity.tenantId,
    userId: activity.userId,
    activityType: activity.activityType as ActivityType,
    actionType: activity.actionType || undefined,
    targetType: activity.targetType as Category | undefined,
    targetId: activity.targetId || undefined,
    description: activity.description,
    status: activity.status as ActivityStatus,
    userFeedback: activity.userFeedback as UserFeedback | undefined,
    confidence: activity.confidence || undefined,
    createdAt: activity.createdAt,
  }))
}

/**
 * Update activity status
 */
export async function updateActivityStatus(
  tenantId: string,
  userId: string,
  activityId: number,
  status: ActivityStatus,
  userFeedback?: UserFeedback
): Promise<void> {
  await prisma.agentActivity.updateMany({
    where: {
      id: activityId,
      tenantId,
      userId,
    },
    data: {
      status,
      userFeedback: userFeedback || null,
    },
  })
}
