import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { v4 as uuid } from 'uuid'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { bankName, accountNumber, accountName } = await req.json()

    if (!bankName || !accountNumber || !accountName) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
    }

    if (accountNumber.length !== 10) {
      return NextResponse.json({ error: 'Account number must be 10 digits' }, { status: 400 })
    }

    // Update user bank details
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        payoutBankName: bankName,
        payoutAccountNumber: accountNumber,
        payoutAccountName: accountName,
      },
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        id: uuid(),
        userId: session.user.id,
        action: 'BANK_DETAILS_UPDATED',
        meta: JSON.stringify({ bankName, accountNumber: `****${accountNumber.slice(-4)}` }),
      },
    })

    return NextResponse.json({ message: 'Bank details saved successfully' })
  } catch (error) {
    console.error('Save bank details error:', error)
    return NextResponse.json(
      { error: 'Failed to save bank details' },
      { status: 500 }
    )
  }
}
