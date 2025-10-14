'use client'

import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Home,
  MessageCircle,
  Calendar,
  BookOpen,
  User,
  LogOut,
  Menu
} from 'lucide-react'
import { useState } from 'react'

export default function TopNav() {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userName')
    router.push('/login')
  }

  const isActive = (path: string) => pathname === path

  return (
    <>
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/dashboard" className="text-2xl font-bold text-accent">
                Therapy Bro
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              <Link
                href="/dashboard"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  isActive('/dashboard')
                    ? 'bg-gradient-accent text-white shadow-glow'
                    : 'text-text-muted hover:bg-accent/10 hover:text-accent'
                }`}
              >
                <Home size={20} />
                <span className="font-medium">Home</span>
              </Link>

              <Link
                href="/chat"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  isActive('/chat')
                    ? 'bg-gradient-accent text-white shadow-glow'
                    : 'text-text-muted hover:bg-accent/10 hover:text-accent'
                }`}
              >
                <MessageCircle size={20} />
                <span className="font-medium">Chat</span>
              </Link>

              <Link
                href="/calendar"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  isActive('/calendar')
                    ? 'bg-gradient-accent text-white shadow-glow'
                    : 'text-text-muted hover:bg-accent/10 hover:text-accent'
                }`}
              >
                <Calendar size={20} />
                <span className="font-medium">Sessions</span>
              </Link>

              <Link
                href="/resources"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  isActive('/resources')
                    ? 'bg-gradient-accent text-white shadow-glow'
                    : 'text-text-muted hover:bg-accent/10 hover:text-accent'
                }`}
              >
                <BookOpen size={20} />
                <span className="font-medium">Resources</span>
              </Link>

              <Link
                href="/account"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  isActive('/account')
                    ? 'bg-gradient-accent text-white shadow-glow'
                    : 'text-text-muted hover:bg-accent/10 hover:text-accent'
                }`}
              >
                <User size={20} />
                <span className="font-medium">Account</span>
              </Link>
            </div>

            {/* Right side - Logout button */}
            <div className="hidden md:flex items-center">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-danger hover:bg-red-50 transition-all"
              >
                <LogOut size={20} />
                <span className="font-medium">Logout</span>
              </button>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-text-muted hover:bg-accent/10"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-white">
            <div className="px-4 py-3 space-y-1">
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive('/dashboard')
                    ? 'bg-gradient-accent text-white shadow-glow'
                    : 'text-text-muted hover:bg-accent/10 hover:text-accent'
                }`}
              >
                <Home size={20} />
                <span className="font-medium">Home</span>
              </Link>

              <Link
                href="/chat"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive('/chat')
                    ? 'bg-gradient-accent text-white shadow-glow'
                    : 'text-text-muted hover:bg-accent/10 hover:text-accent'
                }`}
              >
                <MessageCircle size={20} />
                <span className="font-medium">Chat</span>
              </Link>

              <Link
                href="/calendar"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive('/calendar')
                    ? 'bg-gradient-accent text-white shadow-glow'
                    : 'text-text-muted hover:bg-accent/10 hover:text-accent'
                }`}
              >
                <Calendar size={20} />
                <span className="font-medium">Sessions</span>
              </Link>

              <Link
                href="/resources"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive('/resources')
                    ? 'bg-gradient-accent text-white shadow-glow'
                    : 'text-text-muted hover:bg-accent/10 hover:text-accent'
                }`}
              >
                <BookOpen size={20} />
                <span className="font-medium">Resources</span>
              </Link>

              <Link
                href="/account"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive('/account')
                    ? 'bg-gradient-accent text-white shadow-glow'
                    : 'text-text-muted hover:bg-accent/10 hover:text-accent'
                }`}
              >
                <User size={20} />
                <span className="font-medium">Account</span>
              </Link>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-danger hover:bg-red-50 transition-all"
              >
                <LogOut size={20} />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        )}
      </nav>
    </>
  )
}
