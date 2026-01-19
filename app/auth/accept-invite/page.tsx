'use client'

export const dynamic = 'force-dynamic'
export const dynamicParams = true

import { useSearchParams, useRouter } from 'next/navigation'
import { signIn, useSession } from 'next-auth/react'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'

function AcceptInviteContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data: session } = useSession()
  const token = searchParams.get('token')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inviteInfo, setInviteInfo] = useState<{
    tenantName: string
    email: string
    role: string
  } | null>(null)

  useEffect(() => {
    if (token) {
      fetchInviteInfo()
    }
  }, [token])

  const fetchInviteInfo = async () => {
    try {
      const response = await fetch(`/api/tenants/invite/info?token=${token}`)
      if (response.ok) {
        const data = await response.json()
        setInviteInfo(data)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Invalid or expired invite')
      }
    } catch (error) {
      setError('Failed to load invite information')
    }
  }

  const handleAccept = async () => {
    if (!token || !session?.user) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/tenants/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      if (response.ok) {
        router.push('/')
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to accept invite')
      }
    } catch (error) {
      setError('Failed to accept invite')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold mb-4">Invalid Invite</h2>
          <p className="text-gray-600 mb-4">
            This invite link is invalid or missing a token.
          </p>
          <Link
            href="/auth/signin"
            className="text-indigo-600 hover:text-indigo-500"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    )
  }

  if (error && !inviteInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold mb-4">Invalid Invite</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link
            href="/auth/signin"
            className="text-indigo-600 hover:text-indigo-500"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold mb-4">Sign In Required</h2>
          <p className="text-gray-600 mb-4">
            You need to sign in to accept this invite.
          </p>
          {inviteInfo && (
            <p className="text-sm text-gray-500 mb-4">
              You've been invited to join <strong>{inviteInfo.tenantName}</strong>{' '}
              as a <strong>{inviteInfo.role}</strong>.
            </p>
          )}
          <button
            onClick={() => signIn()}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Sign In
          </button>
        </div>
      </div>
    )
  }

  if (inviteInfo && inviteInfo.email !== session.user?.email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold mb-4">Email Mismatch</h2>
          <p className="text-gray-600 mb-4">
            This invite was sent to <strong>{inviteInfo.email}</strong>, but
            you're signed in as <strong>{session.user?.email}</strong>.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Please sign in with the email address the invite was sent to.
          </p>
          <button
            onClick={() => signIn()}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Sign In with Different Account
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow p-8">
        <h2 className="text-2xl font-bold mb-4">Accept Invite</h2>
        {inviteInfo && (
          <div className="mb-6">
            <p className="text-gray-600 mb-2">
              You've been invited to join:
            </p>
            <p className="text-lg font-semibold">{inviteInfo.tenantName}</p>
            <p className="text-sm text-gray-500 mt-2">
              Role: <span className="capitalize">{inviteInfo.role}</span>
            </p>
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}
        <button
          onClick={handleAccept}
          disabled={loading}
          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? 'Accepting...' : 'Accept Invite'}
        </button>
      </div>
    </div>
  )
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">Loading...</div>
      </div>
    }>
      <AcceptInviteContent />
    </Suspense>
  )
}
