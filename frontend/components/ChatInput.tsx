'use client'
import { useState, useRef } from 'react'
import { Mic, Send } from 'lucide-react'

export default function ChatInput({
  onSend,
  placeholder,
  disabled
}: {
  onSend: (t: string) => void
  placeholder?: string
  disabled?: boolean
}) {
  const [v, setV] = useState('')
  const composingRef = useRef(false)

  const submit = () => {
    const text = v.trim()
    if (!text || disabled) return
    onSend(text)
    setV('')
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        submit()
      }}
      className="flex items-center gap-2 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-2"
    >
      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 bg-transparent px-2 py-2 text-slate-900 dark:text-slate-50 placeholder:text-slate-500 dark:placeholder:text-slate-400 outline-none"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && !(e as any).isComposing && !composingRef.current) {
            e.preventDefault()
            submit()
          }
        }}
        onCompositionStart={() => (composingRef.current = true)}
        onCompositionEnd={() => (composingRef.current = false)}
        aria-label="Message"
      />
      <button
        type="button"
        disabled={disabled}
        className="flex items-center justify-center w-9 h-9 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
        aria-label="Voice input"
      >
        <Mic className="w-4 h-4" />
      </button>
      <button
        type="submit"
        disabled={disabled || !v.trim()}
        className="flex items-center justify-center w-9 h-9 rounded-full bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
        aria-label="Send message"
      >
        <Send className="w-4 h-4" />
      </button>
    </form>
  )
}