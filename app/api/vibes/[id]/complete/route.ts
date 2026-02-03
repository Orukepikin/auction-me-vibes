import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { v4 as uuid } from 'uuid'

// Confirm completion and release funds (buyer action)
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

    const vibe = await prisma.vibe.findUnique({
      where: { id: vibeId },
      include: {
        payments: {
          where: { status: 'SUCCESS' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    })

    if (!vibe) {
      return NextResponse.json({ error: 'Vibe not found' }, { status: 404 })
    }

    // Only winner can confirm completion
    if (vibe.winnerUserId !== session.user.id) {
      return NextResponse.json({ error: 'Only winner can confirm completion' }, { status: 403 })
    }

    // Must be delivered
    if (!vibe.deliveredAt) {
      return NextResponse.json({ error: 'Service not yet delivered' }, { status: 400 })
    }

    // Must be in correct status
    if (vibe.status !== 'IN_PROGRESS' && vibe.status !== 'PAID') {
      return NextResponse.json({ error: 'Cannot complete this vibe' }, { status: 400 })
    }

    const payment = vibe.payments[0]
    if (!payment) {
      return NextResponse.json({ error: 'No payment found' }, { status: 400 })
    }

    // Update vibe to completed
    await prisma.vibe.update({
      where: { id: vibeId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        escrowReleasedAt: new Date(),
      },
    })

    // Update payment status
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'RELEASED',
        escrowReleasedAt: new Date(),
      },
    })

    // Add funds to creator's wallet
    await prisma.user.update({
      where: { id: vibe.creatorId },
      data: {
        walletBalance: { increment: payment.netAmount },
        totalSales: { increment: 1 },
        totalEarnings: { increment: payment.netAmount },
      },
    })

    // Log action
    await prisma.auditLog.create({
      data: {
        id: uuid(),
        userId: session.user.id,
        action: 'VIBE_COMPLETED',
        meta: JSON.stringify({ vibeId, amount: payment.netAmount }),
      },
    })

    return NextResponse.json({ message: 'Transaction completed! Funds released to creator.' })
  } catch (error) {
    console.error('Complete vibe error:', error)
    return NextResponse.json(
      { error: 'Failed to complete transaction' },
      { status: 500 }
    )
  }
}
