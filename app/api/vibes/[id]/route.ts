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

    console.log('Fetching vibe with ID:', vibeId)

    const vibe = await prisma.vibe.findUnique({
      where: { id: vibeId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
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
            username: true,
            image: true,
            phone: true,
            email: true,
            instagram: true,
            twitter: true,
          },
        },
        bids: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            bidder: {
              select: {
                id: true,
                name: true,
                username: true,
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
      console.log('Vibe not found for ID:', vibeId)
      return NextResponse.json({ error: 'Vibe not found' }, { status: 404 })
    }

    const isCreator = session?.user?.id === vibe.creatorId
    const isWinner = session?.user?.id === vibe.winnerUserId
    const isPaidOrCompleted = vibe.status === 'PAID' || vibe.status === 'COMPLETED'

    // Build response
    const response: any = { ...vibe }

    // Hide contact info unless paid and user is creator or winner
    if (!isPaidOrCompleted || (!isCreator && !isWinner)) {
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

    // Add permission flags
    response.canBid = session?.user?.id && 
                      vibe.status === 'ACTIVE' && 
                      session.user.id !== vibe.creatorId
    response.canSelectWinner = isCreator && vibe.status === 'ENDED' && !vibe.winnerUserId
    response.canPay = isWinner && vibe.status === 'ENDED' && vibe.winnerUserId
    response.contactsUnlocked = isPaidOrCompleted && (isCreator || isWinner)

    return NextResponse.json(response)
  } catch (error) {
    console.error('Get vibe error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vibe' },
      { status: 500 }
    )
  }
}
