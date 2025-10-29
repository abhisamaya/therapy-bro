'use client'

import Link from 'next/link'
import TopNav from '@/components/TopNav'
import PhoneVerificationBanner from '@/components/PhoneVerificationBanner'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getWallet } from '@/lib/api'

export default function DashboardPage() {
  const router = useRouter()
  const [userName, setUserName] = useState<string>('Bro')
  const [walletBalance, setWalletBalance] = useState<string>('0')
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    // Get user name from localStorage
    const storedName = localStorage.getItem('userName') || 'Bro'
    setUserName(storedName)

    // Fetch wallet balance
    const fetchWalletBalance = async () => {
      try {
        const wallet = await getWallet()
        setWalletBalance(wallet.balance)
      } catch (error) {
        console.error('Failed to fetch wallet balance:', error)
        setWalletBalance('0')
      } finally {
        setLoading(false)
      }
    }

    fetchWalletBalance()
  }, [router])

  return (
    <div className="bg-bg min-h-screen">
      <TopNav />
      <PhoneVerificationBanner />
      <div className="relative flex h-auto min-h-screen w-full flex-col overflow-x-hidden">
        {/* Header */}
        <div className="flex items-center bg-white p-4 pb-2 justify-between max-w-7xl mx-auto w-full">
          <div className="flex flex-col">
            <h2 className="text-text text-2xl font-bold leading-tight tracking-[-0.015em]">Hey {userName},</h2>
            <p className="text-text-muted text-base">how are you feeling today?</p>
          </div>
        </div>

        {/* CTA: AI Therapist */}
        <div className="p-4 @container max-w-7xl mx-auto w-full">
          <div className="flex flex-col items-stretch justify-start rounded-xl @xl:flex-row @xl:items-start shadow-sm bg-gradient-to-br from-blue-400 to-accent">
            <div className="flex w-full min-w-72 grow flex-col items-stretch justify-center gap-2 p-6">
              <div className="flex items-center justify-center bg-white/20 rounded-full size-12 mb-4">
                <span className="material-symbols-outlined text-white text-3xl">psychology</span>
              </div>
              <p className="text-white text-xl font-bold leading-tight tracking-[-0.015em]">Talk to TherapyBro</p>
              <div className="flex items-end gap-3 justify-between">
                <p className="text-white/80 text-base">Get instant support from our AI Buddy</p>
                <Link
                  href="/chat"
                  className="flex min-w-[84px] max-w-[480px] items-center justify-center overflow-hidden rounded-xl h-10 px-5 bg-white text-accent text-sm font-medium leading-normal hover:bg-gray-50 transition-colors"
                >
                  <span className="truncate">Start Chat</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* CTA: Listening Bro */}
        <div className="p-4 pt-0 @container max-w-7xl mx-auto w-full">
          <div className="flex flex-col items-stretch justify-start rounded-xl @xl:flex-row @xl:items-start shadow-sm bg-gradient-to-br from-teal-400 to-cyan-500">
            <div className="flex w-full min-w-72 grow flex-col items-stretch justify-center gap-2 p-6">
              <div className="flex items-center justify-center bg-white/20 rounded-full size-12 mb-4">
                <span className="material-symbols-outlined text-white text-3xl">forum</span>
              </div>
              <p className="text-white text-xl font-bold leading-tight tracking-[-0.015em]">Connect with a Listening Bro</p>
              <div className="flex items-end gap-3 justify-between">
                <p className="text-white/80 text-base">Chat with a trained peer who gets it</p>
                <Link
                  href="/peers"
                  className="flex min-w-[84px] max-w-[480px] items-center justify-center overflow-hidden rounded-xl h-10 px-5 bg-white text-teal-500 text-sm font-medium leading-normal hover:bg-gray-50 transition-colors"
                >
                  <span className="truncate">Find a Bro</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Wallet */}
        <div className="p-4 pt-0 max-w-7xl mx-auto w-full">
          <div className="flex items-center justify-between gap-4 rounded-xl bg-bg-muted p-4">
            <div className="flex flex-col gap-2">
              <p className="text-text-muted text-sm">Wallet Balance</p>
              <p className="text-text text-2xl font-bold">
                {loading ? '...' : `₹${parseFloat(walletBalance).toFixed(2)}`}
              </p>

            </div>
            <button
              onClick={() => alert('Payment integration coming soon!')}
              className="flex min-w-[84px] items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-amber-400 text-white gap-2 text-sm font-medium hover:bg-amber-500 transition-colors"
            >
              <span className="truncate">Add Money</span>
              <span className="material-symbols-outlined">add_circle</span>
            </button>
          </div>
        </div>

        {/* Quick Insights */}
        <div className="max-w-7xl mx-auto w-full px-4">
          <h2 className="text-text text-xl font-bold tracking-[-0.015em] pb-3 pt-4">Quick Insights</h2>
        </div>
        <div className="flex gap-3 overflow-x-auto px-4 pb-8 max-w-7xl mx-auto w-full">
          <div className="flex flex-col gap-3 rounded-xl bg-white border border-border shadow-glass p-4 w-56 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center rounded-full bg-accent/20 size-10">
                <span className="material-symbols-outlined text-accent">history</span>
              </div>
              <p className="text-text font-semibold">Last Session</p>
            </div>
            <p className="text-text-muted">AI Chat (4<span className="text-amber-400">★</span>)</p>
          </div>

          <div className="flex flex-col gap-3 rounded-xl bg-white border border-border shadow-glass p-4 w-56 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center rounded-full bg-purple-500/20 size-10">
                <span className="material-symbols-outlined text-purple-500">lightbulb</span>
              </div>
              <p className="text-text font-semibold">Tip of the Day</p>
            </div>
            <p className="text-text-muted">Practice mindful breathing for 5 minutes.</p>
          </div>

          <div className="flex flex-col gap-3 rounded-xl bg-white border border-border shadow-glass p-4 w-56 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center rounded-full bg-green-500/20 size-10">
                <span className="material-symbols-outlined text-green-500">edit_note</span>
              </div>
              <p className="text-text font-semibold">Mood Journal</p>
            </div>
            <p className="text-text-muted">How are you feeling right now?</p>
          </div>
        </div>

      </div>
    </div>
  )
}