import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { VibeStatus } from '@prisma/client'
import { v4 as uuid } from 'uuid'

// This route can be hit manually or via a cron job
// In production, set up a cron job to hit this endpoint every minute
export async function POST(req: NextRequest) {
  try {
    // Optional: Add a secret key check for production
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()

    // Find and update expired active auctions
    const expiredVibes = await prisma.vibe.findMany({
      where: {
        status: VibeStatus.ACTIVE,
        endAt: { lt: now },
      },
    })

    if (expiredVibes.length > 0) {
      await prisma.vibe.updateMany({
        where: {
          id: { in: expiredVibes.map(v => v.id) },
        },
        data: {
          status: VibeStatus.ENDED,
        },
      })

      // Log the updates
      await prisma.auditLog.createMany({
        data: expiredVibes.map(vibe => ({
          id: uuid(),
          action: 'VIBE_ENDED_AUTO',
          meta: JSON.stringify({ vibeId: vibe.id, title: vibe.title }),
        })),
      })
    }

    // Find vibes where payment deadline passed
    // Note: We don't auto-change winners, just flag them
    const overduePayments = await prisma.vibe.findMany({
      where: {
        status: VibeStatus.ENDED,
        winnerUserId: { not: null },
        paymentDueAt: { lt: now },
      },
      select: {
        id: true,
        title: true,
        winnerUserId: true,
        paymentDueAt: true,
      },
    })

    return NextResponse.json({
      message: 'Cron tick completed',
      vibesEnded: expiredVibes.length,
      overduePayments: overduePayments.length,
      overdueVibeIds: overduePayments.map(v => v.id),
    })
  } catch (error) {
    console.error('Cron tick error:', error)
    return NextResponse.json(
      { error: 'Cron tick failed' },
      { status: 500 }
    )
  }
}

// Allow GET for easy manual testing in dev
export async function GET(req: NextRequest) {
  return POST(req)
}
