import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { v4 as uuid } from 'uuid'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

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

    const updates: any = {}

    if (phone) {
      updates.phone = phone
      updates.phoneVerified = true
    }

    if (idDocumentUrl) {
      updates.idDocumentUrl = idDocumentUrl
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: updates,
    })

    // Calculate verification level
    const hasEmail = !!updatedUser.email && !!updatedUser.emailVerified
    const hasPhone = !!updatedUser.phone && updatedUser.phoneVerified
    const hasId = !!updatedUser.idDocumentUrl
    const hasCompletedSales = updatedUser.totalSales >= 3
    const hasGoodRating = updatedUser.averageRating >= 4.0

    let verificationLevel = 'NONE'
    if (hasEmail || hasPhone) {
      verificationLevel = 'BASIC'
    }
    if (hasEmail && hasPhone && hasId) {
      verificationLevel = 'VERIFIED'
    }
    if (verificationLevel === 'VERIFIED' && hasCompletedSales && hasGoodRating) {
      verificationLevel = 'TRUSTED'
    }

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

    return NextResponse.json(user)
  } catch (error) {
    console.error('Get verification error:', error)
    return NextResponse.json(
      { error: 'Failed to get verification status' },
      { status: 500 }
    )
  }
}
