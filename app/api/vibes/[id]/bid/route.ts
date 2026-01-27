import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { bidSchema } from '@/lib/validations'
import { v4 as uuid } from 'uuid'
import { VibeStatus, formatCurrency } from '@/lib/utils'

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const limit = rateLimitMap.get(userId)

  if (!limit || now > limit.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 60000 })
    return true
  }

  if (limit.count >= 5) {
    return false
  }

  limit.count++
  return true
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Rate limit check
    if (!checkRateLimit(session.user.id)) {
      return NextResponse.json(
        { error: 'Too many bids. Please wait a moment.' },
        { status: 429 }
      )
    }

    const body = await req.json()
    const result = bidSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid bid amount' },
        { status: 400 }
      )
    }

    const { amount } = result.data
    const vibeId = params.id

    // Get the vibe
    const vibe = await prisma.vibe.findUnique({
      where: { id: vibeId },
    })

    if (!vibe) {
      return NextResponse.json({ error: 'Vibe not found' }, { status: 404 })
    }

    if (vibe.status !== VibeStatus.ACTIVE) {
      return NextResponse.json({ error: 'Auction is not active' }, { status: 400 })
    }

    if (new Date() > new Date(vibe.endAt)) {
      return NextResponse.json({ error: 'Auction has ended' }, { status: 400 })
    }

    if (session.user.id === vibe.creatorId) {
      return NextResponse.json({ error: 'Cannot bid on your own vibe' }, { status: 400 })
    }

    const minBid = vibe.currentBid + vibe.minIncrement
    if (amount < minBid) {
      return NextResponse.json(
        { error: `Minimum bid is ${formatCurrency(minBid)}` },
        { status: 400 }
      )
    }

    // Create the bid and update vibe
    const bid = await prisma.bid.create({
      data: {
        id: uuid(),
        vibeId,
        bidderId: session.user.id,
        amount,
      },
    })

    await prisma.vibe.update({
      where: { id: vibeId },
      data: { currentBid: amount },
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        id: uuid(),
        userId: session.user.id,
        action: 'BID_PLACED',
        meta: JSON.stringify({ vibeId, amount }),
      },
    })

    return NextResponse.json(bid, { status: 201 })
  } catch (error) {
    console.error('Bid error:', error)
    return NextResponse.json(
      { error: 'Failed to place bid' },
      { status: 500 }
    )
  }
}
