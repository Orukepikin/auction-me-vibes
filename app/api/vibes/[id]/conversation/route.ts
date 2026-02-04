import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { v4 as uuid } from 'uuid'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Create or get conversation for a vibe
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
      select: {
        id: true,
        title: true,
        creatorId: true,
        winnerUserId: true,
        status: true,
      },
    })

    if (!vibe) {
      return NextResponse.json({ error: 'Vibe not found' }, { status: 404 })
    }

    // Check if user is creator or winner
    const isCreator = vibe.creatorId === session.user.id
    const isWinner = vibe.winnerUserId === session.user.id

    if (!isCreator && !isWinner) {
      return NextResponse.json(
        { error: 'Only the creator or winner can start a conversation' },
        { status: 403 }
      )
    }

    // Winner must be selected
    if (!vibe.winnerUserId) {
      return NextResponse.json(
        { error: 'No winner selected yet. Conversation will be available after a winner is chosen.' },
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

      // Create a system message
      await prisma.message.create({
        data: {
          id: uuid(),
          conversationId: conversation.id,
          senderId: vibe.creatorId,
          receiverId: vibe.winnerUserId,
          content: `Conversation started for "${vibe.title}". You can now discuss the details of the service.`,
        },
      })
    }

    return NextResponse.json({
      conversationId: conversation.id,
      vibeId: vibe.id,
      vibeTitle: vibe.title,
    })
  } catch (error) {
    console.error('Create conversation error:', error)
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    )
  }
}

// Get conversation for a vibe
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

    const conversation = await prisma.conversation.findUnique({
      where: { vibeId },
      include: {
        vibe: {
          select: { title: true, status: true, creatorId: true, winnerUserId: true },
        },
      },
    })

    if (!conversation) {
      return NextResponse.json({ error: 'No conversation found' }, { status: 404 })
    }

    // Check if user is part of conversation
    if (conversation.user1Id !== session.user.id && conversation.user2Id !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    return NextResponse.json(conversation)
  } catch (error) {
    console.error('Get conversation error:', error)
    return NextResponse.json(
      { error: 'Failed to get conversation' },
      { status: 500 }
    )
  }
}
