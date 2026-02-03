'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'

export default function NotificationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      setLoading(false)
    }
  }, [status, router])

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

  // Sample notifications - in production, fetch from API
  const notifications = [
    { id: '1', icon: '💰', title: 'New Bid Received!', message: 'Someone placed a bid on your vibe', time: 'Just now', unread: true },
    { id: '2', icon: '🎉', title: 'You Won!', message: 'You won the auction for "Creative Design"', time: '1 hour ago', unread: true },
    { id: '3', icon: '💬', title: 'New Message', message: 'You have a new message', time: '2 hours ago', unread: false },
    { id: '4', icon: '⭐', title: 'New Review', message: 'Someone left you a 5-star review!', time: 'Yesterday', unread: false },
  ]

  return (
    <div className="min-h-screen bg-dark-950">
      <Navbar />
      <main className="pt-24 pb-12">
        <div className="max-w-2xl mx-auto px-4">
          <h1 className="text-2xl font-bold mb-6">🔔 Notifications</h1>
          
          <div className="space-y-3">
            {notifications.map((n) => (
              <div key={n.id} className={`glass-card rounded-xl p-4 flex items-start gap-4 ${n.unread ? 'border-l-4 border-purple-500' : ''}`}>
                <span className="text-2xl">{n.icon}</span>
                <div className="flex-1">
                  <p className={`font-medium ${n.unread ? 'text-white' : 'text-gray-300'}`}>{n.title}</p>
                  <p className="text-sm text-gray-400">{n.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{n.time}</p>
                </div>
                {n.unread && <span className="w-2 h-2 bg-purple-500 rounded-full" />}
              </div>
            ))}
          </div>

          <p className="text-center text-gray-500 mt-8 text-sm">
            Real-time notifications coming soon!
          </p>
        </div>
      </main>
    </div>
  )
}
