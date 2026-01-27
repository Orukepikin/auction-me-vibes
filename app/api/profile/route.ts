import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { profileSchema } from '@/lib/validations'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const result = profileSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const data = result.data

    // Check if username is taken (if provided)
    if (data.username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username: data.username,
          NOT: { id: session.user.id },
        },
      })

      if (existingUser) {
        return NextResponse.json(
          { error: 'Username is already taken' },
          { status: 400 }
        )
      }
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: data.name,
        username: data.username,
        bio: data.bio,
        phone: data.phone,
        instagram: data.instagram,
        twitter: data.twitter,
        location: data.location,
        payoutBankName: data.payoutBankName,
        payoutAccountNumber: data.payoutAccountNumber,
        payoutAccountName: data.payoutAccountName,
      },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        bio: true,
        phone: true,
        instagram: true,
        twitter: true,
        location: true,
        payoutBankName: true,
        payoutAccountNumber: true,
        payoutAccountName: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
