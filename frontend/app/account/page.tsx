'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { me, updateProfile, getWallet, sendPhoneOTP, verifyPhoneOTP, getPhoneVerificationStatus, resendPhoneOTP, checkPhone } from '@/lib/api'
import { User, Wallet, CreditCard, Mail, Phone, Calendar as CalendarIcon, Shield, Edit2, Check, X, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import TopNav from '@/components/TopNav'

type UserData = {
  login_id: string
  name?: string
  email?: string
  phone?: string
  age?: number
  avatar_url?: string
  auth_provider: string
}

type WalletData = {
  balance: string
  reserved: string
  currency: string
}

type SidebarTab = 'profile' | 'billing'

export default function AccountPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [activeTab, setActiveTab] = useState<SidebarTab>('profile')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Form states for profile
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    age: ''
  })
  const [saving, setSaving] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ phone?: string; age?: string }>({})
  const [phoneStatus, setPhoneStatus] = useState<{ exists?: boolean; message?: string; is_own?: boolean }>({})
  const [isCheckingPhone, setIsCheckingPhone] = useState(false)

  // Phone verification states
  const [showVerifyModal, setShowVerifyModal] = useState(false)
  const [verificationPhone, setVerificationPhone] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [verificationStatus, setVerificationStatus] = useState<any>(null)
  const [verifyError, setVerifyError] = useState('')
  const [verifySuccess, setVerifySuccess] = useState('')
  const [sendingOTP, setSendingOTP] = useState(false)
  const [verifying, setVerifying] = useState(false)

  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/

  const validateProfile = (fd: { phone: string; age: string }) => {
    const errs: { phone?: string; age?: string } = {}

    const trimmedPhone = fd.phone?.trim() || ''
    if (trimmedPhone && !phoneRegex.test(trimmedPhone)) {
      errs.phone = 'Invalid phone number format'
    }

    if (fd.age !== '') {
      const ageNum = parseInt(fd.age, 10)
      if (Number.isNaN(ageNum) || ageNum < 13 || ageNum > 120) {
        errs.age = 'Age must be between 13 and 120'
      }
    }

    return errs
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    Promise.all([
      me().catch(() => null),
      getWallet().catch(() => null),
      getPhoneVerificationStatus().catch(() => null)
    ]).then(([userData, walletData, verifyStatus]) => {
      if (userData) {
        setUser(userData)
        setFormData({
          name: userData.name || '',
          phone: userData.phone || '',
          age: userData.age?.toString() || ''
        })
      }
      if (walletData) {
        setWallet(walletData)
      }
      if (verifyStatus) {
        setVerificationStatus(verifyStatus)
      }
      setLoading(false)
    })
  }, [router])

  const handleSaveProfile = async () => {
    console.log('===== SAVE PROFILE CLICKED =====')
    console.log('1. Form Data:', formData)
    console.log('2. User Data:', user)
    console.log('3. Token in localStorage:', localStorage.getItem('token') ? 'EXISTS' : 'MISSING')

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const errs = validateProfile(formData)
      setFieldErrors(errs)
      if (errs.phone || errs.age) {
        setError(Object.values(errs).join(' • '))
        setSaving(false)
        return
      }
      const updateData: any = {}
      // Only include fields that have values
      if (formData.name && formData.name.trim() !== '') {
        updateData.name = formData.name.trim()
      }
      if (formData.phone && formData.phone.trim() !== '') {
        updateData.phone = formData.phone.trim()
      }
      if (formData.age && formData.age !== '') {
        const ageNum = parseInt(formData.age, 10)
        if (!Number.isNaN(ageNum)) {
          updateData.age = ageNum
        }
      }

      console.log('4. Data to send:', updateData)
      console.log('5. Calling updateProfile API...')

      const result = await updateProfile(updateData)
      console.log('6. Update result:', result)

      console.log('7. Refreshing user data...')
      // Refresh user data
      const userData = await me()
      console.log('8. Fresh user data:', userData)

      setUser(userData)
      setFormData({
        name: userData.name || '',
        phone: userData.phone || '',
        age: userData.age?.toString() || ''
      })
      setSuccess('Profile updated successfully!')
      setEditMode(false)
      setFieldErrors({})

      console.log('9. Profile update completed successfully!')
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      console.error('===== ERROR OCCURRED =====')
      console.error('Error type:', typeof err)
      console.error('Error object:', err)
      console.error('Error message:', err instanceof Error ? err.message : 'Unknown')
      console.error('Error stack:', err instanceof Error ? err.stack : 'No stack')

      setError(`Failed to update profile: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setSaving(false)
      console.log('===== SAVE PROFILE FINISHED =====')
    }
  }

  const handleCancelEdit = () => {
    setFormData({
      name: user?.name || '',
      phone: user?.phone || '',
      age: user?.age?.toString() || ''
    })
    setEditMode(false)
  }

  const handleVerifyPhone = () => {
    setVerificationPhone(formData.phone || '')
    setShowVerifyModal(true)
    setVerifyError('')
    setVerifySuccess('')
    setOtpCode('')
  }

  const handleSendOTP = async () => {
    // Clean the phone number
    const cleanedPhone = verificationPhone.trim()

    if (!cleanedPhone) {
      setVerifyError('Please enter a phone number')
      return
    }

    // Extract only digits for validation
    const digitsOnly = cleanedPhone.replace(/\D/g, '')

    if (digitsOnly.length < 10) {
      setVerifyError(`Phone number must have at least 10 digits. You entered ${digitsOnly.length} digits.`)
      return
    }

    if (digitsOnly.length > 15) {
      setVerifyError(`Phone number cannot exceed 15 digits. You entered ${digitsOnly.length} digits.`)
      return
    }

    setSendingOTP(true)
    setVerifyError('')
    setVerifySuccess('')

    try {
      console.log('📱 Sending OTP for phone:', cleanedPhone)
      await sendPhoneOTP(cleanedPhone)
      setVerifySuccess('OTP sent successfully! Check your phone.')

      // Refresh verification status
      const status = await getPhoneVerificationStatus()
      setVerificationStatus(status)
    } catch (err) {
      console.error('❌ Error sending OTP:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to send OTP'
      setVerifyError(errorMessage)
    } finally {
      setSendingOTP(false)
    }
  }

  const handleVerifyOTP = async () => {
    if (!otpCode || otpCode.length !== 4) {
      setVerifyError('Please enter the 4-digit OTP code')
      return
    }

    setVerifying(true)
    setVerifyError('')

    try {
      const result = await verifyPhoneOTP(otpCode)

      if (result.success) {
        setVerifySuccess('Phone number verified successfully!')

        // Refresh verification status
        const status = await getPhoneVerificationStatus()
        setVerificationStatus(status)

        // Close modal after 2 seconds
        setTimeout(() => {
          setShowVerifyModal(false)
          setOtpCode('')
          setVerifySuccess('')
        }, 2000)
      } else {
        setVerifyError(result.message || 'Invalid OTP code')
      }
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : 'Failed to verify OTP')
    } finally {
      setVerifying(false)
    }
  }

  const handleResendOTP = async () => {
    setSendingOTP(true)
    setVerifyError('')
    setVerifySuccess('')

    try {
      await resendPhoneOTP()
      setVerifySuccess('OTP resent successfully!')
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : 'Failed to resend OTP')
    } finally {
      setSendingOTP(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-main flex items-center justify-center">
        <div className="text-text-muted">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-main flex flex-col">
      {/* Top Navigation */}
      <TopNav />

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text mb-2">Account Settings</h1>
          <p className="text-text-muted">Manage your profile and billing preferences</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'profile'
                ? 'bg-gradient-accent text-white shadow-glow'
                : 'glass-card text-text-muted hover:bg-card-hover'
            }`}
          >
            <User className="w-5 h-5" />
            <span>Profile</span>
          </button>

          <button
            onClick={() => setActiveTab('billing')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'billing'
                ? 'bg-gradient-accent text-white shadow-glow'
                : 'glass-card text-text-muted hover:bg-card-hover'
            }`}
          >
            <Wallet className="w-5 h-5" />
            <span>Billing</span>
          </button>
        </div>

        {/* Content Area */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Profile Header Card */}
            <div className="glass-card rounded-2xl p-8">
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-6">
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt="Profile"
                      className="w-24 h-24 rounded-full border-4 border-accent shadow-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-accent flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                      {user?.name?.[0]?.toUpperCase() || user?.login_id?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  <div>
                    <h2 className="text-2xl font-bold text-text mb-1">
                      {user?.name || 'User'}
                    </h2>
                    <p className="text-text-muted flex items-center gap-2 mb-2">
                      <Mail className="w-4 h-4" />
                      {user?.login_id}
                    </p>
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-accent" />
                      <span className="text-sm text-text-muted">
                        {user?.auth_provider === 'google' ? 'Google Account' : 'Local Account'}
                      </span>
                    </div>
                  </div>
                </div>

                {!editMode && (
                  <button
                    onClick={() => setEditMode(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-accent text-white rounded-xl hover:shadow-glow transition-all font-medium"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit Profile
                  </button>
                )}
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
                  <X className="w-5 h-5 flex-shrink-0" />
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center gap-2">
                  <Check className="w-5 h-5 flex-shrink-0" />
                  {success}
                </div>
              )}

              {/* Profile Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-text-muted">
                    <User className="w-4 h-4" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={!editMode}
                    className={`w-full px-4 py-3 border border-border rounded-xl transition-all text-text ${
                      editMode ? 'bg-white focus:ring-2 focus:ring-accent focus:border-accent' : 'bg-bg-muted cursor-not-allowed'
                    }`}
                    placeholder="Enter your full name"
                  />
                </div>

                {/* Email (Read-only) */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-text-muted">
                    <Mail className="w-4 h-4" />
                    Email Address
                  </label>
                  <input
                    type="text"
                    value={user?.login_id || ''}
                    disabled
                    className="w-full px-4 py-3 border border-border rounded-xl bg-bg-muted text-text-muted cursor-not-allowed"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-text-muted">
                    <Phone className="w-4 h-4" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    pattern="^(?:\+?91[\s-]?|0)?(?:[()\s-]*[6-9][()\s-]*\d[()\s-]*){9}$"
                    minLength={10}
                    maxLength={12}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={!editMode}
                    className={`w-full px-4 py-3 border border-border rounded-xl transition-all text-text ${
                      editMode ? 'bg-white focus:ring-2 focus:ring-accent focus:border-accent' : 'bg-bg-muted cursor-not-allowed'
                    }`}
                    placeholder="Enter your phone number"
                    aria-invalid={!!fieldErrors.phone}
                  />
                  {fieldErrors.phone && (
                    <p className="text-sm text-red-600">{fieldErrors.phone}</p>
                  )}
                </div>

                {/* Age */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-text-muted">
                    <CalendarIcon className="w-4 h-4" />
                    Age
                  </label>
                  <input
                    type="number"
                    min={13}
                    max={120}
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    disabled={!editMode}
                    className={`w-full px-4 py-3 border border-border rounded-xl transition-all text-text ${
                      editMode ? 'bg-white focus:ring-2 focus:ring-accent focus:border-accent' : 'bg-bg-muted cursor-not-allowed'
                    }`}
                    placeholder="Enter your age"
                    aria-invalid={!!fieldErrors.age}
                  />
                  {fieldErrors.age && (
                    <p className="text-sm text-red-600">{fieldErrors.age}</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {editMode && (
                <div className="flex gap-4 mt-8 pt-6 border-t border-border">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-accent text-white rounded-xl hover:shadow-glow transition-all font-medium disabled:opacity-50"
                  >
                    <Check className="w-5 h-5" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 border-2 border-border text-text-muted rounded-xl hover:bg-card-hover transition-all font-medium"
                  >
                    <X className="w-5 h-5" />
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Phone Verification Card */}
            <div className="glass-card rounded-2xl p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-text mb-2">Phone Verification</h3>
                  <p className="text-text-muted text-sm">
                    Verify your phone number for enhanced account security
                  </p>
                </div>
                {verificationStatus?.is_verified && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-xl">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-green-700 font-medium text-sm">Verified</span>
                  </div>
                )}
              </div>

              {verificationStatus?.is_verified ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                    <Phone className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm text-text-muted">Verified Phone Number</p>
                      <p className="text-text font-medium">{verificationStatus.phone_number}</p>
                    </div>
                  </div>
                  <p className="text-xs text-text-muted">
                    Verified on: {verificationStatus.verified_at ? new Date(verificationStatus.verified_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800 mb-1">Phone Not Verified</p>
                      <p className="text-xs text-yellow-700">
                        Please verify your phone number to enhance your account security and enable all features.
                      </p>
                    </div>
                  </div>

                  {formData.phone ? (
                    <button
                      onClick={handleVerifyPhone}
                      className="flex items-center gap-2 px-6 py-3 bg-gradient-accent text-white rounded-xl hover:shadow-glow transition-all font-medium"
                    >
                      <Shield className="w-5 h-5" />
                      Verify Phone Number
                    </button>
                  ) : (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <p className="text-sm text-blue-800">
                        Please add a phone number to your profile first, then click "Save Changes" before verifying.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="space-y-6">
            {/* Wallet Balance Card */}
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="bg-gradient-accent p-8 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-sm font-medium mb-2">Wallet Balance</p>
                    <p className="text-5xl font-bold mb-4">
                      ₹{wallet?.balance ? parseFloat(wallet.balance).toFixed(2) : '0.00'}
                    </p>
                    {wallet && parseFloat(wallet.reserved) > 0 && (
                      <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                        <span className="text-xs font-medium">Reserved:</span>
                        <span className="text-sm font-bold">₹{parseFloat(wallet.reserved).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                  <Wallet className="w-20 h-20 text-white/20" />
                </div>
              </div>

              <div className="p-8">
                <button
                  onClick={() => alert('Payment integration coming soon!')}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-accent text-white rounded-xl hover:shadow-glow transition-all font-medium text-lg"
                >
                  <CreditCard className="w-6 h-6" />
                  Add Money to Wallet
                </button>
              </div>
            </div>

            {/* How it Works Card */}
            <div className="glass-card rounded-2xl p-8">
              <h3 className="text-xl font-semibold text-text mb-4">How it works</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-accent font-bold text-sm">1</span>
                  </div>
                  <div>
                    <p className="text-text font-medium">Free 5 Minutes</p>
                    <p className="text-text-muted text-sm">Start every chat session with 5 minutes completely free</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-accent font-bold text-sm">2</span>
                  </div>
                  <div>
                    <p className="text-text font-medium">₹10 to Continue</p>
                    <p className="text-text-muted text-sm">After 5 minutes, ₹10 will be deducted to continue chatting</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-accent font-bold text-sm">3</span>
                  </div>
                  <div>
                    <p className="text-text font-medium">Top Up Anytime</p>
                    <p className="text-text-muted text-sm">Keep your wallet topped up for uninterrupted therapy sessions</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Low Balance Warning */}
            {wallet && parseFloat(wallet.balance) < 10 && (
              <div className="glass-card rounded-2xl p-6 border-2 border-warning/30 bg-warning/5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center flex-shrink-0">
                    <Wallet className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <h4 className="text-text font-semibold mb-1">Low Balance Alert</h4>
                    <p className="text-text-muted text-sm">
                      Your wallet balance is low. Please recharge to continue chatting after the free 5 minutes.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Phone Verification Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="glass-card rounded-2xl p-8 max-w-md w-full">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-text mb-2">Verify Phone Number</h3>
                <p className="text-text-muted text-sm mb-1">
                  We'll send a 4-digit OTP to verify your phone number
                </p>
                <p className="text-xs text-text-muted/80">
                  Note: Each phone number can only be verified once
                </p>
              </div>
              <button
                onClick={() => {
                  setShowVerifyModal(false)
                  setVerifyError('')
                  setVerifySuccess('')
                }}
                className="text-text-muted hover:text-text transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {verifyError && (
              <div className="mb-4 p-4 bg-red-50 border-2 border-red-300 text-red-800 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
                  <div className="flex-1">
                    <p className="font-semibold mb-1">Verification Error</p>
                    <p className="text-sm">{verifyError}</p>
                  </div>
                  <button
                    onClick={() => setVerifyError('')}
                    className="text-red-400 hover:text-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {verifySuccess && (
              <div className="mb-4 p-4 bg-green-50 border-2 border-green-300 text-green-800 rounded-xl">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-green-600" />
                  <div className="flex-1">
                    <p className="font-semibold mb-1">Success</p>
                    <p className="text-sm">{verifySuccess}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {/* Phone Number Display */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-text-muted">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={verificationPhone}
                    disabled
                    className="flex-1 px-4 py-3 border border-border rounded-xl bg-bg-muted text-text cursor-not-allowed"
                    placeholder="+919876543210"
                  />
                  <button
                    onClick={handleSendOTP}
                    disabled={sendingOTP || verificationStatus?.has_active_session}
                    className="px-6 py-3 bg-gradient-accent text-white rounded-xl hover:shadow-glow transition-all font-medium disabled:opacity-50"
                  >
                    {sendingOTP ? 'Sending...' : 'Send OTP'}
                  </button>
                </div>
                <p className="text-xs text-text-muted">
                  This phone number is from your profile and cannot be edited here
                </p>
              </div>

              {/* OTP Session Info */}
              {verificationStatus?.has_active_session && (
                <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-blue-900 mb-1">
                        OTP Sent Successfully!
                      </p>
                      <p className="text-sm text-blue-800 mb-2">
                        Check your phone and enter the 4-digit verification code below.
                      </p>
                      <div className="flex items-center gap-2 text-xs text-blue-700">
                        <Clock className="w-3 h-3" />
                        <span>Attempts remaining: {verificationStatus.attempts_remaining}/3</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* OTP Input */}
              {verificationStatus?.has_active_session && (
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-text-muted">
                    <Shield className="w-4 h-4" />
                    Enter 4-Digit OTP Code
                  </label>
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    maxLength={4}
                    className="w-full px-4 py-4 border-2 border-accent/30 rounded-xl bg-white text-text focus:ring-2 focus:ring-accent focus:border-accent text-center text-3xl tracking-[0.5em] font-mono transition-all"
                    placeholder="0000"
                    autoComplete="off"
                    autoFocus
                  />
                  <p className="text-xs text-text-muted text-center">
                    {otpCode.length}/4 digits entered
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                {verificationStatus?.has_active_session && (
                  <>
                    <button
                      onClick={handleVerifyOTP}
                      disabled={verifying || otpCode.length !== 4}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-accent text-white rounded-xl hover:shadow-glow transition-all font-medium disabled:opacity-50"
                    >
                      <Check className="w-5 h-5" />
                      {verifying ? 'Verifying...' : 'Verify OTP'}
                    </button>
                    <button
                      onClick={handleResendOTP}
                      disabled={sendingOTP}
                      className="px-6 py-3 border-2 border-border text-text-muted rounded-xl hover:bg-card-hover transition-all font-medium disabled:opacity-50"
                    >
                      Resend
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
