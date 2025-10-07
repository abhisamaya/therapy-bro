'use client'
export default function ChatMessage({ role, content }: { role: 'user'|'assistant', content: string }){
  const isUser = role==='user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} items-end gap-3`}>
      {!isUser && (
        <div
          className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-8 h-8 shrink-0"
          aria-label="TherapyBro AI avatar"
          style={{ backgroundImage: 'url("/assets/icons/therapybro_logo.jpg")' }}
        />
      )}
      <div
        className={[
          'max-w-[85%] whitespace-pre-wrap text-sm',
          isUser
            ? 'bg-gradient-to-br from-purple-200 to-blue-200 text-slate-800 rounded-2xl rounded-br-none px-4 py-3'
            : 'bg-gradient-to-br from-teal-100 to-green-100 text-slate-800 rounded-2xl rounded-bl-none px-4 py-3'
        ].join(' ')}
      >
        {content}
      </div>
      {isUser && (
        <div
          className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-8 h-8 shrink-0"
          aria-label="User avatar"
          style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuC1_7JQFi36-BS-CRoy0ZfWaUG7k40ypyRKRTh_lrMNXucQ_W9GAiLPsmQ35sXDYKvOt6dtBfVveZ5VKNAH-0ymDhiTvRPxF_Szrxsc8ruNt3eAg3q5fHz1Lireq2f8JS1Uw-DlH68Koj9F-mdjmooyFglh_y8z0rJ41rdtwRUBaIs2iHNYX0TWobmCptiGP_MR0oba_OhKXwmEsmE7n4tIelgZ3If7gaPD1ov_NyLf0T95O6fGqVnsaHt4oH6FGkVSmH1GIKMiOao")' }}
        />
      )}
    </div>
  )
}