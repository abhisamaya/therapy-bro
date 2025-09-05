import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Auth Chat', description: 'Streaming chat with login' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en"><body><div className="mx-auto max-w-5xl p-4">{children}</div></body></html>
  )
}
