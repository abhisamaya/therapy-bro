'use client'

import { useState } from 'react'
import { requestOTP, verifyOTP, resetPassword } from '@/lib/api'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Step = 'request' | 'verify' | 'reset' | 'success'

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('request')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await requestOTP(email)
      setStep('verify')
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await verifyOTP(email, otp)
      setStep('reset')
    } catch (err: any) {
      setError(err.message || 'Invalid or expired OTP. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    // Validate password strength
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    setIsLoading(true)

    try {
      await resetPassword(email, otp, newPassword)
      setStep('success')
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-main flex items-center justify-center px-4">
      <div className="mx-auto w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-text mb-2">Reset Password</h1>
          <p className="text-text-muted">
            {step === 'request' && 'Enter your email to receive an OTP'}
            {step === 'verify' && 'Enter the OTP sent to your email'}
            {step === 'reset' && 'Create a new password'}
            {step === 'success' && 'Password reset successful!'}
          </p>
        </div>

        <div className="space-y-4 rounded-2xl bg-white p-8 shadow-glass">
          {step === 'request' && (
            <form onSubmit={handleRequestOTP} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-text mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  className="w-full rounded-xl bg-bg-muted border border-border p-3 text-text focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  required
                  autoComplete="email"
                />
              </div>

              {error && (
                <div className="text-sm text-danger bg-red-50 p-3 rounded-xl border border-red-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl bg-gradient-accent px-6 py-3 text-white font-medium hover:opacity-90 transition-all shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Sending OTP...
                  </span>
                ) : (
                  'Send OTP'
                )}
              </button>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="text-sm text-accent hover:text-accent-light transition-colors font-medium"
                >
                  Back to Sign In
                </Link>
              </div>
            </form>
          )}

          {step === 'verify' && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4">
                <p className="text-sm text-blue-800">
                  A 6-digit OTP has been sent to <strong>{email}</strong>
                </p>
              </div>

              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-text mb-2">
                  Enter OTP
                </label>
                <input
                  id="otp"
                  type="text"
                  maxLength={6}
                  className="w-full rounded-xl bg-bg-muted border border-border p-3 text-text text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  required
                  autoComplete="one-time-code"
                />
              </div>

              {error && (
                <div className="text-sm text-danger bg-red-50 p-3 rounded-xl border border-red-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="w-full rounded-xl bg-gradient-accent px-6 py-3 text-white font-medium hover:opacity-90 transition-all shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Verifying...
                  </span>
                ) : (
                  'Verify OTP'
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setStep('request')}
                  className="text-sm text-accent hover:text-accent-light transition-colors font-medium"
                >
                  Request New OTP
                </button>
              </div>
            </form>
          )}

          {step === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4">
                <p className="text-sm text-green-800">
                  OTP verified! Now create a new password.
                </p>
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-text mb-2">
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  className="w-full rounded-xl bg-bg-muted border border-border p-3 text-text focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  autoComplete="new-password"
                  minLength={6}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-text mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  className="w-full rounded-xl bg-bg-muted border border-border p-3 text-text focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  autoComplete="new-password"
                  minLength={6}
                />
              </div>

              {error && (
                <div className="text-sm text-danger bg-red-50 p-3 rounded-xl border border-red-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-xl bg-gradient-accent px-6 py-3 text-white font-medium hover:opacity-90 transition-all shadow-glow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Resetting Password...
                  </span>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>
          )}

          {step === 'success' && (
            <div className="space-y-4 text-center">
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-4">
                <svg
                  className="mx-auto h-12 w-12 text-green-600 mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  Password Reset Successful!
                </h3>
                <p className="text-sm text-green-700">
                  Your password has been successfully reset. You can now login with your new password.
                </p>
              </div>

              <button
                onClick={() => router.push('/login')}
                className="w-full rounded-xl bg-gradient-accent px-6 py-3 text-white font-medium hover:opacity-90 transition-all shadow-glow"
              >
                Go to Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
