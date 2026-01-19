'use client'

export const dynamic = 'force-dynamic'

import { useSession } from 'next-auth/react'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface Member {
  id: string
  userId: string
  email: string
  name: string | null
  image: string | null
  role: string
  joinedAt: string
}

interface RuleSettings {
  id: number
  confidence_threshold: number
  default_project_status: string
  default_admin_status: string
  learning_enabled: number
  max_learning_examples: number
  example_timeframe_days: number
}

interface RuleCategory {
  id: number
  category_key: string
  label: string
  description: string | null
  enabled: number
  field_schema: string | null
  display_order: number
}

interface RulePrompt {
  id: number
  name: string
  template: string
  active: number
}

interface RuleRouting {
  id: number
  category_key: string
  destination_table: string
  field_mapping: string | null
}

interface ClassificationAuditLog {
  id: number
  message_text: string
  provider: string
  model: string | null
  prompt: string | null
  response_text: string | null
  parsed_result: Record<string, any> | null
  status: 'success' | 'error'
  error_message: string | null
  created: string
}

interface ClassificationCorrection {
  id: number
  inbox_log_id: number
  original_category: string
  corrected_category: string
  message_text: string
  created_at: string
}

type Tab = 'workspace' | 'llm' | 'categories' | 'prompts' | 'routing' | 'audit' | 'learning' | 'token-usage'

// PromptCard component
function PromptCard({
  prompt,
  editingPrompt,
  setEditingPrompt,
  handleSavePrompt,
  handleSetActivePrompt,
  rulesSaving,
}: {
  prompt: RulePrompt
  editingPrompt: RulePrompt | null
  setEditingPrompt: (p: RulePrompt | null) => void
  handleSavePrompt: (p: RulePrompt) => void
  handleSetActivePrompt: (name: string) => void
  rulesSaving: boolean
}) {
  const getPromptPlaceholders = (promptName: string): string => {
    if (promptName === 'classification') {
      return 'Use {messageText}, {confidenceThreshold}, {defaultProjectStatus} as placeholders'
    } else if (promptName === 'daily-digest' || promptName === 'weekly-review') {
      return 'Use {context}, {inboxLogsCount}, {categoryBreakdown}, {itemsNeedingReview}, {timeframe} as placeholders'
    }
    return 'Use template variables as placeholders'
  }

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      {editingPrompt?.id === prompt.id ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-gray-900 dark:text-white">
              {prompt.name}
            </h3>
            <div className="flex items-center gap-2">
              {prompt.active === 1 && (
                <span className="px-2 py-1 text-xs rounded bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                  Active
                </span>
              )}
              <button
                onClick={() => handleSetActivePrompt(prompt.name)}
                disabled={prompt.active === 1 || rulesSaving}
                className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
              >
                Set Active
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Template
            </label>
            <textarea
              value={editingPrompt.template}
              onChange={(e) =>
                setEditingPrompt({
                  ...editingPrompt,
                  template: e.target.value,
                })
              }
              rows={20}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {getPromptPlaceholders(prompt.name)}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleSavePrompt(editingPrompt)}
              disabled={rulesSaving}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
            >
              Save
            </button>
            <button
              onClick={() => setEditingPrompt(null)}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-gray-900 dark:text-white">
              {prompt.name}
            </h3>
            <div className="flex items-center gap-2">
              {prompt.active === 1 && (
                <span className="px-2 py-1 text-xs rounded bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                  Active
                </span>
              )}
              <button
                onClick={() => setEditingPrompt(prompt)}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Edit
              </button>
            </div>
          </div>
          <pre className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-mono bg-gray-50 dark:bg-gray-900 p-3 rounded">
            {prompt.template.substring(0, 200)}...
          </pre>
        </div>
      )}
    </div>
  )
}

