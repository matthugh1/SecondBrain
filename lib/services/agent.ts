import * as agentMonitor from './agent-monitor'
import * as agentSuggestions from './agent-suggestions'
import * as agentActivityRepo from '@/lib/db/repositories/agent-activity'
import * as agentSettingsRepo from '@/lib/db/repositories/agent-settings'
import * as actionsRepo from '@/lib/db/repositories/actions'
import { executeAction } from './actions'
import type { Category } from '@/types'

/**
 * Run agent monitoring cycle
 */
export async function runAgentCycle(
  tenantId: string,
  userId: string
): Promise<{ suggestions: number; executed: number }> {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/03cc86a7-5004-44c5-8434-e4ab8f6d3441',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/services/agent.ts:14',message:'runAgentCycle - Entry',data:{tenantId,userId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
  // #endregion
  // Generate suggestions
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/03cc86a7-5004-44c5-8434-e4ab8f6d3441',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/services/agent.ts:17',message:'Before generateSuggestions',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  const suggestions = await agentSuggestions.generateSuggestions(tenantId, userId)
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/03cc86a7-5004-44c5-8434-e4ab8f6d3441',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/services/agent.ts:20',message:'After generateSuggestions',data:{suggestionsCount:suggestions.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion

  // Get settings
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/03cc86a7-5004-44c5-8434-e4ab8f6d3441',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/services/agent.ts:23',message:'Before getAgentSettings',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  const settings = await agentSettingsRepo.getAgentSettings(tenantId, userId)
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/03cc86a7-5004-44c5-8434-e4ab8f6d3441',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/services/agent.ts:24',message:'After getAgentSettings',data:{settingsExists:settings!==null,settingsKeys:settings?Object.keys(settings):[]},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

  let executed = 0

  // Auto-execute suggestions based on settings
  for (const suggestion of suggestions) {
    const shouldAutoExecute =
      settings &&
      suggestion.confidence >= settings.approvalThreshold &&
      (settings.autoApproveTypes || []).includes(suggestion.actionType)

    if (shouldAutoExecute) {
      try {
        // Create action
        const actionId = await actionsRepo.createAction(tenantId, {
          userId,
          actionType: suggestion.actionType as any,
          targetType: suggestion.targetType as Category,
          targetId: suggestion.targetId,
          parameters: {},
          requiresApproval: false,
        })

        // Execute action
        const result = await executeAction(tenantId, actionId, userId)
        
        if (result.success) {
          // Update activity status
          const activities = await agentActivityRepo.getAgentActivities(
            tenantId,
            userId,
            { activityType: 'suggest', status: 'pending', limit: 1 }
          )
          
          if (activities.length > 0) {
            await agentActivityRepo.updateActivityStatus(
              tenantId,
              userId,
              activities[0].id,
              'executed'
            )
          }

          executed++
        }
      } catch (error) {
        console.error('Error auto-executing suggestion:', error)
      }
    }
  }

  return {
    suggestions: suggestions.length,
    executed,
  }
}
