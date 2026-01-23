'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function UserMenu() {
  const { data: session } = useSession()
  const router = useRouter()

  if (!session) {
    return (
      <div className="flex gap-4">
        <a
          href="/auth/signin"
          className="px-4 py-2 text-xs font-bold text-textMuted uppercase tracking-widest hover:text-textPrimary transition-all"
        >
          Identify
        </a>
        <a
          href="/auth/register"
          className="px-6 py-2 text-xs font-bold bg-primary text-textPrimary rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 uppercase tracking-widest"
        >
          Initialize
        </a>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex flex-col items-end">
        <span className="text-sm font-black text-textPrimary tracking-tight">
          {session.user?.email}
        </span>
      </div>
      <Link
        href="/help"
        className="px-4 py-2 text-xs font-bold text-textMuted uppercase tracking-widest hover:text-secondary hover:bg-secondary/10 border border-transparent hover:border-secondary/20 rounded-xl transition-all"
      >
        Help
      </Link>
      <button
        onClick={() => {
          signOut({ callbackUrl: '/auth/signin' })
        }}
        className="px-4 py-2 text-xs font-bold text-textMuted uppercase tracking-widest hover:text-error hover:bg-error/10 border border-transparent hover:border-error/20 rounded-xl transition-all"
      >
        Signal Out
      </button>
    </div>
  )
}
