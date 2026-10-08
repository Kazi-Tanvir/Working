'use client'

import { useEffect, useState } from 'react'

interface MediaEntry {
  id: string; title: string; type: string; status: string; score: number | null
  progressCurrent: number | null; progressTotal: number | null; progressUnit: string
  season: string | null; coverUrl: string | null; startedAt: string | null
  completedAt: string | null; watchtime: number | null; notes: string | null
}
interface Stats {
  totalEntries: number; totalHours: number; avgScore: number; ongoing: number
  byType: { type: string; count: number }[]
  byStatus: { status: string; count: number }[]
}

const statusFilters = [
  { key: 'all', label: 'All' },
  { key: 'ONGOING', label: 'Ongoing' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'PLAN_TO_CONSUME', label: 'Plan to Watch' },
  { key: 'ON_HOLD', label: 'On Hold' },
  { key: 'DROPPED', label: 'Dropped' },
]
const typeFilters = [
  { key: 'all', label: 'All' }, { key: 'ANIME', label: 'Anime' }, { key: 'ANIME_MOVIE', label: 'Anime Movies' },
  { key: 'SERIES', label: 'Series' }, { key: 'MOVIE', label: 'Movies' }, { key: 'MANGA', label: 'Manga' },
  { key: 'PC_GAME', label: 'PC Games' }, { key: 'MOBILE_GAME', label: 'Mobile Games' },
]
const statusStyles: Record<string, { color: string; bg: string; label: string }> = {
  ONGOING: { color: 'var(--accent-purple)', bg: 'rgba(217, 70, 239, 0.05)', label: 'Ongoing' },
  COMPLETED: { color: 'var(--accent-green)', bg: 'rgba(57, 255, 20, 0.05)', label: 'Completed' },
  PLAN_TO_CONSUME: { color: 'var(--accent-blue)', bg: 'rgba(59, 130, 246, 0.05)', label: 'Planned' },
  ON_HOLD: { color: 'var(--text-secondary)', bg: 'rgba(158, 158, 174, 0.05)', label: 'On Hold' },
  DROPPED: { color: 'var(--accent-red)', bg: 'rgba(255, 0, 85, 0.05)', label: 'Dropped' },
}

