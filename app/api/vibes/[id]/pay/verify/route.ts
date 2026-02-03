import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { v4 as uuid } from 'uuid'

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
    const { reference } = await req.json()

    if (!reference) {
      return NextResponse.json({ error: 'Reference is required' }, { status: 400 })
    }

    // Get payment record
    const payment = await prisma.payment.findUnique({
      where: { reference },
      include: { vibe: true },
    })

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    if (payment.vibeId !== vibeId) {
      return NextResponse.json({ error: 'Payment does not match vibe' }, { status: 400 })
    }

    // Already verified
    if (payment.status === 'SUCCESS') {
      return NextResponse.json({ status: 'success', message: 'Payment already verified' })
    }

    // Verify with Paystack
    const paystackResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    )

    const paystackData = await paystackResponse.json()

    if (!paystackData.status) {
      return NextResponse.json(
        { error: 'Verification failed', details: paystackData.message },
        { status: 400 }
      )
    }

    const transaction = paystackData.data

    // Check if payment was successful
    if (transaction.status !== 'success') {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' },
      })

      return NextResponse.json(
        { error: 'Payment was not successful', status: transaction.status },
        { status: 400 }
      )
    }

    // Verify amount matches (Paystack returns in kobo)
    const expectedAmount = payment.amount * 100
    if (transaction.amount !== expectedAmount) {
      return NextResponse.json(
        { error: 'Amount mismatch' },
        { status: 400 }
      )
    }

    // Update payment status
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'SUCCESS',
        verifiedAt: new Date(),
      },
    })

    // Update vibe status to PAID
    await prisma.vibe.update({
      where: { id: vibeId },
      data: {
        status: 'PAID',
        escrowAmount: payment.netAmount,
      },
    })

    // Create conversation between creator and winner
    const existingConversation = await prisma.conversation.findUnique({
      where: { vibeId },
    })

    if (!existingConversation) {
      await prisma.conversation.create({
        data: {
          id: uuid(),
          vibeId,
          user1Id: payment.vibe.creatorId,
          user2Id: payment.payerId,
        },
      })
    }

    // Log the action
    await prisma.auditLog.create({
      data: {
        id: uuid(),
        userId: session.user.id,
        action: 'PAYMENT_SUCCESS',
        meta: JSON.stringify({
          vibeId,
          reference,
          amount: payment.amount,
          paystackRef: transaction.reference,
        }),
      },
    })

    return NextResponse.json({
      status: 'success',
      message: 'Payment verified successfully',
      vibeId,
    })
  } catch (error) {
    console.error('Payment verification error:', error)
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    )
  }
}
