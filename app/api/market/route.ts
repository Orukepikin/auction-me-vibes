import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    
    // Get query params
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category')
    const status = searchParams.get('status') || 'ACTIVE'
    const sort = searchParams.get('sort') || 'endingSoon'
    const minWeirdness = parseInt(searchParams.get('minWeirdness') || '1')
    const maxWeirdness = parseInt(searchParams.get('maxWeirdness') || '10')
    const minBid = parseInt(searchParams.get('minBid') || '0')
    const maxBid = parseInt(searchParams.get('maxBid') || '999999999')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Build where clause
    const where: any = {
      weirdness: {
        gte: minWeirdness,
        lte: maxWeirdness,
      },
      currentBid: {
        gte: minBid,
        lte: maxBid,
      },
    }

    // Status filter
    if (status && status !== 'ALL') {
      where.status = status
    }

    // Category filter
    if (category && category !== 'All') {
      where.category = category
    }

    // Search filter (title or description)
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ]
    }

    // Build orderBy
    let orderBy: any = { endAt: 'asc' }
    switch (sort) {
      case 'newest':
        orderBy = { createdAt: 'desc' }
        break
      case 'oldest':
        orderBy = { createdAt: 'asc' }
        break
      case 'highestBid':
        orderBy = { currentBid: 'desc' }
        break
      case 'lowestBid':
        orderBy = { currentBid: 'asc' }
        break
      case 'mostBids':
        orderBy = { bids: { _count: 'desc' } }
        break
      case 'endingSoon':
      default:
        orderBy = { endAt: 'asc' }
        break
    }

    // Get total count for pagination
    const totalCount = await prisma.vibe.count({ where })

    // Get vibes with pagination
    const vibes = await prisma.vibe.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        _count: {
          select: { bids: true },
        },
      },
    })

    // Get categories for filter dropdown
    const categories = await prisma.vibe.groupBy({
      by: ['category'],
      where: { category: { not: null } },
      _count: true,
    })

    return NextResponse.json({
      vibes,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: page * limit < totalCount,
      },
      categories: categories.map((c) => ({
        name: c.category,
        count: c._count,
      })),
    })
  } catch (error) {
    console.error('Market API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch vibes' },
      { status: 500 }
    )
  }
}