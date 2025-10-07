'use client'

import { useState, useEffect, useCallback } from 'react'
import { login, register } from '@/lib/api'
import { useRouter } from 'next/navigation'

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
  const [loginId, setLoginId] = useState('demo')
  const [password, setPassword] = useState('demo123')
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
        console.log('🚀 [LOGIN] Redirecting to /chat...')

        // Small delay to ensure localStorage is synced on mobile browsers
        await new Promise(resolve => setTimeout(resolve, 100))

        // Use window.location for more reliable navigation on mobile
        window.location.href = '/chat'
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
      console.log('Login attempt started...', { mode, loginId })

      if (mode === 'login') {
        await login(loginId, password)
      } else {
        await register(loginId, password, 'Demo User')
      }

      console.log('Auth API call completed')

      // Ensure token is persisted before navigation (critical for mobile)
      const token = localStorage.getItem('token')
      console.log('Token retrieved from localStorage:', token ? 'EXISTS' : 'NULL')

      if (!token) {
        throw new Error('Token not stored properly after login')
      }

      // Verify token is valid by testing an API call
      try {
        await fetch(process.env.NEXT_PUBLIC_API_BASE_URL + '/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` },
          credentials: 'include'
        })
        console.log('Token verification successful')
      } catch (verifyErr) {
        console.error('Token verification failed:', verifyErr)
        throw new Error('Authentication token invalid')
      }

      // Small delay to ensure localStorage is synced on mobile browsers
      await new Promise(resolve => setTimeout(resolve, 150))

      console.log('Redirecting to /chat...')
      // Use window.location for more reliable navigation on mobile
      window.location.href = '/chat'
    } catch (err: any) {
      console.error('Auth error:', err)
      setError(err.message || 'Authentication failed')
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto mt-24 max-w-md">
      <h1 className="mb-6 text-2xl font-semibold">Welcome</h1>

      <div className="space-y-4 rounded-2xl bg-card p-6 shadow">
        {/* Google Sign-In Section */}
        <div className="space-y-3">
          <div className="text-center text-sm text-gray-600">
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
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-card text-gray-500">Or continue with email</span>
          </div>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={submit} className="space-y-3">
          <input
            name="loginId"
            className="w-full rounded-xl bg-black/20 p-3"
            value={loginId}
            onChange={e => setLoginId(e.target.value)}
            placeholder="Email or Login ID"
            required
          />
          <input
            name="password"
            className="w-full rounded-xl bg-black/20 p-3"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            required
          />

          {error && (
            <div className="text-sm text-red-400 bg-red-50 p-2 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-xl bg-accent px-6 py-2 text-white hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Loading...' : mode === 'login' ? 'Login' : 'Register'}
            </button>

            <button
              type="button"
              disabled={isLoading}
              className="text-sm opacity-75 hover:opacity-100 transition-opacity disabled:opacity-50"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
            >
              {mode === 'login' ? 'Need an account? Register' : 'Have an account? Login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
