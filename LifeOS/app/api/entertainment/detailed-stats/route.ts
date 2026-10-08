import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const allMedia = await prisma.mediaEntry.findMany({
      orderBy: { updatedAt: 'desc' },
    })

    const buckets = {
      ANIME: { key: 'ANIME', totalEntries: 0, totalMinutes: 0, meanScore: 0, statusCounts: { ONGOING: 0, COMPLETED: 0, ON_HOLD: 0, DROPPED: 0, PLAN_TO_CONSUME: 0 }, episodesWatched: 0, lastUpdates: [] as typeof allMedia },
      MANGA: { key: 'MANGA', totalEntries: 0, totalMinutes: 0, meanScore: 0, statusCounts: { ONGOING: 0, COMPLETED: 0, ON_HOLD: 0, DROPPED: 0, PLAN_TO_CONSUME: 0 }, episodesWatched: 0, lastUpdates: [] as typeof allMedia },
      GAMES: { key: 'GAMES', totalEntries: 0, totalMinutes: 0, meanScore: 0, statusCounts: { ONGOING: 0, COMPLETED: 0, ON_HOLD: 0, DROPPED: 0, PLAN_TO_CONSUME: 0 }, episodesWatched: 0, lastUpdates: [] as typeof allMedia },
      MOVIES: { key: 'MOVIES', totalEntries: 0, totalMinutes: 0, meanScore: 0, statusCounts: { ONGOING: 0, COMPLETED: 0, ON_HOLD: 0, DROPPED: 0, PLAN_TO_CONSUME: 0 }, episodesWatched: 0, lastUpdates: [] as typeof allMedia },
      SERIES: { key: 'SERIES', totalEntries: 0, totalMinutes: 0, meanScore: 0, statusCounts: { ONGOING: 0, COMPLETED: 0, ON_HOLD: 0, DROPPED: 0, PLAN_TO_CONSUME: 0 }, episodesWatched: 0, lastUpdates: [] as typeof allMedia },
    }

    const scoresSum: Record<string, number> = { ANIME: 0, MANGA: 0, GAMES: 0, MOVIES: 0, SERIES: 0 }
    const scoresCount: Record<string, number> = { ANIME: 0, MANGA: 0, GAMES: 0, MOVIES: 0, SERIES: 0 }

    for (const m of allMedia) {
      let bKey: keyof typeof buckets = 'ANIME'

      if (m.type === 'ANIME' || m.type === 'ANIME_MOVIE') bKey = 'ANIME'
      else if (m.type === 'MANGA') bKey = 'MANGA'
      else if (m.type === 'PC_GAME' || m.type === 'MOBILE_GAME') bKey = 'GAMES'
      else if (m.type === 'MOVIE') bKey = 'MOVIES'
      else if (m.type === 'SERIES') bKey = 'SERIES'

      const b = buckets[bKey]
      b.totalEntries++
      b.totalMinutes += m.watchtime || 0
      b.episodesWatched += m.progressCurrent || 0

      const status = m.status as keyof typeof b.statusCounts
      if (b.statusCounts[status] !== undefined) {
        b.statusCounts[status]++
      }

      if (m.score !== null) {
        scoresSum[bKey] += m.score
        scoresCount[bKey]++
      }

      if (b.lastUpdates.length < 3) {
        b.lastUpdates.push(m)
      }
    }

    // Compute average scores
    for (const k of Object.keys(buckets) as (keyof typeof buckets)[]) {
      const count = scoresCount[k]
      buckets[k].meanScore = count > 0 ? Math.round((scoresSum[k] / count) * 100) / 100 : 0
    }

    return NextResponse.json({
      success: true,
      stats: buckets,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to calculate detailed stats' }, { status: 500 })
  }
}
