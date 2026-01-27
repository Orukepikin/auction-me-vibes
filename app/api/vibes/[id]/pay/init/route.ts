import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { generateReference, VibeStatus } from '@/lib/utils'
import { v4 as uuid } from 'uuid'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const vibeId = params.id

    const vibe = await prisma.vibe.findUnique({
      where: { id: vibeId },
    })

    if (!vibe) {
      return NextResponse.json({ error: 'Vibe not found' }, { status: 404 })
    }

    if (vibe.status !== VibeStatus.ENDED) {
      return NextResponse.json({ error: 'Auction has not ended' }, { status: 400 })
    }

    if (vibe.winnerUserId !== session.user.id) {
      return NextResponse.json({ error: 'You are not the winner' }, { status: 403 })
    }

    // Check for existing pending payment
    const existingPayment = await prisma.payment.findFirst({
      where: {
        vibeId,
        payerId: session.user.id,
        status: 'INITIATED',
      },
    })

    if (existingPayment) {
      // Return existing payment reference
      return NextResponse.json({
        reference: existingPayment.reference,
        authorization_url: `https://checkout.paystack.com/${existingPayment.reference}`,
      })
    }

    // Calculate fees
    const feePercent = parseInt(process.env.PLATFORM_FEE_PERCENT || '10')
    const amount = vibe.currentBid
    const feeAmount = Math.round(amount * (feePercent / 100))
    const netAmount = amount - feeAmount

    // Generate reference
    const reference = generateReference()

    // Create payment record
    await prisma.payment.create({
      data: {
        id: uuid(),
        vibeId,
        payerId: session.user.id,
        amount,
        feeAmount,
        netAmount,
        reference,
        status: 'INITIATED',
      },
    })

    // Initialize Paystack transaction
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY

    if (!paystackSecretKey) {
      // Return mock URL for development
      const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/pay/callback?reference=${reference}`
      return NextResponse.json({
        reference,
        authorization_url: callbackUrl,
        message: 'Paystack not configured - using mock payment',
      })
    }

    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: session.user.email,
        amount: amount * 100, // Paystack uses kobo
        reference,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/pay/callback`,
        metadata: {
          vibeId,
          userId: session.user.id,
        },
      }),
    })

    const paystackData = await paystackResponse.json()

    if (!paystackData.status) {
      throw new Error(paystackData.message || 'Failed to initialize payment')
    }

    return NextResponse.json({
      reference,
      authorization_url: paystackData.data.authorization_url,
    })
  } catch (error) {
    console.error('Payment init error:', error)
    return NextResponse.json(
      { error: 'Failed to initialize payment' },
      { status: 500 }
    )
  }
}
