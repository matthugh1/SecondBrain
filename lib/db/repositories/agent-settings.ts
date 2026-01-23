import { prisma } from '../index'

export interface AgentSettings {
  id: number
  tenantId: string
  userId: string
  proactivityLevel: 'low' | 'medium' | 'high'
  approvalThreshold: number
  autoApproveTypes?: string[]
  focusAreas?: string[]
  notificationPreferences?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

/**
 * Get agent settings for user
 */
export async function getAgentSettings(
  tenantId: string,
  userId: string
): Promise<AgentSettings | null> {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/03cc86a7-5004-44c5-8434-e4ab8f6d3441',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/db/repositories/agent-settings.ts:20',message:'getAgentSettings - Entry',data:{tenantId,userId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  try {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/03cc86a7-5004-44c5-8434-e4ab8f6d3441',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/db/repositories/agent-settings.ts:23',message:'Before prisma.agentSettings.findUnique',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    const settings = await prisma.agentSettings.findUnique({
      where: {
        tenantId_userId: {
          tenantId,
          userId,
        },
      },
    })
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/03cc86a7-5004-44c5-8434-e4ab8f6d3441',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/db/repositories/agent-settings.ts:33',message:'After prisma.agentSettings.findUnique',data:{settingsExists:settings!==null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    if (!settings) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/03cc86a7-5004-44c5-8434-e4ab8f6d3441',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/db/repositories/agent-settings.ts:42',message:'Settings not found, returning null',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      return null
    }

    try {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/03cc86a7-5004-44c5-8434-e4ab8f6d3441',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/db/repositories/agent-settings.ts:48',message:'Before parsing settings JSON',data:{hasAutoApproveTypes:!!settings.autoApproveTypes,hasFocusAreas:!!settings.focusAreas},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      return {
        id: settings.id,
        tenantId: settings.tenantId,
        userId: settings.userId,
        proactivityLevel: settings.proactivityLevel as 'low' | 'medium' | 'high',
        approvalThreshold: settings.approvalThreshold,
        autoApproveTypes: settings.autoApproveTypes ? JSON.parse(settings.autoApproveTypes) : undefined,
        focusAreas: settings.focusAreas ? JSON.parse(settings.focusAreas) : undefined,
        notificationPreferences: settings.notificationPreferences ? JSON.parse(settings.notificationPreferences) : undefined,
        createdAt: settings.createdAt,
        updatedAt: settings.updatedAt,
      }
    } catch (error) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/03cc86a7-5004-44c5-8434-e4ab8f6d3441',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/db/repositories/agent-settings.ts:61',message:'Error parsing settings JSON',data:{errorMessage:error instanceof Error?error.message:'unknown'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      throw error
    }
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/03cc86a7-5004-44c5-8434-e4ab8f6d3441',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/db/repositories/agent-settings.ts:66',message:'Error in getAgentSettings',data:{errorMessage:error instanceof Error?error.message:'unknown',errorStack:error instanceof Error?error.stack:'',errorName:error instanceof Error?error.name:'unknown'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    throw error
  }
}

/**
 * Create or update agent settings
 */
export async function upsertAgentSettings(
  tenantId: string,
  userId: string,
  settings: Partial<AgentSettings>
): Promise<void> {
  await prisma.agentSettings.upsert({
    where: {
      tenantId_userId: {
        tenantId,
        userId,
      },
    },
    create: {
      tenantId,
      userId,
      proactivityLevel: settings.proactivityLevel || 'medium',
      approvalThreshold: settings.approvalThreshold ?? 0.8,
      autoApproveTypes: settings.autoApproveTypes ? JSON.stringify(settings.autoApproveTypes) : null,
      focusAreas: settings.focusAreas ? JSON.stringify(settings.focusAreas) : null,
      notificationPreferences: settings.notificationPreferences ? JSON.stringify(settings.notificationPreferences) : null,
    },
    update: {
      proactivityLevel: settings.proactivityLevel,
      approvalThreshold: settings.approvalThreshold,
      autoApproveTypes: settings.autoApproveTypes ? JSON.stringify(settings.autoApproveTypes) : undefined,
      focusAreas: settings.focusAreas ? JSON.stringify(settings.focusAreas) : undefined,
      notificationPreferences: settings.notificationPreferences ? JSON.stringify(settings.notificationPreferences) : undefined,
      updatedAt: new Date(),
    },
  })
}
