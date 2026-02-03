import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { v4 as uuid } from 'uuid'

// Mark vibe as delivered (creator action)
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

    const vibe = await prisma.vibe.findUnique({
      where: { id: vibeId },
    })

    if (!vibe) {
      return NextResponse.json({ error: 'Vibe not found' }, { status: 404 })
    }

    // Only creator can mark as delivered
    if (vibe.creatorId !== session.user.id) {
      return NextResponse.json({ error: 'Only creator can mark as delivered' }, { status: 403 })
    }

    // Must be in PAID or IN_PROGRESS status
    if (vibe.status !== 'PAID' && vibe.status !== 'IN_PROGRESS') {
      return NextResponse.json({ error: 'Vibe is not in deliverable state' }, { status: 400 })
    }

    // Update vibe
    const updatedVibe = await prisma.vibe.update({
      where: { id: vibeId },
      data: {
        status: 'IN_PROGRESS',
        deliveredAt: new Date(),
      },
    })

    // Log action
    await prisma.auditLog.create({
      data: {
        id: uuid(),
        userId: session.user.id,
        action: 'VIBE_DELIVERED',
        meta: JSON.stringify({ vibeId }),
      },
    })

    return NextResponse.json(updatedVibe)
  } catch (error) {
    console.error('Mark delivered error:', error)
    return NextResponse.json(
      { error: 'Failed to mark as delivered' },
      { status: 500 }
    )
  }
}
