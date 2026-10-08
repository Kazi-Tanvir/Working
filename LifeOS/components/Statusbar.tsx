'use client'

import { useEffect, useState } from 'react'

export default function Statusbar() {
  const [uptime, setUptime] = useState(0)

  useEffect(() => {
    const t = setInterval(() => {
      setUptime(prev => prev + 1)
    }, 1000)
    return () => clearInterval(t)
  }, [])

  const formatUptime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return [hrs, mins, secs].map(v => String(v).padStart(2, '0')).join(':')
  }

  return (
    <footer
      className="w-full shrink-0 flex items-center justify-between px-6 border-t font-mono text-[9px] tracking-wider text-muted select-none"
      style={{
        height: '30px',
        background: '#000000',
        borderColor: 'var(--border)',
        color: 'var(--text-muted)',
      }}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-accent-green animate-pulse" />
          <span style={{ color: 'var(--accent-green)' }}>[SYS_STATUS: ONLINE]</span>
        </div>
        <span style={{ color: 'var(--accent-cyan)' }}>[DB_STATUS: DB_CLUSTERS_CONNECTED]</span>
      </div>

      <div className="flex items-center gap-4">
        <span>[UPTIME: {formatUptime(uptime)}]</span>
        <span style={{ color: 'var(--accent-purple)' }}>[* GIT: ORIGIN/MAIN]</span>
      </div>
    </footer>
  )
}
