'use client'

import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import TenantSwitcher from '@/components/TenantSwitcher'
import UserMenu from '@/components/UserMenu'

export default function TopBar() {
  const pathname = usePathname()
  const { data: session, status } = useSession()

  // Don't show on auth pages
  const isAuthPage = pathname?.startsWith('/auth/')
  
  // Only show when authenticated and not on auth pages
  if (isAuthPage || status === 'unauthenticated' || !session) {
    return null
  }

  return (
    <header className="h-14 flex-shrink-0 bg-surface/90 backdrop-blur-md border-b border-border/60 sticky top-0 z-50">
      <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Left side - App name/branding */}
        <div className="flex items-center">
          <h1 className="text-lg font-black text-textPrimary tracking-tight">
            Second Brain
          </h1>
        </div>

        {/* Right side - Workspace switcher and user menu */}
        <div className="flex items-center gap-4">
          <TenantSwitcher />
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
