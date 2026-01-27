'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { formatCurrency, formatTimeLeft, formatRelativeTime, getWeirdnessLabel, getWeirdnessColor } from '@/lib/utils'

interface Vibe {
  id: string
  title: string
  description: string
  category: string | null
  mediaUrl: string | null
  weirdness: number
  startingBid: number
  minIncrement: number
  currentBid: number
  endAt: string
  status: string
  creatorId: string
  winnerUserId: string | null
  paymentDueAt: string | null
  creator: {
    id: string
    name: string | null
    username: string | null
    image: string | null
    bio: string | null
    phone?: string
    email?: string
    instagram?: string
    twitter?: string
  }
  winner?: {
    id: string
    name: string | null
    username: string | null
    phone?: string
    email?: string
    instagram?: string
    twitter?: string
  }
  bids: Array<{
    id: string
    amount: number
    createdAt: string
    bidder: {
      id: string
      name: string | null
      username: string | null
      image: string | null
    }
  }>
  _count: { bids: number }
  canBid?: boolean
  canSelectWinner?: boolean
  canPay?: boolean
  contactsUnlocked?: boolean
}

export default function VibePage() {
  const { id } = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const { addToast } = useToast()

  const [vibe, setVibe] = useState<Vibe | null>(null)
  const [loading, setLoading] = useState(true)
  const [bidAmount, setBidAmount] = useState('')
  const [bidding, setBidding] = useState(false)
  const [selecting, setSelecting] = useState(false)
  const [paying, setPaying] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    fetchVibe()
  }, [id])

  useEffect(() => {
    if (vibe && vibe.status === 'ACTIVE') {
      setTimeLeft(formatTimeLeft(vibe.endAt))
      const interval = setInterval(() => {
        setTimeLeft(formatTimeLeft(vibe.endAt))
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [vibe])

  const fetchVibe = async () => {
    try {
      const res = await fetch(`/api/vibes/${id}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setVibe(data)
      setBidAmount((data.currentBid + data.minIncrement).toString())
      setTimeLeft(formatTimeLeft(data.endAt))
    } catch (error) {
      addToast('Failed to load vibe', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleBid = async () => {
    if (!session) {
      router.push(`/login?callbackUrl=/vibe/${id}`)
      return
    }
    setBidding(true)
    try {
      const res = await fetch(`/api/vibes/${id}/bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseInt(bidAmount) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      addToast('Bid placed successfully! 🎉', 'success')
      fetchVibe()
    } catch (error: any) {
      addToast(error.message || 'Failed to place bid', 'error')
    } finally {
      setBidding(false)
    }
  }

  const handleSelectWinner = async (winnerId: string) => {
    setSelecting(true)
    try {
      const res = await fetch(`/api/vibes/${id}/select-winner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winnerId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      addToast('Winner selected! 🏆', 'success')
      fetchVibe()
    } catch (error: any) {
      addToast(error.message || 'Failed to select winner', 'error')
    } finally {
      setSelecting(false)
    }
  }

  const handlePay = async () => {
    setPaying(true)
    try {
      const res = await fetch(`/api/vibes/${id}/pay/init`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      window.location.href = data.authorization_url
    } catch (error: any) {
      addToast(error.message || 'Failed to initialize payment', 'error')
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950">
        <Navbar />
        <div className="pt-24 pb-12 max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-96 skeleton rounded-2xl" />
              <div className="h-32 skeleton rounded-2xl" />
            </div>
            <div className="h-[500px] skeleton rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  if (!vibe) {
    return (
      <div className="min-h-screen bg-dark-950">
        <Navbar />
        <div className="pt-32 pb-12 max-w-7xl mx-auto px-4 text-center">
          <span className="text-8xl block mb-6">😵</span>
          <h1 className="text-3xl font-bold mb-3">Vibe not found</h1>
          <p className="text-gray-500 mb-8">This vibe may have been removed</p>
          <Link href="/market">
            <Button size="lg">Back to Market</Button>
          </Link>
        </div>
      </div>
    )
  }

  const isCreator = session?.user?.id === vibe.creatorId
  const isWinner = session?.user?.id === vibe.winnerUserId
  const isActive = vibe.status === 'ACTIVE'
  const isEnded = vibe.status === 'ENDED'
  const isPaid = vibe.status === 'PAID' || vibe.status === 'COMPLETED'
  const isUrgent = isActive && timeLeft.includes('m') && !timeLeft.includes('h')
  const minBid = vibe.currentBid + vibe.minIncrement

  return (
    <div className="min-h-screen bg-dark-950">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="blob blob-1 opacity-20" />
        <div className="blob blob-2 opacity-20" />
      </div>

      <Navbar />

      <main className="relative z-10 pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back link */}
          <Link href="/market" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
            <span>←</span> Back to Market
          </Link>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Image */}
              <div className="glass-card rounded-2xl overflow-hidden">
                <div className="relative h-72 sm:h-96 bg-dark-800">
                  {vibe.mediaUrl && !imageError ? (
                    <Image
                      src={vibe.mediaUrl}
                      alt={vibe.title}
                      fill
                      className="object-cover"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-8xl opacity-30">🌀</span>
                    </div>
                  )}
                  
                  {/* Status badge */}
                  <div className="absolute top-4 left-4">
                    <span className={`px-4 py-2 rounded-xl text-sm font-bold backdrop-blur-md ${
                      isActive ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                      isPaid ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                      'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    }`}>
                      {vibe.status}
                    </span>
                  </div>

                  {/* Weirdness */}
                  <div className="absolute top-4 right-4">
                    <span className={`px-4 py-2 rounded-xl text-sm font-bold bg-dark-900/80 backdrop-blur-md ${getWeirdnessColor(vibe.weirdness)}`}>
                      {vibe.weirdness}/10 {getWeirdnessLabel(vibe.weirdness)}
                    </span>
                  </div>

                  {/* Time left */}
                  {isActive && (
                    <div className="absolute bottom-4 right-4">
                      <span className={`px-4 py-2 rounded-xl text-sm font-bold bg-dark-900/80 backdrop-blur-md ${isUrgent ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                        ⏱ {timeLeft}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Title & Description */}
              <div className="glass-card rounded-2xl p-6 sm:p-8">
                {vibe.category && (
                  <span className="text-xs text-purple-400 font-semibold uppercase tracking-wider">
                    {vibe.category}
                  </span>
                )}
                <h1 className="text-2xl sm:text-3xl font-bold mt-2 mb-4">{vibe.title}</h1>
                <p className="text-gray-400 leading-relaxed whitespace-pre-wrap">{vibe.description}</p>
              </div>

              {/* Creator */}
              <div className="glass-card rounded-2xl p-6 sm:p-8">
                <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-4">Creator</h3>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xl font-bold">
                    {vibe.creator.name?.[0] || '?'}
                  </div>
                  <div>
                    <p className="font-bold text-lg">{vibe.creator.name || 'Anonymous'}</p>
                    {vibe.creator.username && <p className="text-gray-500 text-sm">@{vibe.creator.username}</p>}
                  </div>
                </div>

                {/* Unlocked contacts */}
                {vibe.contactsUnlocked && (vibe.creator.phone || vibe.creator.email) && (
                  <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                    <p className="text-green-400 font-semibold mb-3 flex items-center gap-2">
                      <span>🔓</span> Contact Unlocked
                    </p>
                    <div className="space-y-2">
                      {vibe.creator.phone && (
                        <a href={`https://wa.me/${vibe.creator.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-dark-800 rounded-lg hover:bg-dark-700 transition-colors">
                          <span>💬</span> <span>{vibe.creator.phone}</span>
                        </a>
                      )}
                      {vibe.creator.email && (
                        <a href={`mailto:${vibe.creator.email}`} className="flex items-center gap-3 p-3 bg-dark-800 rounded-lg hover:bg-dark-700 transition-colors">
                          <span>✉️</span> <span>{vibe.creator.email}</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Bid History */}
              <div className="glass-card rounded-2xl p-6 sm:p-8">
                <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-4">
                  Bid History ({vibe._count.bids})
                </h3>
                {vibe.bids.length > 0 ? (
                  <div className="space-y-3">
                    {vibe.bids.slice(0, 10).map((bid, i) => (
                      <div key={bid.id} className={`flex items-center justify-between p-4 rounded-xl ${
                        i === 0 ? 'bg-purple-500/10 border border-purple-500/30' : 'bg-dark-800'
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${
                            i === 0 ? 'bg-gradient-to-br from-purple-500 to-pink-500' : 'bg-dark-700'
                          }`}>
                            {bid.bidder.name?.[0] || '?'}
                          </div>
                          <div>
                            <p className="font-medium">{bid.bidder.name || 'Anonymous'}</p>
                            <p className="text-xs text-gray-500">{formatRelativeTime(bid.createdAt)}</p>
                          </div>
                        </div>
                        <p className={`font-bold ${i === 0 ? 'text-purple-400' : 'text-white'}`}>
                          {formatCurrency(bid.amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No bids yet. Be the first!</p>
                )}
              </div>
            </div>

            {/* Right Column - Bid Panel */}
            <div className="lg:sticky lg:top-24 h-fit space-y-6">
              {/* Current bid card */}
              <div className="glass-card rounded-2xl p-6 sm:p-8">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Current Bid</p>
                <p className="text-4xl font-bold gradient-text-gold mb-1">
                  {formatCurrency(vibe.currentBid)}
                </p>
                <p className="text-sm text-gray-500">{vibe._count.bids} bids</p>

                <div className="mt-6 pt-6 border-t border-dark-600 space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Starting bid</span>
                    <span>{formatCurrency(vibe.startingBid)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Min increment</span>
                    <span>{formatCurrency(vibe.minIncrement)}</span>
                  </div>
                  {isActive && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Ends in</span>
                      <span className={isUrgent ? 'text-red-400' : 'text-white'}>{timeLeft}</span>
                    </div>
                  )}
                </div>

                {/* Bid form */}
                {isActive && !isCreator && (
                  <div className="mt-6 pt-6 border-t border-dark-600">
                    <label className="text-sm text-gray-400 mb-2 block">Your Bid</label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        min={minBid}
                        step={vibe.minIncrement}
                        className="flex-1"
                      />
                      <Button onClick={handleBid} loading={bidding} className="px-6">
                        Bid
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Min bid: {formatCurrency(minBid)}
                    </p>
                  </div>
                )}

                {/* Creator view - select winner */}
                {isCreator && isEnded && !vibe.winnerUserId && vibe.bids.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-dark-600">
                    <p className="text-sm text-yellow-400 mb-4">⚡ Select a winner:</p>
                    <div className="space-y-2">
                      {vibe.bids.slice(0, 5).map((bid) => (
                        <button
                          key={bid.id}
                          onClick={() => handleSelectWinner(bid.bidder.id)}
                          disabled={selecting}
                          className="w-full flex items-center justify-between p-3 bg-dark-800 hover:bg-dark-700 rounded-xl transition-colors"
                        >
                          <span>{bid.bidder.name || 'Anonymous'}</span>
                          <span className="font-bold">{formatCurrency(bid.amount)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Winner view - pay button */}
                {isWinner && isEnded && (
                  <div className="mt-6 pt-6 border-t border-dark-600">
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl mb-4">
                      <p className="text-yellow-400 font-semibold">🏆 You won this vibe!</p>
                      <p className="text-sm text-gray-400 mt-1">Pay to unlock creator contact info</p>
                    </div>
                    <Button onClick={handlePay} loading={paying} className="w-full" size="lg">
                      Pay {formatCurrency(vibe.currentBid)}
                    </Button>
                  </div>
                )}

                {/* Paid status */}
                {isPaid && (
                  <div className="mt-6 pt-6 border-t border-dark-600">
                    <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                      <p className="text-green-400 font-semibold">✅ Payment Complete</p>
                      <p className="text-sm text-gray-400 mt-1">Contact info has been unlocked</p>
                    </div>
                  </div>
                )}

                {/* Creator own vibe */}
                {isCreator && isActive && (
                  <div className="mt-6 pt-6 border-t border-dark-600">
                    <p className="text-sm text-gray-500 text-center">This is your vibe</p>
                  </div>
                )}

                {/* Not logged in */}
                {!session && isActive && (
                  <div className="mt-6 pt-6 border-t border-dark-600">
                    <Link href={`/login?callbackUrl=/vibe/${id}`}>
                      <Button className="w-full" size="lg">Sign in to Bid</Button>
                    </Link>
                  </div>
                )}
              </div>

              {/* Quick tips */}
              <div className="glass-card rounded-2xl p-6">
                <h4 className="font-semibold mb-3">💡 Tips</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>• Higher bids get noticed first</li>
                  <li>• Payment unlocks contact info</li>
                  <li>• 24 hours to pay after winning</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
