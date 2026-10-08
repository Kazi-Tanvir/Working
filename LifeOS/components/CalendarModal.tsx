'use client'

import { useEffect, useState } from 'react'

interface ClassSchedule {
  id: string
  subject: string
  dayOfWeek: number
  startTime: string
  endTime: string
  room: string | null
  color: string
  attendance: string
  status: string
}

interface CalendarModalProps {
  onClose: () => void
}

const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const START_HOUR = 8
const END_HOUR = 22
const ROW_HEIGHT = 50

const colorPresets = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Cyan', value: '#00E5FF' },
  { name: 'Purple', value: '#D946EF' },
  { name: 'Green', value: '#39FF14' },
  { name: 'Amber', value: '#FFB000' },
  { name: 'Pink', value: '#FF007F' },
  { name: 'Red', value: '#FF0055' },
]

export default function CalendarModal({ onClose }: CalendarModalProps) {
  const [classes, setClasses] = useState<ClassSchedule[]>([])
  const [loading, setLoading] = useState(true)

  // Modals
  const [showAddClass, setShowAddClass] = useState(false)
  const [showEditClass, setShowEditClass] = useState<ClassSchedule | null>(null)

  // Form states for adding
  const [newClass, setNewClass] = useState({
    subject: '',
    dayOfWeek: 1,
    startTime: '10:00',
    endTime: '11:30',
    room: '',
    color: '#3B82F6',
    attendance: 'PENDING',
    status: 'ACTIVE',
  })

  // Form states for editing
  const [editingClassState, setEditingClassState] = useState<ClassSchedule | null>(null)
  const [dragOverSlot, setDragOverSlot] = useState<{ day: number; hour: number; minute: number } | null>(null)

  useEffect(() => {
    fetch('/api/academic/classes')
      .then(r => r.json())
      .then(c => {
        setClasses(c)
        setLoading(false)
      })
  }, [])

  const closeEditClass = () => {
    setShowEditClass(null)
    setEditingClassState(null)
  }

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showAddClass) setShowAddClass(false)
        else if (showEditClass) closeEditClass()
        else onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showAddClass, showEditClass, onClose])

  const addClass = async () => {
    const res = await fetch('/api/academic/classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newClass,
        dayOfWeek: parseInt(newClass.dayOfWeek.toString()),
      }),
    })
    if (res.ok) {
      const cls = await res.json()
      setClasses(prev => [...prev, cls])
      setShowAddClass(false)
      setNewClass({
        subject: '',
        dayOfWeek: 1,
        startTime: '10:00',
        endTime: '11:30',
        room: '',
        color: '#3B82F6',
        attendance: 'PENDING',
        status: 'ACTIVE',
      })
    }
  }

  const updateClass = async (id: string, data: Partial<ClassSchedule>) => {
    const res = await fetch(`/api/academic/classes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        dayOfWeek: data.dayOfWeek !== undefined ? parseInt(data.dayOfWeek.toString()) : undefined,
      }),
    })
    if (res.ok) {
      const cls = await res.json()
      setClasses(prev => prev.map(c => (c.id === id ? cls : c)))
      closeEditClass()
    }
  }

  const deleteClass = async (id: string) => {
    const res = await fetch(`/api/academic/classes/${id}`, {
      method: 'DELETE',
    })
    if (res.ok) {
      setClasses(prev => prev.filter(c => c.id !== id))
      closeEditClass()
    }
  }

  const handleDropClass = async (classId: string, targetDay: number, targetHour: number, targetMin: number) => {
    const cls = classes.find(c => c.id === classId)
    if (!cls) return

    const [sh, sm] = cls.startTime.split(':').map(Number)
    const [eh, em] = cls.endTime.split(':').map(Number)
    const duration = (eh * 60 + em) - (sh * 60 + sm)

    const newStartMin = targetHour * 60 + targetMin
    const newEndMin = newStartMin + duration

    const startStr = `${String(targetHour).padStart(2, '0')}:${String(targetMin).padStart(2, '0')}`
    const endH = Math.floor(newEndMin / 60)
    const endM = newEndMin % 60
    const endStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`

    await updateClass(classId, {
      dayOfWeek: targetDay,
      startTime: startStr,
      endTime: endStr,
    })
  }

  const hoursList = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i)

  return (
    <div 
      className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-bg-secondary border border-border w-full max-w-7xl rounded-xl p-6 shadow-2xl relative flex flex-col font-mono text-xs"
        style={{ minHeight: '650px', maxHeight: '95vh', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button & Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/50 shrink-0">
          <div>
            <h1 className="text-display text-lg uppercase tracking-wider font-mono text-accent-cyan">{"// SYS://ACADEMIC_TIMETABLE"}</h1>
            <p className="text-[10px] text-text-secondary mt-1">{"// TIME-BLOCKED WEEKLY SCHEDULE. DRAG AND DROP CLASS CARDS TO RESCHEDULE."}</p>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" className="btn btn-primary text-xs cursor-pointer" onClick={() => setShowAddClass(true)}>
              + ADD CLASS
            </button>
            <button 
              type="button"
              onClick={onClose}
              className="text-text-secondary hover:text-white transition-colors p-1 cursor-pointer border border-border hover:border-text-muted rounded bg-bg-tertiary flex items-center justify-center"
              title="Close modal (ESC)"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Timetable Grid */}
        <div className="flex-1 overflow-auto pr-1">
          {loading ? (
            <div className="space-y-4 py-12">
              {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-32 rounded-xl bg-bg-tertiary animate-pulse" />)}
            </div>
          ) : (
            <div className="min-w-[900px] select-none flex">
              {/* Time Labels Column */}
              <div className="w-[60px] flex-shrink-0 pt-10 text-right pr-3 flex flex-col justify-between" style={{ height: `${(END_HOUR - START_HOUR) * ROW_HEIGHT + 40}px` }}>
                <div className="h-10" />
                {hoursList.map(h => (
                  <div key={h} className="text-[10px] text-text-muted font-mono flex items-start justify-end" style={{ height: `${ROW_HEIGHT}px` }}>
                    <span>{String(h).padStart(2, '0')}:00</span>
                  </div>
                ))}
              </div>

              {/* Days Columns Grid */}
              <div className="flex-1 grid grid-cols-7 border border-border bg-bg-secondary rounded-lg overflow-hidden relative" style={{ height: `${(END_HOUR - START_HOUR) * ROW_HEIGHT + 40}px` }}>
                {dayNames.map((dayName, dayIndex) => {
                  return (
                    <div key={dayName} className="border-r border-border/20 last:border-r-0 relative pt-10 flex flex-col">
                      {/* Day Header */}
                      <div className="absolute top-0 left-0 right-0 h-10 border-b border-border flex items-center justify-center bg-bg-tertiary z-20">
                        <span className="text-[10px] font-bold text-text-secondary font-mono">{dayName}</span>
                      </div>

                      {/* Hour slots droppables */}
                      <div className="relative w-full h-full">
                        {hoursList.map((h) => {
                          const isOver0 = dragOverSlot?.day === dayIndex && dragOverSlot?.hour === h && dragOverSlot?.minute === 0
                          const isOver30 = dragOverSlot?.day === dayIndex && dragOverSlot?.hour === h && dragOverSlot?.minute === 30
                          
                          return (
                            <div key={h} className="w-full border-b border-border/5 relative" style={{ height: `${ROW_HEIGHT}px` }}>
                              {/* 00 min slot */}
                              <div
                                className={`absolute top-0 left-0 w-full h-1/2 transition-all duration-150 z-0 ${
                                  isOver0 ? 'bg-accent-cyan/15 border-t border-b border-dashed border-accent-cyan' : ''
                                }`}
                                onDragOver={e => {
                                  e.preventDefault()
                                  if (dragOverSlot?.day !== dayIndex || dragOverSlot?.hour !== h || dragOverSlot?.minute !== 0) {
                                    setDragOverSlot({ day: dayIndex, hour: h, minute: 0 })
                                  }
                                }}
                                onDragLeave={() => setDragOverSlot(null)}
                                onDrop={e => {
                                  e.preventDefault()
                                  setDragOverSlot(null)
                                  const classId = e.dataTransfer.getData('text/plain')
                                  if (classId) handleDropClass(classId, dayIndex, h, 0)
                                }}
                              />

                              {/* 30 min slot */}
                              <div
                                className={`absolute bottom-0 left-0 w-full h-1/2 border-t border-dashed border-border/5 transition-all duration-150 z-0 ${
                                  isOver30 ? 'bg-accent-cyan/15 border-t border-b border-dashed border-accent-cyan' : ''
                                }`}
                                onDragOver={e => {
                                  e.preventDefault()
                                  if (dragOverSlot?.day !== dayIndex || dragOverSlot?.hour !== h || dragOverSlot?.minute !== 30) {
                                    setDragOverSlot({ day: dayIndex, hour: h, minute: 30 })
                                  }
                                }}
                                onDragLeave={() => setDragOverSlot(null)}
                                onDrop={e => {
                                  e.preventDefault()
                                  setDragOverSlot(null)
                                  const classId = e.dataTransfer.getData('text/plain')
                                  if (classId) handleDropClass(classId, dayIndex, h, 30)
                                }}
                              />
                            </div>
                          )
                        })}

                        {/* Positioned class cards */}
                        {classes
                          .filter(c => c.dayOfWeek === dayIndex)
                          .map(c => {
                            const [sh, sm] = c.startTime.split(':').map(Number)
                            const [eh, em] = c.endTime.split(':').map(Number)

                            const startOffsetHours = (sh + sm / 60) - START_HOUR
                            const durationHours = (eh + em / 60) - (sh + sm / 60)

                            const top = startOffsetHours * ROW_HEIGHT
                            const height = durationHours * ROW_HEIGHT

                            const isCancelled = c.status === 'CANCELLED'
                            const isRescheduled = c.status === 'RESCHEDULED'

                            return (
                              <div
                                key={c.id}
                                draggable
                                onDragStart={e => {
                                  e.dataTransfer.setData('text/plain', c.id)
                                  e.dataTransfer.effectAllowed = 'move'
                                }}
                                onClick={() => {
                                  setShowEditClass(c)
                                  setEditingClassState({ ...c })
                                }}
                                className={`absolute left-1 right-1 rounded p-2 text-[10px] cursor-pointer transition-all duration-200 hover:scale-[1.03] hover:shadow-lg flex flex-col justify-between border border-l-[3px] z-10 ${
                                  isCancelled ? 'opacity-40' : 'opacity-100'
                                }`}
                                style={{
                                  top: `${top}px`,
                                  height: `${height}px`,
                                  backgroundColor: 'var(--bg-tertiary)',
                                  borderColor: `${c.color}35`,
                                  borderLeftColor: c.color,
                                  boxShadow: `0 3px 6px rgba(0,0,0,0.4), inset 0 0 10px ${c.color}08`,
                                }}
                              >
                                <div>
                                  <div className="flex items-center justify-between gap-1 mb-0.5">
                                    <span className={`font-bold truncate tracking-wide text-[10px] ${isCancelled ? 'line-through' : ''}`} style={{ color: c.color }}>
                                      {c.subject.toUpperCase()}
                                    </span>
                                    {c.attendance === 'PRESENT' && (
                                      <span className="w-1.5 h-1.5 rounded-full bg-accent-green shadow-[0_0_4px_#39FF14]" title="Present" />
                                    )}
                                    {c.attendance === 'ABSENT' && (
                                      <span className="w-1.5 h-1.5 rounded-full bg-accent-red shadow-[0_0_4px_#FF0055]" title="Absent" />
                                    )}
                                  </div>
                                  <span className="text-text-secondary text-[9px] font-mono leading-none block">
                                    {c.startTime} - {c.endTime}
                                  </span>
                                </div>

                                <div className="flex items-center justify-between text-[8px] mt-1 text-text-muted">
                                  <span className="truncate">{c.room ? c.room.toUpperCase() : 'N/A'}</span>
                                  <div className="flex gap-1">
                                    {isCancelled && <span className="text-accent-red font-bold font-mono">CXL</span>}
                                    {isRescheduled && <span className="text-accent-amber font-bold font-mono">RSC</span>}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Add Class Modal */}
        {showAddClass && (
          <div className="modal-overlay" onClick={() => setShowAddClass(false)}>
            <div className="modal-panel font-mono text-xs text-text-primary" onClick={e => e.stopPropagation()}>
              <h3 className="text-sm font-bold mb-6 text-text-primary">{"// SCHEDULE_NEW_CLASS"}</h3>
              <div className="space-y-4">
                <div>
                  <label className="label">Subject Name</label>
                  <input className="input" value={newClass.subject} onChange={e => setNewClass({ ...newClass, subject: e.target.value })} placeholder="e.g. Data Structures" />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Day of Week</label>
                    <select className="input text-text-primary" value={newClass.dayOfWeek} onChange={e => setNewClass({ ...newClass, dayOfWeek: parseInt(e.target.value) })}>
                      {dayNames.map((d, i) => <option key={i} value={i}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Room / Venue</label>
                    <input className="input" value={newClass.room} onChange={e => setNewClass({ ...newClass, room: e.target.value })} placeholder="e.g. Lab 404" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Start Time</label>
                    <input type="time" className="input" value={newClass.startTime} onChange={e => setNewClass({ ...newClass, startTime: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">End Time</label>
                    <input type="time" className="input" value={newClass.endTime} onChange={e => setNewClass({ ...newClass, endTime: e.target.value })} />
                  </div>
                </div>

                <div>
                  <label className="label">Theme Color</label>
                  <div className="flex gap-2 mt-1">
                    {colorPresets.map(cp => (
                      <button
                        key={cp.value}
                        type="button"
                        className="w-6 h-6 rounded-full cursor-pointer transition border border-black"
                        style={{
                          backgroundColor: cp.value,
                          transform: newClass.color === cp.value ? 'scale(1.2)' : 'none',
                          boxShadow: newClass.color === cp.value ? `0 0 8px ${cp.value}` : 'none',
                          borderColor: newClass.color === cp.value ? '#FFF' : 'transparent',
                        }}
                        onClick={() => setNewClass({ ...newClass, color: cp.value })}
                        title={cp.name}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <button type="button" className="btn btn-ghost" onClick={() => setShowAddClass(false)}>Cancel</button>
                  <button type="button" className="btn btn-primary" onClick={addClass} disabled={!newClass.subject || !newClass.startTime || !newClass.endTime}>Confirm</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Class Modal */}
        {showEditClass && editingClassState && (
          <div className="modal-overlay" onClick={() => setShowEditClass(null)}>
            <div className="modal-panel font-mono text-xs text-text-primary" onClick={e => e.stopPropagation()}>
              <h3 className="text-sm font-bold mb-6 text-text-primary">{"// EDIT_CLASS_BLOCK"}</h3>
              <div className="space-y-4">
                <div>
                  <label className="label">Subject Name</label>
                  <input className="input" value={editingClassState.subject} onChange={e => setEditingClassState({ ...editingClassState, subject: e.target.value })} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Day of Week</label>
                    <select className="input text-text-primary" value={editingClassState.dayOfWeek} onChange={e => setEditingClassState({ ...editingClassState, dayOfWeek: parseInt(e.target.value) })}>
                      {dayNames.map((d, i) => <option key={i} value={i}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Room / Venue</label>
                    <input className="input" value={editingClassState.room || ''} onChange={e => setEditingClassState({ ...editingClassState, room: e.target.value })} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Start Time</label>
                    <input type="time" className="input" value={editingClassState.startTime} onChange={e => setEditingClassState({ ...editingClassState, startTime: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">End Time</label>
                    <input type="time" className="input" value={editingClassState.endTime} onChange={e => setEditingClassState({ ...editingClassState, endTime: e.target.value })} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Attendance Status</label>
                    <select className="input text-text-primary" value={editingClassState.attendance} onChange={e => setEditingClassState({ ...editingClassState, attendance: e.target.value })}>
                      <option value="PENDING">Pending Log</option>
                      <option value="PRESENT">Present</option>
                      <option value="ABSENT">Absent</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Schedule Status</label>
                    <select className="input text-text-primary" value={editingClassState.status} onChange={e => setEditingClassState({ ...editingClassState, status: e.target.value })}>
                      <option value="ACTIVE">Active (Scheduled)</option>
                      <option value="RESCHEDULED">Rescheduled</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">Theme Color</label>
                  <div className="flex gap-2 mt-1">
                    {colorPresets.map(cp => (
                      <button
                        key={cp.value}
                        type="button"
                        className="w-6 h-6 rounded-full cursor-pointer transition border border-black"
                        style={{
                          backgroundColor: cp.value,
                          transform: editingClassState.color === cp.value ? 'scale(1.2)' : 'none',
                          boxShadow: editingClassState.color === cp.value ? `0 0 8px ${cp.value}` : 'none',
                          borderColor: editingClassState.color === cp.value ? '#FFF' : 'transparent',
                        }}
                        onClick={() => setEditingClassState({ ...editingClassState, color: cp.value })}
                        title={cp.name}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 justify-between pt-4 border-t border-border">
                  <button type="button" className="btn btn-ghost text-accent-red hover:bg-accent-red/5 hover:border-accent-red" onClick={() => {
                    if (confirm('Delete this class schedule permanently?')) {
                      deleteClass(editingClassState.id)
                    }
                  }}>
                    Delete Class
                  </button>
                  <div className="flex gap-2">
                    <button type="button" className="btn btn-ghost" onClick={closeEditClass}>Cancel</button>
                    <button type="button" className="btn btn-primary" onClick={() => updateClass(editingClassState.id, editingClassState)}>Save Changes</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
