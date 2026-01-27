import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { VibeStatus } from '@/lib/utils'
import { v4 as uuid } from 'uuid'

// This route can be hit manually or via a cron job
// It checks for ended auctions and updates their status

export async function GET(req: NextRequest) {
  try {
    // Optional: Verify cron secret for security
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      // Allow without auth if CRON_SECRET is not set (for development)
      if (cronSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const now = new Date()

    // Find all active vibes that have ended
    const endedVibes = await prisma.vibe.findMany({
      where: {
        status: VibeStatus.ACTIVE,
        endAt: { lte: now },
      },
      select: { id: true, title: true },
    })

    if (endedVibes.length === 0) {
      return NextResponse.json({ 
        message: 'No auctions to update',
        checked: 0,
        updated: 0,
      })
    }

    // Update all ended vibes
    const updateResult = await prisma.vibe.updateMany({
      where: {
        status: VibeStatus.ACTIVE,
        endAt: { lte: now },
      },
      data: {
        status: VibeStatus.ENDED,
      },
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        id: uuid(),
        action: 'CRON_TICK',
        meta: JSON.stringify({
          vibesEnded: endedVibes.map((v) => v.id),
          count: updateResult.count,
        }),
      },
    })

    return NextResponse.json({
      message: `Updated ${updateResult.count} auctions`,
      checked: endedVibes.length,
      updated: updateResult.count,
      vibes: endedVibes,
    })
  } catch (error) {
    console.error('Cron tick error:', error)
    return NextResponse.json(
      { error: 'Failed to process auctions' },
      { status: 500 }
    )
  }
}