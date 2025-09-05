'use client'
export default function ChatMessage({ role, content }: { role: 'user'|'assistant', content: string }){
  const isUser = role==='user'
  return (
    <div className={`flex ${isUser?'justify-end':'justify-start'}`}>
      <div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm shadow ${isUser?'bg-accent text-white':'bg-card'}`}>{content}</div>
    </div>
  )
}
