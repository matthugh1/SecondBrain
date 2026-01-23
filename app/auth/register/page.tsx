'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // This useEffect is now empty after removing the agent log.
    // If it's meant to be empty, it's fine. Otherwise, it might be a candidate for removal.
  }, [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {

    setError('')
    setLoading(true)

    console.log('Registration attempt:', { email, name: name || '(not provided)' })

    // Validate form
    if (!email || !password) {
      setError('Email and password are required')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {

      console.log('Sending registration request...')
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })


      console.log('Registration response status:', response.status)

      let data
      try {
        data = await response.json()
        console.log('Registration response data:', data)
      } catch (parseError) {
        setError('Server error: Invalid response from server. Check if DATABASE_URL is configured.')
        setLoading(false)
        console.error('Failed to parse response:', parseError)
        return
      }

      if (!response.ok) {
        setError(data.error || `Registration failed (${response.status})`)
        setLoading(false)
        console.error('Registration error:', data)
        return
      }

      console.log('Registration successful, attempting sign-in...')

      // Auto sign in after registration
      try {
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false,
          callbackUrl: '/',
        })

        console.log('Sign-in result:', result)

        if (result?.error) {
          console.error('Sign-in error:', result.error)
          setError(`✅ Registration successful! However, automatic sign-in failed. Please click "Sign In" below to sign in manually.`)
          setLoading(false)
          // Don't redirect - let user see the success message and manually sign in
          return
        }

        if (result?.ok || !result?.error) {
          console.log('Sign-in successful, redirecting...')
          // Successfully signed in, redirect to home
          window.location.href = '/' // Use window.location for a full page reload
          return
        }
      } catch (signInError) {
        console.error('Sign-in exception:', signInError)
        setError('✅ Registration successful! Please sign in manually using your new account.')
        setLoading(false)
        // Don't auto-redirect - let user see the message and choose to sign in
        return
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred. Please try again.'
      setError(`Network error: ${errorMessage}`)
      setLoading(false)
      console.error('Registration error:', err)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-10">
          <div className="inline-block p-3 rounded-2xl bg-surfaceElevated border border-border mb-4 shadow-lg shadow-primary/10">
            <svg className="w-10 h-10 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 className="text-4xl font-black text-textPrimary tracking-tight">
            Join the Network
          </h2>
          <p className="mt-2 text-textMuted font-medium italic">
            Create your local node in the Second Brain
          </p>
        </div>

        <div className="bg-surface border border-border/60 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
          <form
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleSubmit(e)
              return false
            }}
            noValidate
          >
            {error && (
              <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-xl text-sm font-medium animate-shake">
                {error}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-xs font-bold text-textMuted uppercase tracking-widest mb-1.5 ml-1">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  className="w-full px-4 py-3 bg-surfaceElevated border border-border/60 rounded-xl text-textPrimary placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-300"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-xs font-bold text-textMuted uppercase tracking-widest mb-1.5 ml-1">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="w-full px-4 py-3 bg-surfaceElevated border border-border/60 rounded-xl text-textPrimary placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-300"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !loading) {
                      e.preventDefault()
                    }
                  }}
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-xs font-bold text-textMuted uppercase tracking-widest mb-1.5 ml-1">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  className="w-full px-4 py-3 bg-surfaceElevated border border-border/60 rounded-xl text-textPrimary placeholder-textMuted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-300"
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !loading) {
                      e.preventDefault()
                    }
                  }}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-primary text-textPrimary font-bold rounded-xl hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300 shadow-lg shadow-primary/20 disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-textPrimary" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Creating account...
                  </span>
                ) : 'Create Account'}
              </button>
            </div>

            <div className="pt-4 text-center border-t border-border/50">
              <Link
                href="/auth/signin"
                className="text-xs font-bold text-secondary uppercase tracking-widest hover:text-secondary/80 transition-colors"
              >
                Already have an account? Sign In
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
