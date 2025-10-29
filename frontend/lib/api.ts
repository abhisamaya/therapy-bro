// Automatically determine API URL based on environment
const getApiUrl = () => {
  // Auto-detect based on hostname FIRST (client-side)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    // Development: localhost or 127.0.0.1
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:8000'
    }
    // Production: any other domain, use env var or default
    return process.env.NEXT_PUBLIC_API_BASE_URL || 'https://textraja.com'
  }
  
  // Server-side: use env var or NODE_ENV
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL
  }
  
  return process.env.NODE_ENV === 'production' 
    ? 'https://textraja.com' 
    : 'http://localhost:8000'
}

const API = getApiUrl()

// Log API base URL for debugging
if (typeof window !== 'undefined') {
  console.log('Environment:', process.env.NODE_ENV)
  console.log('Hostname:', window.location.hostname)
  console.log('API Base URL:', API)
}

function authHeaders(): HeadersInit {
  const t = (typeof window !== 'undefined') ? localStorage.getItem('token') : null
  return t ? { Authorization: `Bearer ${t}` } : {}
}

export async function register(login_id: string, password: string, name?: string) {
  const res = await fetch(`${API}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ login_id, password, name })
  })
  if (!res.ok) throw new Error('User Already Exists!')
  const j = await res.json(); localStorage.setItem('token', j.access_token); return j
}

export async function login(login_id: string, password: string) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ login_id, password })
  })
  if (!res.ok) throw new Error('login failed')
  const j = await res.json(); localStorage.setItem('token', j.access_token); return j
}

export async function me() {
  const res = await fetch(`${API}/auth/me`, {
    headers: { ...authHeaders() },
    credentials: 'include'
  })
  if (!res.ok) throw new Error('me failed')
  return res.json()
}

export async function listChats() {
  const res = await fetch(`${API}/api/chats`, {
    headers: { ...authHeaders() },
    credentials: 'include'
  })
  if (!res.ok) throw new Error('list failed')
  return res.json()
}

export async function startSession(category: string) {
  const res = await fetch(`${API}/api/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    credentials: 'include',
    body: JSON.stringify({ category })
  })
  if (!res.ok) throw new Error('start failed')
  return res.json()
}

export async function getHistory(sessionId: string) {
  const res = await fetch(`${API}/api/sessions/${sessionId}`, {
    headers: { ...authHeaders() },
    credentials: 'include',
    cache: 'no-store'
  })
  if (!res.ok) throw new Error('history failed')
  return res.json()
}

export async function setNotes(sessionId: string, notes: string) {
  const res = await fetch(`${API}/api/sessions/${sessionId}/notes`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    credentials: 'include',
    body: JSON.stringify({ notes })
  })
  if (!res.ok) throw new Error('notes failed')
}

export async function deleteSession(sessionId: string) {
  console.log('deleteSession called with:', sessionId);
  console.log('API base URL:', API);
  
  const headers = authHeaders();
  console.log('Auth headers:', headers);
  
  const url = `${API}/api/sessions/${sessionId}`;
  console.log('Full URL:', url);
  
  const res = await fetch(url, {
    method: 'DELETE', 
    headers: { ...headers }
  });
  
  console.log('Response status:', res.status);
  console.log('Response ok:', res.ok);
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error('Error response:', errorText);
    throw new Error(`delete failed: ${res.status} ${errorText}`);
  }
  
  const result = await res.json();
  console.log('Delete response:', result);
  return result;
}

export async function streamMessage(sessionId: string, text: string, opts?: { onToken?: (t: string) => void }) {
  const res = await fetch(`${API}/api/sessions/${sessionId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    credentials: 'include',
    body: JSON.stringify({ content: text })
  })
  if (!res.ok || !res.body) throw new Error('stream failed')

  const reader = res.body.getReader(); const decoder = new TextDecoder(); let buf = ''
  while (true) {
    const { value, done } = await reader.read(); if (done) break
    buf += decoder.decode(value, { stream: true })
    let idx: number
    while ((idx = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, idx); buf = buf.slice(idx + 1)
      if (!line) continue
      try { const evt = JSON.parse(line); if (evt.type === 'delta' && evt.content && opts?.onToken) opts.onToken(evt.content) } catch {}
    }
  }
}

// Add to your existing lib/api.ts
export async function googleAuth(idToken: string) {
  const response = await fetch('/api/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ id_token: idToken }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Google authentication failed')
  }

  const data = await response.json()

  // Store the token
  localStorage.setItem('access_token', data.access_token)

  return data
}

// Profile update
export async function updateProfile(data: { name?: string; phone?: string; date_of_birth?: string }) {
  console.log('===== API: updateProfile =====')
  console.log('API Base URL:', API)
  console.log('Full URL:', `${API}/auth/profile`)
  console.log('Data to send:', data)

  const headers = { 'Content-Type': 'application/json', ...authHeaders() }
  console.log('Headers:', headers)
  console.log('Body:', JSON.stringify(data))

  try {
    console.log('Sending PUT request...')
    const res = await fetch(`${API}/auth/profile`, {
      method: 'PUT',
      headers: headers,
      credentials: 'include',
      body: JSON.stringify(data)
    })

    console.log('Response received!')
    console.log('Response status:', res.status)
    console.log('Response ok:', res.ok)
    console.log('Response headers:', Object.fromEntries(res.headers.entries()))

    if (!res.ok) {
      const errorText = await res.text()
      console.error('Error response text:', errorText)
      throw new Error(`Profile update failed (${res.status}): ${errorText}`)
    }

    const jsonData = await res.json()
    console.log('Response data:', jsonData)
    return jsonData
  } catch (err) {
    console.error('===== API ERROR =====')
    console.error('Error caught in updateProfile:', err)
    console.error('Error name:', (err as any)?.name)
    console.error('Error message:', (err as any)?.message)
    throw err
  }
}

// Wallet
export async function getWallet() {
  const res = await fetch(`${API}/api/wallet`, {
    headers: { ...authHeaders() },
    credentials: 'include'
  })
  if (!res.ok) throw new Error('Failed to fetch wallet')
  return res.json()
}

// Session extension
export async function extendSessionAPI(sessionId: string, durationSeconds: number, requestId?: string) {
  const res = await fetch(`${API}/api/sessions/${sessionId}/extend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    credentials: 'include',
    body: JSON.stringify({ duration_seconds: durationSeconds, request_id: requestId })
  })
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.error?.message || `Extend session failed: ${res.status}`)
  }
  return res.json()
}

