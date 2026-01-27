import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { createVibeSchema } from '@/lib/validations'
import { v4 as uuid } from 'uuid'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    
    // Validate input
    const result = createVibeSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const { title, description, category, mediaUrl, weirdness, startingBid, minIncrement, durationHours } = result.data

    // Calculate end time
    const endAt = new Date(Date.now() + durationHours * 60 * 60 * 1000)

    // Create the vibe
    const vibe = await prisma.vibe.create({
      data: {
        id: uuid(),
        title,
        description,
        category: category || null,
        mediaUrl: mediaUrl || null,
        weirdness: weirdness || 5,
        startingBid,
        minIncrement: minIncrement || 100,
        currentBid: startingBid,
        endAt,
        status: 'ACTIVE',
        creatorId: session.user.id,
      },
    })

    console.log('Created vibe:', vibe.id, vibe.title)

    // Log the action
    await prisma.auditLog.create({
      data: {
        id: uuid(),
        userId: session.user.id,
        action: 'VIBE_CREATED',
        meta: JSON.stringify({ vibeId: vibe.id, title: vibe.title }),
      },
    })

    return NextResponse.json(vibe, { status: 201 })
  } catch (error) {
    console.error('Create vibe error:', error)
    return NextResponse.json(
      { error: 'Failed to create vibe' },
      { status: 500 }
    )
  }
}
