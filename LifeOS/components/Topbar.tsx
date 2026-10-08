'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

const sectionLabels: Record<string, string> = {
  '/':             'DASHBOARD',
  '/academic':     'ACADEMIC_TRACKER',
  '/entertainment':'ENTERTAINMENT_DATABASE',
  '/projects':     'PROJECTS_ARCHIVE',
  '/finance':      'FINANCIAL_LEDGER',
  '/media':        'MEDIA_ANALYTICS',
  '/notes':        'GLOBAL_NOTES',
  '/settings':     'SYSTEM_SETTINGS',
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'GOOD MORNING'
  if (h < 17) return 'GOOD AFTERNOON'
  return 'GOOD EVENING'
}

function formatDate(date: Date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).toUpperCase()
}

export default function Topbar() {
  const pathname = usePathname()
  const [search, setSearch] = useState('')
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(t)
  }, [])

  const sectionKey = Object.keys(sectionLabels)
    .filter(k => k !== '/')
    .find(k => pathname.startsWith(k)) ?? '/'
  const pageTitle = sectionLabels[sectionKey]

  return (
    <header
      className="flex items-center gap-4 px-6 shrink-0"
      style={{
        height: 'var(--topbar-height)',
        background: 'rgba(8,8,12,0.95)',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Page title */}
      <div className="flex-1 min-w-0">
        <h1
          className="font-mono font-bold text-xs uppercase tracking-widest"
          style={{ color: 'var(--text-primary)' }}
        >
          SYS://{pageTitle}
        </h1>
      </div>

      {/* Search */}
      <div className="relative hidden md:block">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs flex items-center justify-center text-text-muted" style={{ color: 'var(--text-muted)' }}>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
        <input
          type="text"
          placeholder="SYS_SEARCH..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 pr-4 py-1.5 text-[10px] font-mono rounded w-48 transition-all duration-200"
          style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
            outline: 'none',
          }}
        />
      </div>

      {/* Date */}
      <div
        className="hidden lg:flex items-center gap-1.5 text-[10px] font-mono tracking-wider whitespace-nowrap"
        style={{ color: 'var(--text-muted)' }}
      >
        <span>DATE:</span>
        <span className="text-text-secondary">{formatDate(now)}</span>
      </div>

      {/* Greeting chip */}
      <div
        className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded text-[10px] font-mono tracking-wider"
        style={{
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border)',
          color: 'var(--text-secondary)',
        }}
      >
        <span>{getGreeting()}</span>
        <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>TAMIM</span>
      </div>
    </header>
  )
}
