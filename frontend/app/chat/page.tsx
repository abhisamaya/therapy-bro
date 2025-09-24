'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
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

  // ----- Timer state -----
  const [totalSeconds, setTotalSeconds] = useState<number>(300) // default 5 min
  const [remaining, setRemaining] = useState<number>(300)
  const [running, setRunning] = useState<boolean>(false)
  const timerRef = useRef<number | null>(null)

  // Expiry modal
  const [expiredModalOpen, setExpiredModalOpen] = useState(false)

  // categories shown in left UI and modal
  const categories = ['Career Councelling','Mental Wellbeing','Relationship Management','Sexual Wellness']

  // -------------------------
  // helpers
  // -------------------------
  const appendSystem = useCallback((text: string) => {
    setMessages(prev => [...prev, { role: 'system', content: text }])
  }, [])

  // load conversations and initial session
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('token'); if (!token) { router.push('/login'); return }
        const list = await listChats(); setConvs(list)
        if (list.length) {
          await select(list[0].session_id) // will auto-start timer for "continue"
        } else {
          // create a default session and start it
          const s = await startSession('general'); setActive(s.session_id); await load(s.session_id); setConvs(await listChats())
          // start timer automatically for new session
          startTimerWithCurrentDuration()
        }
      } catch {
        router.push('/login')
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const load = async (id: string) => {
    const h = await getHistory(id)
    // keep system messages out of the main stream (you may want them preserved elsewhere)
    setMessages(h.messages.filter((m: Msg) => m.role !== 'system'))
  }

  // select an existing conversation and auto-start timer (continue)
  const select = async (id: string) => {
    setActive(id)
    await load(id)
    // auto-start timer for continuing the session
    startTimerWithCurrentDuration()
  }

  // create new category/session and auto-start timer
  const newCategory = async (cat: string) => {
    const s = await startSession(cat)
    setActive(s.session_id)
    await load(s.session_id)
    setConvs(await listChats())
    // auto-start timer for newly created session
    startTimerWithCurrentDuration()
  }

  // keep remaining in sync whenever duration changes and timer not running
  useEffect(() => {
    if (!running) {
      setRemaining(totalSeconds)
    }
  }, [totalSeconds, running])

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [])

  // start timer using currently selected totalSeconds (used on select/new)
  const startTimerWithCurrentDuration = () => {
    // ensure we use the chosen duration
    setRemaining(totalSeconds)
    // clear any old timer
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    // start ticking
    timerRef.current = window.setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          // stop timer
          if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
          setRunning(false)
          setExpiredModalOpen(true) // show modal to ask continue or start new
          appendSystem("Time's up — session ended.")
          return 0
        }
        return prev - 1
      })
    }, 1000)
    setRunning(true)
    appendSystem('Timer started.')
  }

  // manual "continue" from modal: restart same chat using a chosen duration
  const continueSameChat = (secs: number) => {
    setTotalSeconds(secs)
    setRemaining(secs)
    setExpiredModalOpen(false)
    // restart timer
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    timerRef.current = window.setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
          setRunning(false)
          setExpiredModalOpen(true)
          appendSystem("Time's up — session ended.")
          return 0
        }
        return prev - 1
      })
    }, 1000)
    setRunning(true)
    appendSystem('Session continued.')
  }

  // "start new chat" from modal: pick a category, create new session and auto-start
  const startNewChatFromModal = async (cat: string, secs: number) => {
    setExpiredModalOpen(false)
    setTotalSeconds(secs)
    // create new session and auto-start inside newCategory
    await newCategory(cat)
  }

  const formatTime = (s: number) => {
    const sec = Math.max(0, Math.floor(s))
    const m = String(Math.floor(sec / 60)).padStart(2, '0')
    const ss = String(sec % 60).padStart(2, '0')
    return `${m}:${ss}`
  }

  // --- Message send logic (keeps your original flow) ---
  const onSend = async (text: string) => {
    // Prevent sends if pending OR timer has expired OR timer not running
    if (!active || !text.trim() || pending) return
    if (!running || remaining <= 0) {
      appendSystem('Cannot send message — session is not active.')
      return
    }
    setPending(true)
    setMessages(prev => [...prev, { role: 'user', content: text }])
    let idx: number = -1
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

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  // -------------------------
  // UI pieces
  // -------------------------
  const left = (
    <div className="w-64 shrink-0 space-y-2">
      <div className="rounded-2xl bg-card p-3">
        <div className="mb-2 text-sm opacity-70">New chat</div>
        <div className="grid grid-cols-2 gap-2">
          {categories.map(cat => (
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
      <div className="mb-3 rounded-2xl bg-card p-3 text-sm flex items-center justify-between gap-4">
        <div>Hi! I’m your assistant. Ask anything.</div>

        {/* Timer UI: only remaining time now */}
        <div className="flex items-center gap-2">
          <div className="text-sm opacity-90">Time Remaining</div>
          <div
            className={`px-3 py-1 rounded-lg font-mono text-sm font-semibold
              ${remaining <= 30 && running ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-black/10 text-gray-100  opacity-90'}`}
          >
            {formatTime(remaining)}
          </div>
        </div>
      </div>


      <div className="space-y-3 pb-28">
        {messages.filter(m=>m.role!=='system').map((m,i)=> (
          <ChatMessage key={i} role={m.role as 'user'|'assistant'} content={m.content} />
        ))}
        <div ref={endRef} />
      </div>

      <div className="fixed inset-x-0 bottom-0 mx-auto max-w-5xl p-4">
        <ChatInput
          disabled={pending || remaining <= 0 || !running}
          placeholder={!running ? 'Start or continue a chat to send messages' : remaining <= 0 ? 'Session ended. Continue or start a new chat.' : 'Type your message…'}
          onSend={onSend}
        />
      </div>
    </div>
  )

  return (
    <div className="flex gap-4">
      {left}
      {main}

      {/* Expired modal */}
      {expiredModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* backdrop */}
          <div className="absolute inset-0 bg-black/50" />

          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">Session ended</h3>
            <p className="text-sm text-gray-700">
              Your chat session has ended. Would you like to continue the same chat or start a new one?
            </p>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Choose duration</label>
              <select
                defaultValue={String(totalSeconds)}
                onChange={(e)=>setTotalSeconds(Number(e.target.value))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={300}>5 minutes</option>
                <option value={600}>10 minutes</option>
                <option value={900}>15 minutes</option>
              </select>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => continueSameChat(totalSeconds)}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700"
              >
                Continue same chat
              </button>

              <div className="grid grid-cols-2 gap-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => startNewChatFromModal(cat, totalSeconds)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-gray-600 text-sm hover:bg-gray-100"
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setExpiredModalOpen(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-gray-600 text-sm hover:bg-gray-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
