'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import TaskNavigation from '@/components/TaskNavigation'
import type { TaskTemplate } from '@/types'
import * as adminRepo from '@/lib/db/repositories/admin'

export default function TaskTemplatesPage() {
  const [templates, setTemplates] = useState<TaskTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    fields: JSON.stringify({ name: '', status: 'Todo', priority: 'medium' }, null, 2),
    defaultValues: JSON.stringify({}, null, 2),
  })

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/admin/templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTemplate = async () => {
    try {
      const response = await fetch('/api/admin/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTemplate),
      })

      if (response.ok) {
        setNewTemplate({
          name: '',
          description: '',
          fields: JSON.stringify({ name: '', status: 'Todo', priority: 'medium' }, null, 2),
          defaultValues: JSON.stringify({}, null, 2),
        })
        setShowCreateForm(false)
        fetchTemplates()
      }
    } catch (error) {
      console.error('Error creating template:', error)
    }
  }

  const handleDeleteTemplate = async (id: number) => {
    if (!confirm('Delete this template?')) return

    try {
      const response = await fetch(`/api/admin/templates/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchTemplates()
      }
    } catch (error) {
      console.error('Error deleting template:', error)
    }
  }

  const handleCreateTaskFromTemplate = async (templateId: number) => {
    try {
      const response = await fetch(`/api/admin/templates/${templateId}/create-task`, {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        window.location.href = `/admin/${data.taskId}`
      }
    } catch (error) {
      console.error('Error creating task from template:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="text-center py-8 text-textMuted">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <nav className="mb-4">
              <Link
                href="/"
                className="text-xs font-bold text-primary uppercase tracking-widest hover:text-primary/80 transition-colors flex items-center gap-1 group"
              >
                ← Dashboard
              </Link>
            </nav>
            <h1 className="text-4xl font-black text-textPrimary tracking-tight">
              Task Templates
            </h1>
            <p className="mt-2 text-textMuted font-medium italic">
              Create reusable task templates
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 bg-primary text-textPrimary rounded-lg hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
          >
            {showCreateForm ? 'Cancel' : '+ New Template'}
          </button>
        </div>

        <TaskNavigation />

        {showCreateForm && (
          <div className="mb-8 p-6 bg-surfaceElevated rounded-xl border border-border/60 shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-textPrimary">Create Template</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-textMuted uppercase tracking-widest mb-2">Name</label>
                <input
                  type="text"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-surface border border-border/60 rounded-xl text-textPrimary placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-textMuted uppercase tracking-widest mb-2">Description</label>
                <textarea
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-surface border border-border/60 rounded-xl text-textPrimary placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-textMuted uppercase tracking-widest mb-2">Fields (JSON)</label>
                <textarea
                  value={newTemplate.fields}
                  onChange={(e) => setNewTemplate({ ...newTemplate, fields: e.target.value })}
                  className="w-full px-4 py-2.5 bg-surface border border-border/60 rounded-xl font-mono text-sm text-textPrimary placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  rows={5}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-textMuted uppercase tracking-widest mb-2">Default Values (JSON)</label>
                <textarea
                  value={newTemplate.defaultValues}
                  onChange={(e) => setNewTemplate({ ...newTemplate, defaultValues: e.target.value })}
                  className="w-full px-4 py-2.5 bg-surface border border-border/60 rounded-xl font-mono text-sm text-textPrimary placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  rows={5}
                />
              </div>
              <button
                onClick={handleCreateTemplate}
                className="px-4 py-2 bg-primary text-textPrimary rounded-lg hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
              >
                Create Template
              </button>
            </div>
          </div>
        )}

        {templates.length === 0 ? (
          <div className="text-center py-8 text-textMuted">
            No templates yet. Create your first template!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <div
                key={template.id}
                className="p-6 bg-surfaceElevated rounded-xl border border-border/60 shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all"
              >
                <h3 className="text-lg font-bold mb-2 text-textPrimary">{template.name}</h3>
                {template.description && (
                  <p className="text-sm text-textMuted mb-4">{template.description}</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCreateTaskFromTemplate(template.id!)}
                    className="flex-1 px-4 py-2 bg-primary text-textPrimary rounded-lg hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all text-sm font-medium"
                  >
                    Use Template
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template.id!)}
                    className="px-4 py-2 bg-error text-textPrimary rounded-lg hover:bg-error/90 shadow-lg shadow-error/20 transition-all text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
