'use client'

import { useState, useEffect, useCallback } from 'react'
import { login, register } from '@/lib/api'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// Google Sign-In types
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void
          renderButton: (element: HTMLElement, config: any) => void
          prompt: () => void
        }
      }
    }
  }
}

export default function LoginPage() {
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [error, setError] = useState('')
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleGoogleSignIn = useCallback(async (response: { credential: string }) => {
    setIsGoogleLoading(true)
    setError('')

    console.log('🔵 [LOGIN] Starting Google Sign-In...')
    console.log('📍 [LOGIN] Current URL:', window.location.href)
    console.log('🌐 [LOGIN] API Base URL:', process.env.NEXT_PUBLIC_API_BASE_URL)

    try {
      const fetchUrl = '/api/auth/google'
      console.log(`🌐 [LOGIN] Fetching: ${fetchUrl}`)
      console.log('📦 [LOGIN] Sending credential token length:', response.credential.length)

      const result = await fetch(fetchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_token: response.credential,
        }),
      })

      console.log('📡 [LOGIN] Response status:', result.status, result.statusText)
      console.log('📋 [LOGIN] Response headers:', Object.fromEntries(result.headers.entries()))

      const data = await result.json()
      console.log('📦 [LOGIN] Response data keys:', Object.keys(data))

      if (result.ok) {
        console.log('✅ [LOGIN] Authentication successful!')
        console.log('💾 [LOGIN] Storing token in localStorage...')
        localStorage.setItem('token', data.access_token)
        console.log('✅ [LOGIN] Token stored')
        console.log('🚀 [LOGIN] Redirecting to /dashboard...')

        // Small delay to ensure localStorage is synced on mobile browsers
        await new Promise(resolve => setTimeout(resolve, 100))

        // Use window.location for more reliable navigation on mobile
        window.location.href = '/dashboard'
      } else {
        const errorMsg = data.detail || 'Google sign-in failed'
        console.error('❌ [LOGIN] Authentication failed:', errorMsg)
        console.error('📦 [LOGIN] Full error response:', data)
        setError(`Error: ${errorMsg}`)
      }
    } catch (err: any) {
      console.error('❌ [LOGIN] CRITICAL ERROR:', err)
      console.error('❌ [LOGIN] Error name:', err.name)
      console.error('❌ [LOGIN] Error message:', err.message)
      console.error('❌ [LOGIN] Error stack:', err.stack)
      console.error('❌ [LOGIN] Full error object:', err)

      // More detailed error message
      let errorMsg = 'Network error during Google sign-in'
      if (err.message) {
        errorMsg += `: ${err.message}`
      }
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        errorMsg = `Failed to fetch /api/auth/google - Network error. Check if server is running and accessible.`
      }

      setError(`Error: ${errorMsg}`)
    } finally {
      setIsGoogleLoading(false)
      console.log('🏁 [LOGIN] Sign-in attempt completed')
    }
  }, [router])

  const initializeGoogleSignIn = useCallback(() => {
    if (!window.google || !process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) return

    window.google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      callback: handleGoogleSignIn,
      auto_select: false,
      cancel_on_tap_outside: true,
      // Mobile-friendly settings
      ux_mode: 'popup',  // Use popup mode for better mobile support
      context: 'signin',
    })

    const googleButtonElement = document.getElementById('google-signin-button')
    if (googleButtonElement) {
      window.google.accounts.id.renderButton(googleButtonElement, {
        type: 'standard',
        shape: 'rectangular',
        theme: 'outline',
        text: 'signin_with',
        size: 'large',
        width: '100%',
        // Mobile optimization
        locale: 'en',
      })
    }
  }, [handleGoogleSignIn])

  useEffect(() => {
    const scriptId = 'google-signin-script'
    if (document.getElementById(scriptId)) {
      initializeGoogleSignIn()
      return
    }

    const script = document.createElement('script')
    script.id = scriptId
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = initializeGoogleSignIn
    document.head.appendChild(script)
  }, [initializeGoogleSignIn])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      if (mode === 'login') await login(loginId, password)
      else await register(loginId, password, 'Demo User')
      router.push('/dashboard')
    } catch (e:any) { setError(String(e.message||e)) } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-main flex items-center justify-center px-4">
      <div className="mx-auto w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text mb-2">Welcome to Therapy Bro</h1>
          <p className="text-text-muted">Sign in to start your therapeutic journey</p>
        </div>

        <div className="space-y-4 rounded-2xl bg-white p-8 shadow-glass">
        {/* Google Sign-In Section */}
        <div className="space-y-3">
          <div className="text-center text-sm text-text-muted font-medium">
            Sign {mode === 'login' ? 'in' : 'up'} with Google
          </div>

          <div
            id="google-signin-button"
            className={`flex items-center justify-center ${isGoogleLoading ? 'opacity-50 pointer-events-none' : ''}`}
          >
            {isGoogleLoading && (
              <div className="flex items-center justify-center w-full py-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-accent"></div>
                <span className="ml-2">Signing in...</span>
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-text-muted">Or continue with email</span>
          </div>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="loginId" className="block text-sm font-medium text-text mb-2">
              Email or Login ID
            </label>
            <input
              id="loginId"
              name="loginId"
              className="w-full rounded-xl bg-bg-muted border border-border p-3 text-text focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
              value={loginId}
              onChange={e => setLoginId(e.target.value)}
              placeholder="Enter your email or login ID"
              required
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="password" className="block text-sm font-medium text-text">
                Password
              </label>
              {mode === 'login' && (
                <Link
                  href="/forgot-password"
                  className="text-sm text-accent hover:text-accent-light transition-colors font-medium"
                >
                  Forgot Password?
                </Link>
              )}
            </div>
            <input
              id="password"
              name="password"
              className="w-full rounded-xl bg-bg-muted border border-border p-3 text-text focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          {error && (
            <div className="text-sm text-danger bg-red-50 p-3 rounded-xl border border-red-200">
              {error}
            </div>
          )}

          <div className="space-y-4 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-gradient-accent px-6 py-3 text-white font-medium hover:opacity-90 transition-all shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Loading...
                </span>
              ) : (
                mode === 'login' ? 'Sign In' : 'Create Account'
              )}
            </button>

            <div className="text-center">
              <button
                type="button"
                disabled={isLoading}
                className="text-sm text-accent hover:text-accent-light transition-colors disabled:opacity-50 font-medium"
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              >
                {mode === 'login' ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
              </button>
            </div>
          </div>
        </form>
        </div>
      </div>
    </div>
  )
}