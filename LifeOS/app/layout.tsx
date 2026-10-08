import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/Header'
import Statusbar from '@/components/Statusbar'

export const metadata: Metadata = {
  title: 'Life OS — Command Center',
  description: 'Your centralized personal dashboard for academics, entertainment, projects, and finances.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className="flex flex-col h-screen overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
        <Statusbar />
      </body>
    </html>
  )
}
