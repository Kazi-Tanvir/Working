import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const exams = await prisma.exam.findMany({ orderBy: { date: 'asc' } })
    return NextResponse.json(exams)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch exams' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const exam = await prisma.exam.create({ data: body })
    return NextResponse.json(exam, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create exam' }, { status: 500 })
  }
}
