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

    // Get the vibe
    const vibe = await prisma.vibe.findUnique({
      where: { id: vibeId },
      include: {
        creator: { select: { email: true, name: true } },
      },
    })

    if (!vibe) {
      return NextResponse.json({ error: 'Vibe not found' }, { status: 404 })
    }

    // Check if user is the winner
    if (vibe.winnerUserId !== session.user.id) {
      return NextResponse.json({ error: 'Only the winner can pay' }, { status: 403 })
    }

    // Check if already paid
    if (vibe.status === 'PAID' || vibe.status === 'COMPLETED') {
      return NextResponse.json({ error: 'Already paid' }, { status: 400 })
    }

    // Get user email
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, name: true },
    })

    if (!user?.email) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 })
    }

    // Calculate amounts
    const amount = vibe.currentBid // Amount in Naira
    const platformFeePercent = parseInt(process.env.PLATFORM_FEE_PERCENT || '10')
    const feeAmount = Math.round(amount * (platformFeePercent / 100))
    const netAmount = amount - feeAmount

    // Generate unique reference
    const reference = `vibe_${vibeId}_${Date.now()}_${uuid().slice(0, 8)}`

    // Create payment record
    await prisma.payment.create({
      data: {
        id: uuid(),
        amount,
        feeAmount,
        netAmount,
        reference,
        status: 'INITIATED',
        vibeId,
        payerId: session.user.id,
      },
    })

    // Get the app URL for callback
    const appUrl = process.env.NEXTAUTH_URL || 'https://auction-me-vibes.vercel.app'

    // Initialize Paystack transaction
    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        amount: amount * 100, // Paystack expects amount in kobo (multiply by 100)
        reference,
        callback_url: `${appUrl}/pay/callback`,
        metadata: {
          vibeId,
          vibeTitle: vibe.title,
          payerId: session.user.id,
          payerName: user.name,
          creatorId: vibe.creatorId,
          creatorName: vibe.creator.name,
          custom_fields: [
            {
              display_name: 'Vibe',
              variable_name: 'vibe_title',
              value: vibe.title,
            },
          ],
        },
      }),
    })

    const paystackData = await paystackResponse.json()

    if (!paystackData.status) {
      console.error('Paystack error:', paystackData)
      return NextResponse.json(
        { error: paystackData.message || 'Payment initialization failed' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      authorization_url: paystackData.data.authorization_url,
      access_code: paystackData.data.access_code,
      reference: paystackData.data.reference,
    })
  } catch (error) {
    console.error('Payment init error:', error)
    return NextResponse.json(
      { error: 'Failed to initialize payment' },
      { status: 500 }
    )
  }
}
