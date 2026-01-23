'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import TaskNavigation from '@/components/TaskNavigation'
import type { TaskWorkflowRule } from '@/lib/services/task-workflows'

export default function TaskAutomationPage() {
  const [rules, setRules] = useState<TaskWorkflowRule[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newRule, setNewRule] = useState<TaskWorkflowRule>({
    name: '',
    condition: {
      field: 'status',
      operator: 'equals',
      value: '',
    },
    action: {
      type: 'update_status',
      value: '',
    },
    enabled: true,
  })

  useEffect(() => {
    // Load rules from localStorage for now (could be API in future)
    const savedRules = localStorage.getItem('taskWorkflowRules')
    if (savedRules) {
      setRules(JSON.parse(savedRules))
    }
    setLoading(false)
  }, [])

  const saveRules = (newRules: TaskWorkflowRule[]) => {
    setRules(newRules)
    localStorage.setItem('taskWorkflowRules', JSON.stringify(newRules))
  }

  const handleCreateRule = () => {
    const ruleWithId = {
      ...newRule,
      id: Date.now().toString(),
    }
    saveRules([...rules, ruleWithId])
    setNewRule({
      name: '',
      condition: {
        field: 'status',
        operator: 'equals',
        value: '',
      },
      action: {
        type: 'update_status',
        value: '',
      },
      enabled: true,
    })
    setShowCreateForm(false)
  }

  const handleDeleteRule = (id: string) => {
    if (!confirm('Delete this rule?')) return
    saveRules(rules.filter(r => r.id !== id))
  }

  const handleToggleRule = (id: string) => {
    saveRules(rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r))
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
        <div className="mb-8">
          <nav className="mb-4">
            <Link
              href="/"
              className="text-xs font-bold text-primary uppercase tracking-widest hover:text-primary/80 transition-colors flex items-center gap-1 group"
            >
              ← Dashboard
            </Link>
          </nav>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black text-textPrimary tracking-tight">
                Task Automation
              </h1>
              <p className="mt-2 text-textMuted font-medium italic">
                Set up rules to automate task management
              </p>
            </div>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-4 py-2 bg-primary text-textPrimary rounded-lg hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
            >
              {showCreateForm ? 'Cancel' : '+ New Rule'}
            </button>
          </div>
        </div>

        <TaskNavigation />

        {showCreateForm && (
          <div className="mb-8 p-6 bg-surfaceElevated rounded-xl border border-border/60 shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-textPrimary">Create Automation Rule</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-textMuted uppercase tracking-widest mb-2">Rule Name</label>
                <input
                  type="text"
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-surface border border-border/60 rounded-xl text-textPrimary placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  placeholder="e.g., Auto-escalate overdue tasks"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-textMuted uppercase tracking-widest mb-2">If Field</label>
                  <select
                    value={newRule.condition.field}
                    onChange={(e) => setNewRule({
                      ...newRule,
                      condition: { ...newRule.condition, field: e.target.value }
                    })}
                    className="w-full px-4 py-2.5 bg-surface border border-border/60 rounded-xl text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  >
                    <option value="status">Status</option>
                    <option value="priority">Priority</option>
                    <option value="due_date">Due Date</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-textMuted uppercase tracking-widest mb-2">Operator</label>
                  <select
                    value={newRule.condition.operator}
                    onChange={(e) => setNewRule({
                      ...newRule,
                      condition: { ...newRule.condition, operator: e.target.value as any }
                    })}
                    className="w-full px-4 py-2.5 bg-surface border border-border/60 rounded-xl text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  >
                    <option value="equals">Equals</option>
                    <option value="not_equals">Not Equals</option>
                    <option value="greater_than">Greater Than</option>
                    <option value="less_than">Less Than</option>
                    <option value="contains">Contains</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-textMuted uppercase tracking-widest mb-2">Value</label>
                  <input
                    type="text"
                    value={newRule.condition.value}
                    onChange={(e) => setNewRule({
                      ...newRule,
                      condition: { ...newRule.condition, value: e.target.value }
                    })}
                    className="w-full px-4 py-2.5 bg-surface border border-border/60 rounded-xl text-textPrimary placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-textMuted uppercase tracking-widest mb-2">Then Action</label>
                  <select
                    value={newRule.action.type}
                    onChange={(e) => setNewRule({
                      ...newRule,
                      action: { ...newRule.action, type: e.target.value as any }
                    })}
                    className="w-full px-4 py-2.5 bg-surface border border-border/60 rounded-xl text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  >
                    <option value="update_status">Update Status</option>
                    <option value="update_priority">Update Priority</option>
                    <option value="create_task">Create Task</option>
                    <option value="send_notification">Send Notification</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-textMuted uppercase tracking-widest mb-2">Action Value</label>
                  <input
                    type="text"
                    value={newRule.action.value}
                    onChange={(e) => setNewRule({
                      ...newRule,
                      action: { ...newRule.action, value: e.target.value }
                    })}
                    className="w-full px-4 py-2.5 bg-surface border border-border/60 rounded-xl text-textPrimary placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    placeholder="e.g., urgent or Done"
                  />
                </div>
              </div>
              <button
                onClick={handleCreateRule}
                className="px-4 py-2 bg-primary text-textPrimary rounded-lg hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
              >
                Create Rule
              </button>
            </div>
          </div>
        )}

        {rules.length === 0 ? (
          <div className="text-center py-8 text-textMuted">
            No automation rules yet. Create your first rule!
          </div>
        ) : (
          <div className="space-y-4">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="p-6 bg-surfaceElevated rounded-xl border border-border/60 shadow-xl hover:shadow-primary/20 hover:-translate-y-1 transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-textPrimary">{rule.name}</h3>
                    <p className="text-sm text-textMuted">
                      If {rule.condition.field} {rule.condition.operator} "{rule.condition.value}"
                      then {rule.action.type} to "{rule.action.value}"
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleRule(rule.id!)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        rule.enabled
                          ? 'bg-success text-textPrimary shadow-lg shadow-success/20'
                          : 'bg-surface text-textMuted border border-border/60'
                      }`}
                    >
                      {rule.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                    <button
                      onClick={() => handleDeleteRule(rule.id!)}
                      className="px-4 py-2 bg-error text-textPrimary rounded-lg hover:bg-error/90 shadow-lg shadow-error/20 transition-all font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
