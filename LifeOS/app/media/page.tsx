'use client'

import { useEffect, useState } from 'react'
import MediaCollection from '@/components/MediaCollection'

interface Stats {
  totalEntries: number
  totalHours: number
  avgScore: number
  ongoing: number
  byType: { type: string; count: number }[]
}

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
  updatedAt: string
}

type Tab = 'ANIME' | 'MANGA' | 'GAMES' | 'MOVIES' | 'SERIES' | 'STATS'

export default function MediaPage() {
  const [activeTab, setActiveTab] = useState<Tab>('ANIME')
  const [stats, setStats] = useState<Stats | null>(null)
  const [ongoing, setOngoing] = useState<MediaEntry[]>([])
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    if (activeTab === 'STATS') {
      setLoadingStats(true)
      Promise.all([
        fetch('/api/entertainment/stats').then(r => r.json()),
        fetch('/api/entertainment/media?status=ONGOING&take=10').then(r => r.json()),
      ]).then(([s, m]) => {
        setStats(s)
        setOngoing(m.media || [])
        setLoadingStats(false)
      })
    }
  }, [activeTab])

  const subTabs = [
    { key: 'ANIME', label: 'Anime' },
    { key: 'MANGA', label: 'Manga' },
    { key: 'GAMES', label: 'Games' },
    { key: 'MOVIES', label: 'Movies' },
    { key: 'SERIES', label: 'Series' },
    { key: 'STATS', label: 'Analytics' },
  ]

  return (
    <div className="w-full space-y-6 max-w-full font-mono text-xs text-[var(--text-secondary)]">
      {/* Sub Tabs Selection Bar */}
      <div className="flex gap-2 p-1.5 rounded border border-white/5 bg-[#050508]/40 w-fit">
        {subTabs.map(t => (
          <button
            key={t.key}
            className="px-3 py-1.5 rounded font-bold uppercase transition-all"
            style={{
              background: activeTab === t.key ? 'var(--accent-purple)' : 'transparent',
              color: activeTab === t.key ? '#FFFFFF' : 'var(--text-muted)',
            }}
            onClick={() => setActiveTab(t.key as Tab)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Renders category view grids dynamically */}
      {activeTab === 'ANIME' && (
        <MediaCollection
          categoryKey="ANIME"
          title="anime series"
          types={['ANIME', 'ANIME_MOVIE']}
          statusLabels={[
            { key: 'ONGOING', label: 'watching' },
            { key: 'COMPLETED', label: 'completed' },
            { key: 'PLAN_TO_CONSUME', label: 'plan to watch' },
            { key: 'DROPPED', label: 'dropped' },
          ]}
        />
      )}

      {activeTab === 'MANGA' && (
        <MediaCollection
          categoryKey="MANGA"
          title="manga volumes"
          types={['MANGA']}
          statusLabels={[
            { key: 'ONGOING', label: 'reading' },
            { key: 'COMPLETED', label: 'completed' },
            { key: 'PLAN_TO_CONSUME', label: 'plan to read' },
            { key: 'DROPPED', label: 'dropped' },
          ]}
        />
      )}

      {activeTab === 'GAMES' && (
        <MediaCollection
          categoryKey="GAMES"
          title="video games"
          types={['PC_GAME', 'MOBILE_GAME']}
          statusLabels={[
            { key: 'ONGOING', label: 'playing' },
            { key: 'COMPLETED', label: 'completed' },
            { key: 'PLAN_TO_CONSUME', label: 'plan to play' },
            { key: 'DROPPED', label: 'dropped' },
          ]}
        />
      )}

      {activeTab === 'MOVIES' && (
        <MediaCollection
          categoryKey="MOVIES"
          title="movies"
          types={['MOVIE']}
          statusLabels={[
            { key: 'ONGOING', label: 'watching' },
            { key: 'COMPLETED', label: 'completed' },
            { key: 'PLAN_TO_CONSUME', label: 'plan to watch' },
            { key: 'DROPPED', label: 'dropped' },
          ]}
        />
      )}

      {activeTab === 'SERIES' && (
        <MediaCollection
          categoryKey="SERIES"
          title="tv series"
          types={['SERIES']}
          statusLabels={[
            { key: 'ONGOING', label: 'watching' },
            { key: 'COMPLETED', label: 'completed' },
            { key: 'PLAN_TO_CONSUME', label: 'plan to watch' },
            { key: 'DROPPED', label: 'dropped' },
          ]}
        />
      )}

      {/* Analytics view layout */}
      {activeTab === 'STATS' && (
        <>
          {loadingStats ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-32 rounded" />)}
            </div>
          ) : (
            stats && (
              <div className="space-y-6">
                <div className="border p-6 bg-black" style={{ borderColor: 'var(--border)' }}>
                  <h3 className="font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>
                    MEDIA_ANALYTICS_METRICS
                  </h3>
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-xl font-bold text-accent-pink">{stats.totalEntries}</p>
                      <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>TOTAL_ENTRIES</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-accent-pink">{stats.totalHours}</p>
                      <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>ELAPSED_HOURS</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-accent-amber">{stats.avgScore.toFixed(2)}</p>
                      <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>MEAN_SCORE</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-accent-purple">{stats.ongoing}</p>
                      <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>ACTIVE_STREAMS</p>
                    </div>
                  </div>
                </div>

                {/* Currently Consuming */}
                <div className="border p-6 bg-black" style={{ borderColor: 'var(--border)' }}>
                  <h3 className="font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--text-muted)' }}>
                    CURRENTLY_CONSUMING_LOGS
                  </h3>
                  {ongoing.length === 0 ? (
                    <p className="text-center py-6 text-muted-foreground" style={{ color: 'var(--text-muted)' }}>
                      NO ACTIVE SESSIONS.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {ongoing.map(m => (
                        <div key={m.id} className="flex items-center gap-4 py-2 border-b border-white/5">
                          {m.coverUrl ? (
                            <img src={m.coverUrl} alt={m.title} className="w-8 h-12 object-cover shrink-0 filter brightness-90" />
                          ) : (
                            <div className="w-8 h-12 shrink-0 bg-tertiary" style={{ background: 'var(--bg-tertiary)' }} />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold truncate text-white">{m.title.toUpperCase()}</p>
                            <p style={{ color: 'var(--text-muted)' }}>
                              PROGRESS: {m.progressCurrent}{m.progressTotal ? ` / ${m.progressTotal}` : ''} {m.progressUnit?.toUpperCase()}
                            </p>
                          </div>
                          <span className="px-2 py-0.5 border text-[9px] uppercase" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                            {m.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          )}
        </>
      )}
    </div>
  )
}
