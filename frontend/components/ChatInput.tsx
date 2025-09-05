'use client'
import { useState } from 'react'
export default function ChatInput({ onSend, placeholder, disabled }: { onSend: (t: string)=>void, placeholder?: string, disabled?: boolean }){
  const [v, setV] = useState('')
  return (
    <form onSubmit={e=>{e.preventDefault(); if(!v.trim()) return; onSend(v); setV('')}} className="flex items-end gap-2 rounded-2xl bg-card p-3 shadow">
      <textarea value={v} onChange={e=>setV(e.target.value)} placeholder={placeholder} disabled={disabled} rows={1} className="min-h-[44px] max-h-40 w-full resize-y rounded-xl bg-transparent p-2 outline-none placeholder:opacity-60" />
      <button type="submit" disabled={disabled || !v.trim()} className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Send</button>
    </form>
  )
}
