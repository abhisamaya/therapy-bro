'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { listChats, startSession, getHistory, streamMessage } from '@/lib/api'
import ChatInput from '@/components/ChatInput'
import ChatMessage from '@/components/ChatMessage'
import { useRouter } from 'next/navigation'

type Msg = { role: 'user'|'assistant'|'system'; content: string }
type Conv = { session_id: string; category: string; updated_at: string; notes?: string }

export default function ChatPage() {
  const [convs, setConvs] = useState<Conv[]>([])
  const [active, setActive] = useState<string | null>(null)
  const [messages, setMessages] = useState<Msg[]>([])
  const [pending, setPending] = useState(false)
  const endRef = useRef<HTMLDivElement|null>(null)
  const router = useRouter()

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('token'); if (!token) { router.push('/login'); return }
        const list = await listChats(); setConvs(list)
        if (list.length) select(list[0].session_id)
        else {
          const s = await startSession('general'); setActive(s.session_id); load(s.session_id)
        }
      } catch { router.push('/login') }
    })()
  }, [])

  const load = async (id: string) => {
    const h = await getHistory(id)
    setMessages(h.messages.filter((m: Msg) => m.role !== 'system'))
  }

  const select = async (id: string) => { setActive(id); await load(id) }

  const newCategory = async (cat: string) => {
    const s = await startSession(cat); setActive(s.session_id); await load(s.session_id); setConvs(await listChats())
  }

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const onSend = async (text: string) => {
    if (!active || !text.trim() || pending) return
    setPending(true)
    setMessages(prev => [...prev, { role: 'user', content: text }])
    let idx: number
    setMessages(prev => { idx = prev.length; return [...prev, { role: 'assistant', content: '' }] })
    try {
      await streamMessage(active, text, { onToken: (tok) => {
        setMessages(prev => { const next = [...prev]; next[idx] = { ...next[idx], content: next[idx].content + tok }; return next })
      }})
    } finally {
      setPending(false)
      setConvs(await listChats())
    }
  }

  const left = (
    <div className="w-64 shrink-0 space-y-2">
      <div className="rounded-2xl bg-card p-3">
        <div className="mb-2 text-sm opacity-70">New chat</div>
        <div className="grid grid-cols-2 gap-2">
          {['career','mental','relation','sexual wellness'].map(cat => (
            <button key={cat} onClick={()=>newCategory(cat)} className="rounded-xl bg-black/20 px-3 py-2 text-xs hover:bg-black/30">{cat}</button>
          ))}
        </div>
      </div>
      <div className="rounded-2xl bg-card p-3">
        <div className="mb-2 text-sm opacity-70">Your conversations</div>
        <div className="space-y-1">
          {convs.map(c => (
            <button key={c.session_id} onClick={()=>select(c.session_id)} className={`block w-full rounded-xl px-3 py-2 text-left text-sm ${active===c.session_id?'bg-black/30':'bg-black/10 hover:bg-black/20'}`}>
              <div className="font-medium">{c.category}</div>
              <div className="text-xs opacity-60">{new Date(c.updated_at).toLocaleString()}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  const main = (
    <div className="flex-1">
      <div className="mb-3 rounded-2xl bg-card p-3 text-sm">Hi! I’m your assistant. Ask anything.</div>
      <div className="space-y-3 pb-28">
        {messages.filter(m=>m.role!=='system').map((m,i)=> (
          <ChatMessage key={i} role={m.role as 'user'|'assistant'} content={m.content} />
        ))}
        <div ref={endRef} />
      </div>
      <div className="fixed inset-x-0 bottom-0 mx-auto max-w-5xl p-4">
        <ChatInput disabled={pending} placeholder="Type your message…" onSend={onSend} />
      </div>
    </div>
  )

  return (
    <div className="flex gap-4">
      {left}
      {main}
    </div>
  )
}
