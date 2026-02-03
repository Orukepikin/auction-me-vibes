import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { v4 as uuid } from 'uuid'

// Create a review
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
    const { rating, comment } = await req.json()

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    const vibe = await prisma.vibe.findUnique({
      where: { id: vibeId },
    })

    if (!vibe) {
      return NextResponse.json({ error: 'Vibe not found' }, { status: 404 })
    }

    // Must be completed
    if (vibe.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'Can only review completed transactions' }, { status: 400 })
    }

    // Only creator or winner can review
    const isCreator = vibe.creatorId === session.user.id
    const isWinner = vibe.winnerUserId === session.user.id

    if (!isCreator && !isWinner) {
      return NextResponse.json({ error: 'Only parties involved can review' }, { status: 403 })
    }

    // Determine who is being reviewed
    const revieweeId = isCreator ? vibe.winnerUserId : vibe.creatorId

    if (!revieweeId) {
      return NextResponse.json({ error: 'Cannot create review' }, { status: 400 })
    }

    // Check if already reviewed
    const existingReview = await prisma.review.findFirst({
      where: {
        vibeId,
        reviewerId: session.user.id,
      },
    })

    if (existingReview) {
      return NextResponse.json({ error: 'You already reviewed this transaction' }, { status: 400 })
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        id: uuid(),
        rating,
        comment,
        vibeId,
        reviewerId: session.user.id,
        revieweeId,
      },
    })

    // Update reviewee's average rating
    const allReviews = await prisma.review.findMany({
      where: { revieweeId },
      select: { rating: true },
    })

    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length

    await prisma.user.update({
      where: { id: revieweeId },
      data: {
        averageRating: avgRating,
        totalReviews: allReviews.length,
      },
    })

    return NextResponse.json(review, { status: 201 })
  } catch (error) {
    console.error('Create review error:', error)
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    )
  }
}

// Get reviews for a vibe
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vibeId = params.id

    const reviews = await prisma.review.findMany({
      where: { vibeId },
      include: {
        reviewer: {
          select: { id: true, name: true, image: true },
        },
        reviewee: {
          select: { id: true, name: true, image: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(reviews)
  } catch (error) {
    console.error('Get reviews error:', error)
    return NextResponse.json(
      { error: 'Failed to get reviews' },
      { status: 500 }
    )
  }
}
