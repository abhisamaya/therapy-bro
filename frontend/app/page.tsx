'use client'

import { useState, useEffect, useCallback } from 'react'
import { login, register, requestOTP } from '@/lib/api'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

// Google Sign-In types
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void
          renderButton: (element: HTMLElement, config: any) => void
          prompt: (callback?: any) => void
          cancel: () => void
        }
      }
    }
  }
}

type Mode = 'login' | 'register' | 'forgot-password'

export default function LandingPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [mode, setMode] = useState<Mode>('login')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false)
  const router = useRouter()

  const handleGoogleSignIn = useCallback(async (response: { credential: string }) => {
    setIsGoogleLoading(true)
    setError('')

    try {
      const result = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id_token: response.credential,
        }),
      })

      const data = await result.json()

      if (result.ok) {
        localStorage.setItem('token', data.access_token)
        await new Promise(resolve => setTimeout(resolve, 100))

        // Check if user needs onboarding
        if (data.needs_onboarding) {
          window.location.href = '/onboarding'
        } else {
          window.location.href = '/dashboard'
        }
      } else {
        const errorMsg = data.detail || 'Google sign-in failed'
        setError(`Error: ${errorMsg}`)
      }
    } catch (err: any) {
      let errorMsg = 'Network error during Google sign-in'
      if (err.message) {
        errorMsg += `: ${err.message}`
      }
      setError(`Error: ${errorMsg}`)
    } finally {
      setIsGoogleLoading(false)
    }
  }, [])

  const initializeGoogleSignIn = useCallback(() => {
    if (!window.google || !process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) return

    // Cancel any One Tap prompts
    window.google.accounts.id.cancel()

    window.google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      callback: handleGoogleSignIn,
      auto_select: false,
      cancel_on_tap_outside: true,
      ux_mode: 'popup',
      context: 'signin',
    })
  }, [handleGoogleSignIn])

  const handleGoogleButtonClick = () => {
    if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
      setError('Google Client ID not configured')
      return
    }

    setIsGoogleLoading(true)
    setError('')

    // Build Google OAuth URL
    const redirectUri = `${window.location.origin}/api/auth/google/callback`
    const scope = 'openid email profile'
    const responseType = 'id_token'
    const nonce = Math.random().toString(36).substring(2, 15)

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=${responseType}` +
      `&scope=${encodeURIComponent(scope)}` +
      `&nonce=${nonce}`

    // Open popup window
    const width = 500
    const height = 600
    const left = window.screenX + (window.outerWidth - width) / 2
    const top = window.screenY + (window.outerHeight - height) / 2

    const popup = window.open(
      authUrl,
      'Google Sign In',
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`
    )

    if (!popup) {
      setIsGoogleLoading(false)
      setError('Please allow popups for Google sign-in')
      return
    }

    // Listen for message from popup
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return

      if (event.data.type === 'GOOGLE_AUTH_SUCCESS' && event.data.credential) {
        window.removeEventListener('message', handleMessage)
        await handleGoogleSignIn({ credential: event.data.credential })
      } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
        window.removeEventListener('message', handleMessage)
        setIsGoogleLoading(false)
        setError(event.data.error || 'Google sign-in failed')
      }
    }

    window.addEventListener('message', handleMessage)

    // Check if popup was closed
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed)
        window.removeEventListener('message', handleMessage)
        setIsGoogleLoading(false)
      }
    }, 1000)
  }

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

    // Cleanup: cancel One Tap when component unmounts
    return () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.cancel()
      }
    }
  }, [initializeGoogleSignIn])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setForgotPasswordSuccess(false)

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    // Password validation for both login and registration
    if (mode !== 'forgot-password') {
      if (!password || password.length < 8) {
        setError('Please create a strong password with at least 8 characters')
        return
      }

      // Additional password strength checks
      const hasUpperCase = /[A-Z]/.test(password)
      const hasLowerCase = /[a-z]/.test(password)
      const hasNumber = /[0-9]/.test(password)

      if (mode === 'register' && password.length < 8) {
        setError('Password should be at least 8 characters long for better security')
        return
      }

      if (mode === 'register' && !(hasUpperCase || hasLowerCase) && !hasNumber) {
        setError('Please create a strong password with letters and numbers')
        return
      }
    }

    // Additional validation for registration
    if (mode === 'register') {
      // Phone number validation (must be exactly 10 digits)
      const phoneRegex = /^[0-9]{10}$/
      if (!phoneRegex.test(phone)) {
        setError('Please enter a valid 10-digit phone number')
        return
      }

      // Date of birth validation
      if (!dateOfBirth) {
        setError('Please enter your date of birth')
        return
      }

      const dob = new Date(dateOfBirth)
      const today = new Date()

      if (isNaN(dob.getTime())) {
        setError('Please enter a valid date of birth')
        return
      }

      if (dob >= today) {
        setError('Date of birth must be in the past')
        return
      }

      // Check if user is at least 13 years old
      const age = today.getFullYear() - dob.getFullYear()
      const monthDiff = today.getMonth() - dob.getMonth()
      const dayDiff = today.getDate() - dob.getDate()
      const actualAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age

      if (actualAge < 13) {
        setError('You must be at least 13 years old to register')
        return
      }

      // Terms and conditions validation
      if (!termsAccepted) {
        setError('Please accept the Terms and Conditions to continue')
        return
      }
    }

    setIsLoading(true)

    try {
      if (mode === 'forgot-password') {
        await requestOTP(email)
        setForgotPasswordSuccess(true)
        // Redirect to forgot-password page after a short delay
        setTimeout(() => {
          router.push('/forgot-password')
        }, 2000)
      } else if (mode === 'login') {
        const loginResponse = await login(email, password)
        // Check if user needs onboarding
        if (loginResponse.needs_onboarding) {
          router.push('/onboarding')
        } else {
          router.push('/dashboard')
        }
      } else {
        await register(email, password, 'User', phone, dateOfBirth)
        router.push('/onboarding')
      }
    } catch (e: any) {
      setError(String(e.message || e))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <style jsx global>{`
        /* Date input calendar icon styling */
        input[type="date"]::-webkit-calendar-picker-indicator {
          cursor: pointer;
          filter: opacity(0.6);
          padding: 4px;
        }
        input[type="date"]::-webkit-calendar-picker-indicator:hover {
          filter: opacity(1);
        }
        input[type="date"]:focus::-webkit-calendar-picker-indicator {
          filter: brightness(0) saturate(100%) invert(64%) sepia(43%) saturate(1077%) hue-rotate(139deg) brightness(95%) contrast(86%);
        }
        /* Dark mode calendar icon */
        .dark input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(1) opacity(0.6);
        }
        .dark input[type="date"]::-webkit-calendar-picker-indicator:hover {
          filter: invert(1) opacity(1);
        }
        /* Ensure date input shows placeholder-like text when empty */
        input[type="date"]:not(:focus)::-webkit-datetime-edit {
          color: transparent;
        }
        input[type="date"]:focus::-webkit-datetime-edit,
        input[type="date"]:valid::-webkit-datetime-edit {
          color: inherit;
        }
      `}</style>
      <div className="relative flex min-h-screen w-full flex-col bg-white dark:bg-gray-900">
        <div className="layout-container flex h-full grow flex-col">
          <main className="flex min-h-screen w-full flex-col lg:flex-row px-8 sm:px-12 lg:px-16 pt-1 pb-8 gap-6 lg:gap-12 max-w-7xl mx-auto">
          {/* Left Side - Logo and Tagline */}
          <div className="w-full flex flex-col items-center justify-center lg:w-1/2 order-1 lg:order-1">
            <div className="flex flex-col items-center gap-3 lg:max-w-lg text-center">
              <Image
                alt="Therapy Bro Logo"
                className="w-48 h-auto sm:w-56"
                src="/therapy-bro-logo.png"
                width={224}
                height={224}
                priority
              />
              <p className="text-2xl text-slate-900 dark:text-white lg:text-3xl font-bold text-center">
                Share <span className="text-4xl text-slate-900 dark:text-white">•</span> Heal <span className="text-4xl text-slate-900 dark:text-white">•</span> Grow
              </p>
            </div>
          </div>

          {/* Right Side - Login/Register Form */}
          <div className="flex w-full flex-col items-center justify-center lg:w-1/2 order-2 lg:order-2">
            <div className="flex w-full max-w-md flex-col justify-center">
              <div className="flex w-full flex-col gap-3 bg-white dark:bg-slate-900 p-5 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
                {/* Google Sign-In Button */}
                <button
                  type="button"
                  onClick={handleGoogleButtonClick}
                  disabled={isGoogleLoading}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#4abbc9]/50 focus:ring-offset-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGoogleLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-slate-700 dark:border-slate-200"></div>
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <svg aria-hidden="true" className="h-5 w-5" fill="currentColor" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"></path>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"></path>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"></path>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"></path>
                      </svg>
                      <span>Sign in with Google</span>
                    </>
                  )}
                </button>

                {mode === 'forgot-password' && forgotPasswordSuccess ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
                    OTP sent to your email! Redirecting to reset password page...
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
                    <input
                      className="form-input w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-[#4abbc9] focus:outline-none focus:ring-2 focus:ring-[#4abbc9]/50 dark:focus:border-[#4abbc9]"
                      id="email"
                      placeholder="Email address"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                    {mode !== 'forgot-password' && (
                      <>
                        <input
                          className="form-input w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-[#4abbc9] focus:outline-none focus:ring-2 focus:ring-[#4abbc9]/50 dark:focus:border-[#4abbc9]"
                          id="password"
                          placeholder="Password"
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                        {mode === 'register' && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 -mt-1">
                            Password must be at least 8 characters with letters and numbers
                          </p>
                        )}
                      </>
                    )}

                    {mode === 'register' && (
                      <>
                        <input
                          className="form-input w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-[#4abbc9] focus:outline-none focus:ring-2 focus:ring-[#4abbc9]/50 dark:focus:border-[#4abbc9]"
                          id="phone"
                          placeholder="Phone Number (10 digits)"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          required
                          maxLength={10}
                        />
                        <div className="flex flex-col gap-1">
                          <label htmlFor="dateOfBirth" className="text-xs font-medium text-slate-700 dark:text-slate-300 px-1">
                            Date of Birth *
                          </label>
                          <input
                            className="form-input w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-[#4abbc9] focus:outline-none focus:ring-2 focus:ring-[#4abbc9]/50 dark:focus:border-[#4abbc9] cursor-pointer"
                            id="dateOfBirth"
                            type="date"
                            value={dateOfBirth}
                            onChange={(e) => setDateOfBirth(e.target.value)}
                            required
                            max={new Date().toISOString().split('T')[0]}
                            min={new Date(new Date().setFullYear(new Date().getFullYear() - 120)).toISOString().split('T')[0]}
                          />
                        </div>
                        <div className="flex items-start gap-2">
                          <input
                            type="checkbox"
                            id="terms"
                            checked={termsAccepted}
                            onChange={(e) => setTermsAccepted(e.target.checked)}
                            className="mt-1 h-4 w-4 rounded border-slate-300 text-[#4abbc9] focus:ring-[#4abbc9] focus:ring-offset-0"
                          />
                          <label htmlFor="terms" className="text-sm text-slate-700 dark:text-slate-300">
                            I accept the{' '}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault()
                                setShowTermsModal(true)
                              }}
                              className="font-medium hover:underline"
                              style={{ color: '#4abbc9' }}
                            >
                              Terms and Conditions
                            </button>
                          </label>
                        </div>
                      </>
                    )}

                    {error && (
                      <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex h-10 w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg text-base font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: '#4abbc9' }}
                    >
                      {isLoading ? (
                        <span className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Loading...
                        </span>
                      ) : mode === 'forgot-password' ? (
                        'Send Reset Link'
                      ) : mode === 'login' ? (
                        'Log in'
                      ) : (
                        'Create Account'
                      )}
                    </button>
                  </form>
                )}

                {mode === 'login' && (
                  <button
                    onClick={() => setMode('forgot-password')}
                    className="text-center text-sm font-medium hover:underline"
                    style={{ color: '#4abbc9' }}
                  >
                    Forgotten password?
                  </button>
                )}

                {mode === 'forgot-password' && (
                  <button
                    onClick={() => {
                      setMode('login')
                      setForgotPasswordSuccess(false)
                    }}
                    className="text-center text-sm font-medium hover:underline"
                    style={{ color: '#4abbc9' }}
                  >
                    Back to Login
                  </button>
                )}

                {mode !== 'forgot-password' && (
                  <>
                    <div className="relative my-1">
                      <div aria-hidden="true" className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-300 dark:border-slate-700"></div>
                      </div>
                    </div>

                    <button
                      onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                      disabled={isLoading}
                      className="flex h-10 w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg text-base font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: '#e6721a' }}
                    >
                      {mode === 'login' ? 'Create new account' : 'Already have an account? Log in'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>

    {/* Terms and Conditions Modal */}
    {showTermsModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Terms and Conditions</h2>
            <button
              onClick={() => setShowTermsModal(false)}
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1">
            <div className="prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300">
              <h3 className="text-lg font-semibold mb-3">1. Acceptance of Terms</h3>
              <p className="mb-4">
                By accessing and using Therapy Bro, you accept and agree to be bound by the terms and provisions of this agreement.
              </p>

              <h3 className="text-lg font-semibold mb-3">2. Use of Service</h3>
              <p className="mb-4">
                Therapy Bro provides AI-powered therapeutic chat services. This service is not a replacement for professional medical or mental health advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
              </p>

              <h3 className="text-lg font-semibold mb-3">3. User Eligibility</h3>
              <p className="mb-4">
                You must be at least 13 years old to use this service. By using Therapy Bro, you represent and warrant that you meet this age requirement.
              </p>

              <h3 className="text-lg font-semibold mb-3">4. Privacy and Data Collection</h3>
              <p className="mb-4">
                We collect and store your email, phone number, date of birth, and chat conversations to provide and improve our services. Your data is stored securely and will not be shared with third parties without your consent, except as required by law.
              </p>

              <h3 className="text-lg font-semibold mb-3">5. User Responsibilities</h3>
              <p className="mb-4">
                You agree to provide accurate, current, and complete information during registration. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
              </p>

              <h3 className="text-lg font-semibold mb-3">6. Prohibited Activities</h3>
              <p className="mb-4">
                You may not use Therapy Bro to engage in any illegal activities, harass others, or attempt to harm the service or other users. We reserve the right to terminate accounts that violate these terms.
              </p>

              <h3 className="text-lg font-semibold mb-3">7. Disclaimer of Warranties</h3>
              <p className="mb-4">
                Therapy Bro is provided "as is" without any warranties, express or implied. We do not guarantee that the service will be uninterrupted, secure, or error-free.
              </p>

              <h3 className="text-lg font-semibold mb-3">8. Limitation of Liability</h3>
              <p className="mb-4">
                To the fullest extent permitted by law, Therapy Bro shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the service.
              </p>

              <h3 className="text-lg font-semibold mb-3">9. Changes to Terms</h3>
              <p className="mb-4">
                We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the modified terms.
              </p>

              <h3 className="text-lg font-semibold mb-3">10. Contact Information</h3>
              <p className="mb-4">
                If you have any questions about these Terms and Conditions, please contact us through the app.
              </p>
            </div>
          </div>

          <div className="p-6 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setShowTermsModal(false)}
              className="w-full h-10 rounded-lg font-bold text-white"
              style={{ backgroundColor: '#4abbc9' }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
