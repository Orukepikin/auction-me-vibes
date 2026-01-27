'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatTimeLeft } from '@/lib/utils'

interface DashboardData {
  stats: {
    walletBalance: number
    activeAuctions: number
    endedAuctions: number
    totalBidsPlaced: number
    vibesWon: number
    pendingPaymentsCount: number
    pendingPaymentsAmount: number
    totalSpent: number
  }
  pendingPayments: Array<{
    id: string
    title: string
    currentBid: number
    paymentDueAt: string | null
  }>
  winningBids: number
  recentBids: Array<{
    id: string
    amount: number
    createdAt: string
    vibe: {
      id: string
      title: string
      status: string
      currentBid: number
      winnerUserId: string | null
    }
  }>
  recentVibes: Array<{
    id: string
    title: string
    status: string
    currentBid: number
    endAt: string
    _count: { bids: number }
  }>
}

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/dashboard')
    } else if (status === 'authenticated') {
      fetchDashboard()
    }
  }, [status])

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/dashboard')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setData(data)
    } catch (error) {
      console.error('Failed to fetch dashboard:', error)
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
              <div key={i} className="h-32 skeleton rounded-2xl" />
            ))}
          </div>
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="h-96 skeleton rounded-2xl" />
            <div className="h-96 skeleton rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-dark-950">
        <Navbar />
        <div className="pt-32 pb-12 max-w-7xl mx-auto px-4 text-center">
          <span className="text-6xl block mb-4">😵</span>
          <p className="text-gray-400 mb-6">Failed to load dashboard</p>
          <Button onClick={fetchDashboard}>Retry</Button>
        </div>
      </div>
    )
  }

  const statCards = [
    {
      label: 'Wallet Balance',
      value: formatCurrency(data.stats.walletBalance),
      icon: '💰',
      color: 'from-yellow-500 to-orange-500',
      textColor: 'gradient-text-gold',
    },
    {
      label: 'Active Vibes',
      value: data.stats.activeAuctions.toString(),
      icon: '🔥',
      color: 'from-green-500 to-emerald-500',
      subtext: data.stats.endedAuctions > 0 ? `${data.stats.endedAuctions} ended` : undefined,
    },
    {
      label: 'Bids Placed',
      value: data.stats.totalBidsPlaced.toString(),
      icon: '🎯',
      color: 'from-purple-500 to-pink-500',
      subtext: `${data.winningBids} winning`,
    },
    {
      label: 'Vibes Won',
      value: data.stats.vibesWon.toString(),
      icon: '🏆',
      color: 'from-cyan-500 to-blue-500',
      subtext: data.stats.totalSpent > 0 ? `${formatCurrency(data.stats.totalSpent)} spent` : undefined,
    },
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold">
                Welcome back, <span className="gradient-text">{session?.user?.name?.split(' ')[0] || 'Creator'}</span>
              </h1>
              <p className="text-gray-400 mt-1">Here&apos;s what&apos;s happening with your vibes</p>
            </div>
            <Link href="/create">
              <Button size="lg" className="w-full sm:w-auto">
                <span className="mr-2">✨</span> Create Vibe
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statCards.map((stat) => (
              <div key={stat.label} className="glass-card rounded-2xl p-5 sm:p-6 group hover:scale-105 transition-transform duration-300">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 uppercase tracking-wider">{stat.label}</p>
                    <p className={`text-2xl sm:text-3xl font-bold mt-1 ${stat.textColor || 'text-white'}`}>
                      {stat.value}
                    </p>
                    {stat.subtext && (
                      <p className="text-xs text-gray-500 mt-1">{stat.subtext}</p>
                    )}
                  </div>
                  <span className="text-2xl sm:text-3xl group-hover:scale-125 transition-transform">{stat.icon}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Pending payments alert */}
          {data.stats.pendingPaymentsCount > 0 && (
            <div className="glass-card rounded-2xl p-5 sm:p-6 mb-8 border-l-4 border-yellow-500 bg-yellow-500/5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                    <h3 className="font-bold text-yellow-400">Pending Payments</h3>
                    <p className="text-sm text-gray-400 mt-1">
                      You have {data.stats.pendingPaymentsCount} vibe(s) awaiting payment
                      <span className="text-yellow-400 font-semibold ml-1">
                        ({formatCurrency(data.stats.pendingPaymentsAmount)})
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 ml-9 sm:ml-0">
                  {data.pendingPayments.slice(0, 1).map((vibe) => (
                    <Link key={vibe.id} href={`/vibe/${vibe.id}`}>
                      <Button size="sm">Pay Now</Button>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Main grid */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Your Vibes */}
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <span>🌀</span> Your Vibes
                </h2>
                <Link href="/market" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
                  View all →
                </Link>
              </div>

              {data.recentVibes.length > 0 ? (
                <div className="space-y-3">
                  {data.recentVibes.map((vibe) => (
                    <Link key={vibe.id} href={`/vibe/${vibe.id}`}>
                      <div className="flex items-center justify-between p-4 bg-dark-800 hover:bg-dark-700 rounded-xl transition-all hover:scale-[1.02]">
                        <div className="flex-1 min-w-0 mr-4">
                          <p className="font-medium truncate">{vibe.title}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              vibe.status === 'ACTIVE'
                                ? 'bg-green-500/20 text-green-400'
                                : vibe.status === 'ENDED'
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-blue-500/20 text-blue-400'
                            }`}>
                              {vibe.status}
                            </span>
                            <span className="text-xs text-gray-500">
                              {vibe._count.bids} bids
                            </span>
                            {vibe.status === 'ACTIVE' && (
                              <span className="text-xs text-gray-500">
                                {formatTimeLeft(vibe.endAt)} left
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="font-bold gradient-text-gold whitespace-nowrap">
                          {formatCurrency(vibe.currentBid)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <span className="text-5xl block mb-4">🌀</span>
                  <p className="text-gray-500 mb-4">No vibes yet</p>
                  <Link href="/create">
                    <Button size="sm">Create your first vibe</Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Your Bids */}
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <span>🎯</span> Your Bids
                </h2>
                <Link href="/market" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
                  Browse more →
                </Link>
              </div>

              {data.recentBids.length > 0 ? (
                <div className="space-y-3">
                  {data.recentBids.map((bid) => {
                    const isWinning = bid.amount === bid.vibe.currentBid
                    const isWinner = session?.user?.id === bid.vibe.winnerUserId

                    return (
                      <Link key={bid.id} href={`/vibe/${bid.vibe.id}`}>
                        <div className="flex items-center justify-between p-4 bg-dark-800 hover:bg-dark-700 rounded-xl transition-all hover:scale-[1.02]">
                          <div className="flex-1 min-w-0 mr-4">
                            <p className="font-medium truncate">{bid.vibe.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {isWinner ? (
                                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-500/20 text-green-400">
                                  🏆 Won
                                </span>
                              ) : isWinning ? (
                                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-purple-500/20 text-purple-400">
                                  Leading
                                </span>
                              ) : (
                                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-500/20 text-gray-400">
                                  Outbid
                                </span>
                              )}
                              <span className="text-xs text-gray-500">
                                Your bid: {formatCurrency(bid.amount)}
                              </span>
                            </div>
                          </div>
                          <p className="font-bold text-white whitespace-nowrap">
                            {formatCurrency(bid.vibe.currentBid)}
                          </p>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <span className="text-5xl block mb-4">🎯</span>
                  <p className="text-gray-500 mb-4">No bids yet</p>
                  <Link href="/market">
                    <Button size="sm">Browse vibes</Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div className="mt-8 grid sm:grid-cols-3 gap-4">
            <Link href="/create" className="glass-card rounded-2xl p-6 hover:scale-105 transition-transform group">
              <span className="text-3xl block mb-3 group-hover:scale-110 transition-transform">✨</span>
              <h3 className="font-bold mb-1">Create a Vibe</h3>
              <p className="text-sm text-gray-500">Post a new service auction</p>
            </Link>
            <Link href="/market" className="glass-card rounded-2xl p-6 hover:scale-105 transition-transform group">
              <span className="text-3xl block mb-3 group-hover:scale-110 transition-transform">🛒</span>
              <h3 className="font-bold mb-1">Browse Market</h3>
              <p className="text-sm text-gray-500">Find vibes to bid on</p>
            </Link>
            <Link href="/profile" className="glass-card rounded-2xl p-6 hover:scale-105 transition-transform group">
              <span className="text-3xl block mb-3 group-hover:scale-110 transition-transform">👤</span>
              <h3 className="font-bold mb-1">Edit Profile</h3>
              <p className="text-sm text-gray-500">Update your details</p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
