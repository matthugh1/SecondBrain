import * as agentMonitor from './agent-monitor'
import * as agentActivityRepo from '@/lib/db/repositories/agent-activity'
import * as agentSettingsRepo from '@/lib/db/repositories/agent-settings'
import type { Category } from '@/types'

export interface AgentSuggestion {
  id?: number
  type: string
  actionType: string
  targetType: string
  targetId: number
  description: string
  reasoning: string
  confidence: number
  priority: 'low' | 'medium' | 'high'
}

/**
 * Generate proactive action suggestions
 */
export async function generateSuggestions(
  tenantId: string,
  userId: string
): Promise<AgentSuggestion[]> {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/03cc86a7-5004-44c5-8434-e4ab8f6d3441',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/services/agent-suggestions.ts:23',message:'generateSuggestions - Entry',data:{tenantId,userId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  // Get monitoring results
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/03cc86a7-5004-44c5-8434-e4ab8f6d3441',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/services/agent-suggestions.ts:26',message:'Before monitorSystemState',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  const monitoringResults = await agentMonitor.monitorSystemState(tenantId, userId)
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/03cc86a7-5004-44c5-8434-e4ab8f6d3441',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/services/agent-suggestions.ts:28',message:'After monitorSystemState',data:{resultsCount:monitoringResults.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion

  // Get agent settings
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/03cc86a7-5004-44c5-8434-e4ab8f6d3441',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/services/agent-suggestions.ts:31',message:'Before getAgentSettings (in generateSuggestions)',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  const settings = await agentSettingsRepo.getAgentSettings(tenantId, userId)
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/03cc86a7-5004-44c5-8434-e4ab8f6d3441',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/services/agent-suggestions.ts:32',message:'After getAgentSettings (in generateSuggestions)',data:{settingsExists:settings!==null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion

  const suggestions: AgentSuggestion[] = []

  for (const result of monitoringResults) {
    // Filter by proactivity level
    if (settings && settings.proactivityLevel === 'low' && result.priority === 'low') {
      continue
    }

    let actionType = 'update'
    let reasoning = result.description

    switch (result.type) {
      case 'stale_item':
        if (result.itemType === 'projects') {
          actionType = 'update'
          reasoning = `Project hasn't been updated in a while. Consider updating status or adding notes.`
        }
        break

      case 'overdue_task':
        actionType = 'notify'
        reasoning = `Task is overdue. Consider updating due date or marking as complete.`
        break

      case 'pattern_anomaly':
        if (result.itemType === 'ideas') {
          actionType = 'create'
          reasoning = `Idea is frequently mentioned. Consider converting to a project.`
        }
        break

      case 'unlinked_relationship':
        if (result.itemType === 'people') {
          actionType = 'create'
          reasoning = `Person needs follow-up. Create a follow-up task?`
        }
        break
    }

    // Check confidence threshold
    const confidence = calculateConfidence(result, settings)
    if (settings && confidence < settings.approvalThreshold) {
      continue
    }

    suggestions.push({
      type: result.type,
      actionType,
      targetType: result.itemType,
      targetId: result.itemId,
      description: result.description,
      reasoning,
      confidence,
      priority: result.priority,
    })
  }

  // Store suggestions as agent activities
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/03cc86a7-5004-44c5-8434-e4ab8f6d3441',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/services/agent-suggestions.ts:90',message:'Before storing suggestions as activities',data:{suggestionsCount:suggestions.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  for (const suggestion of suggestions) {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/03cc86a7-5004-44c5-8434-e4ab8f6d3441',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/services/agent-suggestions.ts:93',message:'Before createAgentActivity',data:{targetType:suggestion.targetType,targetTypeType:typeof suggestion.targetType,actionType:suggestion.actionType},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    await agentActivityRepo.createAgentActivity(tenantId, userId, {
      activityType: 'suggest',
      actionType: suggestion.actionType,
      targetType: suggestion.targetType as Category,
      targetId: suggestion.targetId,
      description: suggestion.description,
      status: 'pending',
      confidence: suggestion.confidence,
    })
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/03cc86a7-5004-44c5-8434-e4ab8f6d3441',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/services/agent-suggestions.ts:103',message:'After createAgentActivity',data:{success:true},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
  }

  return suggestions
}

/**
 * Calculate confidence score for a suggestion
 */
function calculateConfidence(
  result: any,
  settings: any
): number {
  let confidence = 0.5 // Base confidence

  // Adjust based on priority
  if (result.priority === 'high') confidence += 0.3
  else if (result.priority === 'medium') confidence += 0.2
  else confidence += 0.1

  // Adjust based on type
  if (result.type === 'overdue_task') confidence += 0.2
  if (result.type === 'pattern_anomaly') confidence += 0.1

  return Math.min(confidence, 1.0)
}
