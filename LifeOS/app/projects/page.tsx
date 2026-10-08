'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Project {
  id: string; name: string; description: string | null; status: string; priority: string
  progress: number; techStack: string | null; githubUrl: string | null
  startedAt: string | null; completedAt: string | null; updatedAt: string
  errors: { id: string; title: string; severity: string; status: string }[]
}

type View = 'gallery' | 'board'

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
  PLANNED:     { color: 'var(--accent-blue)',   bg: 'rgba(96,165,250,0.06)',  label: 'Planned' },
  IN_PROGRESS: { color: 'var(--accent-cyan)',   bg: 'rgba(0,229,255,0.06)',   label: 'In Progress' },
  PAUSED:      { color: 'var(--accent-amber)',  bg: 'rgba(255,176,0,0.06)',   label: 'Paused' },
  COMPLETED:   { color: 'var(--accent-green)',  bg: 'rgba(57,255,20,0.06)',   label: 'Completed' },
  ARCHIVED:    { color: 'var(--text-muted)',    bg: 'rgba(82,82,107,0.1)',    label: 'Archived' },
}

const boardColumns = ['PLANNED', 'IN_PROGRESS', 'PAUSED', 'COMPLETED']

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<View>('gallery')
  const [showAdd, setShowAdd] = useState(false)
  const [newProject, setNewProject] = useState({ name: '', description: '', priority: 'P2', techStack: '' })

  useEffect(() => {
    fetch('/api/projects').then(r => r.json()).then(p => { setProjects(p); setLoading(false) })
  }, [])

  const addProject = async () => {
    const body: Record<string, unknown> = {
      name: newProject.name,
      description: newProject.description || null,
      priority: newProject.priority,
    }
    if (newProject.techStack) body.techStack = JSON.stringify(newProject.techStack.split(',').map(s => s.trim()))
    
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const p = await res.json()
    setProjects(prev => [p, ...prev])
    setShowAdd(false)
    setNewProject({ name: '', description: '', priority: 'P2', techStack: '' })
  }

  const timeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime()
    const hrs = Math.floor(diff / 3600000)
    if (hrs < 24) return `${hrs}H AGO`
    const days = Math.floor(hrs / 24)
    return days === 1 ? '1 DAY AGO' : `${days} DAYS AGO`
  }

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('projectId', id)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent, status: string) => {
    const id = e.dataTransfer.getData('projectId')
    if (!id) return

    // Optimistically update the UI status
    setProjects(prev => prev.map(p => p.id === id ? { ...p, status } : p))

    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        throw new Error('Failed to update status')
      }
    } catch (err) {
      alert('Failed to update status on the database.')
      // Refresh list to revert
      fetch('/api/projects').then(r => r.json()).then(setProjects)
    }
  }

  if (loading) return <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-48 rounded-xl" />)}</div>

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-display text-xl uppercase tracking-wider font-mono">SYS://PROJECTS_ARCHIVE</h1>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 p-1 rounded" style={{ background: 'var(--bg-tertiary)' }}>
            {(['gallery', 'board'] as View[]).map(v => (
              <button key={v} className={`px-3 py-1 rounded text-[10px] font-mono font-bold uppercase transition-all ${view === v ? 'text-black bg-accent-cyan' : 'text-muted'}`}
                style={{ 
                  backgroundColor: view === v ? 'var(--accent-cyan)' : 'transparent',
                  color: view === v ? '#000000' : 'var(--text-muted)'
                }}
                onClick={() => setView(v)}>{v}</button>
            ))}
          </div>
          <button className="btn btn-primary text-xs" onClick={() => setShowAdd(true)}>+ NEW PROJECT</button>
        </div>
      </div>

      {/* Gallery View */}
      {view === 'gallery' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(p => {
            const sc = statusConfig[p.status] || statusConfig.PLANNED
            const techs: string[] = p.techStack ? JSON.parse(p.techStack) : []
            return (
              <Link key={p.id} href={`/projects/${p.id}`} className="block">
                <div className="glass-card p-6 cursor-pointer group cyber-cyan h-full flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-mono font-bold truncate max-w-[150px]" style={{ color: 'var(--text-primary)' }}>{p.name.toUpperCase()}</h3>
                      <div className="flex gap-1.5">
                        <span className="badge" style={{ color: sc.color, background: sc.bg, border: `1px solid ${sc.color}25` }}>{sc.label.toUpperCase()}</span>
                        <span className="badge" style={{ color: 'var(--text-muted)', background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}>{p.priority}</span>
                      </div>
                    </div>
                    {p.description && (
                      <p className="font-mono text-xs mb-4 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{p.description}</p>
                    )}
                  </div>
                  <div>
                    <div className="mb-3 font-mono text-[10px]">
                      <div className="flex justify-between mb-1">
                        <span style={{ color: 'var(--text-muted)' }}>COMPILATION_PROGRESS</span>
                        <span style={{ color: sc.color }}>{p.progress}%</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-bar-fill" style={{ width: `${p.progress}%`, background: sc.color }} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between font-mono text-[9px]">
                      <div className="flex flex-wrap gap-1">
                        {techs.slice(0, 2).map(t => (
                          <span key={t} className="px-2 py-0.5 rounded" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>{t.toUpperCase()}</span>
                        ))}
                        {techs.length > 2 && <span style={{ color: 'var(--text-muted)' }}>+{techs.length - 2}</span>}
                      </div>
                      <span style={{ color: 'var(--text-muted)' }}>UPDATED: {timeAgo(p.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Board View (Kanban) */}
      {view === 'board' && (
        <div className="grid grid-cols-4 gap-4 min-w-[800px] overflow-x-auto">
          {boardColumns.map(col => {
            const sc = statusConfig[col]
            const colProjects = projects.filter(p => p.status === col)
            return (
              <div 
                key={col} 
                className="font-mono p-2.5 rounded border border-dashed transition-all"
                style={{ 
                  borderColor: 'var(--border)', 
                  background: 'rgba(8,8,12,0.4)' 
                }}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col)}
              >
                <div className="flex items-center justify-between mb-3 pb-2 border-b-2" style={{ borderColor: sc.color }}>
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: sc.color }}>{sc.label}</span>
                  <span className="text-[9px] px-1.5 rounded" style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.color}25` }}>{colProjects.length}</span>
                </div>
                <div className="space-y-2 min-h-[300px]">
                  {colProjects.map(p => (
                    <div 
                      key={p.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, p.id)}
                      className="glass-card p-4 cursor-grab active:cursor-grabbing hover:border-accent-cyan hover:shadow-[0_0_10px_rgba(0,229,255,0.05)] transition-all"
                      style={{ borderRadius: '8px' }}
                    >
                      <Link href={`/projects/${p.id}`} className="font-bold mb-1.5 block hover:text-accent-cyan hover:underline truncate">
                        {p.name.toUpperCase()}
                      </Link>
                      <div className="progress-bar mb-1.5">
                        <div className="progress-bar-fill" style={{ width: `${p.progress}%`, background: sc.color }} />
                      </div>
                      <p className="text-[9px] text-muted-foreground" style={{ color: 'var(--text-muted)' }}>{p.progress}% COMPLETE</p>
                    </div>
                  ))}
                  {colProjects.length === 0 && (
                    <div className="flex items-center justify-center py-12 text-[10px] text-muted" style={{ color: 'var(--text-muted)' }}>
                      DRAG_HERE
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-panel animate-scale" onClick={e => e.stopPropagation()}>
            <h3 className="font-mono text-sm font-bold mb-6" style={{ color: 'var(--text-primary)' }}>CREATE_PROJECT_REGISTRY</h3>
            <div className="space-y-4">
              <div><label className="label">Name</label><input className="input" value={newProject.name} onChange={e => setNewProject({ ...newProject, name: e.target.value })} /></div>
              <div><label className="label">Description</label><textarea className="input" rows={3} value={newProject.description} onChange={e => setNewProject({ ...newProject, description: e.target.value })} /></div>
              <div><label className="label">Priority</label>
                <select className="input" value={newProject.priority} onChange={e => setNewProject({ ...newProject, priority: e.target.value })}>
                  <option value="P0">P0</option><option value="P1">P1</option><option value="P2">P2</option><option value="P3">P3</option>
                </select>
              </div>
              <div><label className="label">Tech Stack (comma-separated)</label><input className="input" value={newProject.techStack} onChange={e => setNewProject({ ...newProject, techStack: e.target.value })} placeholder="Rust, React, MySQL" /></div>
              <div className="flex gap-3 justify-end pt-2">
                <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={addProject} disabled={!newProject.name}>Confirm</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
