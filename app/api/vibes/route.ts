import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { v4 as uuid } from 'uuid'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// GET - List vibes with search and filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('q')
    const category = searchParams.get('category')
    const sort = searchParams.get('sort') || 'newest'
    const status = searchParams.get('status') || 'ACTIVE'

    const where: any = {}

    if (status === 'ACTIVE') {
      where.status = 'ACTIVE'
      where.endAt = { gt: new Date() }
    } else if (status !== 'all') {
      where.status = status
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (category) {
      where.category = category
    }

    let orderBy: any = { createdAt: 'desc' }
    
    switch (sort) {
      case 'newest': orderBy = { createdAt: 'desc' }; break
      case 'ending': orderBy = { endAt: 'asc' }; break
      case 'price_low': orderBy = { currentBid: 'asc' }; break
      case 'price_high': orderBy = { currentBid: 'desc' }; break
      case 'popular': orderBy = { bids: { _count: 'desc' } }; break
    }

    const vibes = await prisma.vibe.findMany({
      where,
      include: {
        creator: {
          select: { id: true, name: true, image: true, isVerified: true },
        },
        _count: { select: { bids: true } },
      },
      orderBy,
      take: 50,
    })

    return NextResponse.json(vibes)
  } catch (error) {
    console.error('Get vibes error:', error)
    return NextResponse.json({ error: 'Failed to get vibes' }, { status: 500 })
  }
}

// POST - Create new vibe
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { title, description, category, mediaUrl, weirdness, startingBid, minIncrement, durationHours } = body

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    if (!description || !description.trim()) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 })
    }

    if (!startingBid || startingBid < 100) {
      return NextResponse.json({ error: 'Starting bid must be at least ₦100' }, { status: 400 })
    }

    if (!durationHours || durationHours < 1) {
      return NextResponse.json({ error: 'Duration must be at least 1 hour' }, { status: 400 })
    }

    const endAt = new Date()
    endAt.setHours(endAt.getHours() + durationHours)

    const vibe = await prisma.vibe.create({
      data: {
        id: uuid(),
        title: title.trim(),
        description: description.trim(),
        category: category || null,
        mediaUrl: mediaUrl || null,
        weirdness: weirdness || 5,
        startingBid,
        minIncrement: minIncrement || 100,
        currentBid: startingBid,
        status: 'ACTIVE',
        endAt,
        creatorId: session.user.id,
      },
      include: {
        creator: { select: { id: true, name: true, image: true } },
      },
    })

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
    return NextResponse.json({ error: 'Failed to create vibe' }, { status: 500 })
  }
}
