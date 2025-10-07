const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

// Log API base URL for debugging (remove in production)
if (typeof window !== 'undefined') {
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
  if (!res.ok) throw new Error('register failed')
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