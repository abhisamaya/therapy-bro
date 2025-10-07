// NO 'use client' here
import Link from 'next/link'

export default function DashboardPage() {
  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen">
      <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden pb-24">
        {/* Header */}
        <div className="flex items-center bg-background-light dark:bg-background-dark p-4 pb-2 justify-between">
          <div className="flex flex-col">
            <h2 className="text-slate-900 dark:text-slate-50 text-2xl font-bold leading-tight tracking-[-0.015em]">Hey Bro,</h2>
            <p className="text-slate-500 dark:text-slate-400 text-base">how’s are you feeling today?</p>
          </div>
          <div className="flex size-12 shrink-0 items-center justify-center">
            <div
              className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-12"
              aria-label="User profile picture"
              style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBiVtbHwcwM3WbuYIrX77DL8qLtG9Kwwz1GN-CjDbatcc9KNDAbV_wEPo07re5XCGXkvIXZiEIIOfMkt32O4nN1FXiEA8v6DARcpsAcbRZPO-JC7MZbimkTTHZiwZpMx04oC4hagEsGZI4h_Pp2fmEB8o05G3DjWCZX0XMS7tbhSjoKQQNkfRdBZyVynkAYuvGs-Y8VjaJ1z_6bGUXglDvhC4zFz-wOiWHOfWfDgET2o0MpTrEsbWUjSCfudCGTOe7p6-AV3bj-x3Q")' }}
            />
          </div>
        </div>

        {/* CTA: AI Therapist */}
        <div className="p-4 @container">
          <div className="flex flex-col items-stretch justify-start rounded-xl @xl:flex-row @xl:items-start shadow-sm bg-gradient-to-br from-blue-400 to-primary">
            <div className="flex w-full min-w-72 grow flex-col items-stretch justify-center gap-2 p-6">
              <div className="flex items-center justify-center bg-white/20 rounded-full size-12 mb-4">
                <span className="material-symbols-outlined text-white text-3xl">psychology</span>
              </div>
              <p className="text-white text-xl font-bold leading-tight tracking-[-0.015em]">Talk to TherapyBro</p>
              <div className="flex items-end gap-3 justify-between">
                <p className="text-white/80 text-base">Get instant support from our AI Buddy</p>
                <Link
                  href="/chat?new=TherapyBro"
                  className="flex min-w-[84px] max-w-[480px] items-center justify-center overflow-hidden rounded-xl h-10 px-5 bg-white text-primary text-sm font-medium leading-normal"
                >
                  <span className="truncate">Start Chat</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* CTA: Listening Bro */}
        <div className="p-4 pt-0 @container">
          <div className="flex flex-col items-stretch justify-start rounded-xl @xl:flex-row @xl:items-start shadow-sm bg-gradient-to-br from-teal-400 to-cyan-500">
            <div className="flex w-full min-w-72 grow flex-col items-stretch justify-center gap-2 p-6">
              <div className="flex items-center justify-center bg-white/20 rounded-full size-12 mb-4">
                <span className="material-symbols-outlined text-white text-3xl">forum</span>
              </div>
              <p className="text-white text-xl font-bold leading-tight tracking-[-0.015em]">Connect with a Listening Bro</p>
              <div className="flex items-end gap-3 justify-between">
                <p className="text-white/80 text-base">Chat with a trained peer who gets it</p>
                <Link
                  href="/chat"
                  className="flex min-w-[84px] max-w-[480px] items-center justify-center overflow-hidden rounded-xl h-10 px-5 bg-white text-teal-500 text-sm font-medium leading-normal"
                >
                  <span className="truncate">Find a Bro</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Wallet */}
        <div className="p-4 pt-0">
          <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-100 dark:bg-slate-800 p-4">
            <div className="flex flex-col gap-2">
              <p className="text-slate-500 dark:text-slate-400 text-sm">Wallet Balance</p>
              <p className="text-slate-900 dark:text-slate-50 text-2xl font-bold">₹180</p>
            </div>
            <button className="flex min-w-[84px] items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-amber-400 text-slate-900 gap-2 text-sm font-medium">
              <span className="truncate">Add Money</span>
              <span className="material-symbols-outlined">add_circle</span>
            </button>
          </div>
        </div>

        {/* Quick Insights */}
        <h2 className="text-slate-900 dark:text-slate-50 text-xl font-bold tracking-[-0.015em] px-4 pb-3 pt-4">Quick Insights</h2>
        <div className="flex gap-3 overflow-x-auto px-4 pb-4">
          <div className="flex flex-col gap-3 rounded-xl bg-slate-100 dark:bg-slate-800 p-4 w-56 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center rounded-full bg-primary/20 size-10">
                <span className="material-symbols-outlined text-primary">history</span>
              </div>
              <p className="text-slate-900 dark:text-slate-50 font-semibold">Last Session</p>
            </div>
            <p className="text-slate-600 dark:text-slate-300">AI Chat (4<span className="text-amber-400">★</span>)</p>
          </div>

          <div className="flex flex-col gap-3 rounded-xl bg-slate-100 dark:bg-slate-800 p-4 w-56 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center rounded-full bg-purple-500/20 size-10">
                <span className="material-symbols-outlined text-purple-500">lightbulb</span>
              </div>
              <p className="text-slate-900 dark:text-slate-50 font-semibold">Tip of the Day</p>
            </div>
            <p className="text-slate-600 dark:text-slate-300">Practice mindful breathing for 5 minutes.</p>
          </div>

          <div className="flex flex-col gap-3 rounded-xl bg-slate-100 dark:bg-slate-800 p-4 w-56 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center rounded-full bg-green-500/20 size-10">
                <span className="material-symbols-outlined text-green-500">edit_note</span>
              </div>
              <p className="text-slate-900 dark:text-slate-50 font-semibold">Mood Journal</p>
            </div>
            <p className="text-slate-600 dark:text-slate-300">How are you feeling right now?</p>
          </div>
        </div>

        {/* Bottom Nav */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-t border-slate-200 dark:border-slate-800">
          <div className="flex justify-around p-2">
            <Link href="/dashboard" className="flex flex-col items-center gap-1 p-2 rounded-lg text-primary">
              <span className="material-symbols-outlined">home</span>
              <span className="text-xs font-medium">Home</span>
            </Link>
            <Link href="/chat" className="flex flex-col items-center gap-1 p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary">
              <span className="material-symbols-outlined">chat_bubble</span>
              <span className="text-xs font-medium">Sessions</span>
            </Link>
            <Link href="/wallet" className="flex flex-col items-center gap-1 p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary">
              <span className="material-symbols-outlined">account_balance_wallet</span>
              <span className="text-xs font-medium">Wallet</span>
            </Link>
            <Link href="/profile" className="flex flex-col items-center gap-1 p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary">
              <span className="material-symbols-outlined">person</span>
              <span className="text-xs font-medium">Profile</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}