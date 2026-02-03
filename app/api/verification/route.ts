import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { v4 as uuid } from 'uuid'

// Request verification
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { phone, idDocumentUrl } = await req.json()

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Basic verification requirements
    const updates: any = {}

    // Phone verification
    if (phone) {
      updates.phone = phone
      // In production, send SMS verification code
      // For now, mark as verified
      updates.phoneVerified = true
    }

    // ID document verification
    if (idDocumentUrl) {
      updates.idDocumentUrl = idDocumentUrl
    }

    // Calculate verification level
    let verificationLevel = 'NONE'
    
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updates,
    })

    // Check verification criteria
    const hasEmail = !!updatedUser.email && !!updatedUser.emailVerified
    const hasPhone = !!updatedUser.phone && updatedUser.phoneVerified
    const hasId = !!updatedUser.idDocumentUrl
    const hasCompletedSales = updatedUser.totalSales >= 3
    const hasGoodRating = updatedUser.averageRating >= 4.0

    if (hasEmail || hasPhone) {
      verificationLevel = 'BASIC'
    }
    if (hasEmail && hasPhone && hasId) {
      verificationLevel = 'VERIFIED'
    }
    if (verificationLevel === 'VERIFIED' && hasCompletedSales && hasGoodRating) {
      verificationLevel = 'TRUSTED'
    }

    // Update verification status
    const finalUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        verificationLevel,
        isVerified: verificationLevel !== 'NONE',
        verifiedAt: verificationLevel !== 'NONE' ? new Date() : null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        phoneVerified: true,
        isVerified: true,
        verificationLevel: true,
      },
    })

    // Log action
    await prisma.auditLog.create({
      data: {
        id: uuid(),
        userId: session.user.id,
        action: 'VERIFICATION_UPDATED',
        meta: JSON.stringify({ verificationLevel }),
      },
    })

    return NextResponse.json(finalUser)
  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { error: 'Failed to update verification' },
      { status: 500 }
    )
  }
}

// Get verification status
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        email: true,
        emailVerified: true,
        phone: true,
        phoneVerified: true,
        idDocumentUrl: true,
        isVerified: true,
        verificationLevel: true,
        verifiedAt: true,
        totalSales: true,
        averageRating: true,
        totalReviews: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Calculate what's needed for next level
    const requirements = {
      BASIC: {
        needed: ['Verify email OR phone'],
        met: !!user.emailVerified || user.phoneVerified,
      },
      VERIFIED: {
        needed: ['Verify email', 'Verify phone', 'Upload ID document'],
        met: !!user.emailVerified && user.phoneVerified && !!user.idDocumentUrl,
      },
      TRUSTED: {
        needed: ['Complete 3+ sales', 'Maintain 4.0+ rating'],
        met: user.totalSales >= 3 && user.averageRating >= 4.0,
      },
    }

    return NextResponse.json({
      ...user,
      requirements,
    })
  } catch (error) {
    console.error('Get verification error:', error)
    return NextResponse.json(
      { error: 'Failed to get verification status' },
      { status: 500 }
    )
  }
}
