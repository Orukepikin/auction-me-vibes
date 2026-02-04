import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { phone } = await req.json()

    if (!phone || phone.length < 10) {
      return NextResponse.json({ error: 'Valid phone number is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { phoneVerified: true },
    })

    if (user?.phoneVerified) {
      return NextResponse.json({ error: 'Phone already verified' }, { status: 400 })
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { phone },
    })

    const code = Math.floor(100000 + Math.random() * 900000).toString()
    console.log(`Phone verification code for ${phone}: ${code}`)

    return NextResponse.json({ 
      message: 'Verification code sent',
      testCode: '123456'
    })
  } catch (error) {
    console.error('Send phone verification error:', error)
    return NextResponse.json(
      { error: 'Failed to send verification code' },
      { status: 500 }
    )
  }
}
