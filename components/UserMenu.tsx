'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function UserMenu() {
  const { data: session } = useSession()
  const router = useRouter()

  if (!session) {
    return (
      <div className="flex gap-2">
        <a
          href="/auth/signin"
          className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
        >
          Sign In
        </a>
        <a
          href="/auth/register"
          className="px-4 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Register
        </a>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-gray-700">
        {session.user?.email}
      </span>
      <button
        onClick={() => {
          signOut({ callbackUrl: '/auth/signin' })
        }}
        className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
      >
        Sign Out
      </button>
    </div>
  )
}
