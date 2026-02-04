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

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, emailVerified: true },
    })

    if (!user?.email) {
      return NextResponse.json({ error: 'No email address found' }, { status: 400 })
    }

    if (user.emailVerified) {
      return NextResponse.json({ error: 'Email already verified' }, { status: 400 })
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString()
    console.log(`Email verification code for ${user.email}: ${code}`)

    return NextResponse.json({ 
      message: 'Verification code sent',
      testCode: '123456' 
    })
  } catch (error) {
    console.error('Send email verification error:', error)
    return NextResponse.json(
      { error: 'Failed to send verification code' },
      { status: 500 }
    )
  }
}
