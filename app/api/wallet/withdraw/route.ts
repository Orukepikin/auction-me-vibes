import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { v4 as uuid } from 'uuid'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { amount } = await req.json()

    if (!amount || amount < 1000) {
      return NextResponse.json({ error: 'Minimum withdrawal is ₦1,000' }, { status: 400 })
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        walletBalance: true,
        payoutBankName: true,
        payoutAccountNumber: true,
        payoutAccountName: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check balance
    if (amount > user.walletBalance) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
    }

    // Check bank details
    if (!user.payoutAccountNumber) {
      return NextResponse.json({ error: 'Please add bank details first' }, { status: 400 })
    }

    // Deduct from wallet
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        walletBalance: { decrement: amount },
      },
    })

    // Create payout request log
    await prisma.auditLog.create({
      data: {
        id: uuid(),
        userId: session.user.id,
        action: 'PAYOUT_REQUESTED',
        meta: JSON.stringify({
          amount,
          status: 'PENDING',
          bankName: user.payoutBankName,
          accountNumber: `****${user.payoutAccountNumber.slice(-4)}`,
          accountName: user.payoutAccountName,
          requestedAt: new Date().toISOString(),
        }),
      },
    })

    return NextResponse.json({ 
      message: 'Withdrawal request submitted',
      amount,
      status: 'PENDING',
    })
  } catch (error) {
    console.error('Withdraw error:', error)
    return NextResponse.json(
      { error: 'Failed to process withdrawal' },
      { status: 500 }
    )
  }
}
