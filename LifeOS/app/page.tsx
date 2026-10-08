'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import MatrixRain from '@/components/MatrixRain'

interface Assignment { topic: string; deadline: string; subject: string }
interface Exam { subject: string; date: string; syllabus: string }
interface ClassSchedule { subject: string; dayOfWeek: number; startTime: string }
interface Project { id: string; name: string; progress: number }
interface MediaEntry { id: string; title: string; type: string; status: string; progressCurrent: number | null; progressTotal: number | null; progressUnit: string; coverUrl: string | null }
interface Activity { id: string; icon: string; title: string; timestamp: string; linkTo: string | null }

interface DashboardData {
  academic: {
    pendingExams: number
    nextExam: Exam | null
    pendingAssignments: number
    topAssignments: Assignment[]
    nextClass: ClassSchedule | null
  }
  entertainment: {
    ongoing: number
    total: number
    ongoingList: MediaEntry[]
  }
  projects: {
    active: number
    avgProgress: number
    list: Project[]
  }
  finance: {
    netWorth: number
    savingsDelta: number
    monthIncome: number
    monthExpense: number
    accounts: Record<string, number>
    categoryBreakdown: { name: string; amount: number }[]
  }
  media: {
    totalWatchtime: number
  }
  recentActivity: Activity[]
}

const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']