export default function EntertainmentPage() {
  const [media, setMedia] = useState<MediaEntry[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selectedMedia, setSelectedMedia] = useState<MediaEntry | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newEntry, setNewEntry] = useState({ title: '', type: 'ANIME', status: 'PLAN_TO_CONSUME', score: '', progressCurrent: '', progressTotal: '', progressUnit: 'EPISODES' })

  const fetchMedia = () => {
    const params = new URLSearchParams()
    if (statusFilter !== 'all') params.set('status', statusFilter)
    if (typeFilter !== 'all') params.set('type', typeFilter)
    fetch(`/api/entertainment/media?${params}`).then(r => r.json()).then(d => setMedia(d.media || []))
  }

  useEffect(() => {
    Promise.all([
      fetch('/api/entertainment/stats').then(r => r.json()),
      fetch('/api/entertainment/media').then(r => r.json()),
    ]).then(([s, m]) => {
      setStats(s)
      setMedia(m.media || [])
      setLoading(false)
    })
  }, [])

  useEffect(() => { if (!loading) fetchMedia() }, [statusFilter, typeFilter])

  const addEntry = async () => {
    const body: Record<string, unknown> = {
      title: newEntry.title,
      type: newEntry.type,
      status: newEntry.status,
      progressUnit: newEntry.progressUnit,
    }
    if (newEntry.score) body.score = parseFloat(newEntry.score)
    if (newEntry.progressCurrent) body.progressCurrent = parseInt(newEntry.progressCurrent)
    if (newEntry.progressTotal) body.progressTotal = parseInt(newEntry.progressTotal)

    await fetch('/api/entertainment/media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setShowAdd(false)
    setNewEntry({ title: '', type: 'ANIME', status: 'PLAN_TO_CONSUME', score: '', progressCurrent: '', progressTotal: '', progressUnit: 'EPISODES' })
    fetchMedia()
    fetch('/api/entertainment/stats').then(r => r.json()).then(setStats)
  }

  if (loading) return <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-36 rounded-xl" />)}</div>

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-display text-xl uppercase tracking-wider font-mono">SYS://ENTERTAINMENT_DATABASE</h1>
        </div>
        <button className="btn btn-primary text-xs" onClick={() => setShowAdd(true)}>+ ADD ENTRY</button>
      </div>

      {/* Stats Bar */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { tag: 'TOT', value: stats.totalEntries, label: 'TOTAL_ENTRIES' },
            { tag: 'HRS', value: stats.totalHours.toLocaleString(), label: 'HOURS_WATCHED' },
            { tag: 'SCR', value: stats.avgScore.toFixed(1), label: 'AVG_SCORE' },
            { tag: 'ONG', value: stats.ongoing, label: 'ONGOING_STREAMS' },
          ].map((s, i) => (
            <div key={i} className="glass-card p-4 text-center cyber-magenta">
              <span className="font-mono text-[8px] font-bold text-muted" style={{ color: 'var(--text-muted)' }}>{s.tag}</span>
              <p className="text-stat text-xl mt-1" style={{ color: 'var(--accent-purple)' }}>{s.value}</p>
              <p className="font-mono text-[9px] uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Status Filter */}
      <div className="flex flex-wrap gap-2">
        {statusFilters.map(f => (
          <button key={f.key} className={`btn btn-pill text-xs ${statusFilter === f.key ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setStatusFilter(f.key)}>
            {f.label.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Type Filter */}
      <div className="flex flex-wrap gap-2">
        {typeFilters.map(f => (
          <button key={f.key} className={`btn btn-pill text-xs ${typeFilter === f.key ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setTypeFilter(f.key)}>
            {f.label.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Media Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {media.map(m => {
          const st = statusStyles[m.status] || statusStyles.COMPLETED
          return (
            <div key={m.id} className="glass-card overflow-hidden cursor-pointer group cyber-magenta" onClick={() => setSelectedMedia(m)}>
              <div className="aspect-[2/3] relative overflow-hidden">
                {m.coverUrl ? (
                  <img src={m.coverUrl} alt={m.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 filter brightness-90 contrast-105" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-mono text-[10px] font-bold" style={{ background: 'var(--bg-tertiary)' }}>M_FILE</div>
                )}
                {m.score && (
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded text-[8px] font-mono font-bold"
                    style={{ background: 'rgba(0,0,0,0.85)', color: 'var(--accent-amber)', border: '1px solid rgba(255,176,0,0.3)' }}>
                    SCORE: {m.score}
                  </span>
                )}
              </div>
              <div className="p-3">
                <p className="font-mono text-xs font-semibold truncate mb-1" style={{ color: 'var(--text-primary)' }}>{m.title.toUpperCase()}</p>
                <div className="flex items-center gap-1 mb-1">
                  <span className="badge text-[9px]" style={{ color: st.color, background: st.bg, border: `1px solid ${st.color}25` }}>{st.label.toUpperCase()}</span>
                </div>
                <p className="font-mono text-[9px]" style={{ color: 'var(--text-secondary)' }}>
                  {m.progressCurrent ? `${m.progressUnit === 'EPISODES' ? 'EP' : m.progressUnit === 'CHAPTERS' ? 'CH' : ''} ${m.progressCurrent}${m.progressTotal ? `/${m.progressTotal}` : ''}` : 'PENDING'}
                  <span className="text-muted-foreground" style={{ color: 'var(--text-muted)' }}> · {m.type.replace(/_/g, ' ')}</span>
                </p>
              </div>
            </div>
          )
        })}
        {media.length === 0 && (
          <p className="col-span-full text-center py-16 font-mono text-xs text-muted" style={{ color: 'var(--text-muted)' }}>
            NO MEDIA STREAMS MATCHING FILTERS.
          </p>
        )}
      </div>

      {/* Stats Breakdown */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass-card p-6">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>MEDIA_BY_TYPE</h3>
            {stats.byType.map(t => {
              const pct = stats.totalEntries > 0 ? Math.round((t.count / stats.totalEntries) * 100) : 0
              return (
                <div key={t.type} className="flex items-center gap-3 mb-2.5 font-mono text-xs">
                  <span className="w-28 truncate text-muted-foreground capitalize" style={{ color: 'var(--text-secondary)' }}>{t.type.replace(/_/g, ' ').toLowerCase()}</span>
                  <div className="flex-1 h-2 rounded overflow-hidden bg-tertiary" style={{ background: 'var(--bg-tertiary)' }}>
                    <div className="h-full rounded" style={{ width: `${pct}%`, background: 'var(--accent-purple)' }} />
                  </div>
                  <span className="w-8 text-right text-muted-foreground" style={{ color: 'var(--text-muted)' }}>{t.count}</span>
                </div>
              )
            })}
          </div>
          <div className="glass-card p-6">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>MEDIA_BY_STATUS</h3>
            {stats.byStatus.map(s => {
              const pct = stats.totalEntries > 0 ? Math.round((s.count / stats.totalEntries) * 100) : 0
              const st = statusStyles[s.status] || statusStyles.COMPLETED
              return (
                <div key={s.status} className="flex items-center gap-3 mb-2.5 font-mono text-xs">
                  <span className="w-28 truncate" style={{ color: st.color }}>{st.label.toUpperCase()}</span>
                  <div className="flex-1 h-2 rounded overflow-hidden bg-tertiary" style={{ background: 'var(--bg-tertiary)' }}>
                    <div className="h-full rounded" style={{ width: `${pct}%`, background: st.color }} />
                  </div>
                  <span className="w-8 text-right text-muted-foreground" style={{ color: 'var(--text-muted)' }}>{s.count}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedMedia && (
        <div className="modal-overlay" onClick={() => setSelectedMedia(null)}>
          <div className="modal-panel max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex gap-4">
              {selectedMedia.coverUrl ? (
                <img src={selectedMedia.coverUrl} alt={selectedMedia.title} className="w-24 h-36 rounded object-cover shrink-0 filter brightness-90 contrast-105" />
              ) : (
                <div className="w-24 h-36 rounded flex items-center justify-center font-mono text-xs font-bold shrink-0" style={{ background: 'var(--bg-tertiary)' }}>M_FILE</div>
              )}
              <div className="font-mono text-xs">
                <h3 className="text-sm font-bold mb-1.5" style={{ color: 'var(--text-primary)' }}>{selectedMedia.title.toUpperCase()}</h3>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <span className="badge text-[9px]" style={{ ...statusStyles[selectedMedia.status] ? { color: statusStyles[selectedMedia.status].color, background: statusStyles[selectedMedia.status].bg, border: `1px solid ${statusStyles[selectedMedia.status].color}25` } : {} }}>
                    {statusStyles[selectedMedia.status]?.label.toUpperCase() || selectedMedia.status}
                  </span>
                  <span className="badge text-[9px] capitalize" style={{ color: 'var(--text-muted)', background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}>{selectedMedia.type.replace(/_/g, ' ').toLowerCase()}</span>
                </div>
                {selectedMedia.score && <p className="text-xs mb-1.5" style={{ color: 'var(--accent-amber)' }}>SCORE: {selectedMedia.score} / 10</p>}
                {selectedMedia.progressCurrent && (
                  <div className="mb-2">
                    <p className="text-[10px] mb-1" style={{ color: 'var(--text-muted)' }}>
                      PROGRESS: {selectedMedia.progressCurrent}{selectedMedia.progressTotal ? ` / ${selectedMedia.progressTotal}` : ''}
                    </p>
                    {selectedMedia.progressTotal && (
                      <div className="progress-bar">
                        <div className="progress-bar-fill" style={{ width: `${Math.round((selectedMedia.progressCurrent / selectedMedia.progressTotal) * 100)}%`, background: 'var(--accent-purple)' }} />
                      </div>
                    )}
                  </div>
                )}
                {selectedMedia.watchtime && <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>ELAPSED: {Math.round(selectedMedia.watchtime / 60)}H</p>}
              </div>
            </div>
            {selectedMedia.notes && (
              <div className="mt-4 p-3 rounded font-mono text-[10px]" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}>
                <p className="font-bold mb-1" style={{ color: 'var(--text-muted)' }}>LOG_NOTES</p>
                <p style={{ color: 'var(--text-secondary)' }}>{selectedMedia.notes.toUpperCase()}</p>
              </div>
            )}
            <div className="flex justify-end mt-4">
              <button className="btn btn-ghost text-xs" onClick={() => setSelectedMedia(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-panel animate-scale" onClick={e => e.stopPropagation()}>
            <h3 className="font-mono text-sm font-bold mb-6" style={{ color: 'var(--text-primary)' }}>ADD_MEDIA_RECORD</h3>
            <div className="space-y-4">
              <div><label className="label">Title</label><input className="input" value={newEntry.title} onChange={e => setNewEntry({ ...newEntry, title: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="label">Type</label>
                  <select className="input" value={newEntry.type} onChange={e => setNewEntry({ ...newEntry, type: e.target.value })}>
                    {typeFilters.filter(f => f.key !== 'all').map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                  </select>
                </div>
                <div><label className="label">Status</label>
                  <select className="input" value={newEntry.status} onChange={e => setNewEntry({ ...newEntry, status: e.target.value })}>
                    {statusFilters.filter(f => f.key !== 'all').map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="label">Progress</label><input className="input" type="number" value={newEntry.progressCurrent} onChange={e => setNewEntry({ ...newEntry, progressCurrent: e.target.value })} placeholder="Current" /></div>
                <div><label className="label">Total</label><input className="input" type="number" value={newEntry.progressTotal} onChange={e => setNewEntry({ ...newEntry, progressTotal: e.target.value })} placeholder="Total" /></div>
                <div><label className="label">Score</label><input className="input" type="number" step="0.5" max="10" value={newEntry.score} onChange={e => setNewEntry({ ...newEntry, score: e.target.value })} placeholder="0-10" /></div>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={addEntry} disabled={!newEntry.title}>Confirm</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
