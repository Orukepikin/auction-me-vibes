import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { reference: string } }
) {
  try {
    const reference = params.reference

    const payment = await prisma.payment.findUnique({
      where: { reference },
      select: {
        id: true,
        vibeId: true,
        amount: true,
        status: true,
        createdAt: true,
      },
    })

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    return NextResponse.json(payment)
  } catch (error) {
    console.error('Get payment error:', error)
    return NextResponse.json(
      { error: 'Failed to get payment' },
      { status: 500 }
    )
  }
}