function SettingsPageContent() {
  const { data: session } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<Tab>('workspace')
  
  // Workspace state
  const [tenantName, setTenantName] = useState('')
  const [members, setMembers] = useState<Member[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userRole, setUserRole] = useState<string>('')
  
  // LLM Configuration state
  const [llmSettings, setLlmSettings] = useState<RuleSettings | null>(null)
  const [llmSaving, setLlmSaving] = useState(false)
  const [llmError, setLlmError] = useState<string | null>(null)
  const [llmSuccess, setLlmSuccess] = useState<string | null>(null)
  
  // Rules state
  const [categories, setCategories] = useState<RuleCategory[]>([])
  const [prompts, setPrompts] = useState<RulePrompt[]>([])
  const [routing, setRouting] = useState<RuleRouting[]>([])
  const [auditLogs, setAuditLogs] = useState<ClassificationAuditLog[]>([])
  const [auditTotal, setAuditTotal] = useState(0)
  const [auditLoading, setAuditLoading] = useState(false)
  const [auditError, setAuditError] = useState<string | null>(null)
  const [auditStatus, setAuditStatus] = useState<'all' | 'success' | 'error'>('all')
  const [auditProvider, setAuditProvider] = useState<'all' | 'openai' | 'anthropic'>('all')
  const [auditLimit, setAuditLimit] = useState(50)
  const [auditOffset, setAuditOffset] = useState(0)
  const [rulesError, setRulesError] = useState<string | null>(null)
  const [rulesSuccess, setRulesSuccess] = useState<string | null>(null)
  const [rulesSaving, setRulesSaving] = useState(false)
  const [editingCategory, setEditingCategory] = useState<RuleCategory | null>(null)
  const [editingPrompt, setEditingPrompt] = useState<RulePrompt | null>(null)
  const [migratingPrompts, setMigratingPrompts] = useState(false)
  
  // Learning state
  const [corrections, setCorrections] = useState<ClassificationCorrection[]>([])
  const [correctionsTotal, setCorrectionsTotal] = useState(0)
  const [correctionsLoading, setCorrectionsLoading] = useState(false)
  const [correctionsError, setCorrectionsError] = useState<string | null>(null)
  const [correctionsLimit, setCorrectionsLimit] = useState(50)
  const [correctionsOffset, setCorrectionsOffset] = useState(0)

  // Token usage state
  const [tokenUsageStats, setTokenUsageStats] = useState<any>(null)
  const [tokenUsageLoading, setTokenUsageLoading] = useState(false)
  const [tokenUsageError, setTokenUsageError] = useState<string | null>(null)
  const [tokenUsagePeriod, setTokenUsagePeriod] = useState<'day' | 'week' | 'month' | 'all'>('all')

  useEffect(() => {
    // Set initial tab from URL query parameter
    const tabParam = searchParams.get('tab') as Tab | null
    if (tabParam && ['workspace', 'llm', 'categories', 'prompts', 'routing', 'audit', 'learning', 'token-usage'].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [searchParams])

  useEffect(() => {
    if (session?.activeTenantId) {
      fetchTenantInfo()
      fetchMembers()
      fetchLlmSettings()
      fetchRulesData()
    }
  }, [session])

  useEffect(() => {
    if (activeTab !== 'audit') return
    const fetchAuditLogs = async () => {
      setAuditLoading(true)
      setAuditError(null)
      try {
        const params = new URLSearchParams()
        if (auditStatus !== 'all') params.set('status', auditStatus)
        if (auditProvider !== 'all') params.set('provider', auditProvider)
        params.set('limit', auditLimit.toString())
        params.set('offset', auditOffset.toString())

        const response = await fetch(`/api/rules/audit?${params.toString()}`)
        if (!response.ok) throw new Error('Failed to load audit logs')
        const data = await response.json()
        setAuditLogs(data.logs || [])
        setAuditTotal(data.total || 0)
      } catch (err) {
        console.error('Error fetching audit logs:', err)
        setAuditError('Failed to load audit logs')
      } finally {
        setAuditLoading(false)
      }
    }

    fetchAuditLogs()
  }, [activeTab, auditStatus, auditProvider, auditLimit, auditOffset])

  useEffect(() => {
    setAuditOffset(0)
  }, [auditStatus, auditProvider, auditLimit])

  useEffect(() => {
    if (activeTab !== 'learning') return
    const fetchCorrections = async () => {
      setCorrectionsLoading(true)
      setCorrectionsError(null)
      try {
        const params = new URLSearchParams()
        params.set('limit', correctionsLimit.toString())
        params.set('offset', correctionsOffset.toString())
        params.set('days', '365')

        const response = await fetch(`/api/rules/corrections?${params.toString()}`)
        if (!response.ok) throw new Error('Failed to load corrections')
        const data = await response.json()
        setCorrections(data.corrections || [])
        setCorrectionsTotal(data.total || 0)
      } catch (err) {
        console.error('Error fetching corrections:', err)
        setCorrectionsError('Failed to load corrections')
      } finally {
        setCorrectionsLoading(false)
      }
    }

    fetchCorrections()
  }, [activeTab, correctionsLimit, correctionsOffset])

  useEffect(() => {
    if (activeTab !== 'token-usage') return
    const fetchTokenUsage = async () => {
      setTokenUsageLoading(true)
      setTokenUsageError(null)
      try {
        const params = new URLSearchParams()
        params.set('period', tokenUsagePeriod)

        const response = await fetch(`/api/token-usage?${params.toString()}`)
        if (!response.ok) throw new Error('Failed to load token usage')
        const data = await response.json()
        setTokenUsageStats(data)
      } catch (err) {
        console.error('Error fetching token usage:', err)
        setTokenUsageError('Failed to load token usage')
      } finally {
        setTokenUsageLoading(false)
      }
    }

    fetchTokenUsage()
  }, [activeTab, tokenUsagePeriod])

  useEffect(() => {
    setCorrectionsOffset(0)
  }, [correctionsLimit])

  const fetchTenantInfo = async () => {
    try {
      const response = await fetch('/api/tenants')
      if (response.ok) {
        const data = await response.json()
        const currentTenant = data.tenants.find(
          (t: any) => t.id === session?.activeTenantId
        )
        if (currentTenant) {
          setTenantName(currentTenant.name)
          setUserRole(currentTenant.role)
        }
      }
    } catch (error) {
      console.error('Error fetching tenant info:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMembers = async () => {
    try {
      const response = await fetch('/api/tenants/members')
      if (response.ok) {
        const data = await response.json()
        setMembers(data.members || [])
      }
    } catch (error) {
      console.error('Error fetching members:', error)
    }
  }

  const fetchLlmSettings = async () => {
    try {
      const response = await fetch('/api/rules/settings')
      if (response.ok) {
        const data = await response.json()
        setLlmSettings(data)
      }
    } catch (error) {
      console.error('Error fetching LLM settings:', error)
    }
  }

  const fetchRulesData = async () => {
    setRulesError(null)
    try {
      const [categoriesRes, promptsRes, routingRes] = await Promise.all([
        fetch('/api/rules/categories'),
        fetch('/api/rules/prompts'),
        fetch('/api/rules/routing'),
      ])

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json()
        setCategories(categoriesData)
      }
      if (promptsRes.ok) {
        const promptsData = await promptsRes.json()
        setPrompts(promptsData)
      }
      if (routingRes.ok) {
        const routingData = await routingRes.json()
        setRouting(routingData)
      }
    } catch (err) {
      console.error('Error fetching rules:', err)
      setRulesError('Failed to load rules')
    }
  }

  const handleSaveLlmSettings = async () => {
    if (!llmSettings) return
    setLlmSaving(true)
    setLlmError(null)
    setLlmSuccess(null)
    try {
      const response = await fetch('/api/rules/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(llmSettings),
      })
      if (!response.ok) throw new Error('Failed to save settings')
      setLlmSuccess('Settings saved successfully')
      fetchLlmSettings()
    } catch (err) {
      setLlmError('Failed to save settings')
    } finally {
      setLlmSaving(false)
    }
  }

  const handleSaveCategory = async (category: RuleCategory) => {
    setRulesSaving(true)
    setRulesError(null)
    setRulesSuccess(null)
    try {
      const response = await fetch(`/api/rules/categories/${category.category_key}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(category),
      })
      if (!response.ok) throw new Error('Failed to save category')
      setRulesSuccess('Category saved successfully')
      setEditingCategory(null)
      fetchRulesData()
    } catch (err) {
      setRulesError('Failed to save category')
    } finally {
      setRulesSaving(false)
    }
  }

  const handleSavePrompt = async (prompt: RulePrompt) => {
    setRulesSaving(true)
    setRulesError(null)
    setRulesSuccess(null)
    try {
      const response = await fetch(`/api/rules/prompts/${prompt.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prompt),
      })
      if (!response.ok) throw new Error('Failed to save prompt')
      setRulesSuccess('Prompt saved successfully')
      setEditingPrompt(null)
      fetchRulesData()
    } catch (err) {
      setRulesError('Failed to save prompt')
    } finally {
      setRulesSaving(false)
    }
  }

  const handleSetActivePrompt = async (name: string) => {
    setRulesSaving(true)
    setRulesError(null)
    setRulesSuccess(null)
    try {
      const response = await fetch('/api/rules/prompts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setActive', name }),
      })
      if (!response.ok) throw new Error('Failed to set active prompt')
      setRulesSuccess('Active prompt updated')
      fetchRulesData()
    } catch (err) {
      setRulesError('Failed to set active prompt')
    } finally {
      setRulesSaving(false)
    }
  }

  const handleMigratePrompts = async () => {
    setMigratingPrompts(true)
    setRulesError(null)
    setRulesSuccess(null)
    try {
      const response = await fetch('/api/rules/prompts/migrate', {
        method: 'POST',
      })
      if (!response.ok) throw new Error('Failed to migrate prompts')
      const data = await response.json()
      setRulesSuccess(data.message || 'Prompts migrated successfully')
      fetchRulesData()
    } catch (err) {
      setRulesError('Failed to migrate prompts')
    } finally {
      setMigratingPrompts(false)
    }
  }

  const getPromptPlaceholders = (promptName: string): string => {
    if (promptName === 'classification') {
      return 'Use {messageText}, {confidenceThreshold}, {defaultProjectStatus} as placeholders'
    } else if (promptName === 'daily-digest' || promptName === 'weekly-review') {
      return 'Use {context}, {inboxLogsCount}, {categoryBreakdown}, {itemsNeedingReview}, {timeframe} as placeholders'
    }
    return 'Use template variables as placeholders'
  }

  const handleSaveTenantName = async () => {
    if (!session?.activeTenantId) return

    setSaving(true)
    try {
      const response = await fetch(`/api/tenants/${session.activeTenantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tenantName }),
      })

      if (response.ok) {
        router.refresh()
      } else {
        alert('Failed to update workspace name')
      }
    } catch (error) {
      console.error('Error updating tenant:', error)
      alert('Failed to update workspace name')
    } finally {
      setSaving(false)
    }
  }

  const handleInvite = async () => {
    if (!inviteEmail) return

    setInviteLoading(true)
    setInviteLink(null)
    try {
      const response = await fetch('/api/tenants/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      })

      if (response.ok) {
        const data = await response.json()
        setInviteLink(data.inviteLink)
        setInviteEmail('')
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create invite')
      }
    } catch (error) {
      console.error('Error creating invite:', error)
      alert('Failed to create invite')
    } finally {
      setInviteLoading(false)
    }
  }

  const canManage = userRole === 'owner' || userRole === 'admin'

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link
            href="/"
            className="text-indigo-600 hover:text-indigo-500 mb-4 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Settings
          </h1>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6 flex gap-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <button
            onClick={() => setActiveTab('workspace')}
            className={`px-4 py-2 font-medium whitespace-nowrap ${
              activeTab === 'workspace'
                ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Workspace
          </button>
          {canManage && (
            <>
              <button
                onClick={() => setActiveTab('llm')}
                className={`px-4 py-2 font-medium whitespace-nowrap ${
                  activeTab === 'llm'
                    ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                LLM Configuration
              </button>
              <button
                onClick={() => setActiveTab('categories')}
                className={`px-4 py-2 font-medium whitespace-nowrap ${
                  activeTab === 'categories'
                    ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Categories
              </button>
              <button
                onClick={() => setActiveTab('prompts')}
                className={`px-4 py-2 font-medium whitespace-nowrap ${
                  activeTab === 'prompts'
                    ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Prompts
              </button>
              <button
                onClick={() => setActiveTab('routing')}
                className={`px-4 py-2 font-medium whitespace-nowrap ${
                  activeTab === 'routing'
                    ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Routing
              </button>
              <button
                onClick={() => setActiveTab('audit')}
                className={`px-4 py-2 font-medium whitespace-nowrap ${
                  activeTab === 'audit'
                    ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Audit
              </button>
              <button
                onClick={() => setActiveTab('learning')}
                className={`px-4 py-2 font-medium whitespace-nowrap ${
                  activeTab === 'learning'
                    ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Learning
              </button>
              <button
                onClick={() => setActiveTab('token-usage')}
                className={`px-4 py-2 font-medium whitespace-nowrap ${
                  activeTab === 'token-usage'
                    ? 'border-b-2 border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Token Usage
              </button>
            </>
          )}
        </div>

        {/* Error/Success Messages */}
        {(rulesError || rulesSuccess || llmError || llmSuccess) && (
          <div className="mb-4">
            {rulesError && (
              <div className="rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
                {rulesError}
              </div>
            )}
            {rulesSuccess && (
              <div className="rounded border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-200">
                {rulesSuccess}
              </div>
            )}
            {llmError && (
              <div className="rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
                {llmError}
              </div>
            )}
            {llmSuccess && (
              <div className="rounded border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-200">
                {llmSuccess}
              </div>
            )}
          </div>
        )}

        {/* Workspace Tab */}
        {activeTab === 'workspace' && (
          <>
            {/* Workspace Name */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Workspace Name</h2>
              <div className="flex gap-4">
                <input
                  type="text"
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                  disabled={!canManage || saving}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                />
                {canManage && (
                  <button
                    onClick={handleSaveTenantName}
                    disabled={saving}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                )}
              </div>
            </div>

            {/* Invite Members */}
            {canManage && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Invite Members</h2>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="Email address"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                      {userRole === 'owner' && (
                        <option value="owner">Owner</option>
                      )}
                    </select>
                    <button
                      onClick={handleInvite}
                      disabled={inviteLoading || !inviteEmail}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {inviteLoading ? 'Creating...' : 'Invite'}
                    </button>
                  </div>
                  {inviteLink && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-sm text-green-800 mb-2">
                        Invite link created! Share this link:
                      </p>
                      <code className="text-xs bg-white p-2 rounded block break-all">
                        {inviteLink}
                      </code>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Members List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Members</h2>
              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-md"
                  >
                    <div>
                      <div className="font-medium">
                        {member.name || member.email}
                      </div>
                      <div className="text-sm text-gray-500">{member.email}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-600 capitalize">
                        {member.role}
                      </span>
                      {member.userId === session?.user?.id && (
                        <span className="text-xs text-gray-400">(You)</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* LLM Configuration Tab */}
        {activeTab === 'llm' && canManage && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">LLM Configuration</h2>
            {llmSettings && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Confidence Threshold
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={llmSettings.confidence_threshold}
                    onChange={(e) =>
                      setLlmSettings({
                        ...llmSettings,
                        confidence_threshold: parseFloat(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Items with confidence below this threshold will be marked for review (0.0 - 1.0)
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Default Project Status
                  </label>
                  <select
                    value={llmSettings.default_project_status}
                    onChange={(e) =>
                      setLlmSettings({
                        ...llmSettings,
                        default_project_status: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Waiting">Waiting</option>
                    <option value="Blocked">Blocked</option>
                    <option value="Someday">Someday</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Default Admin Status
                  </label>
                  <select
                    value={llmSettings.default_admin_status}
                    onChange={(e) =>
                      setLlmSettings({
                        ...llmSettings,
                        default_admin_status: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="Todo">Todo</option>
                    <option value="Done">Done</option>
                  </select>
                </div>

                {/* Learning Settings Section */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Classification Learning
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    The system learns from your corrections to improve future classifications. When you fix a misclassification, 
                    it becomes an example used to guide future similar messages.
                  </p>
                  <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-xs text-gray-600 dark:text-gray-400">
                    <strong>How it works:</strong> Examples are dynamically added to the classification prompt at runtime (the prompt template itself is not modified). 
                    View all corrections in the <button 
                      onClick={() => setActiveTab('learning')}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Learning tab
                    </button>.
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={llmSettings.learning_enabled === 1}
                        onChange={(e) =>
                          setLlmSettings({
                            ...llmSettings,
                            learning_enabled: e.target.checked ? 1 : 0,
                          })
                        }
                        className="rounded"
                        id="learning-enabled"
                      />
                      <label htmlFor="learning-enabled" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Enable Learning from Corrections
                      </label>
                    </div>
                    
                    {llmSettings.learning_enabled === 1 && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Maximum Examples to Include
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="20"
                            value={llmSettings.max_learning_examples}
                            onChange={(e) =>
                              setLlmSettings({
                                ...llmSettings,
                                max_learning_examples: parseInt(e.target.value, 10) || 5,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            Number of recent corrections to include as examples in classification prompts (1-20)
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Example Timeframe (Days)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="365"
                            value={llmSettings.example_timeframe_days}
                            onChange={(e) =>
                              setLlmSettings({
                                ...llmSettings,
                                example_timeframe_days: parseInt(e.target.value, 10) || 30,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            How far back to look for correction examples (1-365 days)
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleSaveLlmSettings}
                  disabled={llmSaving}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {llmSaving ? 'Saving...' : 'Save LLM Settings'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && canManage && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Categories
            </h2>
            <div className="space-y-4">
              {categories && categories.length > 0 ? categories.map((category) => (
                <div
                  key={category.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  {editingCategory?.id === category.id ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Category Key
                        </label>
                        <input
                          type="text"
                          value={editingCategory.category_key}
                          onChange={(e) =>
                            setEditingCategory({
                              ...editingCategory,
                              category_key: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Label
                        </label>
                        <input
                          type="text"
                          value={editingCategory.label}
                          onChange={(e) =>
                            setEditingCategory({
                              ...editingCategory,
                              label: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Description
                        </label>
                        <textarea
                          value={editingCategory.description || ''}
                          onChange={(e) =>
                            setEditingCategory({
                              ...editingCategory,
                              description: e.target.value,
                            })
                          }
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editingCategory.enabled === 1}
                          onChange={(e) =>
                            setEditingCategory({
                              ...editingCategory,
                              enabled: e.target.checked ? 1 : 0,
                            })
                          }
                          className="rounded"
                        />
                        <label className="text-sm text-gray-700 dark:text-gray-300">
                          Enabled
                        </label>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveCategory(editingCategory)}
                          disabled={rulesSaving}
                          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingCategory(null)}
                          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {category.label}
                          </h3>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            ({category.category_key})
                          </span>
                          {category.enabled === 1 ? (
                            <span className="px-2 py-1 text-xs rounded bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                              Enabled
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                              Disabled
                            </span>
                          )}
                        </div>
                        {category.description && (
                          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            {category.description}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => setEditingCategory(category)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>
              )) : (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  No categories found.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Prompts Tab */}
        {activeTab === 'prompts' && canManage && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Prompts
              </h2>
              <button
                onClick={handleMigratePrompts}
                disabled={migratingPrompts}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                {migratingPrompts ? 'Migrating...' : 'Migrate Code Prompts to Database'}
              </button>
            </div>
            
            {prompts && prompts.length > 0 && (
              <>
                {/* Classification Prompts */}
                {prompts.filter(p => p.name === 'classification').length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                      Classification Prompts
                    </h3>
                    <div className="space-y-4">
                      {prompts.filter(p => p.name === 'classification').map((prompt) => (
                        <PromptCard
                          key={prompt.id}
                          prompt={prompt}
                          editingPrompt={editingPrompt}
                          setEditingPrompt={setEditingPrompt}
                          handleSavePrompt={handleSavePrompt}
                          handleSetActivePrompt={handleSetActivePrompt}
                          rulesSaving={rulesSaving}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Digest Prompts */}
                {prompts.filter(p => p.name === 'daily-digest' || p.name === 'weekly-review').length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                      Digest Prompts
                    </h3>
                    <div className="space-y-4">
                      {prompts.filter(p => p.name === 'daily-digest' || p.name === 'weekly-review').map((prompt) => (
                        <PromptCard
                          key={prompt.id}
                          prompt={prompt}
                          editingPrompt={editingPrompt}
                          setEditingPrompt={setEditingPrompt}
                          handleSavePrompt={handleSavePrompt}
                          handleSetActivePrompt={handleSetActivePrompt}
                          rulesSaving={rulesSaving}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Other Prompts */}
                {prompts.filter(p => p.name !== 'classification' && p.name !== 'daily-digest' && p.name !== 'weekly-review').length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                      Other Prompts
                    </h3>
                    <div className="space-y-4">
                      {prompts.filter(p => p.name !== 'classification' && p.name !== 'daily-digest' && p.name !== 'weekly-review').map((prompt) => (
                        <PromptCard
                          key={prompt.id}
                          prompt={prompt}
                          editingPrompt={editingPrompt}
                          setEditingPrompt={setEditingPrompt}
                          handleSavePrompt={handleSavePrompt}
                          handleSetActivePrompt={handleSetActivePrompt}
                          rulesSaving={rulesSaving}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {(!prompts || prompts.length === 0) && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                No prompts found. Click "Migrate Code Prompts to Database" to create default prompts.
              </div>
            )}
          </div>
        )}

        {/* Routing Tab */}
        {activeTab === 'routing' && canManage && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Routing Rules
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Destination Table
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                      Field Mapping
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {routing && routing.length > 0 ? routing.map((route) => (
                    <tr key={route.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {route.category_key}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {route.destination_table}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        <pre className="text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded">
                          {route.field_mapping || 'N/A'}
                        </pre>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-600 dark:text-gray-400">
                        No routing rules found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Audit Tab */}
        {activeTab === 'audit' && canManage && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Classification Audit
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Review prompt, response, and parsing outcomes for each capture.
              </p>
            </div>

            <div className="flex flex-wrap items-end gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select
                  value={auditStatus}
                  onChange={(e) => setAuditStatus(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">All</option>
                  <option value="success">Success</option>
                  <option value="error">Error</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Provider
                </label>
                <select
                  value={auditProvider}
                  onChange={(e) => setAuditProvider(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">All</option>
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Page Size
                </label>
                <select
                  value={auditLimit}
                  onChange={(e) => setAuditLimit(parseInt(e.target.value, 10))}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              <button
                onClick={() => setAuditOffset(0)}
                disabled={auditLoading}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
              >
                {auditLoading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

            {auditError && (
              <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
                {auditError}
              </div>
            )}

            {auditLoading ? (
              <div className="text-sm text-gray-600 dark:text-gray-300">Loading audit logs...</div>
            ) : auditLogs.length === 0 ? (
              <div className="text-sm text-gray-600 dark:text-gray-300">No audit logs found.</div>
            ) : (
              <div className="space-y-4">
                {auditLogs.map((log) => {
                  const category = log.parsed_result?.category
                  const confidence = log.parsed_result?.confidence
                  return (
                    <div
                      key={log.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`px-2 py-1 text-xs rounded ${
                              log.status === 'success'
                                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                            }`}
                          >
                            {log.status === 'success' ? 'Success' : 'Error'}
                          </span>
                          <span className="text-xs text-gray-600 dark:text-gray-300">
                            {log.provider}
                          </span>
                          {log.model && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {log.model}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(log.created).toLocaleString()}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">
                        <span className="font-medium">Message:</span> {log.message_text}
                      </p>

                      {(category || typeof confidence === 'number') && (
                        <p className="mt-2 text-sm text-gray-700 dark:text-gray-200">
                          <span className="font-medium">Result:</span>{' '}
                          {category || 'Unknown'}{' '}
                          {typeof confidence === 'number'
                            ? `• ${(confidence * 100).toFixed(0)}%`
                            : ''}
                        </p>
                      )}

                      {log.error_message && (
                        <p className="mt-2 text-sm text-red-600 dark:text-red-300">
                          <span className="font-medium">Error:</span> {log.error_message}
                        </p>
                      )}

                      <details className="mt-3">
                        <summary className="text-xs text-indigo-600 dark:text-indigo-400 cursor-pointer">
                          Show raw payload
                        </summary>
                        <div className="mt-2 space-y-3">
                          <div>
                            <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                              Prompt
                            </div>
                            <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-2 rounded max-h-40 overflow-auto whitespace-pre-wrap">
                              {log.prompt || 'N/A'}
                            </pre>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                              Response
                            </div>
                            <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-2 rounded max-h-40 overflow-auto whitespace-pre-wrap">
                              {log.response_text || 'N/A'}
                            </pre>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                              Parsed Result
                            </div>
                            <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-2 rounded max-h-40 overflow-auto whitespace-pre-wrap">
                              {log.parsed_result
                                ? JSON.stringify(log.parsed_result, null, 2)
                                : 'N/A'}
                            </pre>
                          </div>
                        </div>
                      </details>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-gray-600 dark:text-gray-300">
              <span>
                {auditTotal === 0
                  ? 'Showing 0 of 0'
                  : `Showing ${auditOffset + 1}-${Math.min(
                      auditOffset + auditLimit,
                      auditTotal
                    )} of ${auditTotal}`}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAuditOffset(Math.max(0, auditOffset - auditLimit))}
                  disabled={auditOffset === 0 || auditLoading}
                  className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setAuditOffset(auditOffset + auditLimit)}
                  disabled={auditOffset + auditLimit >= auditTotal || auditLoading}
                  className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Learning Tab */}
        {activeTab === 'learning' && canManage && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Classification Learning
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                View corrections that the system is learning from. These examples are dynamically added to classification prompts to improve accuracy.
              </p>
            </div>

            {/* How it works explanation */}
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                How Learning Works
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                <li>When you fix a misclassification, it's recorded as a correction</li>
                <li>Recent corrections are retrieved based on your settings (max examples, timeframe)</li>
                <li>These examples are dynamically inserted into the classification prompt before each classification</li>
                <li>The prompt template itself is NOT modified - examples are added at runtime</li>
                <li>This allows the LLM to learn from your specific correction patterns</li>
              </ul>
            </div>

            <div className="flex flex-wrap items-end gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Page Size
                </label>
                <select
                  value={correctionsLimit}
                  onChange={(e) => setCorrectionsLimit(parseInt(e.target.value, 10))}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              <button
                onClick={() => setCorrectionsOffset(0)}
                disabled={correctionsLoading}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
              >
                {correctionsLoading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>

            {correctionsError && (
              <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
                {correctionsError}
              </div>
            )}

            {correctionsLoading ? (
              <div className="text-sm text-gray-600 dark:text-gray-300">Loading corrections...</div>
            ) : corrections.length === 0 ? (
              <div className="text-sm text-gray-600 dark:text-gray-300">
                No corrections found. Start fixing misclassifications to build up learning examples!
              </div>
            ) : (
              <>
                <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                  Showing {corrections.length} of {correctionsTotal} total corrections
                </div>
                <div className="space-y-4">
                  {corrections.map((correction) => (
                    <div
                      key={correction.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-1 text-xs rounded bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
                              {correction.original_category}
                            </span>
                            <span className="text-gray-400">→</span>
                            <span className="px-2 py-1 text-xs rounded bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                              {correction.corrected_category}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(correction.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-200">
                            <span className="font-medium">Message:</span> {correction.message_text}
                          </p>
                          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            This correction will be used as an example when classifying similar messages (if learning is enabled and within your timeframe settings).
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {corrections.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-gray-600 dark:text-gray-300">
                <span>
                  {correctionsTotal === 0
                    ? 'Showing 0 of 0'
                    : `Showing ${correctionsOffset + 1}-${Math.min(
                        correctionsOffset + correctionsLimit,
                        correctionsTotal
                      )} of ${correctionsTotal}`}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCorrectionsOffset(Math.max(0, correctionsOffset - correctionsLimit))}
                    disabled={correctionsOffset === 0 || correctionsLoading}
                    className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCorrectionsOffset(correctionsOffset + correctionsLimit)}
                    disabled={correctionsOffset + correctionsLimit >= correctionsTotal || correctionsLoading}
                    className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Token Usage Tab */}
        {activeTab === 'token-usage' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Token Usage Statistics
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Track your API token consumption across OpenAI and Anthropic providers.
              </p>
            </div>

            {/* Period Selector */}
            <div className="mb-6 flex gap-2">
              <button
                onClick={() => setTokenUsagePeriod('day')}
                className={`px-4 py-2 rounded ${
                  tokenUsagePeriod === 'day'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setTokenUsagePeriod('week')}
                className={`px-4 py-2 rounded ${
                  tokenUsagePeriod === 'week'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                This Week
              </button>
              <button
                onClick={() => setTokenUsagePeriod('month')}
                className={`px-4 py-2 rounded ${
                  tokenUsagePeriod === 'month'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                This Month
              </button>
              <button
                onClick={() => setTokenUsagePeriod('all')}
                className={`px-4 py-2 rounded ${
                  tokenUsagePeriod === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                All Time
              </button>
            </div>

            {tokenUsageError && (
              <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
                {tokenUsageError}
              </div>
            )}

            {tokenUsageLoading ? (
              <div className="text-sm text-gray-600 dark:text-gray-300">Loading token usage...</div>
            ) : !tokenUsageStats ? (
              <div className="text-sm text-gray-600 dark:text-gray-300">
                No token usage data available yet. Token usage will be tracked as you use AI features.
              </div>
            ) : (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Tokens</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {tokenUsageStats.total?.toLocaleString() || 0}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Cost: ${(tokenUsageStats.totalCost || 0).toFixed(4)}
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-600 dark:text-gray-400">OpenAI</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {tokenUsageStats.byProvider?.openai?.toLocaleString() || 0}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Cost: ${(tokenUsageStats.byProviderCost?.openai || 0).toFixed(4)}
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Anthropic</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {tokenUsageStats.byProvider?.anthropic?.toLocaleString() || 0}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Cost: ${(tokenUsageStats.byProviderCost?.anthropic || 0).toFixed(4)}
                    </div>
                  </div>
                </div>

                {/* Breakdown by Operation */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                    Usage by Operation
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Classification</div>
                      <div className="text-xl font-semibold text-gray-900 dark:text-white mt-1">
                        {tokenUsageStats.byOperation?.classification?.toLocaleString() || 0}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Cost: ${(tokenUsageStats.byOperationCost?.classification || 0).toFixed(4)}
                      </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <div className="text-sm text-gray-600 dark:text-gray-400">Digest</div>
                      <div className="text-xl font-semibold text-gray-900 dark:text-white mt-1">
                        {tokenUsageStats.byOperation?.digest?.toLocaleString() || 0}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Cost: ${(tokenUsageStats.byOperationCost?.digest || 0).toFixed(4)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Daily Breakdown */}
                {tokenUsageStats.daily && tokenUsageStats.daily.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Daily Breakdown
                    </h3>
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <div className="space-y-2">
                        {tokenUsageStats.daily.slice(-7).reverse().map((day: any) => (
                          <div
                            key={day.date}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="text-gray-700 dark:text-gray-300">
                              {new Date(day.date).toLocaleDateString()}
                            </span>
                            <div className="text-right">
                              <div className="font-medium text-gray-900 dark:text-white">
                                {day.tokens.toLocaleString()} tokens
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                ${(day.cost || 0).toFixed(4)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Recent Usage */}
                {tokenUsageStats.recent && tokenUsageStats.recent.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                      Recent API Calls
                    </h3>
                    <div className="space-y-2">
                      {tokenUsageStats.recent.slice(0, 10).map((record: any) => (
                        <div
                          key={record.id}
                          className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="px-2 py-1 text-xs rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200">
                                {record.provider}
                              </span>
                              <span className="px-2 py-1 text-xs rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                {record.operationType}
                              </span>
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                {record.model}
                              </span>
                            </div>
                            <div className="text-right text-sm text-gray-700 dark:text-gray-300">
                              <div>
                                <span className="font-medium">{record.totalTokens.toLocaleString()}</span>
                                <span className="text-gray-500 dark:text-gray-400 ml-2">
                                  ({record.promptTokens.toLocaleString()} + {record.completionTokens.toLocaleString()})
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                ${(record.cost || 0).toFixed(4)}
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {new Date(record.created).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">Loading...</div>
      </div>
    }>
      <SettingsPageContent />
    </Suspense>
  )
}
