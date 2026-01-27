import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { initializeTransaction, calculateFees } from '@/lib/paystack'
import { generateReference } from '@/lib/utils'
import { v4 as uuid } from 'uuid'
import { VibeStatus } from '@prisma/client'

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
    const userId = session.user.id

    // Get vibe
    const vibe = await prisma.vibe.findUnique({
      where: { id: vibeId },
    })

    if (!vibe) {
      return NextResponse.json({ error: 'Vibe not found' }, { status: 404 })
    }

    // Validate permissions
    if (vibe.winnerUserId !== userId) {
      return NextResponse.json(
        { error: 'Only the winner can initiate payment' },
        { status: 403 }
      )
    }

    if (vibe.status !== VibeStatus.ENDED) {
      return NextResponse.json(
        { error: 'Invalid vibe status for payment' },
        { status: 400 }
      )
    }

    // Check payment deadline
    if (vibe.paymentDueAt && new Date() > vibe.paymentDueAt) {
      return NextResponse.json(
        { error: 'Payment deadline has passed' },
        { status: 400 }
      )
    }

    // Get user email
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    })

    if (!user?.email) {
      return NextResponse.json(
        { error: 'Email required for payment. Please update your profile.' },
        { status: 400 }
      )
    }

    // Calculate fees
    const feePercent = parseInt(process.env.PLATFORM_FEE_PERCENT || '10')
    const { feeAmount, netAmount } = calculateFees(vibe.currentBid, feePercent)

    // Generate reference
    const reference = generateReference()

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        id: uuid(),
        vibeId,
        payerId: userId,
        amount: vibe.currentBid,
        feeAmount,
        netAmount,
        reference,
        status: 'INITIATED',
      },
    })

    // Initialize Paystack transaction
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const callbackUrl = `${appUrl}/pay/callback?vibeId=${vibeId}`

    const paystackResponse = await initializeTransaction({
      email: user.email,
      amount: vibe.currentBid * 100, // Convert to kobo
      reference,
      callbackUrl,
      metadata: {
        vibeId,
        paymentId: payment.id,
        custom_fields: [
          {
            display_name: 'Vibe',
            variable_name: 'vibe_title',
            value: vibe.title,
          },
        ],
      },
    })

    // Log payment initiation
    await prisma.auditLog.create({
      data: {
        id: uuid(),
        userId,
        action: 'PAYMENT_INITIATED',
        meta: JSON.stringify({ vibeId, reference, amount: vibe.currentBid }),
      },
    })

    return NextResponse.json({
      authorization_url: paystackResponse.data.authorization_url,
      reference: paystackResponse.data.reference,
      amount: vibe.currentBid,
    })
  } catch (error) {
    console.error('Init payment error:', error)
    return NextResponse.json(
      { error: 'Failed to initialize payment' },
      { status: 500 }
    )
  }
}
