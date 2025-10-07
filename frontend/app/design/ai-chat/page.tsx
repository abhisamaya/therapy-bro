export default function AiChatDesignPage() {
    return (
      <div className="relative flex h-screen min-h-screen w-full flex-col bg-background-light dark:bg-background-dark overflow-hidden">
        {/* Header */}
        <div className="flex items-center bg-background-light dark:bg-background-dark p-4 pb-2 justify-between border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="text-primary flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/20">
              <span className="material-symbols-outlined text-lg">psychology</span>
            </div>
            <h2 className="text-slate-900 dark:text-slate-50 text-lg font-bold leading-tight tracking-[-0.015em]">TherapyBro AI</h2>
            <div className="w-2 h-2 rounded-full bg-green-500" />
          </div>
        </div>
  
        {/* Info Strip */}
        <h4 className="text-slate-500 dark:text-slate-400 text-sm font-bold leading-normal tracking-[0.015em] px-4 py-2 text-center bg-slate-100 dark:bg-slate-800">
          ₹2/min · 10:25 mins remaining
        </h4>
  
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Low Wallet Balance Chip */}
          <div className="flex justify-center">
            <div className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-full bg-yellow-100 dark:bg-yellow-900/50 pl-4 pr-4">
              <p className="text-yellow-800 dark:text-yellow-300 text-sm font-medium leading-normal">Low Wallet Balance. Recharge to continue.</p>
            </div>
          </div>
  
          {/* AI Message */}
          <div className="flex items-end gap-3">
            <div
              className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-10 h-10 shrink-0"
              style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBn4XBruf5FdR-ns1Ccsq1bxwETU3UQ7lylMqJ_vSVFNMMwXDDEcifxvMYc7GOVR1CKhP8aBgjr8mSM0WXoxXMKfWO0mV-KWCspxko1jhPLKFUnblzSU7MkTLmk5gwCA8nuwxklTCcWlEIlQwNQqlGTvzT-ZiT4pKYslOGQm5N62uDcOklLx79BSw3aH2EWUBclQa8_rXkfxo3-9yGcTLaTYbnX0_T_M8RXmZKmBJPF3qktl5zSIt_oy2y4wmaFYESVqCTo6R2r4nM")' }}
              aria-label="TherapyBro AI avatar"
            />
            <div className="flex flex-1 flex-col gap-1 items-start">
              <p className="text-slate-500 dark:text-slate-400 text-[13px]">TherapyBro AI</p>
              <p className="text-base flex max-w-sm rounded-lg rounded-bl-none px-4 py-3 bg-gradient-to-br from-teal-100 to-green-100 dark:from-teal-900 dark:to-green-900 text-slate-800 dark:text-slate-200">
                Hello! How are you feeling today?
              </p>
            </div>
          </div>
  
          {/* User Message */}
          <div className="flex items-end gap-3 justify-end">
            <div className="flex flex-1 flex-col gap-1 items-end">
              <p className="text-slate-500 dark:text-slate-400 text-[13px] text-right">You</p>
              <p className="text-base flex max-w-sm rounded-lg rounded-br-none px-4 py-3 bg-gradient-to-br from-purple-200 to-blue-200 dark:from-purple-800 dark:to-blue-800 text-slate-800 dark:text-slate-200">
                I'm feeling a bit anxious.
              </p>
            </div>
            <div
              className="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-10 h-10 shrink-0"
              style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuC1_7JQFi36-BS-CRoy0ZfWaUG7k40ypyRKRTh_lrMNXucQ_W9GAiLPsmQ35sXDYKvOt6dtBfVveZ5VKNAH-0ymDhiTvRPxF_Szrxsc8ruNt3eAg3q5fHz1Lireq2f8JS1Uw-DlH68Koj9F-mdjmooyFglh_y8z0rJ41rdtwRUBaIs2iHNYX0TWobmCptiGP_MR0oba_OhKXwmEsmE7n4tIelgZ3If7gaPD1ov_NyLf0T95O6fGqVnsaHt4oH6FGkVSmH1GIKMiOao")' }}
              aria-label="User avatar"
            />
          </div>
        </div>
  
        {/* Message Input */}
        <div className="bg-background-light dark:bg-background-dark p-4 border-t border-slate-200 dark:border-slate-800 sticky bottom-0">
          <div className="flex items-center gap-2">
            <input
              className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full border-transparent focus:border-primary focus:ring-primary text-slate-900 dark:text-slate-50 placeholder:text-slate-500 dark:placeholder:text-slate-400 px-4 py-2"
              placeholder="Tell me what's on your mind..."
              type="text"
            />
            <button className="flex items-center justify-center w-10 h-10 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              <span className="material-symbols-outlined">mic</span>
            </button>
            <button className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white hover:bg-primary/90 transition-colors">
              <span className="material-symbols-outlined">send</span>
            </button>
          </div>
        </div>
  
        {/* End of Session Modal (example, keep hidden by default) */}
        {/* Add your stateful logic later; markup kept for parity with the design */}
      </div>
    )
  }