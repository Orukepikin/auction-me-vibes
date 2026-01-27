import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { selectWinnerSchema } from '@/lib/validations'
import { VibeStatus } from '@/lib/utils'
import { v4 as uuid } from 'uuid'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const result = selectWinnerSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid winner ID' },
        { status: 400 }
      )
    }

    const { winnerId } = result.data
    const vibeId = params.id

    const vibe = await prisma.vibe.findUnique({
      where: { id: vibeId },
      include: {
        bids: {
          where: { bidderId: winnerId },
          orderBy: { amount: 'desc' },
          take: 1,
        },
      },
    })

    if (!vibe) {
      return NextResponse.json({ error: 'Vibe not found' }, { status: 404 })
    }

    if (vibe.creatorId !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    if (vibe.status !== VibeStatus.ENDED && vibe.status !== VibeStatus.ACTIVE) {
      return NextResponse.json({ error: 'Cannot select winner for this vibe' }, { status: 400 })
    }

    if (vibe.winnerUserId) {
      return NextResponse.json({ error: 'Winner already selected' }, { status: 400 })
    }

    if (vibe.bids.length === 0) {
      return NextResponse.json({ error: 'Selected user has not bid on this vibe' }, { status: 400 })
    }

    // Set payment deadline (24 hours from now)
    const paymentDueAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    // Update vibe with winner
    const updatedVibe = await prisma.vibe.update({
      where: { id: vibeId },
      data: {
        status: VibeStatus.ENDED,
        winnerUserId: winnerId,
        selectedAt: new Date(),
        paymentDueAt,
      },
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        id: uuid(),
        userId: session.user.id,
        action: 'WINNER_SELECTED',
        meta: JSON.stringify({
          vibeId,
          winnerId,
          winningBid: vibe.bids[0].amount,
        }),
      },
    })

    return NextResponse.json(updatedVibe)
  } catch (error) {
    console.error('Select winner error:', error)
    return NextResponse.json(
      { error: 'Failed to select winner' },
      { status: 500 }
    )
  }
}