// Password Reset APIs
export async function requestOTP(email: string) {
  console.log('='.repeat(80))
  console.log('🔵 Frontend: requestOTP called')
  console.log('📧 Email:', email)
  console.log('🌐 API Base URL:', API)
  console.log('🔗 Full URL:', `${API}/api/password-reset/request-otp`)

  try {
    const res = await fetch(`${API}/api/password-reset/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email })
    })

    console.log('📡 Response received')
    console.log('   Status:', res.status)
    console.log('   OK:', res.ok)

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      console.error('❌ Error response:', errorData)
      // Backend returns errors in format: { error: { message: "..." } } or FastAPI format: { detail: "..." }
      const errorMessage = errorData.error?.message || errorData.detail || 'Failed to send OTP'
      throw new Error(errorMessage)
    }

    const data = await res.json()
    console.log('✅ Success response:', data)
    console.log('='.repeat(80))
    return data
  } catch (error) {
    console.error('❌ Fetch error:', error)
    console.log('='.repeat(80))
    throw error
  }
}

export async function verifyOTP(email: string, otp: string) {
  const res = await fetch(`${API}/api/password-reset/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, otp })
  })
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    const errorMessage = errorData.error?.message || errorData.detail || 'Invalid or expired OTP'
    throw new Error(errorMessage)
  }
  return res.json()
}

export async function resetPassword(email: string, otp: string, newPassword: string) {
  const res = await fetch(`${API}/api/password-reset/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, otp, new_password: newPassword })
  })
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    const errorMessage = errorData.error?.message || errorData.detail || 'Failed to reset password'
    throw new Error(errorMessage)
  }
  return res.json()
}

// Phone Verification APIs
export async function sendPhoneOTP(phoneNumber: string) {
  console.log('🔵 sendPhoneOTP called')
  console.log('📱 Phone Number:', phoneNumber)
  console.log('🌐 API Base URL:', API)
  console.log('🔗 Full URL:', `${API}/api/phone-verification/send-otp`)

  try {
    const res = await fetch(`${API}/api/phone-verification/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      credentials: 'include',
      body: JSON.stringify({ phone_number: phoneNumber })
    })

    console.log('📡 Response received')
    console.log('   Status:', res.status)
    console.log('   OK:', res.ok)

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      console.error('❌ Error response:', errorData)
      const errorMessage = errorData.detail || errorData.message || 'Failed to send OTP'
      throw new Error(errorMessage)
    }

    const data = await res.json()
    console.log('✅ Success response:', data)
    return data
  } catch (error) {
    console.error('❌ Fetch error in sendPhoneOTP:', error)
    // If it's a network error (failed to fetch), provide a more helpful message
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to server. Please check your connection and try again.')
    }
    throw error
  }
}

export async function verifyPhoneOTP(otpCode: string) {
  try {
    const res = await fetch(`${API}/api/phone-verification/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      credentials: 'include',
      body: JSON.stringify({ otp_code: otpCode })
    })
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      const errorMessage = errorData.detail || errorData.message || 'Failed to verify OTP'
      throw new Error(errorMessage)
    }
    return res.json()
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to server.')
    }
    throw error
  }
}

export async function getPhoneVerificationStatus() {
  try {
    const res = await fetch(`${API}/api/phone-verification/status`, {
      headers: { ...authHeaders() },
      credentials: 'include'
    })
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      const errorMessage = errorData.detail || errorData.message || 'Failed to get verification status'
      throw new Error(errorMessage)
    }
    return res.json()
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to server.')
    }
    throw error
  }
}

export async function resendPhoneOTP() {
  try {
    const res = await fetch(`${API}/api/phone-verification/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      credentials: 'include'
    })
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      const errorMessage = errorData.detail || errorData.message || 'Failed to resend OTP'
      throw new Error(errorMessage)
    }
    return res.json()
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to server.')
    }
    throw error
  }
}

// Email validation
export async function checkEmail(email: string) {
  try {
    const res = await fetch(`${API}/auth/check-email/${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    })
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      const errorMessage = errorData.detail || errorData.message || 'Failed to check email'
      throw new Error(errorMessage)
    }
    return res.json()
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to server.')
    }
    throw error
  }
}

// Phone number validation
export async function checkPhone(phone: string) {
  try {
    const res = await fetch(`${API}/auth/check-phone/${encodeURIComponent(phone)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      credentials: 'include'
    })
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}))
      const errorMessage = errorData.detail || errorData.message || 'Failed to check phone number'
      throw new Error(errorMessage)
    }
    return res.json()
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to server.')
    }
    throw error
  }
}