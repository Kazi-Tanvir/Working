'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface ProjectError { id: string; title: string; description: string | null; severity: string; status: string; resolution: string | null; createdAt: string; resolvedAt: string | null }
interface Project {
  id: string; name: string; description: string | null; status: string; priority: string
  progress: number; techStack: string | null; githubUrl: string | null
  startedAt: string | null; completedAt: string | null; prd: string | null
  documentation: string | null; errors: ProjectError[]
}

const sevColors: Record<string, string> = { LOW: 'var(--accent-blue)', MEDIUM: 'var(--accent-amber)', HIGH: 'var(--accent-red)', CRITICAL: '#FF0055' }
const errStatusColors: Record<string, string> = { OPEN: 'var(--accent-red)', INVESTIGATING: 'var(--accent-amber)', RESOLVED: 'var(--accent-green)' }

export default function ProjectDetailPage() {
  const params = useParams()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'overview' | 'prd' | 'docs' | 'errors'>('overview')

  useEffect(() => {
    fetch(`/api/projects/${params.id}`).then(r => r.json()).then(p => { setProject(p); setLoading(false) })
  }, [params.id])

  if (loading) return <div className="space-y-4"><div className="skeleton h-16 rounded-xl" /><div className="skeleton h-96 rounded-xl" /></div>
  if (!project) return <p className="font-mono text-xs text-muted" style={{ color: 'var(--text-muted)' }}>SYS_ERR: PROJECT_NOT_FOUND_IN_ARCHIVE</p>

  const techs: string[] = project.techStack ? JSON.parse(project.techStack) : []

  return (
    <div className="w-full space-y-6">
      <Link href="/projects" className="font-mono text-[10px] uppercase tracking-wider flex items-center gap-1 transition-colors hover:text-[var(--text-primary)]" style={{ color: 'var(--text-muted)' }}>
        &lt;= RETURN_TO_ARCHIVE
      </Link>

      <div className="glass-card p-6 cyber-cyan">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-display text-xl font-mono uppercase tracking-wide">{project.name.toUpperCase()}</h1>
          </div>
          <div className="flex gap-2">
            <span className="badge" style={{ color: 'var(--accent-cyan)', background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.2)' }}>{project.status.replace(/_/g, ' ')}</span>
            <span className="badge" style={{ color: 'var(--text-muted)', background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}>{project.priority}</span>
          </div>
        </div>
        <div className="mb-2 flex justify-between font-mono text-[10px]">
          <span style={{ color: 'var(--text-muted)' }}>PROGRESS_STABILITY</span>
          <span style={{ color: 'var(--accent-cyan)' }}>{project.progress}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${project.progress}%`, background: 'var(--accent-cyan)' }} />
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-nav">
        {(['overview', 'prd', 'docs', 'errors'] as const).map(t => (
          <button key={t} className={`tab-item ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'overview' ? 'Overview' : t === 'prd' ? 'PRD' : t === 'docs' ? 'Docs' : `Errors (${project.errors.length})`}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="glass-card p-6 space-y-4 font-mono text-xs">
          {project.description && (
            <div>
              <p className="label">Description</p>
              <p style={{ color: 'var(--text-secondary)' }}>{project.description.toUpperCase()}</p>
            </div>
          )}
          {techs.length > 0 && (
            <div>
              <p className="label">Tech Stack</p>
              <div className="flex flex-wrap gap-2">
                {techs.map(t => <span key={t} className="badge text-[10px]" style={{ color: 'var(--accent-cyan)', background: 'rgba(0,229,255,0.05)', border: '1px solid rgba(0,229,255,0.2)' }}>{t.toUpperCase()}</span>)}
              </div>
            </div>
          )}
          {project.githubUrl && (
            <div>
              <p className="label">GitHub Repository</p>
              <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-white" style={{ color: 'var(--accent-blue)' }}>
                {project.githubUrl.toUpperCase()}
              </a>
            </div>
          )}
          {project.startedAt && (
            <div>
              <p className="label">Initialization Date</p>
              <p style={{ color: 'var(--text-secondary)' }}>{new Date(project.startedAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()}</p>
            </div>
          )}
        </div>
      )}

      {tab === 'prd' && (
        <div className="glass-card p-6 font-mono text-xs">
          {project.prd ? (
            <div className="text-sm max-w-none" style={{ color: 'var(--text-secondary)' }}>
              <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed" style={{ background: 'transparent', padding: 0, color: 'var(--text-secondary)' }}>{project.prd}</pre>
            </div>
          ) : (
            <p className="text-center py-8 text-muted" style={{ color: 'var(--text-muted)' }}>NO_PRD_DOCUMENT_FOUND</p>
          )}
        </div>
      )}

      {tab === 'docs' && (
        <div className="glass-card p-6 font-mono text-xs">
          {project.documentation ? (
            <div className="text-sm max-w-none" style={{ color: 'var(--text-secondary)' }}>
              <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed" style={{ background: 'transparent', padding: 0, color: 'var(--text-secondary)' }}>{project.documentation}</pre>
            </div>
          ) : (
            <p className="text-center py-8 text-muted" style={{ color: 'var(--text-muted)' }}>NO_DOCUMENTATION_FOUND</p>
          )}
        </div>
      )}

      {tab === 'errors' && (
        <div className="glass-card p-6 space-y-3 font-mono text-xs">
          {project.errors.length === 0 ? (
            <p className="text-center py-8 text-muted" style={{ color: 'var(--text-muted)' }}>NO_LOGGED_EXCEPTION_EVENTS</p>
          ) : (
            project.errors.map(e => (
              <div key={e.id} className="p-4 rounded border" style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: errStatusColors[e.status] || 'var(--text-muted)' }} />
                  <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{e.title.toUpperCase()}</span>
                  <span className="badge ml-auto" style={{ color: sevColors[e.severity], background: `${sevColors[e.severity]}10`, border: `1px solid ${sevColors[e.severity]}25`, fontSize: '8px' }}>{e.severity}</span>
                  <span className="badge" style={{ color: errStatusColors[e.status], background: `${errStatusColors[e.status]}10`, border: `1px solid ${errStatusColors[e.status]}25`, fontSize: '8px' }}>{e.status}</span>
                </div>
                {e.description && <p className="text-[11px] mb-2" style={{ color: 'var(--text-secondary)' }}>{e.description}</p>}
                {e.resolution && (
                  <p className="text-[11px] text-accent-green" style={{ color: 'var(--accent-green)' }}>// RESOLUTION: {e.resolution.toUpperCase()}</p>
                )}
                <p className="text-[9px] mt-2 text-muted" style={{ color: 'var(--text-muted)' }}>TIMESTAMP: {new Date(e.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
