'use client'

import { SessionProvider } from 'next-auth/react'
import { ChatProvider } from '@/contexts/ChatContext'
import { DataUpdateProvider } from '@/contexts/DataUpdateContext'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider
      refetchInterval={0}
      refetchOnWindowFocus={false}
    >
      <DataUpdateProvider>
        <ChatProvider>
          {children}
        </ChatProvider>
      </DataUpdateProvider>
    </SessionProvider>
  )
}
