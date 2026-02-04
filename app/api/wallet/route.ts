import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        walletBalance: true,
        totalEarnings: true,
        totalSales: true,
        payoutBankName: true,
        payoutAccountNumber: true,
        payoutAccountName: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get recent transactions from audit logs
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        userId: session.user.id,
        action: { in: ['PAYMENT_SUCCESS', 'VIBE_COMPLETED', 'PAYOUT_REQUESTED', 'PAYOUT_COMPLETED'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    // Transform audit logs to transactions
    const recentTransactions = auditLogs.map((log) => {
      let type: 'EARNING' | 'PAYOUT' | 'REFUND' = 'EARNING'
      let description = ''
      let amount = 0
      let status = 'COMPLETED'

      try {
        const meta = JSON.parse(log.meta || '{}')
        
        if (log.action === 'VIBE_COMPLETED') {
          type = 'EARNING'
          description = 'Sale completed'
          amount = meta.amount || 0
        } else if (log.action === 'PAYOUT_REQUESTED') {
          type = 'PAYOUT'
          description = 'Withdrawal to bank'
          amount = meta.amount || 0
          status = meta.status || 'PENDING'
        } else if (log.action === 'PAYOUT_COMPLETED') {
          type = 'PAYOUT'
          description = 'Withdrawal completed'
          amount = meta.amount || 0
          status = 'COMPLETED'
        }
      } catch (e) {}

      return {
        id: log.id,
        type,
        amount,
        description,
        status,
        createdAt: log.createdAt.toISOString(),
      }
    }).filter(tx => tx.amount > 0)

    return NextResponse.json({
      balance: user.walletBalance,
      totalEarnings: user.totalEarnings,
      totalSales: user.totalSales,
      pendingPayouts: 0,
      bankDetails: {
        bankName: user.payoutBankName,
        accountNumber: user.payoutAccountNumber,
        accountName: user.payoutAccountName,
      },
      recentTransactions,
    })
  } catch (error) {
    console.error('Get wallet error:', error)
    return NextResponse.json(
      { error: 'Failed to get wallet' },
      { status: 500 }
    )
  }
}
