'use client'
import { useState } from 'react'
import { login, register } from '@/lib/api'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [loginId, setLoginId] = useState('demo')
  const [password, setPassword] = useState('demo123')
  const [mode, setMode] = useState<'login'|'register'>('login')
  const [error, setError] = useState('')
  const router = useRouter()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    try {
      if (mode === 'login') await login(loginId, password)
      else await register(loginId, password, 'Demo User')
      router.push('/calendar') // Changed from '/chat' to '/calendar'
    } catch (e:any) { setError(String(e.message||e)) }
  }

  return (
    <div className="mx-auto mt-24 max-w-md">
      <h1 className="mb-6 text-2xl font-semibold">Welcome</h1>
      <form onSubmit={submit} className="space-y-3 rounded-2xl bg-card p-4 shadow">
        <input className="w-full rounded-xl bg-black/20 p-3" value={loginId} onChange={e=>setLoginId(e.target.value)} placeholder="Login ID" />
        <input className="w-full rounded-xl bg-black/20 p-3" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" />
        {error && <div className="text-sm text-red-400">{error}</div>}
        <div className="flex items-center justify-between">
          <button type="submit" className="rounded-xl bg-accent px-4 py-2 text-white">{mode==='login'?'Login':'Register'}</button>
          <button type="button" className="text-sm opacity-75" onClick={()=>setMode(mode==='login'?'register':'login')}>
            {mode==='login'? 'Need an account? Register' : 'Have an account? Login'}
          </button>
        </div>
      </form>
    </div>
  )
}