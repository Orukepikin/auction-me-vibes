import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { v4 as uuid } from 'uuid'

// Get messages for a conversation
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const conversationId = params.id

    // Get conversation and verify user is part of it
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        vibe: {
          select: {
            id: true,
            title: true,
            status: true,
            creatorId: true,
            winnerUserId: true,
          },
        },
        user1: {
          select: {
            id: true,
            name: true,
            image: true,
            isVerified: true,
            verificationLevel: true,
          },
        },
        user2: {
          select: {
            id: true,
            name: true,
            image: true,
            isVerified: true,
            verificationLevel: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Check if user is part of conversation
    if (conversation.user1Id !== session.user.id && conversation.user2Id !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        conversationId,
        receiverId: session.user.id,
        read: false,
      },
      data: { read: true },
    })

    const otherUser = conversation.user1Id === session.user.id 
      ? conversation.user2 
      : conversation.user1

    return NextResponse.json({
      id: conversation.id,
      vibe: conversation.vibe,
      otherUser,
      messages: conversation.messages,
    })
  } catch (error) {
    console.error('Get conversation error:', error)
    return NextResponse.json(
      { error: 'Failed to get conversation' },
      { status: 500 }
    )
  }
}

// Send a message
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const conversationId = params.id
    const { content } = await req.json()

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 })
    }

    // Get conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    })

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Check if user is part of conversation
    if (conversation.user1Id !== session.user.id && conversation.user2Id !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const receiverId = conversation.user1Id === session.user.id 
      ? conversation.user2Id 
      : conversation.user1Id

    // Create message
    const message = await prisma.message.create({
      data: {
        id: uuid(),
        content: content.trim(),
        conversationId,
        senderId: session.user.id,
        receiverId,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    })

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    })

    return NextResponse.json(message, { status: 201 })
  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
