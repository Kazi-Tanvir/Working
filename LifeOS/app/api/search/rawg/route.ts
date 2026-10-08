import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Search RAWG for games
 * Requires RAWG_API_KEY in .env
 */
export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl
    const q = url.searchParams.get('q')
    if (!q) return NextResponse.json({ results: [] })

    const apiKey = process.env.RAWG_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'RAWG_API_KEY not set. Add it to your .env file.' }, { status: 400 })

    const res = await fetch(`https://api.rawg.io/api/games?key=${apiKey}&search=${encodeURIComponent(q)}&page_size=10`)
    if (!res.ok) return NextResponse.json({ error: 'RAWG API error' }, { status: res.status })

    const data = await res.json()
    const results = (data.results || []).map((g: Record<string, unknown>) => ({
      externalId: String(g.id),
      externalSource: 'rawg',
      title: g.name,
      coverUrl: g.background_image,
      score: typeof g.metacritic === 'number' ? (g.metacritic as number) / 10 : null,
      type: 'PC_GAME',
    }))

    return NextResponse.json({ results })
  } catch (error) {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
