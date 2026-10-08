import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Academic stats
    const pendingExams = await prisma.exam.count({ where: { status: 'PENDING' } })
    const nextExam = await prisma.exam.findFirst({
      where: { status: 'PENDING' },
      orderBy: { date: 'asc' },
    })
    const pendingAssignments = await prisma.assignment.count({ where: { completed: false } })
    const topAssignments = await prisma.assignment.findMany({
      where: { completed: false },
      orderBy: { deadline: 'asc' },
      take: 3,
    })
    const nextClass = await prisma.classSchedule.findFirst({
      where: { isActive: true },
      orderBy: { dayOfWeek: 'asc' },
    })

    // Entertainment stats
    const ongoingMedia = await prisma.mediaEntry.count({ where: { status: 'ONGOING' } })
    const totalMedia = await prisma.mediaEntry.count()
    const ongoingMediaList = await prisma.mediaEntry.findMany({
      where: { status: 'ONGOING' },
      take: 3,
      orderBy: { updatedAt: 'desc' },
    })

    // Project stats
    const activeProjects = await prisma.project.count({ where: { status: 'IN_PROGRESS' } })
    const projects = await prisma.project.findMany({
      where: { status: 'IN_PROGRESS' },
      take: 3,
      orderBy: { updatedAt: 'desc' },
    })
    const avgProgress = projects.length > 0
      ? Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length)
      : 0

    // Finance stats
    const allTransactions = await prisma.transaction.findMany()
    const netWorth = allTransactions.reduce((sum, t) => sum + t.amount, 0)

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const monthTxns = allTransactions.filter(t => {
      const d = new Date(t.date)
      return d >= monthStart && d <= monthEnd && !t.isBalanceCorrection
    })
    const monthIncome = monthTxns.filter(t => t.isIncome).reduce((s, t) => s + t.amount, 0)
    const monthExpense = monthTxns.filter(t => !t.isIncome).reduce((s, t) => s + Math.abs(t.amount), 0)
    const savingsDelta = monthIncome - monthExpense

    // Account balances
    const accounts: Record<string, number> = {}
    for (const t of allTransactions) {
      accounts[t.account] = (accounts[t.account] || 0) + t.amount
    }

    // Expense categories for current month
    const expensesByCategory: Record<string, number> = {}
    for (const t of monthTxns) {
      if (!t.isIncome) {
        const cat = t.category
        expensesByCategory[cat] = (expensesByCategory[cat] || 0) + Math.abs(t.amount)
      }
    }
    const categoryBreakdown = Object.entries(expensesByCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, amount]) => ({ name, amount }))

    // Media stats (watchtime)
    const totalWatchtime = await prisma.mediaEntry.aggregate({
      _sum: { watchtime: true },
    })

    // Activity feed
    const recentActivity = await prisma.activityFeed.findMany({
      orderBy: { timestamp: 'desc' },
      take: 10,
    })

    return NextResponse.json({
      academic: {
        pendingExams,
        nextExam,
        pendingAssignments,
        topAssignments,
        nextClass,
      },
      entertainment: {
        ongoing: ongoingMedia,
        total: totalMedia,
        ongoingList: ongoingMediaList,
      },
      projects: {
        active: activeProjects,
        avgProgress,
        list: projects,
      },
      finance: {
        netWorth: Math.round(netWorth),
        savingsDelta: Math.round(savingsDelta),
        monthIncome: Math.round(monthIncome),
        monthExpense: Math.round(monthExpense),
        accounts,
        categoryBreakdown,
      },
      media: {
        totalWatchtime: Math.round((totalWatchtime._sum.watchtime || 0) / 60), // hours
      },
      recentActivity,
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json({ error: 'Failed to load dashboard stats' }, { status: 500 })
  }
}
