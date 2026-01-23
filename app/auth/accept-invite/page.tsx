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
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full bg-surface border border-border/60 rounded-2xl shadow-2xl p-8 backdrop-blur-sm">
          <h2 className="text-2xl font-black text-textPrimary tracking-tight mb-4">Invalid Invite</h2>
          <p className="text-textMuted font-medium mb-6">
            This invite link is invalid or missing a token.
          </p>
          <Link
            href="/auth/signin"
            className="inline-block text-xs font-bold text-secondary uppercase tracking-widest hover:text-secondary/80 transition-colors"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    )
  }

  if (error && !inviteInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full bg-surface border border-border/60 rounded-2xl shadow-2xl p-8 backdrop-blur-sm">
          <h2 className="text-2xl font-black text-textPrimary tracking-tight mb-4">Invalid Invite</h2>
          <p className="text-textMuted font-medium mb-6">{error}</p>
          <Link
            href="/auth/signin"
            className="inline-block text-xs font-bold text-secondary uppercase tracking-widest hover:text-secondary/80 transition-colors"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full bg-surface border border-border/60 rounded-2xl shadow-2xl p-8 backdrop-blur-sm">
          <h2 className="text-2xl font-black text-textPrimary tracking-tight mb-4">Sign In Required</h2>
          <p className="text-textMuted font-medium mb-6">
            You need to sign in to accept this invite.
          </p>
          {inviteInfo && (
            <div className="bg-surfaceElevated border border-border/60 rounded-xl p-4 mb-6">
              <p className="text-sm text-textMuted">
                You've been invited to join <span className="text-textPrimary font-bold">{inviteInfo.tenantName}</span>{' '}
                as <span className="text-secondary font-bold uppercase tracking-wider">{inviteInfo.role}</span>.
              </p>
            </div>
          )}
          <button
            onClick={() => signIn()}
            className="w-full py-3 px-4 bg-primary text-textPrimary font-bold rounded-xl hover:bg-primary/90 transition-all duration-300 shadow-lg shadow-primary/20"
          >
            Sign In
          </button>
        </div>
      </div>
    )
  }

  if (inviteInfo && inviteInfo.email !== session.user?.email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full bg-surface border border-border/60 rounded-2xl shadow-2xl p-8 backdrop-blur-sm">
          <h2 className="text-2xl font-black text-textPrimary tracking-tight mb-4 text-error">Email Mismatch</h2>
          <p className="text-textMuted font-medium mb-4">
            This invite was sent to <span className="text-textPrimary font-bold">{inviteInfo.email}</span>, but
            you're signed in as <span className="text-textPrimary font-bold">{session.user?.email}</span>.
          </p>
          <p className="text-sm text-textMuted italic mb-6">
            Please sign in with the email address the invite was sent to.
          </p>
          <button
            onClick={() => signIn()}
            className="w-full py-3 px-4 bg-surfaceElevated border border-border/60 text-textPrimary font-bold rounded-xl hover:bg-surfaceElevated/80 transition-all"
          >
            Sign In with Different Account
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full bg-surface border border-border rounded-2xl shadow-2xl p-8 backdrop-blur-sm">
        <h2 className="text-3xl font-black text-textPrimary tracking-tight mb-6">Accept Invite</h2>
        {inviteInfo && (
          <div className="mb-8">
            <p className="text-xs font-bold text-textMuted uppercase tracking-widest mb-2">
              You've been invited to join:
            </p>
            <p className="text-2xl font-bold text-primary">{inviteInfo.tenantName}</p>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs font-bold text-textMuted uppercase tracking-widest">Role:</span>
              <span className="px-2 py-0.5 bg-secondary/20 text-secondary border border-secondary/30 rounded-full text-[10px] font-bold uppercase tracking-wider">
                {inviteInfo.role}
              </span>
            </div>
          </div>
        )}
        {error && (
          <div className="mb-6 bg-error/10 border border-error/20 text-error px-4 py-3 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}
        <button
          onClick={handleAccept}
          disabled={loading}
          className="w-full py-3 px-4 bg-primary text-textPrimary font-bold rounded-xl hover:bg-primary/90 transition-all duration-300 shadow-lg shadow-primary/20 disabled:opacity-50"
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center text-textMuted">Loading...</div>
      </div>
    }>
      <AcceptInviteContent />
    </Suspense>
  )
}
