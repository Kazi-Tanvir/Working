import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl
    const month = url.searchParams.get('month') // "2026-06"
    const category = url.searchParams.get('category')
    const account = url.searchParams.get('account')
    const type = url.searchParams.get('type') // "income" | "expense" | "all"
    const showCorrections = url.searchParams.get('showCorrections') === 'true'
    const take = parseInt(url.searchParams.get('take') || '30')
    const skip = parseInt(url.searchParams.get('skip') || '0')

    const where: Record<string, unknown> = {}

    if (month) {
      const [y, m] = month.split('-').map(Number)
      where.date = {
        gte: new Date(y, m - 1, 1),
        lt: new Date(y, m, 1),
      }
    }
    if (category) where.category = category
    if (account) where.account = account
    if (type === 'income') where.isIncome = true
    if (type === 'expense') where.isIncome = false
    if (!showCorrections) where.isBalanceCorrection = false

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { date: 'desc' },
        take,
        skip,
      }),
      prisma.transaction.count({ where }),
    ])

    return NextResponse.json({ transactions, total })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const txn = await prisma.transaction.create({ data: body })
    return NextResponse.json(txn, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
  }
}
