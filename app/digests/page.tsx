'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Digest {
  id: number
  type: 'daily' | 'weekly'
  content: string
  created: string
}

interface CustomDigestTemplate {
  id: number
  name: string
  prompt: string
}

export default function DigestsPage() {
  const [digests, setDigests] = useState<Digest[]>([])
  const [templates, setTemplates] = useState<CustomDigestTemplate[]>([])
  const [filter, setFilter] = useState<'all' | 'daily' | 'weekly' | string>('all')
  const [loading, setLoading] = useState(true)
  const [triggering, setTriggering] = useState(false)
  const [triggerError, setTriggerError] = useState<string | null>(null)
  const [triggerSuccess, setTriggerSuccess] = useState<string | null>(null)
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<CustomDigestTemplate | null>(null)
  const [customPrompt, setCustomPrompt] = useState('')
  const [customName, setCustomName] = useState('')
  const [creatingCustom, setCreatingCustom] = useState(false)
  const [updatingCustom, setUpdatingCustom] = useState(false)
  const [generatingDigest, setGeneratingDigest] = useState<string | null>(null)
  const [generatedDigest, setGeneratedDigest] = useState<{ templateId: string; content: string } | null>(null)

  const fetchDigests = () => {
    const url = filter === 'all' ? '/api/digests' : `/api/digests?type=${filter}`
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setDigests(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error fetching digests:', err)
        setLoading(false)
      })
  }

  const fetchTemplates = () => {
    fetch('/api/digests/templates')
      .then((res) => res.json())
      .then((data) => {
        setTemplates(Array.isArray(data) ? data : [])
      })
      .catch((err) => {
        console.error('Error fetching templates:', err)
        setTemplates([])
      })
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  useEffect(() => {
    if (filter === 'all' || filter === 'daily' || filter === 'weekly') {
      setLoading(true)
      fetchDigests()
      setGeneratedDigest(null)
    } else {
      // Custom template selected - generate digest on-the-fly
      const templateId = filter
      const template = templates.find(t => t.id.toString() === templateId)
      if (template) {
        generateDigestForTemplate(templateId, template.prompt)
      }
    }
  }, [filter, templates])

  const generateDigestForTemplate = async (templateId: string, prompt: string) => {
    setGeneratingDigest(templateId)
    setTriggerError(null)
    setTriggerSuccess(null)
    setGeneratedDigest(null)

    try {
      const response = await fetch('/api/digests/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data?.error || 'Failed to generate digest')
      }

      const data = await response.json()
      setGeneratedDigest({ templateId, content: data.content })
    } catch (error) {
      console.error('Error generating digest:', error)
      setTriggerError(error instanceof Error ? error.message : 'Unable to generate digest. Please try again.')
    } finally {
      setGeneratingDigest(null)
    }
  }

  const handleCreateCustomDigest = async () => {
    if (!customPrompt.trim()) {
      setTriggerError('Please enter a prompt for your custom digest')
      return
    }

    if (!customName.trim()) {
      setTriggerError('Please enter a name for your custom digest')
      return
    }

    if (editingTemplate) {
      // Update existing template
      setUpdatingCustom(true)
      setTriggerError(null)
      setTriggerSuccess(null)

      try {
        const response = await fetch(`/api/digests/templates/${editingTemplate.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: customPrompt.trim(),
            name: customName.trim(),
          }),
        })

        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data?.error || 'Failed to update custom digest template')
        }

        const updatedTemplate = await response.json()
        const templateId = editingTemplate.id.toString()
        setTriggerSuccess('Custom digest template updated successfully!')
        setShowCustomModal(false)
        setEditingTemplate(null)
        setCustomPrompt('')
        setCustomName('')
        fetchTemplates()
        // Regenerate digest if this template is currently selected
        if (filter === templateId) {
          setGeneratedDigest(null)
          generateDigestForTemplate(templateId, updatedTemplate.prompt)
        }
      } catch (error) {
        console.error('Error updating custom digest template:', error)
        setTriggerError(error instanceof Error ? error.message : 'Unable to update custom digest template. Please try again.')
      } finally {
        setUpdatingCustom(false)
      }
    } else {
      // Create new template
      setCreatingCustom(true)
      setTriggerError(null)
      setTriggerSuccess(null)

      try {
        const response = await fetch('/api/digests/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: customPrompt.trim(),
            name: customName.trim(),
          }),
        })

        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data?.error || 'Failed to create custom digest template')
        }

        setTriggerSuccess('Custom digest template created successfully!')
        setShowCustomModal(false)
        setCustomPrompt('')
        setCustomName('')
        fetchTemplates()
        // Switch to the new template tab
        const newTemplate = await response.json()
        setFilter(newTemplate.id.toString())
      } catch (error) {
        console.error('Error creating custom digest template:', error)
        setTriggerError(error instanceof Error ? error.message : 'Unable to create custom digest template. Please try again.')
      } finally {
        setCreatingCustom(false)
      }
    }
  }

  const handleTriggerDailyDigest = async () => {
    setTriggering(true)
    setTriggerError(null)
    setTriggerSuccess(null)
    try {
      const response = await fetch('/api/digests/trigger', {
        method: 'POST',
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data?.error || 'Failed to trigger daily digest')
      }
      setTriggerSuccess('Daily digest triggered. Refreshing list...')
      fetchDigests()
    } catch (error) {
      console.error('Error triggering daily digest:', error)
      setTriggerError('Unable to trigger daily digest. Please try again.')
    } finally {
      setTriggering(false)
    }
  }

  const handleDeleteTemplate = async (templateId: number) => {
    if (!confirm('Are you sure you want to delete this custom digest template?')) {
      return
    }

    try {
      const response = await fetch(`/api/digests/templates/${templateId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete template')
      }

      fetchTemplates()
      // If the deleted template was selected, switch to 'all'
      if (filter === templateId.toString()) {
        setFilter('all')
      }
    } catch (error) {
      console.error('Error deleting template:', error)
      setTriggerError('Unable to delete template. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-textPrimary tracking-tight">
              Digests & Reviews
            </h1>
            <p className="mt-2 text-textMuted font-medium italic">
              Daily digests and weekly reviews
            </p>
          </div>
          <Link
            href="/"
            className="text-secondary hover:text-secondary/80 transition-colors font-medium flex items-center gap-1 group"
          >
            <svg className="w-4 h-4 transform group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'all'
                ? 'bg-primary text-textPrimary shadow-lg shadow-primary/20'
                : 'bg-surface text-textMuted hover:bg-surfaceElevated border border-border/60'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('daily')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'daily'
                ? 'bg-primary text-textPrimary shadow-lg shadow-primary/20'
                : 'bg-surface text-textMuted hover:bg-surfaceElevated border border-border/60'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setFilter('weekly')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === 'weekly'
                ? 'bg-primary text-textPrimary shadow-lg shadow-primary/20'
                : 'bg-surface text-textMuted hover:bg-surfaceElevated border border-border/60'
            }`}
          >
            Weekly
          </button>
          {templates && templates.length > 0 && templates.map((template) => (
            <button
              key={template.id}
              onClick={() => setFilter(template.id.toString())}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-all ${
                filter === template.id.toString()
                  ? 'bg-secondary text-textPrimary shadow-lg shadow-secondary/20'
                  : 'bg-surface text-textMuted hover:bg-surfaceElevated border border-border/60'
              }`}
            >
              <span>{template.name}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setEditingTemplate(template)
                  setCustomName(template.name)
                  setCustomPrompt(template.prompt)
                  setShowCustomModal(true)
                }}
                className="text-xs hover:text-secondary transition-colors"
                title="Edit template"
              >
                ✎
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteTemplate(template.id)
                }}
                className="text-xs hover:text-error transition-colors"
                title="Delete template"
              >
                ×
              </button>
            </button>
          ))}
          <button
            onClick={() => {
              setEditingTemplate(null)
              setCustomPrompt('')
              setCustomName('')
              setShowCustomModal(true)
            }}
            className="px-3 py-2 rounded-lg bg-secondary text-textPrimary hover:bg-secondary/90 shadow-lg shadow-secondary/20 transition-all font-medium"
            title="Create custom digest template"
          >
            +
          </button>
          <div className="flex-1" />
          <button
            onClick={handleTriggerDailyDigest}
            disabled={triggering}
            className={`px-4 py-2 rounded-lg border font-medium transition-all ${
              triggering
                ? 'bg-surfaceElevated text-textMuted border-border/60 cursor-not-allowed opacity-50'
                : 'bg-surface text-textPrimary border-border/60 hover:bg-surfaceElevated'
            }`}
          >
            {triggering ? 'Running Daily Digest...' : 'Run Daily Digest'}
          </button>
        </div>

        {triggerError && (
          <div className="mb-4 rounded-lg border border-error/30 bg-error/10 px-4 py-2 text-sm text-error">
            {triggerError}
          </div>
        )}
        {triggerSuccess && (
          <div className="mb-4 rounded-lg border border-success/30 bg-success/10 px-4 py-2 text-sm text-success">
            {triggerSuccess}
          </div>
        )}

        {loading || generatingDigest ? (
          <div className="text-center py-8 text-textPrimary">Generating digest...</div>
        ) : filter !== 'all' && filter !== 'daily' && filter !== 'weekly' ? (
          // Custom template selected - show generated digest
          generatedDigest ? (
            <div className="bg-surfaceElevated border border-border/60 rounded-xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-lg text-sm font-medium bg-secondary/20 text-secondary border border-secondary/30">
                    ✨ {templates.find(t => t.id.toString() === filter)?.name || 'Custom Digest'}
                  </span>
                  <span className="text-xs text-textMuted italic">
                    "{templates.find(t => t.id.toString() === filter)?.prompt}"
                  </span>
                </div>
                <button
                  onClick={() => generateDigestForTemplate(filter, templates.find(t => t.id.toString() === filter)?.prompt || '')}
                  className="px-3 py-1 text-sm rounded-lg border border-border/60 bg-surface text-textPrimary hover:bg-surfaceElevated transition-all font-medium"
                >
                  Regenerate
                </button>
              </div>
              <div className="prose dark:prose-invert max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm text-textPrimary">
                  {generatedDigest.content}
                </pre>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-textMuted">
              Click on a custom digest template tab to generate a digest.
            </div>
          )
        ) : digests.length === 0 ? (
          <div className="text-center py-8 text-textMuted">
            No digests yet. Daily digests run every morning, weekly reviews run on Sundays.
          </div>
        ) : (
          <div className="space-y-6">
            {digests.map((digest) => (
              <div
                key={digest.id}
                className="bg-surfaceElevated border border-border/60 rounded-xl shadow-xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-lg text-sm font-medium border ${
                        digest.type === 'daily'
                          ? 'bg-primary/20 text-primary border-primary/30'
                          : 'bg-info/20 text-info border-info/30'
                      }`}
                    >
                      {digest.type === 'daily' ? '📋 Daily Digest' : '💡 Weekly Review'}
                    </span>
                    <span className="text-sm text-textMuted">
                      {new Date(digest.created).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
                <div className="prose dark:prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm text-textPrimary">
                    {digest.content}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Custom Digest Template Modal */}
        {showCustomModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-surfaceElevated border border-border/60 rounded-xl shadow-2xl max-w-2xl w-full mx-4 p-6">
              <h2 className="text-2xl font-black text-textPrimary mb-4">
                {editingTemplate ? 'Edit Custom Digest Template' : 'Create Custom Digest Template'}
              </h2>
              <p className="text-sm text-textMuted mb-4">
                {editingTemplate 
                  ? 'Update your template. The digest will be regenerated with the new prompt when you click the tab.'
                  : 'Create a reusable template that will generate a digest on-demand. The digest will be generated fresh each time you click the tab.'}
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-textPrimary mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g., Today's Ideas Summary"
                  className="w-full px-3 py-2 border border-border/60 rounded-lg bg-surface text-textPrimary placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-textPrimary mb-2">
                  Prompt *
                </label>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Summarise all the ideas I came up with today"
                  rows={4}
                  className="w-full px-3 py-2 border border-border/60 rounded-lg bg-surface text-textPrimary placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowCustomModal(false)
                    setEditingTemplate(null)
                    setCustomPrompt('')
                    setCustomName('')
                    setTriggerError(null)
                  }}
                  className="px-4 py-2 rounded-lg border border-border/60 bg-surface text-textPrimary hover:bg-surfaceElevated transition-all font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCustomDigest}
                  disabled={(creatingCustom || updatingCustom) || !customPrompt.trim() || !customName.trim()}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    (creatingCustom || updatingCustom) || !customPrompt.trim() || !customName.trim()
                      ? 'bg-surfaceElevated text-textMuted cursor-not-allowed opacity-50'
                      : 'bg-primary text-textPrimary hover:bg-primary/90 shadow-lg shadow-primary/20'
                  }`}
                >
                  {updatingCustom ? 'Updating...' : creatingCustom ? 'Creating...' : editingTemplate ? 'Update Template' : 'Create Template'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
