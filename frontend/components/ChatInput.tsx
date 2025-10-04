'use client'
import { useState, useRef } from 'react'

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
      className="flex items-end gap-2 rounded-2xl bg-card p-3 shadow"
    >
      <textarea
        value={v}
        onChange={(e) => setV(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className="min-h-[44px] max-h-40 w-full resize-y rounded-xl bg-transparent p-2 outline-none placeholder:opacity-60"
        onKeyDown={(e) => {
          // Enter to send; Shift+Enter = newline; ignore while using IME
          if (
            e.key === 'Enter' &&
            !e.shiftKey &&
            !(e as any).isComposing &&
            !composingRef.current
          ) {
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
        className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        Send
      </button>
    </form>
  )
}
