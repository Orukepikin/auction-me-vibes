import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// In production, you'd use a service like Resend, SendGrid, or Nodemailer
// For now, we'll store the code and simulate sending

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

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    
    // Store code in database (expires in 10 minutes)
    // For simplicity, we'll store it in a simple way
    // In production, use a proper verification token table
    
    // For testing purposes, we'll use a simple approach:
    // Store the code temporarily (in production, use Redis or a verification table)
    
    // Since we don't have email sending set up, we'll just return success
    // and use a fixed code for testing: 123456
    
    console.log(`Email verification code for ${user.email}: ${code}`)
    
    // In production, send email here using Resend, SendGrid, etc.
    // await sendEmail({
    //   to: user.email,
    //   subject: 'Verify your email - Auction Me Vibes',
    //   body: `Your verification code is: ${code}`
    // })

    return NextResponse.json({ 
      message: 'Verification code sent',
      // Remove this in production - only for testing
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
