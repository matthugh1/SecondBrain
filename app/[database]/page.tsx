'use client'

import DatabaseTable from '@/components/DatabaseTable'
import Link from 'next/link'

const databaseConfigs: Record<
  string,
  { label: string; columns: { key: string; label: string }[] }
> = {
  people: {
    label: 'People',
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'context', label: 'Context' },
      { key: 'follow_ups', label: 'Follow-ups' },
      { key: 'last_touched', label: 'Last Touched' },
    ],
  },
  projects: {
    label: 'Projects',
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'status', label: 'Status' },
      { key: 'next_action', label: 'Next Action' },
    ],
  },
  ideas: {
    label: 'Ideas',
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'one_liner', label: 'One-Liner' },
      { key: 'last_touched', label: 'Last Touched' },
    ],
  },
  admin: {
    label: 'Admin',
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'due_date', label: 'Due Date' },
      { key: 'status', label: 'Status' },
    ],
  },
}

function getDisplayValue(item: any, key: string): string | React.ReactNode {
  const value = item[key]
  if (value === null || value === undefined || value === '') {
    return '-'
  }
  return String(value)
}

export default function DatabasePage({
  params,
}: {
  params: { database: string }
}) {
  const config = databaseConfigs[params.database]

  if (!config) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            404 - Database not found
          </h1>
          <Link
            href="/"
            className="mt-4 text-blue-600 hover:text-blue-900 dark:text-blue-400"
          >
            Return to dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {config.label}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              View and manage {config.label.toLowerCase()}
            </p>
          </div>
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-900 dark:text-blue-400"
          >
            ← Back to Dashboard
          </Link>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <DatabaseTable
            database={params.database}
            columns={config.columns.map(col => ({
              ...col,
              editable: col.key !== 'id' && col.key !== 'created_at' && col.key !== 'updated_at',
              type: col.key === 'status' && (params.database === 'projects' || params.database === 'admin')
                ? 'select'
                : col.key === 'due_date' && params.database === 'admin'
                ? 'datetime-local'
                : 'text',
              options: col.key === 'status' && params.database === 'projects'
                ? [
                    { value: 'Active', label: 'Active' },
                    { value: 'Waiting', label: 'Waiting' },
                    { value: 'Blocked', label: 'Blocked' },
                    { value: 'Someday', label: 'Someday' },
                    { value: 'Done', label: 'Done' },
                  ]
                : col.key === 'status' && params.database === 'admin'
                ? [
                    { value: 'Todo', label: 'Todo' },
                    { value: 'Done', label: 'Done' },
                  ]
                : undefined,
            }))}
            getDisplayValue={getDisplayValue}
            statusOptions={
              params.database === 'projects'
                ? [
                    { value: 'Active', label: 'Active' },
                    { value: 'Waiting', label: 'Waiting' },
                    { value: 'Blocked', label: 'Blocked' },
                    { value: 'Someday', label: 'Someday' },
                    { value: 'Done', label: 'Done' },
                  ]
                : params.database === 'admin'
                ? [
                    { value: 'Todo', label: 'Todo' },
                    { value: 'Done', label: 'Done' },
                  ]
                : []
            }
          />
        </div>
      </div>
    </div>
  )
}
