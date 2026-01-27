import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { selectWinnerSchema } from '@/lib/validations'
import { v4 as uuid } from 'uuid'
import { VibeStatus } from '@prisma/client'

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
    const userId = session.user.id

    const body = await req.json()
    
    // Validate input
    const result = selectWinnerSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const { winnerId } = result.data

    // Get vibe
    const vibe = await prisma.vibe.findUnique({
      where: { id: vibeId },
      include: {
        bids: {
          orderBy: { amount: 'desc' },
          take: 10,
        },
      },
    })

    if (!vibe) {
      return NextResponse.json({ error: 'Vibe not found' }, { status: 404 })
    }

    // Validate permissions
    if (vibe.creatorId !== userId) {
      return NextResponse.json(
        { error: 'Only the creator can select a winner' },
        { status: 403 }
      )
    }

    if (vibe.status !== VibeStatus.ENDED) {
      return NextResponse.json(
        { error: 'Auction must be ended to select winner' },
        { status: 400 }
      )
    }

    if (vibe.winnerUserId) {
      return NextResponse.json(
        { error: 'Winner already selected' },
        { status: 400 }
      )
    }

    // Verify winner is a valid bidder
    const winnerBid = vibe.bids.find(bid => bid.bidderId === winnerId)
    if (!winnerBid) {
      return NextResponse.json(
        { error: 'Selected winner must be a bidder' },
        { status: 400 }
      )
    }

    // Calculate payment deadline (24 hours from now)
    const paymentDueAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    // Update vibe with winner
    const updatedVibe = await prisma.vibe.update({
      where: { id: vibeId },
      data: {
        winnerUserId: winnerId,
        currentBid: winnerBid.amount,
        selectedAt: new Date(),
        paymentDueAt,
      },
      include: {
        winner: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
    })

    // Log selection
    await prisma.auditLog.create({
      data: {
        id: uuid(),
        userId,
        action: 'WINNER_SELECTED',
        meta: JSON.stringify({ vibeId, winnerId, amount: winnerBid.amount }),
      },
    })

    return NextResponse.json({
      message: 'Winner selected successfully',
      vibe: updatedVibe,
      paymentDueAt,
    })
  } catch (error) {
    console.error('Select winner error:', error)
    return NextResponse.json(
      { error: 'Failed to select winner' },
      { status: 500 }
    )
  }
}
