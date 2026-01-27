import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // Public routes that don't require auth
        const publicRoutes = ['/', '/login', '/api/auth', '/api/market']
        
        // Check if it's a public route
        if (publicRoutes.some(route => pathname.startsWith(route))) {
          return true
        }

        // All other routes require authentication
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/create/:path*',
    '/profile/:path*',
    '/api/vibes/:path*',
    '/api/profile/:path*',
    '/api/dashboard/:path*',
    '/api/me/:path*',
  ],
}
