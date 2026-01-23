import type { Metadata } from 'next'
import './globals.css'
import TopBar from '@/components/TopBar'
import { Providers } from '@/components/Providers'
import LayoutWithChat from '@/components/LayoutWithChat'

export const metadata: Metadata = {
  title: 'Second Brain',
  description: 'Personal knowledge management system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="flex flex-col h-screen overflow-hidden">
        <Providers>
          <TopBar />
          <LayoutWithChat>
            {children}
          </LayoutWithChat>
        </Providers>
      </body>
    </html>
  )
}