function formatBDT(n: number) { return `৳${Math.abs(n).toLocaleString()}` }

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(r => r.json())
      .then(d => {
        setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-20 w-full" style={{ borderRadius: '4px' }} />
        <div className="skeleton h-12 w-full" style={{ borderRadius: '4px' }} />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 skeleton h-96" style={{ borderRadius: '4px' }} />
          <div className="lg:col-span-8 space-y-4">
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-32" style={{ borderRadius: '4px' }} />)}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[...Array(2)].map((_, i) => <div key={i} className="skeleton h-20" style={{ borderRadius: '4px' }} />)}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!data) return <p className="font-mono text-xs text-muted" style={{ color: 'var(--text-muted)' }}>SYS_ERR: DASHBOARD_NOT_LOADABLE</p>

  const totalTracked = data.academic.pendingAssignments + data.projects.active + data.entertainment.total

  return (
    <div className="w-full space-y-6 max-w-full font-mono text-xs text-[var(--text-secondary)]">
      {/* ─── CENTRAL CONSOLE BAR ─── */}
      <div
        className="p-4 border flex flex-col md:flex-row justify-between items-start md:items-center bg-[#050508] gap-3"
        style={{
          borderColor: 'var(--border)',
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border flex items-center justify-center border-accent-purple text-accent-purple font-bold">
            S
          </div>
          <div>
            <p className="font-bold text-[12px] text-white">SYS_OPERATOR::CENTRAL_CONSOLE</p>
            <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
              CORE LIFE ARCHIVE & SYSTEM TRACKER // V1.0.0 STABLE
            </p>
          </div>
        </div>
        <div className="flex gap-2 text-[9px]">
          <span
            className="px-2 py-0.5 border text-accent-cyan"
            style={{ borderColor: 'rgba(0,229,255,0.2)', background: 'rgba(0,229,255,0.05)' }}
          >
            NODE_STATE: SECURE
          </span>
          <span
            className="px-2 py-0.5 border text-accent-purple"
            style={{ borderColor: 'rgba(217,70,239,0.2)', background: 'rgba(217,70,239,0.05)' }}
          >
            &gt;_ SESSION: ACTIVE_DEV
          </span>
        </div>
      </div>

      {/* ─── SEARCH INPUT ─── */}
      <div
        className="border p-3 bg-black flex items-center gap-2"
        style={{ borderColor: 'var(--border)' }}
      >
        <span className="text-muted-foreground" style={{ color: 'var(--text-muted)' }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
        <input
          type="text"
          placeholder="SEARCH EXTERNAL & LOCAL DATABASES... [/]"
          className="bg-transparent border-none outline-none flex-1 text-white placeholder-white/20 text-xs"
        />
      </div>

      {/* ─── 3-COLUMN MAIN PANEL ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left operator profile card */}
        <div
          className="lg:col-span-4 border p-5 flex flex-col justify-between bg-black relative"
          style={{ borderColor: 'var(--border)' }}
        >
          <div>
            <div className="border mb-4 overflow-hidden bg-black flex items-center justify-center" style={{ height: '220px', borderColor: 'var(--border)' }}>
              <MatrixRain />
            </div>
            <div>
              <span
                className="px-2 py-0.5 text-[9px] border text-accent-purple bg-accent-purple/10"
                style={{ borderColor: 'rgba(217,70,239,0.2)' }}
              >
                [SYS_OPERATOR::ELITE]
              </span>
              <h2 className="text-sm font-bold mt-2 text-white">SENPAI_09</h2>
              <p className="text-[9px] mt-1" style={{ color: 'var(--text-muted)' }}>IP: 127.0.0.1 // DEV_NODE</p>
              <p className="text-[11px] text-white/70 mt-3 leading-relaxed">
                ARCHIVING MEDIA EPHEMERA ACROSS MULTIPLE TIMELINES. DESIGN INSPIRED BY ADVANCED OBSIDIAN SYSTEMS.
              </p>
            </div>
          </div>
          <div className="border-t pt-3 mt-4 text-[10px] text-accent-green" style={{ borderColor: 'var(--border)' }}>
            &gt;_ STATUS: SYNC_COMPLETE // OK
          </div>
        </div>

        {/* Center/Right metrics widgets */}
        <div className="lg:col-span-8 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* Academic counter */}
            <div className="border p-4 bg-black flex flex-col justify-between" style={{ borderColor: 'var(--accent-purple)', minHeight: '135px' }}>
              <div className="flex justify-between items-start">
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>ACADEMIC METRICS</span>
                <span className="text-accent-purple">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                  </svg>
                </span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">
                  {data.academic.pendingExams} EXAMS // {data.academic.pendingAssignments} ASSIGNMENTS
                </h3>
                <p className="text-[8px]" style={{ color: 'var(--text-muted)' }}>[RECORDS_PENDING]</p>
              </div>
            </div>

            {/* Projects counter */}
            <div className="border p-4 bg-black flex flex-col justify-between" style={{ borderColor: 'var(--accent-amber)', minHeight: '135px' }}>
              <div className="flex justify-between items-start">
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>ACTIVE PROJECTS</span>
                <span className="text-accent-amber">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">
                  {data.projects.active} ACTIVE ({data.projects.avgProgress}% COMP)
                </h3>
                <p className="text-[8px]" style={{ color: 'var(--text-muted)' }}>[COMPILATION_RATE]</p>
              </div>
            </div>

            {/* Finance counter */}
            <div className="border p-4 bg-black flex flex-col justify-between" style={{ borderColor: 'var(--accent-green)', minHeight: '135px' }}>
              <div className="flex justify-between items-start">
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>FINANCIAL STABILITY</span>
                <span className="text-accent-green">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">
                  {formatBDT(data.finance.netWorth)} ({data.finance.savingsDelta >= 0 ? '+' : '-'}{formatBDT(data.finance.savingsDelta)} DELTA)
                </h3>
                <p className="text-[8px]" style={{ color: 'var(--text-muted)' }}>[NET_BALANCE]</p>
              </div>
            </div>

            {/* Media counter */}
            <div className="border p-4 bg-black flex flex-col justify-between" style={{ borderColor: 'var(--accent-cyan)', minHeight: '135px' }}>
              <div className="flex justify-between items-start">
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>MEDIA TRACKED</span>
                <span className="text-accent-cyan">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                  </svg>
                </span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">
                  {data.entertainment.total} ITEMS ({data.media.totalWatchtime} HOURS)
                </h3>
                <p className="text-[8px]" style={{ color: 'var(--text-muted)' }}>[RECORDS_LOGGED]</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Total tracked stats */}
            <div className="border p-5 bg-[#050508] flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-3">
                <span className="text-white">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </span>
                <div>
                  <p className="text-[8px]" style={{ color: 'var(--text-muted)' }}>TOTAL TRACKED ITEMS</p>
                  <p className="text-base font-bold text-white">{totalTracked} LIFE_ITEMS</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[7px]" style={{ color: 'var(--text-muted)' }}>INTEGRATION STATE</p>
                <p className="text-[9px] font-bold text-accent-green">100% SECURE</p>
              </div>
            </div>

            {/* Split metrics */}
            <div className="border p-4 bg-[#050508] grid grid-cols-3 gap-2 text-center" style={{ borderColor: 'var(--border)' }}>
              <div className="border-r flex flex-col justify-center" style={{ borderColor: 'var(--border)' }}>
                <p className="text-sm font-bold text-accent-cyan flex items-center justify-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse shrink-0" />
                  {data.entertainment.ongoing + data.projects.active}
                </p>
                <p className="text-[8px]" style={{ color: 'var(--text-muted)' }}>ACTIVE</p>
              </div>
              <div className="border-r flex flex-col justify-center" style={{ borderColor: 'var(--border)' }}>
                <p className="text-sm font-bold text-accent-green flex items-center justify-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-green shrink-0" />
                  {data.entertainment.total - data.entertainment.ongoing}
                </p>
                <p className="text-[8px]" style={{ color: 'var(--text-muted)' }}>DONE</p>
              </div>
              <div className="flex flex-col justify-center">
                <p className="text-sm font-bold text-accent-amber flex items-center justify-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-amber shrink-0" />
                  {data.academic.pendingAssignments + data.academic.pendingExams}
                </p>
                <p className="text-[8px]" style={{ color: 'var(--text-muted)' }}>BACKLOG</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── SECTION SPECTACLE PANELS ─── */}
      <div className="space-y-6 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
        
        {/* Academics Spotlight Section */}
        <div className="border bg-black" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <span className="px-2 py-0.5 text-[9px] font-bold text-accent-purple bg-accent-purple/10 border" style={{ borderColor: 'rgba(217,70,239,0.3)' }}>
              ACADEMIC TRACKER METRICS
            </span>
            <Link href="/academic" className="text-[9px] text-white/50 hover:text-white transition-colors">ALL ACADEMIC DATA &gt;</Link>
          </div>

          <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Left values */}
            <div className="grid grid-cols-2 gap-4 border-r pr-6" style={{ borderColor: 'var(--border)' }}>
              <div>
                <p className="text-[8px]" style={{ color: 'var(--text-muted)' }}>EXAMS PENDING</p>
                <p className="text-2xl font-bold text-accent-purple">{data.academic.pendingExams}</p>
              </div>
              <div>
                <p className="text-[8px]" style={{ color: 'var(--text-muted)' }}>ASSIGNMENTS</p>
                <p className="text-2xl font-bold text-white">{data.academic.pendingAssignments}</p>
              </div>
            </div>

            {/* Center - Next exam information */}
            <div className="text-[10px] border-r pr-6" style={{ borderColor: 'var(--border)' }}>
              <p className="text-[8px]" style={{ color: 'var(--text-muted)' }}>UPCOMING EXAMINATIONS</p>
              {data.academic.nextExam ? (
                <div className="mt-1">
                  <p className="font-bold text-white">{data.academic.nextExam.subject.toUpperCase()}</p>
                  <p style={{ color: 'var(--text-secondary)' }}>Syllabus: {data.academic.nextExam.syllabus.toUpperCase()}</p>
                  <p className="text-accent-purple font-bold mt-1">DATE: {new Date(data.academic.nextExam.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}</p>
                </div>
              ) : (
                <p className="text-muted-foreground py-2" style={{ color: 'var(--text-muted)' }}>NO EXAMS SCHEDULED</p>
              )}
            </div>

            {/* Right - Classes Schedule */}
            <div className="text-[10px]">
              <p className="text-[8px]" style={{ color: 'var(--text-muted)' }}>UPCOMING CLASSES SCHEDULE</p>
              {data.academic.nextClass ? (
                <div className="mt-1">
                  <p className="font-bold text-white">{data.academic.nextClass.subject.toUpperCase()}</p>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    DAY: {dayNames[data.academic.nextClass.dayOfWeek]} @ {data.academic.nextClass.startTime}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground py-2" style={{ color: 'var(--text-muted)' }}>NO ACTIVE CLASS SCHEDULES</p>
              )}
            </div>
          </div>
        </div>

        {/* Projects Spotlight Section */}
        <div className="border bg-black" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <span className="px-2 py-0.5 text-[9px] font-bold text-accent-amber bg-accent-amber/10 border" style={{ borderColor: 'rgba(255,176,0,0.3)' }}>
              PROJECT WORKFLOW LOGS
            </span>
            <Link href="/projects" className="text-[9px] text-white/50 hover:text-white transition-colors">PROJECTS KANBAN &gt;</Link>
          </div>

          <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Left values */}
            <div className="grid grid-cols-2 gap-4 border-r pr-6" style={{ borderColor: 'var(--border)' }}>
              <div>
                <p className="text-[8px]" style={{ color: 'var(--text-muted)' }}>ACTIVE DEV FILES</p>
                <p className="text-2xl font-bold text-accent-amber">{data.projects.active}</p>
              </div>
              <div>
                <p className="text-[8px]" style={{ color: 'var(--text-muted)' }}>AVG PROGRESS</p>
                <p className="text-2xl font-bold text-white">{data.projects.avgProgress}%</p>
              </div>
            </div>

            {/* Center - Projects List */}
            <div className="text-[10px] space-y-2 border-r pr-6 md:col-span-2" style={{ borderColor: 'var(--border)' }}>
              <p className="text-[8px]" style={{ color: 'var(--text-muted)' }}>PROJECT REGISTRIES RUNNING</p>
              <div className="space-y-1.5">
                {data.projects.list.map(p => (
                  <div key={p.id} className="space-y-0.5">
                    <div className="flex justify-between text-[9px]">
                      <span className="font-bold text-white truncate max-w-[200px]">{p.name.toUpperCase()}</span>
                      <span className="text-accent-amber">{p.progress}%</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-bar-fill" style={{ width: `${p.progress}%`, background: 'var(--accent-amber)' }} />
                    </div>
                  </div>
                ))}
                {data.projects.list.length === 0 && (
                  <p className="text-muted-foreground py-2" style={{ color: 'var(--text-muted)' }}>NO PROJECTS IN DEVELOPMENT</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Finance Spotlight Section */}
        <div className="border bg-black" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <span className="px-2 py-0.5 text-[9px] font-bold text-accent-green bg-accent-green/10 border" style={{ borderColor: 'rgba(57,255,20,0.3)' }}>
              FINANCIAL STABILITY LEDGER
            </span>
            <Link href="/finance" className="text-[9px] text-white/50 hover:text-white transition-colors">FINANCIAL LEDGER &gt;</Link>
          </div>

          <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Left values */}
            <div className="grid grid-cols-2 gap-4 border-r pr-6" style={{ borderColor: 'var(--border)' }}>
              <div>
                <p className="text-[8px]" style={{ color: 'var(--text-muted)' }}>NET WORTH</p>
                <p className="text-2xl font-bold text-accent-green">{formatBDT(data.finance.netWorth)}</p>
              </div>
              <div>
                <p className="text-[8px]" style={{ color: 'var(--text-muted)' }}>SAVINGS DELTA</p>
                <p className="text-2xl font-bold text-white">{data.finance.savingsDelta >= 0 ? '+' : '-'}{formatBDT(data.finance.savingsDelta)}</p>
              </div>
            </div>

            {/* Center - Expense Category breakdowns */}
            <div className="text-[10px] space-y-1.5 border-r pr-6" style={{ borderColor: 'var(--border)' }}>
              <p className="text-[8px]" style={{ color: 'var(--text-muted)' }}>MONTHLY SPENDING CATEGORIES</p>
              {data.finance.categoryBreakdown.slice(0, 3).map(cat => {
                const total = data.finance.monthExpense
                const pct = total > 0 ? Math.round((cat.amount / total) * 100) : 0
                return (
                  <div key={cat.name} className="flex justify-between">
                    <span style={{ color: 'var(--text-secondary)' }}>/ {cat.name.toUpperCase()}</span>
                    <span className="font-bold text-white">{formatBDT(cat.amount)} ({pct}%)</span>
                  </div>
                )
              })}
              {data.finance.categoryBreakdown.length === 0 && (
                <p className="text-muted-foreground py-2" style={{ color: 'var(--text-muted)' }}>NO OUTFLOWS REGISTERED</p>
              )}
            </div>

            {/* Right - Account values */}
            <div className="text-[10px] space-y-1.5">
              <p className="text-[8px]" style={{ color: 'var(--text-muted)' }}>ACCOUNT BALANCES</p>
              {Object.entries(data.finance.accounts).map(([name, bal]) => (
                <div key={name} className="flex justify-between">
                  <span style={{ color: 'var(--text-secondary)' }}>{name.toUpperCase()}</span>
                  <span className="font-bold text-white">{formatBDT(bal)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Media Spotlight Section */}
        <div className="border bg-black" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <span className="px-2 py-0.5 text-[9px] font-bold text-accent-cyan bg-accent-cyan/10 border" style={{ borderColor: 'rgba(0,229,255,0.3)' }}>
              MEDIA STREAM UNDER CONSUMPTION
            </span>
            <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>LATEST SESSIONS LOG</span>
          </div>

          <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Left values */}
            <div className="grid grid-cols-2 gap-4 border-r pr-6" style={{ borderColor: 'var(--border)' }}>
              <div>
                <p className="text-[8px]" style={{ color: 'var(--text-muted)' }}>TOTAL TRACKED</p>
                <p className="text-2xl font-bold text-accent-cyan">{data.entertainment.total}</p>
              </div>
              <div>
                <p className="text-[8px]" style={{ color: 'var(--text-muted)' }}>HOURS SPENT</p>
                <p className="text-2xl font-bold text-white">{data.media.totalWatchtime}</p>
              </div>
            </div>

            {/* Center - List of ongoing media stream */}
            <div className="text-[10px] space-y-2 border-r pr-6 md:col-span-2" style={{ borderColor: 'var(--border)' }}>
              <p className="text-[8px]" style={{ color: 'var(--text-muted)' }}>ACTIVE MEDIA ONGOING</p>
              <div className="space-y-2">
                {data.entertainment.ongoingList.map(m => (
                  <div key={m.id} className="flex items-center gap-2">
                    {m.coverUrl ? (
                      <img src={m.coverUrl} className="w-6 h-8 object-cover shrink-0 filter brightness-90" alt="" />
                    ) : (
                      <div className="w-6 h-8 bg-tertiary shrink-0" style={{ background: 'var(--bg-tertiary)' }} />
                    )}
                    <div className="min-w-0 flex-1 leading-tight">
                      <p className="font-bold text-white truncate text-[9px]">{m.title.toUpperCase()}</p>
                      <p className="text-[8px]" style={{ color: 'var(--text-muted)' }}>
                        {m.status} - PROGRESS {m.progressCurrent || 0}/{m.progressTotal || '?'} {m.progressUnit} - {m.type}
                      </p>
                    </div>
                  </div>
                ))}
                {data.entertainment.ongoingList.length === 0 && (
                  <p className="text-muted-foreground py-2" style={{ color: 'var(--text-muted)' }}>NO ONGOING MEDIA STREAMS</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* System Activity Logs */}
        <div className="border bg-black" style={{ borderColor: 'var(--border)' }}>
          <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <span className="px-2 py-0.5 text-[9px] font-bold text-white/50 bg-white/5 border" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
              GLOBAL SYSTEM ACTIVITY FEEDS
            </span>
          </div>
          <div className="p-5 space-y-2.5 max-h-[300px] overflow-y-auto">
            {data.recentActivity.map(act => (
              <div key={act.id} className="flex items-center gap-3 text-[10px]">
                <span className="px-2 py-0.5 rounded text-[8px] font-mono font-bold shrink-0"
                  style={{ 
                    color: act.icon === 'DONE' || act.icon === 'OK' || act.icon === 'FIN' ? 'var(--accent-green)' : act.icon === 'EXP' ? 'var(--accent-red)' : 'var(--accent-cyan)',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border)'
                  }}>
                  {act.icon}
                </span>
                <span className="flex-1 text-white/70 truncate">{act.title.toUpperCase()}</span>
                <span className="text-[8px]" style={{ color: 'var(--text-muted)' }}>{new Date(act.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}</span>
              </div>
            ))}
            {data.recentActivity.length === 0 && (
              <p className="text-muted-foreground text-center py-6" style={{ color: 'var(--text-muted)' }}>NO SESSIONS FEED DETECTED</p>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
