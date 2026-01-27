'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Button } from './ui/button'

export function Navbar() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { href: '/market', label: 'Market', icon: '🛒' },
    { href: '/create', label: 'Create', icon: '✨' },
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  ]

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-dark-950/95 backdrop-blur-xl border-b border-dark-700 shadow-xl shadow-purple-500/5' 
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <span className="text-3xl group-hover:rotate-180 transition-transform duration-500">🌀</span>
            <span className="text-xl font-bold gradient-text hidden sm:inline">
              Auction Me Vibes
            </span>
            <span className="text-xl font-bold gradient-text sm:hidden">AMV</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                  pathname === link.href
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth buttons */}
          <div className="flex items-center gap-3">
            {status === 'loading' ? (
              <div className="w-10 h-10 skeleton rounded-full" />
            ) : session ? (
              <div className="flex items-center gap-3">
                <Link href="/profile">
                  <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-dark-800/80 hover:bg-dark-700 transition-all duration-300 border border-dark-600 hover:border-purple-500/30 group">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold ring-2 ring-dark-700 group-hover:ring-purple-500/50 transition-all">
                      {session.user?.name?.[0] || session.user?.email?.[0] || '?'}
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-sm font-medium text-white truncate max-w-[100px]">
                        {session.user?.name || 'User'}
                      </p>
                      <p className="text-xs text-gray-500">View profile</p>
                    </div>
                  </div>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="hidden lg:inline-flex text-gray-400 hover:text-white"
                >
                  Sign out
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                    Sign in
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="sm" className="glow-purple">Get Started</Button>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div 
          className={`md:hidden overflow-hidden transition-all duration-300 ${
            mobileMenuOpen ? 'max-h-96 opacity-100 pb-4' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="pt-4 border-t border-dark-700 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  pathname === link.href
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'text-gray-400 hover:bg-dark-800 hover:text-white'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="text-lg">{link.icon}</span>
                {link.label}
              </Link>
            ))}
            {session && (
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:bg-dark-800 hover:text-white transition-all"
              >
                <span className="text-lg">👋</span>
                Sign out
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
