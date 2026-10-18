// src/app/api/cron/cleanup-leads/route.ts
// Cron: Privacy purge for IncompleteOrder leads older than 30 days

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized cron' }, { status: 401 });
    }

    const now = new Date();
    const result = await prisma.incompleteOrder.deleteMany({
      where: {
        expiresAt: { lt: now },
      },
    });

    return NextResponse.json({
      success: true,
      purgedCount: result.count,
      timestamp: now.toISOString(),
    });
  } catch (err: unknown) {
    console.error('Lead cleanup cron error:', err);
    return NextResponse.json({ error: 'Cron cleanup failed' }, { status: 500 });
  }
}
