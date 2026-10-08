import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl
    const month = url.searchParams.get('month') // "2026-06"

    const allTxns = await prisma.transaction.findMany()

    // Filter for month if specified
    let monthTxns = allTxns
    if (month) {
      const [y, m] = month.split('-').map(Number)
      const start = new Date(y, m - 1, 1)
      const end = new Date(y, m, 1)
      monthTxns = allTxns.filter(t => {
        const d = new Date(t.date)
        return d >= start && d < end
      })
    }

    const nonCorrectionTxns = monthTxns.filter(t => !t.isBalanceCorrection)

    // Monthly summary
    const totalIncome = nonCorrectionTxns.filter(t => t.isIncome).reduce((s, t) => s + t.amount, 0)
    const totalExpense = nonCorrectionTxns.filter(t => !t.isIncome).reduce((s, t) => s + Math.abs(t.amount), 0)
    const savingsDelta = totalIncome - totalExpense

    // Account balances (all time)
    const accounts: Record<string, number> = {}
    for (const t of allTxns) {
      accounts[t.account] = (accounts[t.account] || 0) + t.amount
    }
    const netWorth = Object.values(accounts).reduce((s, v) => s + v, 0)

    // Income by source (subcategory)
    const incomeBySrc: Record<string, number> = {}
    for (const t of nonCorrectionTxns.filter(t => t.isIncome)) {
      const src = t.subcategory || 'Misc'
      incomeBySrc[src] = (incomeBySrc[src] || 0) + t.amount
    }

    // Expense by category
    const expenseByCategory: Record<string, { total: number; subs: Record<string, number> }> = {}
    for (const t of nonCorrectionTxns.filter(t => !t.isIncome)) {
      if (!expenseByCategory[t.category]) expenseByCategory[t.category] = { total: 0, subs: {} }
      expenseByCategory[t.category].total += Math.abs(t.amount)
      const sub = t.subcategory || '(uncategorized)'
      expenseByCategory[t.category].subs[sub] = (expenseByCategory[t.category].subs[sub] || 0) + Math.abs(t.amount)
    }

    // Expense by account
    const expenseByAccount: Record<string, number> = {}
    for (const t of nonCorrectionTxns.filter(t => !t.isIncome)) {
      expenseByAccount[t.account] = (expenseByAccount[t.account] || 0) + Math.abs(t.amount)
    }

    // Available months
    const monthSet = new Set<string>()
    for (const t of allTxns) {
      const d = new Date(t.date)
      monthSet.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    }
    const availableMonths = Array.from(monthSet).sort().reverse()

    return NextResponse.json({
      summary: {
        totalIncome: Math.round(totalIncome),
        totalExpense: Math.round(totalExpense),
        savingsDelta: Math.round(savingsDelta),
      },
      accounts: Object.entries(accounts).map(([name, balance]) => ({ name, balance: Math.round(balance) })),
      netWorth: Math.round(netWorth),
      incomeBySource: Object.entries(incomeBySrc)
        .map(([source, amount]) => ({ source, amount: Math.round(amount) }))
        .sort((a, b) => b.amount - a.amount),
      expenseByCategory: Object.entries(expenseByCategory)
        .map(([category, data]) => ({
          category,
          total: Math.round(data.total),
          subcategories: Object.entries(data.subs)
            .map(([name, amount]) => ({ name, amount: Math.round(amount) }))
            .sort((a, b) => b.amount - a.amount),
        }))
        .sort((a, b) => b.total - a.total),
      expenseByAccount: Object.entries(expenseByAccount)
        .map(([account, amount]) => ({ account, amount: Math.round(amount) }))
        .sort((a, b) => b.amount - a.amount),
      availableMonths,
    })
  } catch (error) {
    console.error('Finance stats error:', error)
    return NextResponse.json({ error: 'Failed to compute finance stats' }, { status: 500 })
  }
}
