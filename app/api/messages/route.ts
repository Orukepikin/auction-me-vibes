import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Get all conversations for current user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { user1Id: session.user.id },
          { user2Id: session.user.id },
        ],
      },
      include: {
        vibe: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        user1: {
          select: {
            id: true,
            name: true,
            image: true,
            isVerified: true,
          },
        },
        user2: {
          select: {
            id: true,
            name: true,
            image: true,
            isVerified: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            content: true,
            createdAt: true,
            read: true,
            senderId: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    // Format conversations with other user info
    const formattedConversations = conversations.map((conv) => {
      const otherUser = conv.user1Id === session.user.id ? conv.user2 : conv.user1
      const lastMessage = conv.messages[0]

      return {
        id: conv.id,
        vibeId: conv.vibeId,
        vibeTitle: conv.vibe.title,
        vibeStatus: conv.vibe.status,
        otherUser,
        lastMessage: lastMessage ? {
          content: lastMessage.content,
          createdAt: lastMessage.createdAt,
          isFromMe: lastMessage.senderId === session.user.id,
        } : null,
        unreadCount: 0,
        updatedAt: conv.updatedAt,
      }
    })

    return NextResponse.json(formattedConversations)
  } catch (error) {
    console.error('Get conversations error:', error)
    return NextResponse.json(
      { error: 'Failed to get conversations' },
      { status: 500 }
    )
  }
}
