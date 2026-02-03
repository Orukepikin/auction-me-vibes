import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { v4 as uuid } from 'uuid'

// Start or get conversation for a vibe
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
    })

    if (!vibe) {
      return NextResponse.json({ error: 'Vibe not found' }, { status: 404 })
    }

    // Check if user is creator or winner
    const isCreator = vibe.creatorId === session.user.id
    const isWinner = vibe.winnerUserId === session.user.id

    if (!isCreator && !isWinner) {
      return NextResponse.json(
        { error: 'Only creator and winner can message' },
        { status: 403 }
      )
    }

    // Must have a winner selected
    if (!vibe.winnerUserId) {
      return NextResponse.json(
        { error: 'No winner selected yet' },
        { status: 400 }
      )
    }

    // Check if conversation already exists
    let conversation = await prisma.conversation.findUnique({
      where: { vibeId },
    })

    if (!conversation) {
      // Create new conversation
      conversation = await prisma.conversation.create({
        data: {
          id: uuid(),
          vibeId,
          user1Id: vibe.creatorId,
          user2Id: vibe.winnerUserId,
        },
      })
    }

    return NextResponse.json({ conversationId: conversation.id })
  } catch (error) {
    console.error('Start conversation error:', error)
    return NextResponse.json(
      { error: 'Failed to start conversation' },
      { status: 500 }
    )
  }
}
