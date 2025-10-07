'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { listChats, startSession, getHistory, streamMessage } from '@/lib/api'
import ChatInput from '@/components/ChatInput'
import ChatMessage from '@/components/ChatMessage'
import { useRouter } from 'next/navigation'
import { LISTENER_META } from '@/lib/listeners'

type Msg = { role: 'user'|'assistant'|'system'; content: string }
type Conv = { session_id: string; category: string; updated_at: string; notes?: string }

export default function ChatPage() {
  const [convs, setConvs] = useState<Conv[]>([])
  const [active, setActive] = useState<string | null>(null)
  const [messages, setMessages] = useState<Msg[]>([])
  const [pending, setPending] = useState(false)
  const [initStatus, setInitStatus] = useState<string>('Initializing...')
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
  const categories = ['Yama', 'Siddhartha', 'Shankara', 'Kama', 'Narada']

  // hover state for tooltip
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)

  // -------------------------
  // helpers
  // -------------------------
  const appendSystem = useCallback((text: string) => {
    setMessages(prev => [...prev, { role: 'system', content: text }])
  }, [])

  // get category name for active session id
  const getActiveCategory = (): string | null => {
    if (!active) return null
    const conv = convs.find(c => c.session_id === active)
    return conv?.category ?? null
  }

  // helper to get welcome for active category
  const activeCategory = getActiveCategory()
  const activeWelcome = activeCategory ? (LISTENER_META[activeCategory]?.welcome ?? LISTENER_META.general.welcome) : LISTENER_META.general.welcome

  // Helper to log to backend
  const logToBackend = useCallback((message: string) => {
    fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: `[CHAT PAGE] ${message}` })
    }).catch(err => console.error('Failed to send log to backend:', err))
  }, [])

  // load conversations and initial session
  useEffect(() => {
    (async () => {
      try {
        setInitStatus('🚀 Chat page mounted')
        logToBackend('═══════════════════════════════════════════════════════════')
        logToBackend('🚀 CHAT PAGE INITIALIZATION STARTED')
        logToBackend('═══════════════════════════════════════════════════════════')
        console.log('🚀 Chat page initializing...')
        logToBackend(`🌐 Current URL: ${window.location.href}`)
        logToBackend(`🌐 Referrer: ${document.referrer}`)
        console.log('🌐 Current URL:', window.location.href)
        console.log('🌐 Referrer:', document.referrer)

        // Wait a bit for localStorage to be available (mobile fix)
        // Increased delay for better cross-page localStorage sync
        setInitStatus('⏳ Waiting for localStorage...')
        logToBackend('⏳ Step 1: Waiting 300ms for localStorage to be available')
        await new Promise(resolve => setTimeout(resolve, 300))
        logToBackend('✅ Step 1a: Wait completed')

        console.log('🔍 First token check...')
        logToBackend('🔍 Step 2: First token check - Calling localStorage.getItem("token")')
        let token = localStorage.getItem('token')
        console.log('🔑 First token check:', token ? `EXISTS (${token.length} chars)` : 'NULL')
        logToBackend(`🔑 Step 2a: First token check result: ${token ? `EXISTS (${token.length} chars)` : 'NULL'}`)
        if (token) {
          logToBackend(`🔑 Step 2b: Token preview: ${token.substring(0, 30)}...`)
        }

        // If no token, wait a bit more and retry (race condition fix)
        if (!token) {
          console.log('⏳ No token found, waiting 200ms more and retrying...')
          setInitStatus('⏳ Retrying token check...')
          logToBackend('⚠️ Step 2c: No token found on first check')
          logToBackend('⏳ Step 3: Waiting 200ms more and retrying')
          await new Promise(resolve => setTimeout(resolve, 200))
          logToBackend('✅ Step 3a: Wait completed')
          logToBackend('🔍 Step 3b: Second token check - Calling localStorage.getItem("token")')
          token = localStorage.getItem('token')
          console.log('🔑 Second token check:', token ? `EXISTS (${token.length} chars)` : 'NULL')
          logToBackend(`🔑 Step 3c: Second token check result: ${token ? `EXISTS (${token.length} chars)` : 'NULL'}`)
          if (token) {
            logToBackend(`🔑 Step 3d: Token preview: ${token.substring(0, 30)}...`)
          }
        }

        setInitStatus(`🔑 Token check: ${token ? 'EXISTS' : 'NULL'}`)
        console.log('🔑 Final token status:', token ? 'Token EXISTS' : 'Token NULL')
        logToBackend(`🔑 Step 4: Final token status: ${token ? 'EXISTS' : 'NULL'}`)

        if (!token) {
          console.error('❌ No token found, redirecting to login')
          setInitStatus('❌ No token - Redirecting to login...')
          logToBackend('❌ Step 4a: CRITICAL - No token found after all retries')
          logToBackend('❌ Step 4b: User will be redirected to /login2 in 1 second')
          logToBackend('❌ Step 4c: This suggests token was not properly saved during login')
          setTimeout(() => {
            logToBackend('🔄 Redirecting to /login2 now...')
            window.location.href = '/login2'
          }, 1000)
          return
        }

        logToBackend('✅ Step 5: Token found successfully! Proceeding with chat initialization')

        setInitStatus('📡 Fetching chat list...')
        console.log('📡 Fetching chat list...')
        logToBackend('📡 Step 6: Calling listChats() API')
        const list = await listChats()
        console.log(`✅ Chat list fetched: ${list.length} conversations`)
        logToBackend(`✅ Step 6a: Chat list fetched successfully: ${list.length} conversations`)
        setInitStatus(`✅ Found ${list.length} conversations`)
        setConvs(list)

        if (list.length) {
          setInitStatus('🔄 Loading latest conversation...')
          await select(list[0].session_id) // will auto-start timer for "continue"
        } else {
          setInitStatus('🆕 Creating new session...')
          console.log('🆕 Creating new session...')
          const s = await startSession('general')
          setActive(s.session_id)
          await load(s.session_id)
          setConvs(await listChats())
          // start timer automatically for new session
          startTimerWithCurrentDuration()
          // append generic system welcome
          appendSystem(LISTENER_META.general.welcome)
        }
        setInitStatus('✅ Chat ready!')
        console.log('✅ Chat initialization complete')
      } catch (err: any) {
        console.error('❌ Chat initialization error:', err)
        console.error('Error details:', err.message || JSON.stringify(err, null, 2))
        logToBackend('═══════════════════════════════════════════════════════════')
        logToBackend('❌ CHAT PAGE ERROR - INITIALIZATION FAILED')
        logToBackend('═══════════════════════════════════════════════════════════')
        logToBackend(`❌ Error name: ${err.name}`)
        logToBackend(`❌ Error message: ${err.message || 'Unknown error'}`)
        logToBackend(`❌ Error stack: ${err.stack || 'No stack trace'}`)
        logToBackend(`❌ Full error object: ${JSON.stringify(err, Object.getOwnPropertyNames(err))}`)
        logToBackend('❌ Action: Removing token and redirecting to login2')
        setInitStatus(`❌ Error: ${err.message || 'Unknown error'}`)
        // Clear potentially corrupted token
        localStorage.removeItem('token')
        logToBackend('❌ Token removed from localStorage')
        logToBackend('❌ Will redirect to /login2 in 2 seconds')
        setTimeout(() => {
          logToBackend('🔄 Redirecting to /login2 now...')
          window.location.href = '/login2'
        }, 2000)
      }
    })()
  }, [logToBackend])

  const load = async (id: string) => {
    const h = await getHistory(id)
    // keep system messages out of the main stream (you may want them preserved elsewhere)
    setMessages(h.messages.filter((m: Msg) => m.role !== 'system'))
    // If this session has no user/assistant messages yet, append the listener-specific system welcome
    const conv = convs.find(c => c.session_id === id)
    const cat = conv?.category ?? null
    if ((h.messages.filter((m: Msg) => m.role !== 'system').length === 0) && cat) {
      const meta = LISTENER_META[cat] ?? LISTENER_META.general
      appendSystem(meta.welcome)
    }
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
    // append listener-specific system welcome for the newly created chat
    const meta = LISTENER_META[cat] ?? LISTENER_META.general
    appendSystem(meta.welcome)
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
        <div className="mb-2 text-sm opacity-70">Pick Listener</div>

        <div className="grid grid-cols-2 gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={()=>newCategory(cat)}
              title={LISTENER_META[cat]?.description}
              onMouseEnter={() => setHoveredCategory(cat)}
              onMouseLeave={() => setHoveredCategory(null)}
              className="rounded-xl bg-black/20 px-3 py-2 text-xs hover:bg-black/30"
            >
              {cat}
            </button>
          ))}
        </div>

        {/* inline tooltip area */}
        <div className="mt-3 min-h-[2rem]">
          {hoveredCategory ? (
            <div className="rounded-md bg-black/10 px-3 py-2 text-xs">
              {LISTENER_META[hoveredCategory]?.description}
            </div>
          ) : (
            <div className="text-xs opacity-60">Hover a listener to see a short description</div>
          )}
        </div>
      </div>

      <div className="rounded-2xl bg-card p-3">
        <div className="mb-2 text-sm opacity-70">Your Conversations</div>
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
      {/* Show init status if not ready */}
      {initStatus !== '✅ Chat ready!' && (
        <div className="mb-3 rounded-2xl bg-blue-50 border border-blue-200 p-3 text-sm">
          <div className="font-medium text-blue-800">{initStatus}</div>
        </div>
      )}

      <div className="mb-3 rounded-2xl bg-card p-3 text-sm flex items-center justify-between gap-4">
        <div>
          {/* show the active listener's assistant welcome if a category exists, otherwise generic */}
          <div className="font-medium">{activeCategory ?? "Assistant"}</div>
          <div className="text-sm opacity-80">{activeWelcome}</div>
        </div>

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
                    title={LISTENER_META[cat]?.description}
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
