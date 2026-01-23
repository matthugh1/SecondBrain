import { Suspense } from 'react'
import InboxLogView from '@/components/InboxLogView'

export default function InboxLogPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-textPrimary tracking-tight">
            Inbox Log
          </h1>
          <p className="mt-2 text-textMuted font-medium italic">
            Audit trail of all captured thoughts
          </p>
        </div>
        <div className="bg-surfaceElevated border border-border/60 rounded-xl shadow-xl p-6">
          <Suspense fallback={<div className="text-center py-8 text-textPrimary">Loading...</div>}>
            <InboxLogView />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
