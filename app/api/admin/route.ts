import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// Admin emails - add your email here
const ADMIN_EMAILS = ['admin@example.com', 'creator@example.com']

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get stats
    const [
      totalUsers,
      totalVibes,
      activeVibes,
      totalBids,
      payments,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.vibe.count(),
      prisma.vibe.count({ where: { status: 'ACTIVE' } }),
      prisma.bid.count(),
      prisma.payment.aggregate({
        where: { status: 'SUCCESS' },
        _count: true,
        _sum: { amount: true, feeAmount: true },
      }),
    ])

    const stats = {
      totalUsers,
      totalVibes,
      activeVibes,
      totalBids,
      totalPayments: payments._count || 0,
      totalRevenue: payments._sum.amount || 0,
      platformFees: payments._sum.feeAmount || 0,
    }

    // Get recent users
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        _count: {
          select: {
            createdVibes: true,
            bids: true,
          },
        },
      },
    })

    // Get recent vibes
    const vibes = await prisma.vibe.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        title: true,
        status: true,
        currentBid: true,
        createdAt: true,
        creator: {
          select: {
            name: true,
            email: true,
          },
        },
        _count: {
          select: { bids: true },
        },
      },
    })

    // Get recent activity
    const activities = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        action: true,
        userId: true,
        meta: true,
        createdAt: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json({
      stats,
      users,
      vibes,
      activities,
    })
  } catch (error) {
    console.error('Admin API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch admin data' },
      { status: 500 }
    )
  }
}
