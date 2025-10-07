'use client'

import { useState, useEffect, useCallback } from 'react'
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

export default function Login2Page() {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [logs, setLogs] = useState<string[]>([])
  const router = useRouter()

  // Helper to add logs
  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const logMessage = `[${timestamp}] ${message}`
    console.log(logMessage)
    setLogs(prev => [...prev, logMessage])

    // Also send to backend log file
    fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: logMessage })
    }).catch(err => console.error('Failed to send log to backend:', err))
  }, [])

  // Handle Google Sign-In callback
  const handleGoogleSignIn = useCallback(async (response: { credential: string }) => {
    addLog('═══════════════════════════════════════════════════════════')
    addLog('🚀 GOOGLE SIGN-IN FLOW STARTED')
    addLog('═══════════════════════════════════════════════════════════')
    setIsGoogleLoading(true)
    setError('')
    addLog('🔵 Step 1: Google Sign-In callback received')
    addLog(`📦 Step 1a: Credential token received (length: ${response.credential.length})`)
    addLog(`📦 Step 1b: Token preview: ${response.credential.substring(0, 50)}...`)

    try {
      // Call Next.js API route which proxies to backend
      addLog('🔵 Step 2: Preparing to call /api/auth/google endpoint')
      addLog(`🔵 Step 2a: Request body prepared with id_token`)
      addLog('🌐 Step 2b: Sending POST request to /api/auth/google...')

      const result = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_token: response.credential,
        }),
      })

      addLog(`📡 Step 3: Received response from /api/auth/google`)
      addLog(`📡 Step 3a: Response status: ${result.status} ${result.statusText}`)
      addLog(`📋 Step 3b: Response headers: ${JSON.stringify(Object.fromEntries(result.headers.entries()))}`)

      const data = await result.json()
      addLog(`📦 Step 4: Response data parsed successfully`)
      addLog(`📦 Step 4a: Response data keys: ${Object.keys(data).join(', ')}`)
      addLog(`📦 Step 4b: Has access_token: ${!!data.access_token}`)
      addLog(`📦 Step 4c: access_token length: ${data.access_token?.length || 0}`)
      addLog(`📦 Step 4d: access_token preview: ${data.access_token?.substring(0, 30) || 'MISSING'}...`)
      addLog(`📦 Step 4e: Full response (excluding token): ${JSON.stringify({...data, access_token: data.access_token ? '[REDACTED]' : 'MISSING'})}`)

      addLog(`🔍 Step 5: Checking if result.ok: ${result.ok}`)
      if (result.ok) {
        addLog(`✅ Step 5a: result.ok is TRUE - Authentication successful!`)
        addLog('✅ Step 5b: Proceeding with success flow')

        // Store token in localStorage
        addLog('💾 Step 6: Starting localStorage token storage process')
        addLog(`💾 Step 6a: Token to store (length ${data.access_token?.length}): ${data.access_token?.substring(0, 30)}...`)
        addLog('💾 Step 6b: Calling localStorage.setItem("token", ...)')

        try {
          localStorage.setItem('token', data.access_token)
          addLog('✅ Step 6c: localStorage.setItem() completed without throwing error')
        } catch (storageError: any) {
          addLog(`❌ Step 6c: localStorage.setItem() threw error: ${storageError.message}`)
          addLog(`❌ Error type: ${storageError.name}`)
          addLog(`❌ Error stack: ${storageError.stack}`)
          throw storageError
        }

        // Verify token was stored
        addLog('🔍 Step 7: Verifying token was stored in localStorage')
        addLog('🔍 Step 7a: Calling localStorage.getItem("token")')
        const storedToken = localStorage.getItem('token')
        addLog(`🔍 Step 7b: localStorage.getItem returned: ${storedToken ? 'EXISTS' : 'NULL'}`)

        if (storedToken) {
          addLog('✅ Step 7c: Token retrieved successfully from localStorage')
          addLog(`🔑 Step 7d: Retrieved token length: ${storedToken.length}`)
          addLog(`🔑 Step 7e: Retrieved token preview: ${storedToken.substring(0, 20)}...`)
          addLog(`🔑 Step 7f: Tokens match: ${storedToken === data.access_token}`)
          if (storedToken !== data.access_token) {
            addLog('❌ Step 7g: WARNING - Stored token does not match original token!')
          }
        } else {
          addLog('❌ Step 7c: Token storage FAILED! localStorage.getItem returned null')
          throw new Error('Failed to store token')
        }

        // Wait for localStorage to sync
        addLog('⏳ Step 8: Waiting 200ms for localStorage sync/persistence...')
        await new Promise(resolve => setTimeout(resolve, 200))
        addLog('✅ Step 8a: Wait completed')

        // Verify token again
        addLog('🔍 Step 9: Re-verifying token after delay')
        addLog('🔍 Step 9a: Calling localStorage.getItem("token") again')
        const verifyToken = localStorage.getItem('token')
        addLog(`🔍 Step 9b: Token status: ${verifyToken ? 'EXISTS' : 'NULL'}`)
        if (verifyToken) {
          addLog(`✅ Step 9c: Token still present after delay (length: ${verifyToken.length})`)
        } else {
          addLog('❌ Step 9c: CRITICAL - Token disappeared after delay!')
          throw new Error('Token not persisted')
        }

        // Test token with /auth/me endpoint
        addLog('🔍 Step 10: Testing token with /auth/me endpoint')
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'
          addLog(`🔍 Step 10a: API URL: ${apiUrl}`)
          addLog(`🔍 Step 10b: Calling ${apiUrl}/auth/me with Bearer token`)
          const meResponse = await fetch(`${apiUrl}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${verifyToken}`,
            },
            credentials: 'include',
          })
          addLog(`📡 Step 10c: /auth/me response status: ${meResponse.status}`)

          if (meResponse.ok) {
            const meData = await meResponse.json()
            addLog(`✅ Step 10d: Token verified! User: ${meData.name || meData.email || meData.login_id}`)
            addLog(`✅ Step 10e: User data: ${JSON.stringify(meData)}`)
          } else {
            addLog(`⚠️ Step 10d: Token verification failed: ${meResponse.status}`)
            const errorText = await meResponse.text()
            addLog(`⚠️ Step 10e: Error response: ${errorText}`)
          }
        } catch (meError: any) {
          addLog(`⚠️ Step 10d: Token verification error: ${meError.message}`)
          addLog(`⚠️ Step 10e: This may be due to CORS or network issues`)
        }

        // Navigate to chat
        addLog('🚀 Step 11: Preparing to redirect to /chat page')
        addLog(`🔍 Step 11a: Current URL: ${window.location.href}`)
        addLog(`🔍 Step 11b: Target URL: ${window.location.origin}/chat`)

        // Final localStorage check before redirect
        addLog('🔍 Step 11c: Final localStorage token check before redirect')
        const finalToken = localStorage.getItem('token')
        addLog(`🔍 Step 11d: Final token status: ${finalToken ? 'EXISTS (' + finalToken.length + ' chars)' : 'NULL'}`)

        if (!finalToken) {
          addLog('❌ Step 11e: CRITICAL - Token is null right before redirect!')
          throw new Error('Token disappeared before redirect')
        } else {
          addLog('✅ Step 11e: Token confirmed present before redirect')
        }

        addLog('⏳ Step 12: Waiting 100ms before redirect for localStorage sync')
        await new Promise(resolve => setTimeout(resolve, 100))
        addLog('✅ Step 12a: Wait completed')

        // Triple check token one more time
        addLog('🔍 Step 13: Final triple-check of token before redirect')
        const tripleCheckToken = localStorage.getItem('token')
        addLog(`🔍 Step 13a: Triple check result: ${tripleCheckToken ? 'EXISTS (' + tripleCheckToken.length + ' chars)' : 'NULL'}`)

        if (!tripleCheckToken) {
          addLog('❌ Step 13b: CRITICAL - Token disappeared during final check!')
          throw new Error('Token disappeared during final check')
        }

        addLog('🚀 Step 14: INITIATING REDIRECT to /chat')
        addLog('🚀 Step 14a: Calling window.location.href = "/chat"')

        // Use href instead of replace for more reliable navigation
        window.location.href = '/chat'

        addLog('⚠️ Step 14b: THIS LINE SHOULD NOT APPEAR - redirect should have happened')
        addLog('⚠️ If you see this, the redirect may have failed or been delayed')

      } else {
        addLog(`❌ Step 5a: result.ok is FALSE - Authentication FAILED`)
        addLog(`❌ Step 5b: Error detail: ${data.detail || 'Unknown error'}`)
        addLog(`❌ Step 5c: Full error response: ${JSON.stringify(data)}`)
        setError(data.detail || 'Google sign-in failed')
      }
    } catch (err: any) {
      addLog('═══════════════════════════════════════════════════════════')
      addLog(`❌ CRITICAL ERROR OCCURRED`)
      addLog('═══════════════════════════════════════════════════════════')
      addLog(`❌ Error name: ${err.name}`)
      addLog(`❌ Error message: ${err.message}`)
      addLog(`❌ Error stack: ${err.stack}`)
      console.error('Google sign-in error:', err)
      setError('Network error during Google sign-in')
    } finally {
      addLog('🔄 Sign-in flow completed (success or failure)')
      addLog('🔄 Setting isGoogleLoading to false')
      setIsGoogleLoading(false)
      addLog('═══════════════════════════════════════════════════════════')
      addLog('🏁 GOOGLE SIGN-IN FLOW ENDED')
      addLog('═══════════════════════════════════════════════════════════')
    }
  }, [addLog])

  // Initialize Google Sign-In
  const initializeGoogleSignIn = useCallback(() => {
    addLog('🔧 Initializing Google Sign-In...')

    if (!window.google) {
      addLog('⚠️ Google SDK not loaded yet')
      return
    }

    if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
      addLog('❌ GOOGLE_CLIENT_ID not found in environment')
      return
    }

    addLog(`🔑 Client ID: ${process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}`)

    window.google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      callback: handleGoogleSignIn,
      auto_select: false,
      cancel_on_tap_outside: true,
      ux_mode: 'popup',
      context: 'signin',
    })

    const googleButtonElement = document.getElementById('google-signin-button')
    if (googleButtonElement) {
      addLog('✅ Rendering Google button')
      window.google.accounts.id.renderButton(googleButtonElement, {
        type: 'standard',
        shape: 'rectangular',
        theme: 'outline',
        text: 'signin_with',
        size: 'large',
        width: '100%',
        locale: 'en',
      })
    } else {
      addLog('❌ Google button element not found')
    }
  }, [handleGoogleSignIn, addLog])

  // Load Google Sign-In script
  useEffect(() => {
    addLog('🚀 Login2 page mounted')
    addLog(`📱 User Agent: ${navigator.userAgent}`)
    addLog(`🌐 Current URL: ${window.location.href}`)

    const scriptId = 'google-signin-script'
    const existingScript = document.getElementById(scriptId)

    if (existingScript) {
      addLog('♻️ Google script already loaded, initializing...')
      initializeGoogleSignIn()
      return
    }

    addLog('📥 Loading Google Sign-In script...')
    const script = document.createElement('script')
    script.id = scriptId
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      addLog('✅ Google script loaded successfully')
      initializeGoogleSignIn()
    }
    script.onerror = () => {
      addLog('❌ Failed to load Google script')
      setError('Failed to load Google Sign-In')
    }
    document.head.appendChild(script)
  }, [initializeGoogleSignIn, addLog])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="mx-auto mt-12 max-w-2xl">
        <div className="mb-4 text-center">
          <h1 className="text-3xl font-bold text-gray-800">Welcome to Therapy Bro</h1>
          <p className="text-sm text-gray-600 mt-2">Login2 - Debug Version</p>
        </div>

        {/* Main Login Card */}
        <div className="rounded-2xl bg-white p-8 shadow-lg">
          <div className="space-y-4">
            {/* Google Sign-In Section */}
            <div className="space-y-3">
              <div className="text-center text-sm text-gray-600">
                Sign in with Google
              </div>

              <div
                id="google-signin-button"
                className={`flex items-center justify-center min-h-[44px] ${
                  isGoogleLoading ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                {isGoogleLoading && (
                  <div className="flex items-center justify-center w-full py-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-700">Signing in...</span>
                  </div>
                )}
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Debug Logs Card */}
        <div className="mt-4 rounded-2xl bg-gray-900 p-4 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold text-green-400">🔍 Debug Logs</h2>
            <button
              onClick={() => setLogs([])}
              className="text-xs text-gray-400 hover:text-white"
            >
              Clear
            </button>
          </div>
          <div className="bg-black rounded-lg p-3 h-96 overflow-y-auto font-mono text-xs">
            {logs.length === 0 ? (
              <div className="text-gray-500">Waiting for activity...</div>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  className={`mb-1 ${
                    log.includes('❌') ? 'text-red-400' :
                    log.includes('✅') ? 'text-green-400' :
                    log.includes('⚠️') ? 'text-yellow-400' :
                    log.includes('🚀') || log.includes('🔵') ? 'text-blue-400' :
                    'text-gray-300'
                  }`}
                >
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-4 rounded-2xl bg-blue-50 p-4 text-sm text-blue-800">
          <p className="font-semibold mb-1">Debug Instructions:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>All actions are logged in real-time above</li>
            <li>On mobile: Use Chrome Remote Debugging to see logs</li>
            <li>Token is stored in localStorage after successful login</li>
            <li>You'll be redirected to /chat after authentication</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
