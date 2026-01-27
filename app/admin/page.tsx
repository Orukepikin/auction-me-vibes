'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatRelativeTime } from '@/lib/utils'

interface AdminStats {
  totalUsers: number
  totalVibes: number
  activeVibes: number
  totalBids: number
  totalPayments: number
  totalRevenue: number
  platformFees: number
}

interface RecentActivity {
  id: string
  action: string
  userId: string | null
  meta: string | null
  createdAt: string
  user?: {
    name: string | null
    email: string | null
  }
}

interface UserData {
  id: string
  name: string | null
  email: string | null
  createdAt: string
  _count: {
    createdVibes: number
    bids: number
  }
}

interface VibeData {
  id: string
  title: string
  status: string
  currentBid: number
  createdAt: string
  creator: {
    name: string | null
    email: string | null
  }
  _count: {
    bids: number
  }
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'vibes' | 'activity'>('overview')
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<UserData[]>([])
  const [vibes, setVibes] = useState<VibeData[]>([])
  const [activities, setActivities] = useState<RecentActivity[]>([])

  // Admin email check (replace with your email)
  const adminEmails = ['admin@example.com', 'creator@example.com']
  const isAdmin = session?.user?.email && adminEmails.includes(session.user.email)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/admin')
    } else if (status === 'authenticated') {
      if (!isAdmin) {
        router.push('/dashboard')
      } else {
        fetchData()
      }
    }
  }, [status, isAdmin])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setStats(data.stats)
      setUsers(data.users)
      setVibes(data.vibes)
      setActivities(data.activities)
    } catch (error) {
      console.error('Failed to fetch admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-dark-950">
        <Navbar />
        <div className="pt-24 pb-12 max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 skeleton rounded-2xl" />
            ))}
          </div>
          <div className="h-96 skeleton rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-dark-950">
        <Navbar />
        <div className="pt-32 pb-12 max-w-7xl mx-auto px-4 text-center">
          <span className="text-6xl block mb-4">🚫</span>
          <h1 className="text-2xl font-bold mb-3">Access Denied</h1>
          <p className="text-gray-400 mb-6">You don&apos;t have permission to view this page.</p>
          <Link href="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers || 0, icon: '👥', color: 'from-blue-500 to-cyan-500' },
    { label: 'Total Vibes', value: stats?.totalVibes || 0, icon: '🌀', color: 'from-purple-500 to-pink-500' },
    { label: 'Active Auctions', value: stats?.activeVibes || 0, icon: '🔥', color: 'from-green-500 to-emerald-500' },
    { label: 'Total Bids', value: stats?.totalBids || 0, icon: '🎯', color: 'from-yellow-500 to-orange-500' },
    { label: 'Completed Payments', value: stats?.totalPayments || 0, icon: '💳', color: 'from-pink-500 to-rose-500' },
    { label: 'Total Revenue', value: formatCurrency(stats?.totalRevenue || 0), icon: '💰', color: 'from-cyan-500 to-blue-500' },
    { label: 'Platform Fees', value: formatCurrency(stats?.platformFees || 0), icon: '🏦', color: 'from-indigo-500 to-purple-500' },
  ]

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'vibes', label: 'Vibes', icon: '🌀' },
    { id: 'activity', label: 'Activity Log', icon: '📋' },
  ]

  return (
    <div className="min-h-screen bg-dark-950">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="blob blob-1 opacity-20" />
        <div className="blob blob-2 opacity-20" />
      </div>

      <Navbar />

      <main className="relative z-10 pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold">
                <span className="gradient-text">Admin</span> Dashboard
              </h1>
              <p className="text-gray-400 mt-1">Manage your platform</p>
            </div>
            <Button onClick={fetchData} variant="secondary">
              Refresh
            </Button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            {statCards.map((stat) => (
              <div key={stat.label} className="glass-card rounded-2xl p-5 group hover:scale-105 transition-transform">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">{stat.label}</p>
                    <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                  </div>
                  <span className="text-2xl group-hover:scale-125 transition-transform">{stat.icon}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-5 py-3 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'bg-dark-800 text-gray-400 hover:bg-dark-700 hover:text-white'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="glass-card rounded-2xl p-6">
            {activeTab === 'overview' && (
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Recent Users */}
                <div>
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <span>👥</span> Recent Users
                  </h3>
                  <div className="space-y-3">
                    {users.slice(0, 5).map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 bg-dark-800 rounded-xl">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold">
                            {user.name?.[0] || user.email?.[0] || '?'}
                          </div>
                          <div>
                            <p className="font-medium">{user.name || 'Anonymous'}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </div>
                        <div className="text-right text-xs text-gray-500">
                          <p>{user._count.createdVibes} vibes</p>
                          <p>{user._count.bids} bids</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Vibes */}
                <div>
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <span>🌀</span> Recent Vibes
                  </h3>
                  <div className="space-y-3">
                    {vibes.slice(0, 5).map((vibe) => (
                      <Link key={vibe.id} href={`/vibe/${vibe.id}`}>
                        <div className="flex items-center justify-between p-4 bg-dark-800 rounded-xl hover:bg-dark-700 transition-colors">
                          <div className="flex-1 min-w-0 mr-4">
                            <p className="font-medium truncate">{vibe.title}</p>
                            <p className="text-xs text-gray-500">by {vibe.creator.name || vibe.creator.email}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-yellow-400">{formatCurrency(vibe.currentBid)}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              vibe.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' :
                              vibe.status === 'ENDED' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-blue-500/20 text-blue-400'
                            }`}>
                              {vibe.status}
                            </span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div>
                <h3 className="text-lg font-bold mb-4">All Users ({users.length})</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs text-gray-500 uppercase tracking-wider border-b border-dark-600">
                        <th className="pb-3 pr-4">User</th>
                        <th className="pb-3 pr-4">Email</th>
                        <th className="pb-3 pr-4">Vibes</th>
                        <th className="pb-3 pr-4">Bids</th>
                        <th className="pb-3">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b border-dark-700">
                          <td className="py-4 pr-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold">
                                {user.name?.[0] || '?'}
                              </div>
                              <span className="font-medium">{user.name || 'Anonymous'}</span>
                            </div>
                          </td>
                          <td className="py-4 pr-4 text-gray-400">{user.email}</td>
                          <td className="py-4 pr-4">{user._count.createdVibes}</td>
                          <td className="py-4 pr-4">{user._count.bids}</td>
                          <td className="py-4 text-gray-500 text-sm">{formatRelativeTime(user.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'vibes' && (
              <div>
                <h3 className="text-lg font-bold mb-4">All Vibes ({vibes.length})</h3>
                <div className="space-y-3">
                  {vibes.map((vibe) => (
                    <Link key={vibe.id} href={`/vibe/${vibe.id}`}>
                      <div className="flex items-center justify-between p-4 bg-dark-800 rounded-xl hover:bg-dark-700 transition-colors">
                        <div className="flex-1 min-w-0 mr-4">
                          <p className="font-medium">{vibe.title}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            by {vibe.creator.name || vibe.creator.email} • {vibe._count.bids} bids • {formatRelativeTime(vibe.createdAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="font-bold text-yellow-400">{formatCurrency(vibe.currentBid)}</p>
                          <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                            vibe.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' :
                            vibe.status === 'ENDED' ? 'bg-yellow-500/20 text-yellow-400' :
                            vibe.status === 'PAID' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-purple-500/20 text-purple-400'
                          }`}>
                            {vibe.status}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <div>
                <h3 className="text-lg font-bold mb-4">Activity Log</h3>
                <div className="space-y-3">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-4 p-4 bg-dark-800 rounded-xl">
                      <div className="w-10 h-10 rounded-full bg-dark-700 flex items-center justify-center text-lg">
                        {activity.action === 'VIBE_CREATED' ? '🌀' :
                         activity.action === 'BID_PLACED' ? '🎯' :
                         activity.action === 'WINNER_SELECTED' ? '🏆' :
                         activity.action === 'PAYMENT_COMPLETED' ? '💰' :
                         activity.action === 'USER_REGISTERED' ? '👤' : '📋'}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">
                          {activity.action.replace(/_/g, ' ')}
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          {activity.user?.name || activity.user?.email || 'System'}
                          {activity.meta && (
                            <span className="text-gray-500"> • {activity.meta}</span>
                          )}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500">{formatRelativeTime(activity.createdAt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
