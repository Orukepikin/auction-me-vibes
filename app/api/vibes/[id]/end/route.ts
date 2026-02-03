import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
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

    const vibeId = params.id

    // Get the vibe
    const vibe = await prisma.vibe.findUnique({
      where: { id: vibeId },
      include: {
        _count: { select: { bids: true } },
      },
    })

    if (!vibe) {
      return NextResponse.json({ error: 'Vibe not found' }, { status: 404 })
    }

    // Only creator can end the auction
    if (vibe.creatorId !== session.user.id) {
      return NextResponse.json({ error: 'Only the creator can end this auction' }, { status: 403 })
    }

    // Check if already ended
    if (vibe.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Auction is not active' }, { status: 400 })
    }

    // Must have at least one bid
    if (vibe._count.bids === 0) {
      return NextResponse.json({ error: 'Cannot end auction with no bids' }, { status: 400 })
    }

    // Update vibe status to ENDED
    const updatedVibe = await prisma.vibe.update({
      where: { id: vibeId },
      data: {
        status: 'ENDED',
        endAt: new Date(), // Set end time to now
      },
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        id: uuid(),
        userId: session.user.id,
        action: 'AUCTION_ENDED_EARLY',
        meta: JSON.stringify({ vibeId }),
      },
    })

    return NextResponse.json(updatedVibe)
  } catch (error) {
    console.error('End auction error:', error)
    return NextResponse.json(
      { error: 'Failed to end auction' },
      { status: 500 }
    )
  }
}
