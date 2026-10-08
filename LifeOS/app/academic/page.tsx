'use client'

import { useEffect, useState } from 'react'

interface Exam {
  id: string
  subject: string
  syllabus: string | null
  date: string
  result: number | null
  maxResult: number
  status: string
  notes: string | null
}

interface Assignment {
  id: string
  subject: string
  topic: string
  deadline: string
  completed: boolean
  completedAt: string | null
  priority: string
  notes: string | null
}

interface Material {
  id: string
  title: string
  type: string
  subject: string
  tags: string | null
  uploadedAt: string
}

type Tab = 'tracker' | 'materials' | 'notes' | 'codes'
type LedgerFilter = 'ALL' | 'EXAM' | 'ASSIGNMENT' | 'PENDING' | 'COMPLETED'

function daysUntil(d: string) {
  return Math.max(0, Math.ceil((new Date(d).getTime() - Date.now()) / 86400000))
}

interface LedgerItem {
  id: string
  type: 'EXAM' | 'ASSIGNMENT'
  subject: string
  title: string
  date: string
  status: string
  completed: boolean
  result?: string
  priority?: string
  raw: Exam | Assignment
}

function KanbanCard({ item, onEdit, onDelete }: { item: LedgerItem; onEdit: () => void; onDelete: () => void }) {
  const isExam = item.type === 'EXAM'
  
  return (
    <div
      draggable
      onDragStart={e => {
        e.dataTransfer.setData('text/plain', item.id)
        e.dataTransfer.setData('itemType', item.type)
        e.dataTransfer.effectAllowed = 'move'
      }}
      className={`glass-card p-3.5 flex flex-col justify-between cursor-grab active:cursor-grabbing hover:scale-[1.01] transition-all duration-200 ${
        isExam ? 'border-accent-purple/20 hover:border-accent-purple/50 bg-bg-tertiary/40' : 'border-accent-cyan/20 hover:border-accent-cyan/50 bg-bg-tertiary/40'
      }`}
    >
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span 
            className="text-[9px] uppercase px-1.5 py-0.5 rounded font-mono font-bold tracking-wider"
            style={{
              color: isExam ? 'var(--accent-purple)' : 'var(--accent-cyan)',
              background: isExam ? 'rgba(217,70,239,0.05)' : 'rgba(0,229,255,0.05)',
              border: isExam ? '1px solid rgba(217,70,239,0.15)' : '1px solid rgba(0,229,255,0.15)',
            }}
          >
            {item.type}
          </span>
          <span className="text-[9px] text-text-muted font-mono">
            {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}
          </span>
        </div>

        <div className="font-bold text-[11px] text-text-primary uppercase tracking-wide truncate mb-1">
          {item.subject}
        </div>
        <div className="text-[10px] text-text-secondary line-clamp-2 leading-normal">
          {item.title}
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/30">
        <div>
          {isExam ? (
            item.result ? (
              <span className="text-accent-green font-bold text-[10px]">GPA: {item.result}</span>
            ) : (
              <span className="text-accent-amber text-[9px] font-bold">PENDING RESULTS</span>
            )
          ) : (
            <span className={item.completed ? 'text-accent-green text-[9px] font-bold' : 'text-accent-amber text-[9px] font-bold'}>
              {item.completed ? 'DONE' : item.priority || 'MEDIUM'}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2 text-[9px] font-mono font-bold">
          <button 
            type="button"
            className="text-text-muted hover:text-accent-cyan cursor-pointer transition-colors"
            onClick={onEdit}
          >
            EDIT
          </button>
          <span className="text-border/40">|</span>
          <button 
            type="button"
            className="text-accent-red/60 hover:text-accent-red cursor-pointer transition-colors"
            onClick={onDelete}
          >
            DEL
          </button>
        </div>
      </div>
    </div>
  )
}

const dummyMaterials = [
  { id: '1', title: 'Data Structures & Algorithms - Complete Guide', type: 'BOOK', subject: 'Algorithms', size: '14.2 MB', uploadedAt: '2026-06-25T10:00:00Z', tags: ['reference', 'cormen'] },
  { id: '2', title: 'Lecture 08: Graph Traversals & BFS/DFS', type: 'LECTURE_SHEET', subject: 'Data Structures', size: '1.8 MB', uploadedAt: '2026-06-28T14:30:00Z', tags: ['graphs', 'notes'] },
  { id: '3', title: 'Midterm Past Papers Collection (2022-2025)', type: 'PREVIOUS_QUESTION', subject: 'Operating Systems', size: '4.5 MB', uploadedAt: '2026-07-01T09:15:00Z', tags: ['exams', 'os'] },
  { id: '4', title: 'SQL Query Optimization Cheat Sheet', type: 'SOURCE_MATERIAL', subject: 'Database Systems', size: '820 KB', uploadedAt: '2026-07-02T11:00:00Z', tags: ['sql', 'cheat-sheet'] },
]

const dummyNotes = [
  { id: '1', title: 'Dynamic Programming: Knapsack Problem', source: 'DIGITAL', subject: 'Algorithms', obsidianUri: 'obsidian://open?vault=Academics&file=Knapsack', snippet: 'DP approach to solve 0/1 knapsack. Time complexity: O(N*W). Space complexity: O(W). Recursive vs iterative...', createdAt: '2026-06-29T15:00:00Z' },
  { id: '2', title: 'OS: Process Synchronization & Semaphores', source: 'SCANNED', subject: 'Operating Systems', obsidianUri: 'obsidian://open?vault=Academics&file=Semaphores', snippet: 'Scanned handwritten notes on mutex lock implementation, busy waiting, producer-consumer problem, Dining Philosophers...', createdAt: '2026-06-30T18:20:00Z' },
  { id: '3', title: 'Discrete Math: Euler Tour & Hamiltonian Paths', source: 'DIGITAL', subject: 'Mathematics', obsidianUri: 'obsidian://open?vault=Academics&file=EulerTour', snippet: 'Euler Tour: visit every edge exactly once. Necessary condition: all vertices have even degrees. Fleury\'s algorithm...', createdAt: '2026-07-02T08:45:00Z' },
]

const dummyRepos = [
  { id: '1', repoName: 'sys-xv6-scheduler', description: 'Implementing lottery and priority scheduler inside the xv6 OS kernel for CSE 314 Operating Systems.', lang: 'C', githubUrl: 'https://github.com/Kazi-Tanvir/sys-xv6-scheduler', status: 'SYNCED', lastCommit: 'Feat: Add lottery tick randomizer' },
  { id: '2', repoName: 'db-b-plus-tree', description: 'Self-balancing B+ tree index database page allocator engine from scratch in C++ for database labs.', lang: 'C++', githubUrl: 'https://github.com/Kazi-Tanvir/db-b-plus-tree', status: 'COMMITS_AHEAD', lastCommit: 'Fix: Node split memory leaks' },
  { id: '3', repoName: 'compiler-lexical-analyzer', description: 'Flex & Bison parser to compile subset of C programming language syntax into assembly instructions.', lang: 'Lex/Yacc', githubUrl: 'https://github.com/Kazi-Tanvir/compiler-lexical-analyzer', status: 'SYNCED', lastCommit: 'Release: Lab 4 final compilation pass' },
]

export default function AcademicPage() {
  const [tab, setTab] = useState<Tab>('tracker')
  const [exams, setExams] = useState<Exam[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'table' | 'details' | 'kanban'>('table')
  
  // Search and Filter states
  const [materialSearch, setMaterialSearch] = useState('')
  const [materialTypeFilter, setMaterialTypeFilter] = useState<string>('ALL')
  const [noteSearch, setNoteSearch] = useState('')

  const filteredMaterials = dummyMaterials.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(materialSearch.toLowerCase()) || 
                          m.subject.toLowerCase().includes(materialSearch.toLowerCase()) || 
                          m.tags.some(t => t.toLowerCase().includes(materialSearch.toLowerCase()))
    const matchesFilter = materialTypeFilter === 'ALL' || m.type === materialTypeFilter
    return matchesSearch && matchesFilter
  })

  const filteredNotes = dummyNotes.filter(n => {
    return n.title.toLowerCase().includes(noteSearch.toLowerCase()) || 
           n.subject.toLowerCase().includes(noteSearch.toLowerCase()) || 
           n.snippet.toLowerCase().includes(noteSearch.toLowerCase())
  })

  // Modals
  const [showAddExam, setShowAddExam] = useState(false)
  const [showAddAssignment, setShowAddAssignment] = useState(false)
  const [showEditLedgerItem, setShowEditLedgerItem] = useState<
    | { type: 'EXAM'; item: Exam }
    | { type: 'ASSIGNMENT'; item: Assignment }
    | null
  >(null)

  // Form states for adding
  const [newExam, setNewExam] = useState({ subject: '', syllabus: '', date: '', maxResult: 4, notes: '' })
  const [newAssignment, setNewAssignment] = useState({ subject: '', topic: '', deadline: '', priority: 'MEDIUM', notes: '' })

  // Form states for editing
  const [editingLedgerState, setEditingLedgerState] = useState<
    | { type: 'EXAM'; item: Exam }
    | { type: 'ASSIGNMENT'; item: Assignment }
    | null
  >(null)

  const startEditing = (type: 'EXAM' | 'ASSIGNMENT', item: Exam | Assignment) => {
    if (type === 'EXAM') {
      setShowEditLedgerItem({ type, item: item as Exam })
      setEditingLedgerState({ type, item: JSON.parse(JSON.stringify(item)) as Exam })
    } else {
      setShowEditLedgerItem({ type, item: item as Assignment })
      setEditingLedgerState({ type, item: JSON.parse(JSON.stringify(item)) as Assignment })
    }
  }

  const closeEditing = () => {
    setShowEditLedgerItem(null)
    setEditingLedgerState(null)
  }

  // Filters
  const [ledgerFilter, setLedgerFilter] = useState<LedgerFilter>('ALL')

  useEffect(() => {
    Promise.all([
      fetch('/api/academic/exams').then(r => r.json()),
      fetch('/api/academic/assignments').then(r => r.json()),
    ]).then(([e, a]) => {
      setExams(e)
      setAssignments(a)
      setLoading(false)
    })
  }, [])



  const toggleAssignment = async (id: string, completed: boolean) => {
    await fetch(`/api/academic/assignments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed }),
    })
    setAssignments(prev =>
      prev.map(a =>
        a.id === id
          ? { ...a, completed, completedAt: completed ? new Date().toISOString() : null }
          : a
      )
    )
  }

  const addExam = async () => {
    const res = await fetch('/api/academic/exams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newExam,
        date: new Date(newExam.date),
        maxResult: parseFloat(newExam.maxResult.toString()) || 4.0,
      }),
    })
    const exam = await res.json()
    setExams(prev => [...prev, exam].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()))
    setShowAddExam(false)
    setNewExam({ subject: '', syllabus: '', date: '', maxResult: 4, notes: '' })
  }

  const updateExam = async (id: string, data: Partial<Exam>) => {
    const res = await fetch(`/api/academic/exams/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        date: data.date ? new Date(data.date) : undefined,
        maxResult: data.maxResult ? parseFloat(data.maxResult.toString()) : undefined,
      }),
    })
    if (res.ok) {
      const updated = await res.json()
      setExams(prev => prev.map(e => (e.id === id ? updated : e)))
      closeEditing()
    }
  }

  const deleteExam = async (id: string) => {
    const res = await fetch(`/api/academic/exams/${id}`, {
      method: 'DELETE',
    })
    if (res.ok) {
      setExams(prev => prev.filter(e => e.id !== id))
      closeEditing()
    }
  }

  const addAssignment = async () => {
    const res = await fetch('/api/academic/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newAssignment, deadline: new Date(newAssignment.deadline) }),
    })
    const a = await res.json()
    setAssignments(prev => [...prev, a].sort((x, y) => new Date(x.deadline).getTime() - new Date(y.deadline).getTime()))
    setShowAddAssignment(false)
    setNewAssignment({ subject: '', topic: '', deadline: '', priority: 'MEDIUM', notes: '' })
  }

  const updateAssignment = async (id: string, data: Partial<Assignment>) => {
    const res = await fetch(`/api/academic/assignments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        deadline: data.deadline ? new Date(data.deadline) : undefined,
      }),
    })
    if (res.ok) {
      const updated = await res.json()
      setAssignments(prev => prev.map(a => (a.id === id ? updated : a)))
      closeEditing()
    }
  }

  const deleteAssignment = async (id: string) => {
    const res = await fetch(`/api/academic/assignments/${id}`, {
      method: 'DELETE',
    })
    if (res.ok) {
      setAssignments(prev => prev.filter(a => a.id !== id))
      closeEditing()
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'tracker', label: 'TRACKER' },
    { key: 'materials', label: 'MATERIALS' },
    { key: 'notes', label: 'NOTES' },
    { key: 'codes', label: 'CODES' },
  ]

  if (loading) return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-40 rounded-xl bg-bg-tertiary animate-pulse" />)}</div>

  const ledgerItems: LedgerItem[] = [
    ...exams.map(e => ({
      id: e.id,
      type: 'EXAM' as const,
      subject: e.subject,
      title: e.syllabus || 'No syllabus details',
      date: e.date,
      status: e.status,
      completed: e.status === 'COMPLETED',
      result: e.result !== null ? `${e.result} / ${e.maxResult}` : undefined,
      raw: e,
    })),
    ...assignments.map(a => ({
      id: a.id,
      type: 'ASSIGNMENT' as const,
      subject: a.subject,
      title: a.topic,
      date: a.deadline,
      status: a.completed ? 'COMPLETED' : 'PENDING',
      completed: a.completed,
      priority: a.priority,
      raw: a,
    })),
  ].sort((x, y) => new Date(x.date).getTime() - new Date(y.date).getTime())

  const filteredLedger = ledgerItems.filter(item => {
    if (ledgerFilter === 'ALL') return true
    if (ledgerFilter === 'EXAM') return item.type === 'EXAM'
    if (ledgerFilter === 'ASSIGNMENT') return item.type === 'ASSIGNMENT'
    if (ledgerFilter === 'PENDING') return !item.completed
    if (ledgerFilter === 'COMPLETED') return item.completed
    return true
  })

  const pendingItems = filteredLedger.filter(item => !item.completed)
  const completedItems = filteredLedger.filter(item => item.completed)

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-display text-xl uppercase tracking-wider font-mono">SYS://ACADEMIC_TRACKER</h1>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-nav">
        {tabs.map(t => (
          <button key={t.key} className={`tab-item ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </div>

      {/* TRACKER TAB */}
      {tab === 'tracker' && (
        <div className="space-y-6">
          {/* Unified Exams & Assignments Ledger */}
          <section>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="font-mono text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>ACADEMIC_LEDGER_REGISTRY</h2>
                {/* Filters & View Modes */}
                <div className="flex flex-wrap items-center gap-4 mt-2">
                  <div className="flex flex-wrap gap-1.5">
                    {(['ALL', 'EXAM', 'ASSIGNMENT', 'PENDING', 'COMPLETED'] as LedgerFilter[]).map(filter => (
                      <button
                        key={filter}
                        type="button"
                        className={`btn btn-pill text-[9px] px-2.5 py-0.5 border cursor-pointer ${
                          ledgerFilter === filter
                            ? 'border-accent-cyan text-accent-cyan bg-accent-cyan/5'
                            : 'border-border text-text-secondary btn-ghost'
                        }`}
                        onClick={() => setLedgerFilter(filter)}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1 border-l border-border pl-4">
                    <span className="text-[9px] text-text-muted font-mono mr-1">VIEW:</span>
                    {(['table', 'details', 'kanban'] as const).map(mode => (
                      <button
                        key={mode}
                        type="button"
                        className={`btn btn-pill text-[9px] px-2.5 py-0.5 border cursor-pointer ${
                          viewMode === mode
                            ? 'border-accent-purple text-accent-purple bg-accent-purple/5'
                            : 'border-border text-text-secondary btn-ghost'
                        }`}
                        onClick={() => setViewMode(mode)}
                      >
                        {mode.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button type="button" className="btn btn-ghost text-xs cursor-pointer" onClick={() => setShowAddExam(true)}>+ ADD EXAM</button>
                <button type="button" className="btn btn-ghost text-xs cursor-pointer" onClick={() => setShowAddAssignment(true)}>+ ADD ASSIGNMENT</button>
              </div>
            </div>

            {/* Table View */}
            {viewMode === 'table' && (
              <div className="glass-card overflow-hidden cyber-blue">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="w-16">Type</th>
                      <th>Subject</th>
                      <th>Task / Details</th>
                      <th>Due Date</th>
                      <th>Status / Score</th>
                      <th className="w-20 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLedger.length > 0 ? (
                      filteredLedger.map(item => {
                        const isExam = item.type === 'EXAM'
                        return (
                          <tr key={item.id} className="font-mono text-xs">
                            {/* Type */}
                            <td>
                              <span
                                className="badge"
                                style={{
                                  color: isExam ? 'var(--accent-purple)' : 'var(--accent-cyan)',
                                  background: isExam ? 'rgba(217,70,239,0.05)' : 'rgba(0,229,255,0.05)',
                                  border: isExam ? '1px solid rgba(217,70,239,0.2)' : '1px solid rgba(0,229,255,0.2)',
                                }}
                              >
                                {item.type}
                              </span>
                            </td>
                            
                            {/* Subject */}
                            <td className="font-semibold text-text-primary uppercase">{item.subject}</td>
                            
                            {/* Topic/Syllabus */}
                            <td className="max-w-xs truncate text-text-secondary" title={item.title}>{item.title}</td>
                            
                            {/* Date */}
                            <td>
                              <span>{new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }).toUpperCase()}</span>
                              {!item.completed && (
                                <span className="text-[10px] ml-1.5 text-text-muted">({daysUntil(item.date)}d left)</span>
                              )}
                            </td>
                            
                            {/* Status/Score */}
                            <td>
                              {isExam ? (
                                item.result ? (
                                  <span className="text-accent-green font-bold">{item.result}</span>
                                ) : (
                                  <span className="text-accent-amber font-semibold">PENDING</span>
                                )
                              ) : (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={item.completed}
                                    onChange={() => toggleAssignment(item.id, !item.completed)}
                                    className="w-3.5 h-3.5 rounded cursor-pointer accent-[var(--accent-cyan)] bg-transparent border border-border"
                                  />
                                  <span
                                    className={item.completed ? 'text-accent-green' : 'text-accent-amber'}
                                    style={{ textDecoration: item.completed ? 'line-through' : 'none' }}
                                  >
                                    {item.completed ? 'DONE' : item.priority || 'MEDIUM'}
                                  </span>
                                </div>
                              )}
                            </td>

                            {/* Actions */}
                            <td>
                              <div className="flex justify-center gap-2">
                                <button
                                  type="button"
                                  className="text-[10px] text-text-secondary hover:text-accent-cyan font-semibold cursor-pointer"
                                  onClick={() => startEditing(item.type, item.raw)}
                                >
                                  EDIT
                                </button>
                                <span className="text-border">|</span>
                                <button
                                  type="button"
                                  className="text-[10px] text-accent-red/75 hover:text-accent-red font-semibold cursor-pointer"
                                  onClick={() => {
                                    if (confirm(`Delete this ${item.type.toLowerCase()}?`)) {
                                      if (isExam) deleteExam(item.id)
                                      else deleteAssignment(item.id)
                                    }
                                  }}
                                >
                                  DEL
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center py-6 text-text-muted font-mono text-xs">
                          NO RECORDED ENTRIES FOUND FOR FILTER.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Details View */}
            {viewMode === 'details' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredLedger.length > 0 ? (
                  filteredLedger.map(item => {
                    const isExam = item.type === 'EXAM'
                    return (
                      <div
                        key={item.id}
                        className={`glass-card p-5 flex flex-col justify-between transition-all duration-300 relative overflow-hidden ${
                          isExam ? 'cyber-magenta hover:shadow-[0_0_15px_rgba(217,70,239,0.15)]' : 'cyber-cyan hover:shadow-[0_0_15px_rgba(0,229,255,0.15)]'
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <span
                              className="badge"
                              style={{
                                color: isExam ? 'var(--accent-purple)' : 'var(--accent-cyan)',
                                background: isExam ? 'rgba(217,70,239,0.05)' : 'rgba(0,229,255,0.05)',
                                border: isExam ? '1px solid rgba(217,70,239,0.2)' : '1px solid rgba(0,229,255,0.2)',
                              }}
                            >
                              {item.type}
                            </span>
                            <span className="text-[10px] text-text-muted font-mono">
                              {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
                            </span>
                          </div>

                          <h3 
                            className="font-bold text-sm tracking-wide mb-1 uppercase text-text-primary"
                            style={{ color: isExam ? 'var(--accent-purple)' : 'var(--accent-cyan)' }}
                          >
                            {item.subject}
                          </h3>
                          <p className="text-text-primary text-xs font-semibold mb-3 leading-snug">{item.title}</p>
                          
                          {/* Syllabus */}
                          {isExam && (item.raw as Exam).syllabus && (
                            <div className="mb-3 text-[11px] text-text-secondary bg-bg-tertiary/45 p-2 rounded border border-border/20">
                              <span className="text-[9px] text-text-muted font-mono block mb-0.5">SYLLABUS:</span>
                              <p className="line-clamp-3 font-mono">{(item.raw as Exam).syllabus}</p>
                            </div>
                          )}

                          {item.raw.notes && (
                            <div className="mb-3 text-[11px] text-text-secondary bg-bg-tertiary/45 p-2 rounded border border-border/20">
                              <span className="text-[9px] text-text-muted font-mono block mb-0.5">NOTES:</span>
                              <p className="line-clamp-3 font-mono">{item.raw.notes}</p>
                            </div>
                          )}
                        </div>

                        {/* Footer: status details and actions */}
                        <div className="mt-4 pt-3 border-t border-border/50 flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            {/* Status/Result */}
                            <div>
                              {isExam ? (
                                item.result ? (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] text-text-muted font-mono">GPA:</span>
                                    <span className="text-accent-green font-bold text-xs">{item.result}</span>
                                  </div>
                                ) : (
                                  <span className="text-accent-amber font-semibold text-[10px]">PENDING RESULTS</span>
                                )
                              ) : (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={item.completed}
                                    onChange={() => toggleAssignment(item.id, !item.completed)}
                                    className="w-3.5 h-3.5 rounded cursor-pointer accent-[var(--accent-cyan)] bg-transparent border border-border"
                                  />
                                  <span
                                    className={item.completed ? 'text-accent-green text-[10px] line-through' : 'text-accent-amber text-[10px] font-semibold'}
                                  >
                                    {item.completed ? 'DONE' : item.priority || 'MEDIUM'}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Days Left */}
                            {!item.completed && (
                              <span className="text-[10px] text-text-muted font-mono font-bold">
                                {daysUntil(item.date)} DAYS LEFT
                              </span>
                            )}
                          </div>

                          <div className="flex justify-between items-center text-[10px] font-mono font-bold pt-1">
                            <button
                              type="button"
                              className="text-text-secondary hover:text-accent-cyan transition-colors cursor-pointer"
                              onClick={() => startEditing(item.type, item.raw)}
                            >
                              {"// EDIT"}
                            </button>
                            <button
                              type="button"
                              className="text-accent-red/75 hover:text-accent-red transition-colors cursor-pointer"
                              onClick={() => {
                                  if (confirm(`Delete this ${item.type.toLowerCase()}?`)) {
                                    if (isExam) deleteExam(item.id)
                                    else deleteAssignment(item.id)
                                  }
                              }}
                            >
                              {"// DELETE"}
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="col-span-full text-center py-12 glass-card font-mono text-xs text-text-muted">
                    NO RECORDED ENTRIES FOUND.
                  </div>
                )}
              </div>
            )}

            {/* Kanban View */}
            {viewMode === 'kanban' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 select-none">
                {/* Pending Column */}
                <div
                  className="glass-card p-4 bg-bg-secondary border border-dashed border-accent-amber/20 flex flex-col min-h-[500px]"
                  onDragOver={e => e.preventDefault()}
                  onDrop={async e => {
                    e.preventDefault()
                    const itemId = e.dataTransfer.getData('text/plain')
                    const itemType = e.dataTransfer.getData('itemType')
                    if (!itemId) return
                    if (itemType === 'ASSIGNMENT') {
                      await toggleAssignment(itemId, false)
                    } else if (itemType === 'EXAM') {
                      await updateExam(itemId, { status: 'PENDING', result: null })
                    }
                  }}
                >
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-border">
                    <span className="font-bold text-xs text-accent-amber">{"// PENDING_TASKS ("}{pendingItems.length}{")"}</span>
                    <span className="text-[10px] text-text-muted font-mono">{"// DRAG HERE TO RESET"}</span>
                  </div>

                  <div className="flex-1 flex flex-col gap-3 overflow-y-auto max-h-[600px] pr-1">
                    {pendingItems.length > 0 ? (
                      pendingItems.map(item => (
                        <KanbanCard 
                          key={item.id} 
                          item={item} 
                          onEdit={() => startEditing(item.type, item.raw)}
                          onDelete={() => {
                            if (confirm(`Delete this ${item.type.toLowerCase()}?`)) {
                              if (item.type === 'EXAM') deleteExam(item.id)
                              else deleteAssignment(item.id)
                            }
                          }}
                        />
                      ))
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-text-muted font-mono text-[11px] py-12">
                        NO PENDING TASKS
                      </div>
                    )}
                  </div>
                </div>

                {/* Completed Column */}
                <div
                  className="glass-card p-4 bg-bg-secondary border border-dashed border-accent-green/20 flex flex-col min-h-[500px]"
                  onDragOver={e => e.preventDefault()}
                  onDrop={async e => {
                    e.preventDefault()
                    const itemId = e.dataTransfer.getData('text/plain')
                    const itemType = e.dataTransfer.getData('itemType')
                    if (!itemId) return
                    if (itemType === 'ASSIGNMENT') {
                      await toggleAssignment(itemId, true)
                    } else if (itemType === 'EXAM') {
                      await updateExam(itemId, { status: 'COMPLETED' })
                    }
                  }}
                >
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-border">
                    <span className="font-bold text-xs text-accent-green">{"// COMPLETED_RECORDS ("}{completedItems.length}{")"}</span>
                    <span className="text-[10px] text-text-muted font-mono">{"// DRAG HERE TO COMPLETE"}</span>
                  </div>

                  <div className="flex-1 flex flex-col gap-3 overflow-y-auto max-h-[600px] pr-1">
                    {completedItems.length > 0 ? (
                      completedItems.map(item => (
                        <KanbanCard 
                          key={item.id} 
                          item={item}
                          onEdit={() => startEditing(item.type, item.raw)}
                          onDelete={() => {
                            if (confirm(`Delete this ${item.type.toLowerCase()}?`)) {
                              if (item.type === 'EXAM') deleteExam(item.id)
                              else deleteAssignment(item.id)
                            }
                          }}
                        />
                      ))
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-text-muted font-mono text-[11px] py-12">
                        NO COMPLETED RECORDS
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {/* MATERIALS TAB */}
      {tab === 'materials' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{"// MATERIALS_STORAGE_VAULT"}</h2>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {['ALL', 'BOOK', 'LECTURE_SHEET', 'PREVIOUS_QUESTION', 'SOURCE_MATERIAL'].map(type => (
                  <button
                    key={type}
                    type="button"
                    className={`btn btn-pill text-[9px] px-2.5 py-0.5 border cursor-pointer ${
                      materialTypeFilter === type
                        ? 'border-accent-cyan text-accent-cyan bg-accent-cyan/5'
                        : 'border-border text-text-secondary btn-ghost'
                    }`}
                    onClick={() => setMaterialTypeFilter(type)}
                  >
                    {type.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="SEARCH_MATERIALS..."
                value={materialSearch}
                onChange={e => setMaterialSearch(e.target.value)}
                className="input pl-8"
              />
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted text-[10px] font-mono">🔍</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMaterials.length > 0 ? (
              filteredMaterials.map(m => (
                <div
                  key={m.id}
                  className="glass-card p-4 hover:border-accent-cyan/50 hover:shadow-[0_0_12px_rgba(0,229,255,0.1)] transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-center mb-2.5">
                      <span className="badge text-[9px]" style={{ color: 'var(--accent-cyan)', background: 'rgba(0,229,255,0.05)', border: '1px solid rgba(0,229,255,0.15)' }}>
                        {m.type.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-text-muted font-mono">{m.size}</span>
                    </div>

                    <h3 className="font-bold text-xs text-text-primary uppercase tracking-wide truncate mb-1">
                      {m.title}
                    </h3>
                    <p className="text-[10px] text-accent-blue/80 font-mono mb-3">{m.subject.toUpperCase()}</p>

                    <div className="flex flex-wrap gap-1 mb-4">
                      {m.tags.map(t => (
                        <span key={t} className="text-[9px] font-mono text-text-secondary bg-bg-tertiary px-1.5 py-0.5 rounded border border-border/30">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-border/55 text-[10px] font-mono font-bold">
                    <button
                      type="button"
                      className="text-text-secondary hover:text-accent-cyan transition-colors cursor-pointer"
                      onClick={() => alert(`Initiating mock download: ${m.title} (${m.size})`)}
                    >
                      {"// DOWNLOAD"}
                    </button>
                    <span className="text-text-muted text-[9px]">
                      {new Date(m.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12 glass-card font-mono text-xs text-text-muted">
                NO MATERIALS FOUND.
              </div>
            )}
          </div>
        </div>
      )}

      {/* NOTES TAB */}
      {tab === 'notes' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="font-mono text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{"// PERSONAL_NOTES_OBSIDIAN_VAULT"}</h2>
              <p className="text-[10px] text-text-secondary font-mono mt-1">{"// HANDWRITTEN SCANS & MARKDOWN DOCUMENTATION SYNCED FROM OBSIDIAN."}</p>
            </div>
            
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="SEARCH_NOTES..."
                value={noteSearch}
                onChange={e => setNoteSearch(e.target.value)}
                className="input pl-8"
              />
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted text-[10px] font-mono">🔍</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredNotes.length > 0 ? (
              filteredNotes.map(n => (
                <div
                  key={n.id}
                  className="glass-card p-4 hover:border-accent-purple/50 hover:shadow-[0_0_12px_rgba(217,70,239,0.1)] transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-center mb-2.5">
                      <span className="badge text-[9px]" style={{ color: 'var(--accent-purple)', background: 'rgba(217,70,239,0.05)', border: '1px solid rgba(217,70,239,0.15)' }}>
                        {n.source}
                      </span>
                      <span className="text-[10px] text-text-muted font-mono">{n.subject.toUpperCase()}</span>
                    </div>

                    <h3 className="font-bold text-xs text-text-primary uppercase tracking-wide mb-2">
                      {n.title}
                    </h3>
                    <p className="text-[11px] text-text-secondary leading-relaxed bg-bg-tertiary/30 p-2.5 border border-border/30 rounded font-mono mb-4">
                      {n.snippet}
                    </p>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-border/55 text-[10px] font-mono font-bold">
                    <a
                      href={n.obsidianUri}
                      className="text-accent-purple hover:text-accent-purple/80 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      ⚡ OPEN IN OBSIDIAN
                    </a>
                    <span className="text-text-muted text-[9px]">
                      {new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12 glass-card font-mono text-xs text-text-muted">
                NO SYNCED VAULT NOTES FOUND.
              </div>
            )}
          </div>
        </div>
      )}

      {/* CODES TAB */}
      {tab === 'codes' && (
        <div className="space-y-6">
          <div>
            <h2 className="font-mono text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{"// CODES_REPOSITORIES"}</h2>
            <p className="text-[10px] text-text-secondary font-mono mt-1">{"// LOCAL REPOS AND ACADEMIC GITHUB ARCHIVES SYNC STATE."}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dummyRepos.map(r => {
              const isSynced = r.status === 'SYNCED'
              return (
                <div
                  key={r.id}
                  className="glass-card p-4 hover:border-accent-cyan/50 hover:shadow-[0_0_12px_rgba(0,229,255,0.1)] transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[10px] font-mono font-bold text-text-primary flex items-center gap-1">
                        📁 {r.repoName}
                      </span>
                      <span
                        className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded"
                        style={{
                          color: isSynced ? 'var(--accent-green)' : 'var(--accent-amber)',
                          background: isSynced ? 'rgba(57,255,20,0.05)' : 'rgba(255,176,0,0.05)',
                          border: isSynced ? '1px solid rgba(57,255,20,0.2)' : '1px solid rgba(255,176,0,0.2)',
                        }}
                      >
                        {isSynced ? 'SYNCED' : 'AHEAD'}
                      </span>
                    </div>

                    <p className="text-[11px] text-text-secondary leading-relaxed mb-3 h-12 overflow-hidden text-ellipsis line-clamp-3">
                      {r.description}
                    </p>

                    <div className="mb-4">
                      <span className="text-[8px] text-text-muted font-mono block mb-1">LATEST_COMMIT:</span>
                      <code className="text-[9px] text-accent-cyan font-mono block bg-bg-tertiary/70 px-2 py-1 rounded truncate border border-border/40">
                        git // {r.lastCommit}
                      </code>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-border/55 text-[10px] font-mono font-bold">
                    <a
                      href={r.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-text-secondary hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                    >
                      🔗 GITHUB_LINK
                    </a>
                    <span 
                      className="badge text-[9px] font-mono"
                      style={{
                        color: r.lang === 'C' ? 'var(--accent-red)' : r.lang === 'C++' ? 'var(--accent-blue)' : 'var(--accent-purple)',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.05)'
                      }}
                    >
                      {r.lang}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}



      {/* Add Exam Modal */}
      {showAddExam && (
        <div className="modal-overlay" onClick={() => setShowAddExam(false)}>
          <div className="modal-panel font-mono text-xs" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold mb-6 text-text-primary">{"// ADD_EXAM_RECORD"}</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Subject</label>
                <input className="input" value={newExam.subject} onChange={e => setNewExam({ ...newExam, subject: e.target.value })} placeholder="e.g. Data Structures" />
              </div>
              <div>
                <label className="label">Syllabus / Focus</label>
                <textarea className="input" rows={3} value={newExam.syllabus} onChange={e => setNewExam({ ...newExam, syllabus: e.target.value })} placeholder="Ch 1-8, Graph Traversals, Heap Sort..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Date</label>
                  <input type="date" className="input" value={newExam.date} onChange={e => setNewExam({ ...newExam, date: e.target.value })} />
                </div>
                <div>
                  <label className="label">Max Result/G.P.A.</label>
                  <input type="number" step="0.1" className="input" value={newExam.maxResult} onChange={e => setNewExam({ ...newExam, maxResult: parseFloat(e.target.value) || 4 })} />
                </div>
              </div>
              <div>
                <label className="label">Additional Notes</label>
                <textarea className="input" rows={2} value={newExam.notes} onChange={e => setNewExam({ ...newExam, notes: e.target.value })} placeholder="Exam is in Room 202, carry calculator..." />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button className="btn btn-ghost" onClick={() => setShowAddExam(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={addExam} disabled={!newExam.subject || !newExam.date}>Confirm</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Assignment Modal */}
      {showAddAssignment && (
        <div className="modal-overlay" onClick={() => setShowAddAssignment(false)}>
          <div className="modal-panel font-mono text-xs" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold mb-6 text-text-primary">{"// ADD_ASSIGNMENT_RECORD"}</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Subject</label>
                <input className="input" value={newAssignment.subject} onChange={e => setNewAssignment({ ...newAssignment, subject: e.target.value })} placeholder="e.g. Operating Systems" />
              </div>
              <div>
                <label className="label">Topic / Deliverables</label>
                <input className="input" value={newAssignment.topic} onChange={e => setNewAssignment({ ...newAssignment, topic: e.target.value })} placeholder="e.g. Process Sync Lab Report" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Deadline Date</label>
                  <input type="date" className="input" value={newAssignment.deadline} onChange={e => setNewAssignment({ ...newAssignment, deadline: e.target.value })} />
                </div>
                <div>
                  <label className="label">Priority Level</label>
                  <select className="input" value={newAssignment.priority} onChange={e => setNewAssignment({ ...newAssignment, priority: e.target.value })}>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Notes / Instructions</label>
                <textarea className="input" rows={2} value={newAssignment.notes} onChange={e => setNewAssignment({ ...newAssignment, notes: e.target.value })} placeholder="Submit as PDF before 11:59 PM..." />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button className="btn btn-ghost" onClick={() => setShowAddAssignment(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={addAssignment} disabled={!newAssignment.subject || !newAssignment.topic || !newAssignment.deadline}>Confirm</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditLedgerItem && editingLedgerState && (
        <div className="modal-overlay" onClick={closeEditing}>
          <div className="modal-panel font-mono text-xs" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold mb-6 text-text-primary">
              {editingLedgerState.type === 'EXAM' ? "// EDIT_EXAM_LOG" : "// EDIT_ASSIGNMENT_RECORD"}
            </h3>
            
            {editingLedgerState.type === 'EXAM' ? (
              <div className="space-y-4">
                <div>
                  <label className="label">Subject</label>
                  <input className="input" value={editingLedgerState.item.subject} onChange={e => setEditingLedgerState({
                    ...editingLedgerState,
                    item: { ...editingLedgerState.item, subject: e.target.value }
                  })} />
                </div>
                
                <div>
                  <label className="label">Syllabus / Focus</label>
                  <textarea className="input" rows={3} value={editingLedgerState.item.syllabus || ''} onChange={e => setEditingLedgerState({
                    ...editingLedgerState,
                    item: { ...editingLedgerState.item, syllabus: e.target.value }
                  })} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Exam Date</label>
                    <input type="date" className="input" value={editingLedgerState.item.date ? new Date(editingLedgerState.item.date).toISOString().split('T')[0] : ''} onChange={e => setEditingLedgerState({
                      ...editingLedgerState,
                      item: { ...editingLedgerState.item, date: e.target.value }
                    })} />
                  </div>
                  <div>
                    <label className="label">Status</label>
                    <select className="input" value={editingLedgerState.item.status} onChange={e => setEditingLedgerState({
                      ...editingLedgerState,
                      item: { ...editingLedgerState.item, status: e.target.value }
                    })}>
                      <option value="PENDING">Pending</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Obtained Result</label>
                    <input type="number" step="0.1" className="input" value={editingLedgerState.item.result || ''} onChange={e => setEditingLedgerState({
                      ...editingLedgerState,
                      item: { ...editingLedgerState.item, result: e.target.value === '' ? null : parseFloat(e.target.value) }
                    })} placeholder="e.g. 3.7 (GPA)" />
                  </div>
                  <div>
                    <label className="label">Max Possible Result</label>
                    <input type="number" step="0.1" className="input" value={editingLedgerState.item.maxResult} onChange={e => setEditingLedgerState({
                      ...editingLedgerState,
                      item: { ...editingLedgerState.item, maxResult: parseFloat(e.target.value) || 4 }
                    })} />
                  </div>
                </div>

                <div>
                  <label className="label">Additional Notes</label>
                  <textarea className="input" rows={2} value={editingLedgerState.item.notes || ''} onChange={e => setEditingLedgerState({
                    ...editingLedgerState,
                    item: { ...editingLedgerState.item, notes: e.target.value }
                  })} />
                </div>

                <div className="flex gap-2 justify-end pt-4 border-t border-border">
                  <button className="btn btn-ghost" onClick={closeEditing}>Cancel</button>
                  <button className="btn btn-primary" onClick={() => updateExam(editingLedgerState.item.id, editingLedgerState.item)}>Save Changes</button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="label">Subject</label>
                  <input className="input" value={editingLedgerState.item.subject} onChange={e => setEditingLedgerState({
                    ...editingLedgerState,
                    item: { ...editingLedgerState.item, subject: e.target.value }
                  })} />
                </div>
                
                <div>
                  <label className="label">Topic / Deliverables</label>
                  <input className="input" value={editingLedgerState.item.topic} onChange={e => setEditingLedgerState({
                    ...editingLedgerState,
                    item: { ...editingLedgerState.item, topic: e.target.value }
                  })} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Deadline Date</label>
                    <input type="date" className="input" value={editingLedgerState.item.deadline ? new Date(editingLedgerState.item.deadline).toISOString().split('T')[0] : ''} onChange={e => setEditingLedgerState({
                      ...editingLedgerState,
                      item: { ...editingLedgerState.item, deadline: e.target.value }
                    })} />
                  </div>
                  <div>
                    <label className="label">Priority Level</label>
                    <select className="input" value={editingLedgerState.item.priority} onChange={e => setEditingLedgerState({
                      ...editingLedgerState,
                      item: { ...editingLedgerState.item, priority: e.target.value }
                    })}>
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 py-2">
                  <input
                    type="checkbox"
                    checked={editingLedgerState.item.completed}
                    onChange={e => setEditingLedgerState({
                      ...editingLedgerState,
                      item: { ...editingLedgerState.item, completed: e.target.checked }
                    })}
                    className="w-4 h-4 rounded cursor-pointer accent-[var(--accent-cyan)]"
                  />
                  <label className="label mb-0 cursor-pointer select-none">Mark Assignment Completed</label>
                </div>

                <div>
                  <label className="label">Notes / Instructions</label>
                  <textarea className="input" rows={2} value={editingLedgerState.item.notes || ''} onChange={e => setEditingLedgerState({
                    ...editingLedgerState,
                    item: { ...editingLedgerState.item, notes: e.target.value }
                  })} />
                </div>

                <div className="flex gap-2 justify-end pt-4 border-t border-border">
                  <button className="btn btn-ghost" onClick={closeEditing}>Cancel</button>
                  <button className="btn btn-primary" onClick={() => updateAssignment(editingLedgerState.item.id, editingLedgerState.item)}>Save Changes</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

