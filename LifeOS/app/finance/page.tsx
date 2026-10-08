'use client'

import { useEffect, useState } from 'react'

interface FinanceStats {
  summary: { totalIncome: number; totalExpense: number; savingsDelta: number }
  accounts: { name: string; balance: number }[]
  netWorth: number
  incomeBySource: { source: string; amount: number }[]
  expenseByCategory: { category: string; total: number; subcategories: { name: string; amount: number }[] }[]
  expenseByAccount: { account: string; amount: number }[]
  availableMonths: string[]
}
interface Transaction {
  id: string; account: string; amount: number; date: string; isIncome: boolean
  category: string; subcategory: string | null; note: string | null; isBalanceCorrection: boolean
}

function formatBDT(n: number) { return `৳${Math.abs(n).toLocaleString()}` }

export default function FinancePage() {
  const [stats, setStats] = useState<FinanceStats | null>(null)
  const [txns, setTxns] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState('')
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set())
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set())
  const [showCorrections, setShowCorrections] = useState(false)

  const fetchData = (m?: string) => {
    const monthParam = m || month
    Promise.all([
      fetch(`/api/finance/stats?month=${monthParam}`).then(r => r.json()),
      fetch(`/api/finance/transactions?month=${monthParam}&take=30&showCorrections=${showCorrections}`).then(r => r.json()),
    ]).then(([s, t]) => {
      setStats(s)
      setTxns(t.transactions || [])
      if (!month && s.availableMonths?.length > 0) setMonth(s.availableMonths[0])
      setLoading(false)
    })
  }

  useEffect(() => { fetchData() }, [])
  useEffect(() => { if (month) fetchData(month) }, [month, showCorrections])

  const prevMonth = () => {
    if (!stats) return
    const idx = stats.availableMonths.indexOf(month)
    if (idx < stats.availableMonths.length - 1) setMonth(stats.availableMonths[idx + 1])
  }
  const nextMonth = () => {
    if (!stats) return
    const idx = stats.availableMonths.indexOf(month)
    if (idx > 0) setMonth(stats.availableMonths[idx - 1])
  }

  const toggleNote = (id: string) => {
    setExpandedNotes(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }
  const toggleCat = (cat: string) => {
    setExpandedCats(prev => {
      const n = new Set(prev)
      n.has(cat) ? n.delete(cat) : n.add(cat)
      return n
    })
  }

  const handleCSVImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      const csvText = e.target?.result
      if (typeof csvText !== 'string') return

      try {
        const res = await fetch('/api/finance/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ csvText }),
        })
        const data = await res.json()
        if (data.error) {
          alert(`Error: ${data.error}`)
        } else {
          alert(`Successfully imported ${data.count} transactions!`)
          fetchData()
        }
      } catch (err) {
        alert('Failed to connect to response endpoint.')
      }
    }
    reader.readAsText(file)
  }

  const monthLabel = month ? new Date(`${month}-01`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase() : ''

  if (loading) return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-40 rounded-xl" />)}</div>
  if (!stats) return <p className="font-mono text-xs text-muted" style={{ color: 'var(--text-muted)' }}>SYS_ERR: FINANCE_LEDGER_NOT_READABLE</p>

  const accColors: Record<string, string> = { CASH: 'var(--accent-green)', BKASH: 'var(--accent-pink)', SAVINGS: 'var(--accent-amber)' }
  const catColors = ['#FF0055', '#3B82F6', '#D946EF', '#FFB000', '#00E5FF', '#FF007F']

  // SVG Doughnut settings
  const radius = 24
  const circumference = 2 * Math.PI * radius
  let accumulatedPercent = 0

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono">
        <div className="flex items-center gap-2">
          <h1 className="text-display text-xl uppercase tracking-wider font-mono">SYS://FINANCIAL_LEDGER</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="btn btn-primary text-xs cursor-pointer">
            IMPORT_CSV
            <input type="file" accept=".csv" onChange={handleCSVImport} className="hidden" />
          </label>
          <div className="flex items-center gap-1">
            <button className="btn btn-ghost text-xs px-2.5 py-1" onClick={prevMonth}>PREV</button>
            <span className="text-xs font-semibold whitespace-nowrap px-4 py-1 border rounded" style={{ color: 'var(--text-primary)', borderColor: 'var(--border)', minWidth: '150px', textAlign: 'center' }}>{monthLabel}</span>
            <button className="btn btn-ghost text-xs px-2.5 py-1" onClick={nextMonth}>NEXT</button>
          </div>
        </div>
      </div>

      {/* Account Balance Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.accounts.map(a => (
          <div key={a.name} className="glass-card p-5">
            <p className="font-mono text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>{a.name}</p>
            <p className="text-stat text-lg font-bold" style={{ color: accColors[a.name] || 'var(--text-primary)' }}>{formatBDT(a.balance)}</p>
          </div>
        ))}
        <div className="glass-card p-5 cyber-cyan">
          <p className="font-mono text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>NET_WORTH_STABLE</p>
          <p className="text-stat text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{formatBDT(stats.netWorth)}</p>
        </div>
      </div>

      {/* Monthly Summary */}
      <div className="glass-card p-6 cyber-green">
        <h3 className="font-mono text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>MONTH_BALANCE_SHEETS</h3>
        <div className="grid grid-cols-3 gap-4 text-center font-mono">
          <div>
            <p className="text-[10px] mb-1" style={{ color: 'var(--text-muted)' }}>INCOME</p>
            <p className="text-stat text-lg" style={{ color: 'var(--accent-green)' }}>+{formatBDT(stats.summary.totalIncome)}</p>
          </div>
          <div>
            <p className="text-[10px] mb-1" style={{ color: 'var(--text-muted)' }}>EXPENSES</p>
            <p className="text-stat text-lg" style={{ color: 'var(--accent-red)' }}>-{formatBDT(stats.summary.totalExpense)}</p>
          </div>
          <div>
            <p className="text-[10px] mb-1" style={{ color: 'var(--text-muted)' }}>SAVINGS_DELTA</p>
            <p className="text-stat text-lg" style={{ color: stats.summary.savingsDelta >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
              {stats.summary.savingsDelta >= 0 ? '+' : '-'}{formatBDT(stats.summary.savingsDelta)}
            </p>
          </div>
        </div>
        
        {/* Progress bar comparison */}
        <div className="mt-5 space-y-2">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[9px] w-12" style={{ color: 'var(--text-muted)' }}>INFLOW</span>
            <div className="flex-1 h-2 rounded overflow-hidden bg-tertiary" style={{ background: 'var(--bg-tertiary)' }}>
              <div className="h-full rounded" style={{ width: `${stats.summary.totalIncome > 0 ? 100 : 0}%`, background: 'var(--accent-green)' }} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[9px] w-12" style={{ color: 'var(--text-muted)' }}>OUTFLOW</span>
            <div className="flex-1 h-2 rounded overflow-hidden bg-tertiary" style={{ background: 'var(--bg-tertiary)' }}>
              <div className="h-full rounded" style={{ width: `${stats.summary.totalIncome > 0 ? Math.min(100, (stats.summary.totalExpense / stats.summary.totalIncome) * 100) : 0}%`, background: 'var(--accent-red)' }} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Income Breakdown */}
        <div className="glass-card p-6">
          <h3 className="font-mono text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>INCOME_SOURCES</h3>
          {stats.incomeBySource.length === 0 ? (
            <p className="font-mono text-xs text-center py-6 text-muted" style={{ color: 'var(--text-muted)' }}>NO_INFLOW_RECORDED</p>
          ) : stats.incomeBySource.map(s => {
            const pct = stats.summary.totalIncome > 0 ? Math.round((s.amount / stats.summary.totalIncome) * 100) : 0
            return (
              <div key={s.source} className="flex items-center gap-3 mb-3 font-mono text-xs">
                <span className="w-20 truncate" style={{ color: 'var(--text-secondary)' }}>{s.source.toUpperCase()}</span>
                <div className="flex-1 h-2 rounded overflow-hidden bg-tertiary" style={{ background: 'var(--bg-tertiary)' }}>
                  <div className="h-full rounded" style={{ width: `${pct}%`, background: 'var(--accent-green)' }} />
                </div>
                <span className="w-16 text-right" style={{ color: 'var(--accent-green)' }}>{formatBDT(s.amount)}</span>
                <span className="w-8 text-right" style={{ color: 'var(--text-muted)' }}>{pct}%</span>
              </div>
            )
          })}
        </div>

        {/* Expense Category Breakdown: High-Tech Circular SVG Ring + Sublists */}
        <div className="glass-card p-6">
          <h3 className="font-mono text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>EXPENSES_CATEGORIES</h3>
          
          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 mb-5">
            {stats.summary.totalExpense > 0 ? (
              <div className="relative flex items-center justify-center shrink-0">
                {/* SVG Doughnut ring representing expenses */}
                <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 60 60">
                  <circle cx="30" cy="30" r={radius} fill="none" stroke="var(--bg-tertiary)" strokeWidth="4" />
                  {stats.expenseByCategory.map((cat, i) => {
                    const pct = stats.summary.totalExpense > 0 ? (cat.total / stats.summary.totalExpense) * 100 : 0
                    if (pct <= 0) return null
                    const strokeDash = `${(pct / 100) * circumference} ${circumference}`
                    const strokeOffset = - (accumulatedPercent / 100) * circumference
                    accumulatedPercent += pct
                    const color = catColors[i % catColors.length]
                    return (
                      <circle
                        key={cat.category}
                        cx="30"
                        cy="30"
                        r={radius}
                        fill="none"
                        stroke={color}
                        strokeWidth="4"
                        strokeDasharray={strokeDash}
                        strokeDashoffset={strokeOffset}
                        strokeLinecap="butt"
                        style={{ transition: 'all 0.5s ease' }}
                      />
                    )
                  })}
                </svg>
                <div className="absolute flex flex-col items-center justify-center font-mono">
                  <span className="text-[10px] text-muted uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>TOTAL</span>
                  <span className="text-xs font-bold" style={{ color: 'var(--accent-red)' }}>{formatBDT(stats.summary.totalExpense)}</span>
                </div>
              </div>
            ) : (
              <div className="w-28 h-28 rounded-full border border-dashed border-border flex items-center justify-center font-mono text-[9px] text-muted" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                STABLE
              </div>
            )}

            <div className="flex-1 space-y-2 max-w-xs font-mono text-xs">
              {stats.expenseByCategory.map((cat, i) => {
                const color = catColors[i % catColors.length]
                const pct = stats.summary.totalExpense > 0 ? Math.round((cat.total / stats.summary.totalExpense) * 100) : 0
                return (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => toggleCat(cat.category)}>
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                      <span className="text-[10px] text-muted mr-1">{expandedCats.has(cat.category) ? '[-]' : '[+]'}</span>
                      <span className="flex-1 truncate" style={{ color: 'var(--text-secondary)' }}>{cat.category.toUpperCase()}</span>
                      <span className="font-bold text-accent-red" style={{ color: 'var(--accent-red)' }}>{pct}%</span>
                    </div>
                    {expandedCats.has(cat.category) && cat.subcategories.map(sub => (
                      <div key={sub.name} className="flex justify-between items-center pl-6 text-[10px] text-muted" style={{ color: 'var(--text-muted)' }}>
                        <span>/ {sub.name.toUpperCase()}</span>
                        <span>{formatBDT(sub.amount)}</span>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Feed */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4 font-mono">
          <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>TRANSACTION_LOGS_FEED</h3>
          <label className="flex items-center gap-2 text-[10px] text-muted cursor-pointer" style={{ color: 'var(--text-muted)' }}>
            <input type="checkbox" checked={showCorrections} onChange={() => setShowCorrections(!showCorrections)} className="accent-[var(--accent-cyan)] bg-transparent border border-border" />
            SHOW_INTERNAL_TRANSFERS
          </label>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr className="font-mono"><th>Date</th><th>Account</th><th>Category</th><th>Amount</th><th>Note</th></tr>
            </thead>
            <tbody>
              {txns.map(t => (
                <>
                  <tr key={t.id} className={`font-mono text-xs ${t.isBalanceCorrection ? 'opacity-40 italic' : ''}`}>
                    <td>{new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}</td>
                    <td>
                      <span className="badge text-[9px]" style={{ color: accColors[t.account] || 'var(--text-muted)', background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}>
                        {t.account}
                      </span>
                    </td>
                    <td>{t.isBalanceCorrection ? 'TRANSFER: ' : ''}{t.category.toUpperCase()}{t.subcategory ? ` / ${t.subcategory.toUpperCase()}` : ''}</td>
                    <td style={{ color: t.isIncome ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 700 }}>
                      {t.isIncome ? '+' : '-'}{formatBDT(t.amount)}
                    </td>
                    <td>
                      {t.note && (
                        <button className="btn btn-ghost py-0.5 px-2 text-[9px] font-mono" onClick={() => toggleNote(t.id)}>LOG_NOTE</button>
                      )}
                    </td>
                  </tr>
                  {expandedNotes.has(t.id) && t.note && (
                    <tr key={`${t.id}-note`}>
                      <td colSpan={5} className="!pt-0 !pb-3">
                        <div className="p-3 rounded text-[10px] font-mono leading-relaxed" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                          {t.note.toUpperCase()}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
        {txns.length === 0 && (
          <p className="font-mono text-xs text-center py-6" style={{ color: 'var(--text-muted)' }}>NO TRANSACTIONS LOGGED FOR CURRENT STAMP</p>
        )}
      </div>
    </div>
  )
}
