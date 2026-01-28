import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    const vibeId = params.id

    const vibe = await prisma.vibe.findUnique({
      where: { id: vibeId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            image: true,
            bio: true,
            phone: true,
            email: true,
            instagram: true,
            twitter: true,
          },
        },
        winner: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            instagram: true,
            twitter: true,
          },
        },
        bids: {
          orderBy: { amount: 'desc' },
          take: 20,
          include: {
            bidder: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        _count: {
          select: { bids: true },
        },
      },
    })

    if (!vibe) {
      return NextResponse.json({ error: 'Vibe not found' }, { status: 404 })
    }

    // Determine user permissions
    const isCreator = session?.user?.id === vibe.creatorId
    const isWinner = session?.user?.id === vibe.winnerUserId

    // Check if payment is completed
    const payment = vibe.winnerUserId
      ? await prisma.payment.findFirst({
          where: {
            vibeId,
            payerId: vibe.winnerUserId,
            status: 'SUCCESS',
          },
        })
      : null

    const isPaid = !!payment

    // Only show contact info if:
    // 1. User is the creator and payment is complete, OR
    // 2. User is the winner and payment is complete
    const contactsUnlocked = isPaid && (isCreator || isWinner)

    // Remove sensitive info if contacts not unlocked
    const response: any = {
      ...vibe,
      canBid: !isCreator && vibe.status === 'ACTIVE',
      canSelectWinner: isCreator && vibe.status === 'ENDED' && !vibe.winnerUserId,
      canPay: isWinner && vibe.status === 'ENDED' && !isPaid,
      contactsUnlocked,
    }

    // Hide contact info if not unlocked
    if (!contactsUnlocked) {
      if (response.creator) {
        delete response.creator.phone
        delete response.creator.email
        delete response.creator.instagram
        delete response.creator.twitter
      }
      if (response.winner) {
        delete response.winner.phone
        delete response.winner.email
        delete response.winner.instagram
        delete response.winner.twitter
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Vibe fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vibe' },
      { status: 500 }
    )
  }
}