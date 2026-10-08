import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const allMedia = await prisma.mediaEntry.findMany()

    const totalEntries = allMedia.length
    const totalHours = Math.round(allMedia.reduce((s, m) => s + (m.watchtime || 0), 0) / 60)
    const scored = allMedia.filter(m => m.score !== null)
    const avgScore = scored.length > 0
      ? Math.round((scored.reduce((s, m) => s + (m.score || 0), 0) / scored.length) * 10) / 10
      : 0
    const ongoing = allMedia.filter(m => m.status === 'ONGOING').length

    // Count by type
    const byType: Record<string, number> = {}
    for (const m of allMedia) {
      byType[m.type] = (byType[m.type] || 0) + 1
    }

    // Count by status
    const byStatus: Record<string, number> = {}
    for (const m of allMedia) {
      byStatus[m.status] = (byStatus[m.status] || 0) + 1
    }

    return NextResponse.json({
      totalEntries,
      totalHours,
      avgScore,
      ongoing,
      byType: Object.entries(byType).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count),
      byStatus: Object.entries(byStatus).map(([status, count]) => ({ status, count })).sort((a, b) => b.count - a.count),
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
