import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { v4 as uuid } from 'uuid'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Get notifications for current user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get notifications from audit logs related to user
    // This includes: bids on their vibes, winning auctions, messages, etc.
    
    const userId = session.user.id

    // Get user's vibes to find bids on them
    const userVibes = await prisma.vibe.findMany({
      where: { creatorId: userId },
      select: { id: true, title: true },
    })
    const vibeIds = userVibes.map(v => v.id)

    // Get recent bids on user's vibes
    const recentBids = await prisma.bid.findMany({
      where: {
        vibeId: { in: vibeIds },
        bidderId: { not: userId }, // Not their own bids
      },
      include: {
        bidder: { select: { name: true } },
        vibe: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    // Get vibes user won
    const wonVibes = await prisma.vibe.findMany({
      where: {
        winnerUserId: userId,
        selectedAt: { not: null },
      },
      select: { id: true, title: true, selectedAt: true, creatorId: true },
      orderBy: { selectedAt: 'desc' },
      take: 5,
    })

    // Get unread messages count
    const unreadMessages = await prisma.message.count({
      where: {
        receiverId: userId,
        read: false,
      },
    })

    // Get vibes where user is creator and winner was selected (payment pending)
    const pendingPayments = await prisma.vibe.findMany({
      where: {
        creatorId: userId,
        status: 'ENDED',
        winnerUserId: { not: null },
      },
      include: {
        winner: { select: { name: true } },
      },
      take: 5,
    })

    // Build notifications array
    const notifications: any[] = []

    // Add bid notifications
    recentBids.forEach(bid => {
      notifications.push({
        id: `bid-${bid.id}`,
        type: 'bid',
        title: 'New Bid! 💰',
        message: `${bid.bidder.name} bid ₦${bid.amount.toLocaleString()} on "${bid.vibe.title}"`,
        link: `/vibe/${bid.vibe.id}`,
        read: false,
        createdAt: bid.createdAt,
      })
    })

    // Add won auction notifications
    wonVibes.forEach(vibe => {
      notifications.push({
        id: `won-${vibe.id}`,
        type: 'winner',
        title: 'You Won! 🎉',
        message: `Congratulations! You won the auction for "${vibe.title}"`,
        link: `/vibe/${vibe.id}`,
        read: false,
        createdAt: vibe.selectedAt,
      })
    })

    // Add pending payment notifications (for creators)
    pendingPayments.forEach(vibe => {
      notifications.push({
        id: `pending-${vibe.id}`,
        type: 'payment',
        title: 'Awaiting Payment 💳',
        message: `${vibe.winner?.name} needs to pay for "${vibe.title}"`,
        link: `/vibe/${vibe.id}`,
        read: false,
        createdAt: vibe.selectedAt,
      })
    })

    // Add message notification if there are unread
    if (unreadMessages > 0) {
      notifications.push({
        id: 'messages',
        type: 'message',
        title: 'New Messages 💬',
        message: `You have ${unreadMessages} unread message${unreadMessages > 1 ? 's' : ''}`,
        link: '/messages',
        read: false,
        createdAt: new Date(),
      })
    }

    // Sort by date
    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json({
      notifications: notifications.slice(0, 20),
      unreadCount: notifications.length,
    })
  } catch (error) {
    console.error('Get notifications error:', error)
    return NextResponse.json(
      { error: 'Failed to get notifications' },
      { status: 500 }
    )
  }
}
