'use client'

import { useEffect, useState } from 'react'

interface MediaEntry {
  id: string
  title: string
  type: string
  status: string
  score: number | null
  progressCurrent: number | null
  progressTotal: number | null
  progressUnit: string
  coverUrl: string | null
  watchtime: number | null
}

interface MediaCollectionProps {
  categoryKey: string // 'ANIME' | 'MANGA' | 'PC_GAME' | 'MOVIE' | 'SERIES'
  title: string // e.g. 'ANIME SERIES'
  types: string[] // e.g. ['ANIME', 'ANIME_MOVIE']
  statusLabels: { key: string; label: string }[]
}

export default function MediaCollection({ categoryKey, title, types, statusLabels }: MediaCollectionProps) {
  const [items, setItems] = useState<MediaEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newEntry, setNewEntry] = useState({ title: '', status: 'PLAN_TO_CONSUME', score: '', progressCurrent: '', progressTotal: '', coverUrl: '' })

  const fetchItems = () => {
    setLoading(true)
    const typeParams = types.map(t => `type=${t}`).join('&')
    fetch(`/api/entertainment/media?${typeParams}`)
      .then(r => r.json())
      .then(d => {
        setItems(d.media || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchItems()
  }, [categoryKey])

  const handleCreate = async () => {
    const defaultType = types[0]
    const defaultUnit = categoryKey === 'ANIME' || categoryKey === 'SERIES' ? 'EPISODES' : categoryKey === 'MANGA' ? 'CHAPTERS' : 'HOURS'
    const body: Record<string, any> = {
      title: newEntry.title,
      type: defaultType,
      status: newEntry.status,
      progressUnit: defaultUnit,
    }
    if (newEntry.score) body.score = parseFloat(newEntry.score)
    if (newEntry.progressCurrent) body.progressCurrent = parseInt(newEntry.progressCurrent)
    if (newEntry.progressTotal) body.progressTotal = parseInt(newEntry.progressTotal)
    if (newEntry.coverUrl) body.coverUrl = newEntry.coverUrl

    await fetch('/api/entertainment/media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    setShowAdd(false)
    setNewEntry({ title: '', status: 'PLAN_TO_CONSUME', score: '', progressCurrent: '', progressTotal: '', coverUrl: '' })
    fetchItems()
  }

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesFilter = filter === 'ALL' || item.status === filter
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-10 w-48" style={{ borderRadius: '4px' }} />
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="skeleton aspect-[2/3]" style={{ borderRadius: '4px' }} />)}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full space-y-5 font-mono text-xs">
      {/* Heading Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2 text-white">
          <span className="text-accent-purple">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </span>
          <span className="font-bold text-sm tracking-wider">ALL {title.toUpperCase()}</span>
          <span className="text-[10px] text-muted-foreground" style={{ color: 'var(--text-muted)' }}>{filteredItems.length} results</span>
        </div>

        {/* Controls Option list */}
        <div className="flex items-center gap-4 text-white/50 text-[10px]">
          <button className="flex items-center gap-1 hover:text-white transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>
            Sort
          </button>
          <button className="flex items-center gap-1 hover:text-white transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
            Filter
          </button>
          <button className="flex items-center gap-1 hover:text-white transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
            Properties
          </button>
          <div className="flex items-center gap-1.5 border border-white/10 px-2 py-0.5 rounded bg-black/40">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-white text-[10px] w-20"
            />
          </div>
          <button className="flex items-center gap-1 hover:text-white transition-colors" onClick={() => setShowAdd(true)}>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            New
          </button>
        </div>
      </div>

      {/* Filter pills bar */}
      <div className="flex gap-1.5 pb-2 border-b border-white/5">
        <button
          className="px-2.5 py-1 text-[9px] font-bold rounded tracking-wider uppercase transition-colors"
          style={{
            background: filter === 'ALL' ? 'var(--accent-purple)' : 'rgba(255,255,255,0.02)',
            color: filter === 'ALL' ? '#FFFFFF' : 'var(--text-secondary)',
          }}
          onClick={() => setFilter('ALL')}
        >
          ALL
        </button>
        {statusLabels.map((lbl) => (
          <button
            key={lbl.key}
            className="px-2.5 py-1 text-[9px] font-bold rounded tracking-wider uppercase transition-colors"
            style={{
              background: filter === lbl.key ? 'var(--accent-purple)' : 'rgba(255,255,255,0.02)',
              color: filter === lbl.key ? '#FFFFFF' : 'var(--text-secondary)',
            }}
            onClick={() => setFilter(lbl.key)}
          >
            {lbl.label}
          </button>
        ))}
      </div>

      {/* Grid of Posters: 8 columns on large screens */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-x-4 gap-y-6">
        {filteredItems.map((item) => (
          <div key={item.id} className="group relative flex flex-col gap-2">
            <div className="aspect-[2/3] w-full overflow-hidden border border-white/10 hover:border-white/40 transition-colors bg-[#08080c] relative">
              {item.coverUrl ? (
                <img
                  src={item.coverUrl}
                  alt={item.title}
                  className="w-full h-full object-cover filter brightness-90 group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground" style={{ color: 'var(--text-muted)' }}>
                  NO_COVER
                </div>
              )}
              {/* Optional Score label top right */}
              {item.score !== null && (
                <span className="absolute top-1.5 right-1.5 px-1.5 py-0.5 text-[8px] bg-black/85 text-accent-amber border border-accent-amber/20 font-bold">
                  {item.score}
                </span>
              )}
            </div>
            <div className="leading-snug min-w-0">
              <p className="font-bold text-white truncate text-[10px]" title={item.title}>
                {item.title}
              </p>
              <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
                {item.progressCurrent !== null ? `${item.progressCurrent}${item.progressTotal ? `/${item.progressTotal}` : ''}` : 'Pending'}
              </p>
            </div>
          </div>
        ))}
        {filteredItems.length === 0 && (
          <p className="col-span-full text-center py-16 text-muted-foreground" style={{ color: 'var(--text-muted)' }}>
            NO ITEMS FOUND MATCHING FILTERS.
          </p>
        )}
      </div>

      {/* Create Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-panel animate-scale" onClick={e => e.stopPropagation()}>
            <h3 className="font-mono text-sm font-bold mb-6 text-white">ADD NEW {title} ENTRY</h3>
            <div className="space-y-4 text-xs font-mono">
              <div>
                <label className="label">Title</label>
                <input className="input" value={newEntry.title} onChange={e => setNewEntry({ ...newEntry, title: e.target.value })} />
              </div>
              <div>
                <label className="label">Cover Image URL</label>
                <input className="input" placeholder="https://example.com/cover.jpg" value={newEntry.coverUrl} onChange={e => setNewEntry({ ...newEntry, coverUrl: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Status</label>
                  <select className="input text-white" value={newEntry.status} onChange={e => setNewEntry({ ...newEntry, status: e.target.value })}>
                    <option value="PLAN_TO_CONSUME">PLAN TO CONSUME</option>
                    <option value="ONGOING">ONGOING</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="ON_HOLD">ON HOLD</option>
                    <option value="DROPPED">DROPPED</option>
                  </select>
                </div>
                <div>
                  <label className="label">Score (0-10)</label>
                  <input className="input" type="number" step="0.5" max="10" placeholder="Optional" value={newEntry.score} onChange={e => setNewEntry({ ...newEntry, score: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Current Progress</label>
                  <input className="input" type="number" placeholder="Optional" value={newEntry.progressCurrent} onChange={e => setNewEntry({ ...newEntry, progressCurrent: e.target.value })} />
                </div>
                <div>
                  <label className="label">Total Progress</label>
                  <input className="input" type="number" placeholder="Optional" value={newEntry.progressTotal} onChange={e => setNewEntry({ ...newEntry, progressTotal: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleCreate} disabled={!newEntry.title}>Confirm</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
