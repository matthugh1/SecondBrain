'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function RulesPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to settings page with categories tab
    router.replace('/settings?tab=categories')
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">Redirecting to Settings...</div>
    </div>
  )
}
