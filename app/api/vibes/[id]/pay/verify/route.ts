import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { verifyTransaction } from '@/lib/paystack'
import { v4 as uuid } from 'uuid'
import { VibeStatus, PaymentStatus } from '@prisma/client'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const vibeId = params.id
    const { searchParams } = new URL(req.url)
    const reference = searchParams.get('reference')

    if (!reference) {
      return NextResponse.json(
        { error: 'Reference required' },
        { status: 400 }
      )
    }

    // Get payment record
    const payment = await prisma.payment.findUnique({
      where: { reference },
    })

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    if (payment.vibeId !== vibeId) {
      return NextResponse.json(
        { error: 'Payment does not match vibe' },
        { status: 400 }
      )
    }

    // If already verified, return status
    if (payment.status === PaymentStatus.SUCCESS) {
      return NextResponse.json({
        status: 'success',
        message: 'Payment already verified',
      })
    }

    // Verify with Paystack
    const verification = await verifyTransaction(reference)

    if (verification.data.status === 'success') {
      // Update payment and vibe in transaction
      await prisma.$transaction([
        prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.SUCCESS,
            verifiedAt: new Date(),
          },
        }),
        prisma.vibe.update({
          where: { id: vibeId },
          data: {
            status: VibeStatus.PAID,
          },
        }),
      ])

      // Update creator earnings
      const vibe = await prisma.vibe.findUnique({
        where: { id: vibeId },
      })

      if (vibe) {
        await prisma.user.update({
          where: { id: vibe.creatorId },
          data: {
            walletBalance: {
              increment: payment.netAmount,
            },
          },
        })
      }

      // Log verification
      await prisma.auditLog.create({
        data: {
          id: uuid(),
          userId: session.user.id,
          action: 'PAYMENT_VERIFIED',
          meta: JSON.stringify({ vibeId, reference, amount: payment.amount }),
        },
      })

      return NextResponse.json({
        status: 'success',
        message: 'Payment verified successfully',
      })
    } else {
      // Update payment status to failed
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED,
        },
      })

      return NextResponse.json({
        status: 'failed',
        message: 'Payment verification failed',
      })
    }
  } catch (error) {
    console.error('Verify payment error:', error)
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    )
  }
}
