'use client'

import { usePathname } from 'next/navigation'
import ChatInterface from '@/components/ChatInterface'

export default function LayoutWithChat({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Exclude chat from auth pages
  const isAuthPage = pathname?.startsWith('/auth')
  
  if (isAuthPage) {
    return <>{children}</>
  }
  
  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Chat Sidebar */}
      <div className="w-[32rem] flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex flex-col p-4">
        <div className="flex-1 flex flex-col min-h-0">
          <ChatInterface />
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  )
}
