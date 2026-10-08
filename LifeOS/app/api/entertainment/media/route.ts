import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl
    const status = url.searchParams.get('status')
    const type = url.searchParams.get('type')
    const take = parseInt(url.searchParams.get('take') || '50')
    const skip = parseInt(url.searchParams.get('skip') || '0')

    const where: Record<string, unknown> = {}
    if (status && status !== 'all') where.status = status
    if (type && type !== 'all') where.type = type

    const [media, total] = await Promise.all([
      prisma.mediaEntry.findMany({ where, orderBy: { updatedAt: 'desc' }, take, skip }),
      prisma.mediaEntry.count({ where }),
    ])

    return NextResponse.json({ media, total })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch media' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const entry = await prisma.mediaEntry.create({ data: body })
    return NextResponse.json(entry, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create media entry' }, { status: 500 })
  }
}
