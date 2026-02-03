import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { v4 as uuid } from 'uuid'

// Create a dispute
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
    const { reason, description } = await req.json()

    if (!reason || !description) {
      return NextResponse.json({ error: 'Reason and description required' }, { status: 400 })
    }

    const vibe = await prisma.vibe.findUnique({
      where: { id: vibeId },
    })

    if (!vibe) {
      return NextResponse.json({ error: 'Vibe not found' }, { status: 404 })
    }

    // Only creator or winner can create dispute
    const isCreator = vibe.creatorId === session.user.id
    const isWinner = vibe.winnerUserId === session.user.id

    if (!isCreator && !isWinner) {
      return NextResponse.json({ error: 'Only parties involved can create dispute' }, { status: 403 })
    }

    // Must be paid or in progress
    if (vibe.status !== 'PAID' && vibe.status !== 'IN_PROGRESS') {
      return NextResponse.json({ error: 'Cannot dispute at this stage' }, { status: 400 })
    }

    // Check for existing open dispute
    const existingDispute = await prisma.dispute.findFirst({
      where: {
        vibeId,
        status: { in: ['OPEN', 'UNDER_REVIEW'] },
      },
    })

    if (existingDispute) {
      return NextResponse.json({ error: 'A dispute is already open' }, { status: 400 })
    }

    const againstId = isCreator ? vibe.winnerUserId : vibe.creatorId

    if (!againstId) {
      return NextResponse.json({ error: 'Cannot create dispute' }, { status: 400 })
    }

    // Create dispute
    const dispute = await prisma.dispute.create({
      data: {
        id: uuid(),
        reason,
        description,
        vibeId,
        createdById: session.user.id,
        againstId,
      },
    })

    // Update vibe status
    await prisma.vibe.update({
      where: { id: vibeId },
      data: { status: 'DISPUTED' },
    })

    // Log action
    await prisma.auditLog.create({
      data: {
        id: uuid(),
        userId: session.user.id,
        action: 'DISPUTE_CREATED',
        meta: JSON.stringify({ vibeId, disputeId: dispute.id, reason }),
      },
    })

    return NextResponse.json(dispute, { status: 201 })
  } catch (error) {
    console.error('Create dispute error:', error)
    return NextResponse.json(
      { error: 'Failed to create dispute' },
      { status: 500 }
    )
  }
}

// Get disputes for a vibe
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const vibeId = params.id

    const disputes = await prisma.dispute.findMany({
      where: { vibeId },
      include: {
        createdBy: {
          select: { id: true, name: true, image: true },
        },
        against: {
          select: { id: true, name: true, image: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(disputes)
  } catch (error) {
    console.error('Get disputes error:', error)
    return NextResponse.json(
      { error: 'Failed to get disputes' },
      { status: 500 }
    )
  }
}
