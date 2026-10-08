import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const query = `
query ($search: String) {
  Page(page: 1, perPage: 10) {
    media(search: $search) {
      id
      title {
        english
        romaji
      }
      type
      format
      averageScore
      coverImage {
        large
      }
      episodes
      chapters
    }
  }
}
`

/**
 * Search AniList for anime and manga
 * AniList uses a GraphQL API and does not require an API key for public queries
 */
export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl
    const q = url.searchParams.get('q')
    if (!q) return NextResponse.json({ results: [] })

    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: { search: q },
      }),
    })

    if (!res.ok) return NextResponse.json({ error: 'AniList API error' }, { status: res.status })

    const { data } = await res.json()
    const mediaList = data?.Page?.media || []

    const results = mediaList.map((m: Record<string, any>) => {
      const isManga = m.type === 'MANGA'
      const isMovie = m.format === 'MOVIE'
      const type = isManga ? 'MANGA' : isMovie ? 'ANIME_MOVIE' : 'ANIME'
      const title = m.title.english || m.title.romaji
      const progressTotal = isManga ? m.chapters : m.episodes
      const progressUnit = isManga ? 'CHAPTERS' : 'EPISODES'
      const score = typeof m.averageScore === 'number' ? m.averageScore / 10 : null

      return {
        externalId: String(m.id),
        externalSource: 'anilist',
        title,
        coverUrl: m.coverImage?.large || null,
        score,
        type,
        progressTotal,
        progressUnit,
      }
    })

    return NextResponse.json({ results })
  } catch (error) {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
