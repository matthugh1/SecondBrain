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

  // #region agent log
  useEffect(() => {
    const currentUrl = typeof window !== 'undefined' ? window.location.href : 'ssr'
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : 'ssr'
    
    fetch('http://127.0.0.1:7243/ingest/03cc86a7-5004-44c5-8434-e4ab8f6d3441',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'register/page.tsx:component-mount',message:'RegisterPage component mounted',data:{pathname:currentPath,href:currentUrl,isSigninPage:currentPath.includes('/signin')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    
    // Monitor URL changes
    const checkUrl = () => {
      if (typeof window !== 'undefined' && window.location.pathname !== currentPath) {
        fetch('http://127.0.0.1:7243/ingest/03cc86a7-5004-44c5-8434-e4ab8f6d3441',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'register/page.tsx:url-change',message:'URL changed after mount',data:{oldPath:currentPath,newPath:window.location.pathname,newHref:window.location.href},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      }
    }
    
    // Check immediately and after a short delay
    setTimeout(checkUrl, 100)
    setTimeout(checkUrl, 500)
    setTimeout(checkUrl, 1000)
  }, [])
  // #endregion

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/03cc86a7-5004-44c5-8434-e4ab8f6d3441',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'register/page.tsx:handleSubmit-entry',message:'handleSubmit called',data:{hasEmail:!!email,hasPassword:!!password,passwordLength:password.length,defaultPrevented:e.defaultPrevented},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
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
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/03cc86a7-5004-44c5-8434-e4ab8f6d3441',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'register/page.tsx:before-fetch',message:'About to call registration API',data:{url:typeof window !== 'undefined' ? window.location.href : 'ssr'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      console.log('Sending registration request...')
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })

      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/03cc86a7-5004-44c5-8434-e4ab8f6d3441',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'register/page.tsx:after-fetch',message:'Registration API response received',data:{status:response.status,ok:response.ok,url:typeof window !== 'undefined' ? window.location.href : 'ssr'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
        </div>
        <form 
          className="mt-8 space-y-6"
          onSubmit={(e) => {
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/03cc86a7-5004-44c5-8434-e4ab8f6d3441',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'register/page.tsx:form-onSubmit-wrapper',message:'Form onSubmit wrapper called',data:{defaultPrevented:e.defaultPrevented,type:e.type},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
            // #endregion
            
            e.preventDefault()
            e.stopPropagation()
            handleSubmit(e)
            return false
          }}
          noValidate
        >
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="name" className="sr-only">
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
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
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password (min 6 characters)"
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
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
            {loading && (
              <p className="mt-2 text-sm text-gray-500 text-center">
                Please wait, creating your account...
              </p>
            )}
          </div>

          <div className="text-center">
            <Link
              href="/auth/signin"
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              Already have an account? Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
