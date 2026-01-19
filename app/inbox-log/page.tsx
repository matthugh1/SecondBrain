import { Suspense } from 'react'
import InboxLogView from '@/components/InboxLogView'

export default function InboxLogPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Inbox Log
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Audit trail of all captured thoughts
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
            <InboxLogView />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
