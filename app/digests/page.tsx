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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Digests & Reviews
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Daily digests and weekly reviews
            </p>
          </div>
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-900 dark:text-blue-400"
          >
            ← Back to Dashboard
          </Link>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('daily')}
            className={`px-4 py-2 rounded ${
              filter === 'daily'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => setFilter('weekly')}
            className={`px-4 py-2 rounded ${
              filter === 'weekly'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Weekly
          </button>
          {templates && templates.length > 0 && templates.map((template) => (
            <button
              key={template.id}
              onClick={() => setFilter(template.id.toString())}
              className={`px-4 py-2 rounded flex items-center gap-2 ${
                filter === template.id.toString()
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
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
                className="text-xs hover:text-blue-300"
                title="Edit template"
              >
                ✎
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteTemplate(template.id)
                }}
                className="text-xs hover:text-red-300"
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
            className="px-3 py-2 rounded bg-green-600 text-white hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
            title="Create custom digest template"
          >
            +
          </button>
          <div className="flex-1" />
          <button
            onClick={handleTriggerDailyDigest}
            disabled={triggering}
            className={`px-4 py-2 rounded border ${
              triggering
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-700 cursor-not-allowed'
                : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            {triggering ? 'Running Daily Digest...' : 'Run Daily Digest'}
          </button>
        </div>

        {triggerError && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            {triggerError}
          </div>
        )}
        {triggerSuccess && (
          <div className="mb-4 rounded border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-200">
            {triggerSuccess}
          </div>
        )}

        {loading || generatingDigest ? (
          <div className="text-center py-8">Generating digest...</div>
        ) : filter !== 'all' && filter !== 'daily' && filter !== 'weekly' ? (
          // Custom template selected - show generated digest
          generatedDigest ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded text-sm font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                    ✨ {templates.find(t => t.id.toString() === filter)?.name || 'Custom Digest'}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 italic">
                    "{templates.find(t => t.id.toString() === filter)?.prompt}"
                  </span>
                </div>
                <button
                  onClick={() => generateDigestForTemplate(filter, templates.find(t => t.id.toString() === filter)?.prompt || '')}
                  className="px-3 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  Regenerate
                </button>
              </div>
              <div className="prose dark:prose-invert max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm text-gray-900 dark:text-gray-100">
                  {generatedDigest.content}
                </pre>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Click on a custom digest template tab to generate a digest.
            </div>
          )
        ) : digests.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No digests yet. Daily digests run every morning, weekly reviews run on Sundays.
          </div>
        ) : (
          <div className="space-y-6">
            {digests.map((digest) => (
              <div
                key={digest.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded text-sm font-medium ${
                        digest.type === 'daily'
                          ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                          : 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                      }`}
                    >
                      {digest.type === 'daily' ? '📋 Daily Digest' : '💡 Weekly Review'}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
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
                  <pre className="whitespace-pre-wrap font-sans text-sm text-gray-900 dark:text-gray-100">
                    {digest.content}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Custom Digest Template Modal */}
        {showCustomModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 p-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {editingTemplate ? 'Edit Custom Digest Template' : 'Create Custom Digest Template'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {editingTemplate 
                  ? 'Update your template. The digest will be regenerated with the new prompt when you click the tab.'
                  : 'Create a reusable template that will generate a digest on-demand. The digest will be generated fresh each time you click the tab.'}
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g., Today's Ideas Summary"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Prompt *
                </label>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Summarise all the ideas I came up with today"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
                  className="px-4 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCustomDigest}
                  disabled={(creatingCustom || updatingCustom) || !customPrompt.trim() || !customName.trim()}
                  className={`px-4 py-2 rounded ${
                    (creatingCustom || updatingCustom) || !customPrompt.trim() || !customName.trim()
                      ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
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
