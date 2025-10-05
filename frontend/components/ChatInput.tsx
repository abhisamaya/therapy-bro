'use client'
import { useState, useRef } from 'react'
import { Send } from 'lucide-react'

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
      className="w-full flex items-center gap-2.5 rounded-[28px] bg-slate-100 dark:bg-[#303030] px-4 py-2.5 shadow-sm"
    >
      <input
        value={v}
        onChange={(e) => setV(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 bg-transparent px-0 py-1.5 text-slate-900 dark:text-slate-50 placeholder:text-slate-500 dark:placeholder:text-slate-400 outline-none"
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