import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Get user with wallet balance
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { walletBalance: true },
    })

    // Count active auctions created by user
    const activeAuctions = await prisma.vibe.count({
      where: { creatorId: userId, status: 'ACTIVE' },
    })

    // Count ended auctions awaiting winner selection
    const endedAuctions = await prisma.vibe.count({
      where: { creatorId: userId, status: 'ENDED', winnerUserId: null },
    })

    // Count total bids placed by user
    const totalBidsPlaced = await prisma.bid.count({
      where: { bidderId: userId },
    })

    // Count vibes won
    const vibesWon = await prisma.vibe.count({
      where: { winnerUserId: userId },
    })

    // Get pending payments (vibes user won but hasn't paid)
    const pendingPayments = await prisma.vibe.findMany({
      where: {
        winnerUserId: userId,
        status: 'ENDED',
      },
      select: {
        id: true,
        title: true,
        currentBid: true,
        paymentDueAt: true,
      },
    })

    // Get total spent from completed payments
    const completedPayments = await prisma.payment.aggregate({
      where: { payerId: userId, status: 'SUCCESS' },
      _sum: { amount: true },
    })

    // Get recent bids
    const recentBids = await prisma.bid.findMany({
      where: { bidderId: userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        vibe: {
          select: {
            id: true,
            title: true,
            status: true,
            currentBid: true,
            winnerUserId: true,
          },
        },
      },
    })

    // Get recent vibes created by user
    const recentVibes = await prisma.vibe.findMany({
      where: { creatorId: userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        status: true,
        currentBid: true,
        endAt: true,
        _count: { select: { bids: true } },
      },
    })

    // Count winning bids
    const winningBidsCount = recentBids.filter(
      bid => bid.vibe.winnerUserId === userId || 
             (bid.vibe.status === 'ACTIVE' && bid.amount === bid.vibe.currentBid)
    ).length

    return NextResponse.json({
      stats: {
        walletBalance: user?.walletBalance || 0,
        activeAuctions,
        endedAuctions,
        totalBidsPlaced,
        vibesWon,
        pendingPaymentsCount: pendingPayments.length,
        pendingPaymentsAmount: pendingPayments.reduce((sum, v) => sum + v.currentBid, 0),
        totalSpent: completedPayments._sum.amount || 0,
      },
      pendingPayments,
      winningBids: winningBidsCount,
      recentBids,
      recentVibes,
    })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
