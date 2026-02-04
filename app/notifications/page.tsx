'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'

interface Notification {
  id: string
  type: 'bid' | 'winner' | 'message' | 'payment' | 'review' | 'dispute'
  title: string
  message: string
  link?: string
  read: boolean
  createdAt: string
}

export default function NotificationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchNotifications()
      // Refresh every 30 seconds
      const interval = setInterval(fetchNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [status, router])

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error('Failed to fetch notifications')
    } finally {
      setLoading(false)
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'bid': return '💰'
      case 'winner': return '🏆'
      case 'message': return '💬'
      case 'review': return '⭐'
      case 'payment': return '💳'
      case 'dispute': return '⚠️'
      default: return '🔔'
    }
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-dark-950">
        <Navbar />
        <main className="pt-24 pb-12">
          <div className="max-w-2xl mx-auto px-4 flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        </main>
      </div>
    )
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="min-h-screen bg-dark-950">
      <Navbar />

      <main className="pt-24 pb-12">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">🔔 Notifications</h1>
              {unreadCount > 0 && (
                <p className="text-sm text-gray-400">{unreadCount} new</p>
              )}
            </div>
            <Button variant="secondary" size="sm" onClick={fetchNotifications}>
              ↻ Refresh
            </Button>
          </div>

          <div className="space-y-3">
            {notifications.length === 0 ? (
              <div className="glass-card rounded-2xl p-8 text-center">
                <span className="text-5xl mb-4 block">🔔</span>
                <p className="text-gray-400">No notifications yet</p>
                <p className="text-sm text-gray-500 mt-2">
                  You'll see updates here when someone bids on your vibes, sends you a message, and more!
                </p>
                <div className="mt-6">
                  <Link href="/create">
                    <Button>Create a Vibe</Button>
                  </Link>
                </div>
              </div>
            ) : (
              notifications.map((notification) => (
                <Link
                  key={notification.id}
                  href={notification.link || '#'}
                  className={`block glass-card rounded-xl p-4 transition-all hover:bg-dark-800 ${
                    !notification.read ? 'border-l-4 border-l-purple-500' : ''
                  }`}
                >
                  <div className="flex gap-4">
                    <div className="text-2xl flex-shrink-0">{getIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`font-medium ${!notification.read ? 'text-white' : 'text-gray-300'}`}>
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0 mt-2" />
                        )}
                      </div>
                      <p className="text-sm text-gray-400 mt-1 truncate">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {getTimeAgo(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <p className="text-center text-gray-500 mt-8 text-sm">
              Notifications refresh automatically
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
