import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { VibeStatus, PaymentStatus } from '@/lib/utils'
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

    const { reference } = await req.json()

    if (!reference) {
      return NextResponse.json({ error: 'Reference is required' }, { status: 400 })
    }

    const vibeId = params.id

    // Find the payment
    const payment = await prisma.payment.findUnique({
      where: { reference },
      include: {
        vibe: true,
      },
    })

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    if (payment.vibeId !== vibeId) {
      return NextResponse.json({ error: 'Payment does not match vibe' }, { status: 400 })
    }

    if (payment.status === PaymentStatus.SUCCESS) {
      return NextResponse.json({ message: 'Payment already verified', status: 'success' })
    }

    // Verify with Paystack
    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY

    if (!paystackSecretKey) {
      // Mock verification for development
      await prisma.payment.update({
        where: { reference },
        data: {
          status: PaymentStatus.SUCCESS,
          verifiedAt: new Date(),
        },
      })

      await prisma.vibe.update({
        where: { id: vibeId },
        data: { status: VibeStatus.PAID },
      })

      // Add to creator wallet
      await prisma.user.update({
        where: { id: payment.vibe.creatorId },
        data: {
          walletBalance: { increment: payment.netAmount },
        },
      })

      return NextResponse.json({ message: 'Payment verified (mock)', status: 'success' })
    }

    const verifyResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
        },
      }
    )

    const verifyData = await verifyResponse.json()

    if (!verifyData.status || verifyData.data.status !== 'success') {
      await prisma.payment.update({
        where: { reference },
        data: { status: PaymentStatus.FAILED },
      })

      return NextResponse.json(
        { error: 'Payment verification failed', status: 'failed' },
        { status: 400 }
      )
    }

    // Update payment status
    await prisma.payment.update({
      where: { reference },
      data: {
        status: PaymentStatus.SUCCESS,
        verifiedAt: new Date(),
      },
    })

    // Update vibe status
    await prisma.vibe.update({
      where: { id: vibeId },
      data: { status: VibeStatus.PAID },
    })

    // Add to creator wallet
    await prisma.user.update({
      where: { id: payment.vibe.creatorId },
      data: {
        walletBalance: { increment: payment.netAmount },
      },
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        id: uuid(),
        userId: session.user.id,
        action: 'PAYMENT_COMPLETED',
        meta: JSON.stringify({
          vibeId,
          reference,
          amount: payment.amount,
        }),
      },
    })

    return NextResponse.json({ message: 'Payment verified', status: 'success' })
  } catch (error) {
    console.error('Payment verify error:', error)
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    )
  }
}
