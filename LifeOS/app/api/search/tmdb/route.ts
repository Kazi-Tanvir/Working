import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Search TMDB for movies and TV shows
 * Requires TMDB_API_KEY in .env
 */
export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl
    const q = url.searchParams.get('q')
    if (!q) return NextResponse.json({ results: [] })

    const apiKey = process.env.TMDB_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'TMDB_API_KEY not set. Add it to your .env file.' }, { status: 400 })

    // Multi-search endpoint search for both movie and tv
    const res = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(q)}&language=en-US&page=1`)
    if (!res.ok) return NextResponse.json({ error: 'TMDB API error' }, { status: res.status })

    const data = await res.json()
    const results = (data.results || [])
      .filter((item: Record<string, unknown>) => item.media_type === 'movie' || item.media_type === 'tv')
      .map((item: Record<string, unknown>) => {
        const isMovie = item.media_type === 'movie'
        const title = isMovie ? (item.title as string) : (item.name as string)
        const dateStr = isMovie ? (item.release_date as string) : (item.first_air_date as string)
        const score = typeof item.vote_average === 'number' ? item.vote_average : null
        
        return {
          externalId: String(item.id),
          externalSource: 'tmdb',
          title,
          coverUrl: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
          score,
          type: isMovie ? 'MOVIE' : 'SERIES',
          releaseDate: dateStr,
        }
      })

    return NextResponse.json({ results })
  } catch (error) {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
