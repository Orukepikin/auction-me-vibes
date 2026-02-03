'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function Navbar() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const navLinks = [
    { href: '/market', label: 'Market', icon: '🏪' },
    { href: '/create', label: 'Create', icon: '✨' },
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  ]

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch unread counts
  useEffect(() => {
    if (session?.user) {
      fetchUnreadCounts()
      // Poll every 30 seconds
      const interval = setInterval(fetchUnreadCounts, 30000)
      return () => clearInterval(interval)
    }
  }, [session])

  const fetchUnreadCounts = async () => {
    try {
      // Fetch unread messages
      const msgRes = await fetch('/api/messages')
      if (msgRes.ok) {
        const conversations = await msgRes.json()
        const totalUnread = conversations.reduce((sum: number, conv: any) => sum + (conv.unreadCount || 0), 0)
        setUnreadMessages(totalUnread)
      }

      // Fetch notifications (we can add this API later)
      // For now, just show 0
      setUnreadNotifications(0)
    } catch (error) {
      console.error('Failed to fetch unread counts')
    }
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-950/80 backdrop-blur-xl border-b border-dark-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-2xl group-hover:rotate-180 transition-transform duration-500">🌀</span>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Auction Me Vibes
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  pathname === link.href
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'text-gray-400 hover:text-white hover:bg-dark-800'
                }`}
              >
                <span className="mr-2">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Side - Auth & Icons */}
          <div className="flex items-center gap-2">
            {status === 'loading' ? (
              <div className="w-8 h-8 rounded-full bg-dark-800 animate-pulse" />
            ) : session?.user ? (
              <>
                {/* Messages Icon */}
                <Link
                  href="/messages"
                  className={`relative p-2 rounded-lg transition-all ${
                    pathname === '/messages'
                      ? 'bg-purple-500/20 text-purple-400'
                      : 'text-gray-400 hover:text-white hover:bg-dark-800'
                  }`}
                  title="Messages"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {unreadMessages > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 rounded-full text-xs font-bold flex items-center justify-center text-white">
                      {unreadMessages > 9 ? '9+' : unreadMessages}
                    </span>
                  )}
                </Link>

                {/* Notifications Icon */}
                <button
                  className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-dark-800 transition-all"
                  title="Notifications"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 rounded-full text-xs font-bold flex items-center justify-center text-white">
                      {unreadNotifications > 9 ? '9+' : unreadNotifications}
                    </span>
                  )}
                </button>

                {/* User Menu */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-dark-800 transition-all"
                  >
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                      {session.user.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-medium text-white">{session.user.name}</p>
                      <p className="text-xs text-gray-400">View profile</p>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-dark-900 border border-dark-700 rounded-xl shadow-xl overflow-hidden z-50">
                      {/* User Info Header */}
                      <div className="p-4 border-b border-dark-700 bg-dark-800/50">
                        <p className="font-medium text-white">{session.user.name}</p>
                        <p className="text-sm text-gray-400">{session.user.email}</p>
                      </div>

                      {/* Menu Links */}
                      <div className="p-2">
                        <Link
                          href="/dashboard"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-dark-800 hover:text-white transition-colors"
                        >
                          <span>📊</span>
                          <span>Dashboard</span>
                        </Link>

                        <Link
                          href="/messages"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-dark-800 hover:text-white transition-colors"
                        >
                          <span>💬</span>
                          <span>Messages</span>
                          {unreadMessages > 0 && (
                            <span className="ml-auto bg-pink-500 text-white text-xs px-2 py-0.5 rounded-full">
                              {unreadMessages}
                            </span>
                          )}
                        </Link>

                        <Link
                          href="/settings/verification"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-dark-800 hover:text-white transition-colors"
                        >
                          <span>✓</span>
                          <span>Get Verified</span>
                          <span className="ml-auto text-xs text-green-400">NEW</span>
                        </Link>

                        <Link
                          href="/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-dark-800 hover:text-white transition-colors"
                        >
                          <span>👤</span>
                          <span>Edit Profile</span>
                        </Link>

                        <Link
                          href="/wallet"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-dark-800 hover:text-white transition-colors"
                        >
                          <span>💰</span>
                          <span>Wallet</span>
                        </Link>
                      </div>

                      {/* Sign Out */}
                      <div className="p-2 border-t border-dark-700">
                        <button
                          onClick={() => {
                            setUserMenuOpen(false)
                            signOut({ callbackUrl: '/' })
                          }}
                          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <span>🚪</span>
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <Link href="/login">
                <Button>Sign In</Button>
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-dark-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-dark-800">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    pathname === link.href
                      ? 'bg-purple-500/20 text-purple-400'
                      : 'text-gray-400 hover:text-white hover:bg-dark-800'
                  }`}
                >
                  <span className="mr-2">{link.icon}</span>
                  {link.label}
                </Link>
              ))}

              {session?.user && (
                <>
                  <div className="border-t border-dark-700 my-2" />
                  <Link
                    href="/messages"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-dark-800 flex items-center justify-between"
                  >
                    <span>💬 Messages</span>
                    {unreadMessages > 0 && (
                      <span className="bg-pink-500 text-white text-xs px-2 py-0.5 rounded-full">
                        {unreadMessages}
                      </span>
                    )}
                  </Link>
                  <Link
                    href="/settings/verification"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-dark-800 flex items-center justify-between"
                  >
                    <span>✓ Get Verified</span>
                    <span className="text-xs text-green-400">NEW</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
