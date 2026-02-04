import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { code } = await req.json()

    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 })
    }

    // For testing, accept code 123456
    // In production, verify against stored code
    if (code !== '123456') {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 })
    }

    // Update user
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        emailVerified: new Date(),
      },
    })

    // Update verification level
    await updateVerificationLevel(session.user.id)

    return NextResponse.json({ message: 'Email verified successfully' })
  } catch (error) {
    console.error('Verify email error:', error)
    return NextResponse.json(
      { error: 'Failed to verify email' },
      { status: 500 }
    )
  }
}

async function updateVerificationLevel(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      emailVerified: true,
      phoneVerified: true,
      idDocumentUrl: true,
      totalSales: true,
      averageRating: true,
    },
  })

  if (!user) return

  let level = 'NONE'
  
  if (user.emailVerified || user.phoneVerified) {
    level = 'BASIC'
  }
  
  if (user.emailVerified && user.phoneVerified && user.idDocumentUrl) {
    level = 'VERIFIED'
  }
  
  if (level === 'VERIFIED' && user.totalSales >= 3 && user.averageRating >= 4.0) {
    level = 'TRUSTED'
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      verificationLevel: level,
      isVerified: level !== 'NONE',
      verifiedAt: level !== 'NONE' ? new Date() : null,
    },
  })
}
