'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { formatCurrency } from '@/lib/utils'

interface Bid {
  id: string
  amount: number
  createdAt: string
  bidder: {
    id: string
    name: string
    image: string | null
  }
}

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
  status: string
  createdAt: string
  endAt: string
  selectedAt: string | null
  paymentDueAt: string | null
  creatorId: string
  winnerUserId: string | null
  creator: {
    id: string
    name: string
    image: string | null
    bio: string | null
    phone?: string
    email?: string
    instagram?: string
    twitter?: string
  }
  winner?: {
    id: string
    name: string
    phone?: string
    email?: string
    instagram?: string
    twitter?: string
  }
  bids: Bid[]
  _count: { bids: number }
  canBid: boolean
  canSelectWinner: boolean
  canPay: boolean
  contactsUnlocked: boolean
}

function CountdownTimer({ endAt }: { endAt: string }) {
  const [timeLeft, setTimeLeft] = useState('')
  const [isEnded, setIsEnded] = useState(false)

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const end = new Date(endAt).getTime()
      const difference = end - now

      if (difference <= 0) {
        setIsEnded(true)
        setTimeLeft('Ended')
        return
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m`)
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`)
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}m ${seconds}s`)
      } else {
        setTimeLeft(`${seconds}s`)
      }
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [endAt])

  return (
    <div className={`text-2xl font-bold ${isEnded ? 'text-red-400' : 'text-green-400'}`}>
      {timeLeft}
    </div>
  )
}

export default function VibePage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const { addToast } = useToast()

  const [vibe, setVibe] = useState<Vibe | null>(null)
  const [loading, setLoading] = useState(true)
  const [bidAmount, setBidAmount] = useState('')
  const [bidding, setBidding] = useState(false)
  const [ending, setEnding] = useState(false)
  const [selecting, setSelecting] = useState(false)
  const [selectedWinner, setSelectedWinner] = useState<string | null>(null)

  useEffect(() => {
    fetchVibe()
  }, [params.id])

  const fetchVibe = async () => {
    try {
      const res = await fetch(`/api/vibes/${params.id}`)
      if (!res.ok) throw new Error('Vibe not found')
      const data = await res.json()
      setVibe(data)
      setBidAmount(String(data.currentBid + data.minIncrement))
    } catch (error) {
      addToast('Failed to load vibe', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleBid = async () => {
    if (!session) {
      router.push('/login')
      return
    }

    setBidding(true)
    try {
      const res = await fetch(`/api/vibes/${params.id}/bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseInt(bidAmount) }),
      })

      const data = await res.json()

      if (!res.ok) {
        addToast(data.error || 'Failed to place bid', 'error')
      } else {
        addToast('Bid placed successfully! 🎉', 'success')
        fetchVibe()
      }
    } catch (error) {
      addToast('Failed to place bid', 'error')
    } finally {
      setBidding(false)
    }
  }

  const handleEndAuction = async () => {
    if (!confirm('Are you sure you want to end this auction early?')) return

    setEnding(true)
    try {
      const res = await fetch(`/api/vibes/${params.id}/end`, {
        method: 'POST',
      })

      const data = await res.json()

      if (!res.ok) {
        addToast(data.error || 'Failed to end auction', 'error')
      } else {
        addToast('Auction ended! Now select a winner.', 'success')
        fetchVibe()
      }
    } catch (error) {
      addToast('Failed to end auction', 'error')
    } finally {
      setEnding(false)
    }
  }

  const handleSelectWinner = async (winnerId: string) => {
    if (!confirm('Are you sure you want to select this bidder as the winner?')) return

    setSelecting(true)
    setSelectedWinner(winnerId)
    try {
      const res = await fetch(`/api/vibes/${params.id}/select-winner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winnerId }),
      })

      const data = await res.json()

      if (!res.ok) {
        addToast(data.error || 'Failed to select winner', 'error')
      } else {
        addToast('Winner selected! Waiting for payment.', 'success')
        fetchVibe()
      }
    } catch (error) {
      addToast('Failed to select winner', 'error')
    } finally {
      setSelecting(false)
      setSelectedWinner(null)
    }
  }

  const handlePay = async () => {
    try {
      const res = await fetch(`/api/vibes/${params.id}/pay/init`, {
        method: 'POST',
      })

      const data = await res.json()

      if (!res.ok) {
        addToast(data.error || 'Failed to initialize payment', 'error')
      } else {
        // Redirect to payment page
        window.location.href = data.authorization_url
      }
    } catch (error) {
      addToast('Failed to initialize payment', 'error')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950">
        <Navbar />
        <main className="pt-24 pb-12">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!vibe) {
    return (
      <div className="min-h-screen bg-dark-950">
        <Navbar />
        <main className="pt-24 pb-12">
          <div className="max-w-6xl mx-auto px-4 text-center py-20">
            <h1 className="text-2xl font-bold mb-4">Vibe not found</h1>
            <Link href="/market">
              <Button>Back to Market</Button>
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const isCreator = session?.user?.id === vibe.creatorId
  const isWinner = session?.user?.id === vibe.winnerUserId
  const isActive = vibe.status === 'ACTIVE'
  const isEnded = vibe.status === 'ENDED'
  const isPaid = vibe.status === 'PAID'
  const hasEnded = new Date() > new Date(vibe.endAt)
  const canEndEarly = isCreator && isActive && vibe.bids.length > 0
  const canSelectWinner = isCreator && (isEnded || (isActive && hasEnded)) && !vibe.winnerUserId && vibe.bids.length > 0
  const canPay = isWinner && isEnded && !isPaid

  return (
    <div className="min-h-screen bg-dark-950">
      <Navbar />

      <main className="pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-4">
          {/* Back button */}
          <Link href="/market" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
            ← Back to Market
          </Link>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Vibe Card */}
              <div className="glass-card rounded-2xl overflow-hidden">
                {vibe.mediaUrl && (
                  <div className="aspect-video bg-dark-800">
                    <img src={vibe.mediaUrl} alt={vibe.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <h1 className="text-2xl font-bold">{vibe.title}</h1>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      isActive ? 'bg-green-500/20 text-green-400' :
                      isEnded ? 'bg-yellow-500/20 text-yellow-400' :
                      isPaid ? 'bg-blue-500/20 text-blue-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {vibe.status}
                    </span>
                  </div>
                  <p className="text-gray-400 whitespace-pre-wrap">{vibe.description}</p>

                  {vibe.category && (
                    <div className="mt-4">
                      <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm">
                        {vibe.category}
                      </span>
                    </div>
                  )}

                  {/* Weirdness meter */}
                  <div className="mt-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Weirdness Level</span>
                      <span className="text-purple-400">{vibe.weirdness}/10</span>
                    </div>
                    <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                        style={{ width: `${vibe.weirdness * 10}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Creator Card */}
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-sm font-medium text-gray-400 mb-4">CREATOR</h3>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-lg font-bold">
                    {vibe.creator.name?.[0] || '?'}
                  </div>
                  <div>
                    <p className="font-semibold">{vibe.creator.name}</p>
                    {vibe.creator.bio && <p className="text-sm text-gray-400">{vibe.creator.bio}</p>}
                  </div>
                </div>

                {/* Show contact info if unlocked */}
                {vibe.contactsUnlocked && (
                  <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                    <h4 className="text-green-400 font-medium mb-2">📞 Contact Info (Unlocked)</h4>
                    {vibe.creator.email && <p className="text-sm">Email: {vibe.creator.email}</p>}
                    {vibe.creator.phone && <p className="text-sm">Phone: {vibe.creator.phone}</p>}
                    {vibe.creator.instagram && <p className="text-sm">Instagram: {vibe.creator.instagram}</p>}
                    {vibe.creator.twitter && <p className="text-sm">Twitter: {vibe.creator.twitter}</p>}
                  </div>
                )}
              </div>

              {/* Bid History */}
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-sm font-medium text-gray-400 mb-4">BID HISTORY ({vibe.bids.length})</h3>
                {vibe.bids.length === 0 ? (
                  <p className="text-gray-500">No bids yet. Be the first!</p>
                ) : (
                  <div className="space-y-3">
                    {vibe.bids.map((bid, index) => (
                      <div key={bid.id} className={`flex items-center justify-between p-3 rounded-xl ${
                        index === 0 ? 'bg-purple-500/10 border border-purple-500/20' : 'bg-dark-800'
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold">
                            {bid.bidder.name?.[0] || '?'}
                          </div>
                          <div>
                            <p className="font-medium">{bid.bidder.name}</p>
                            <p className="text-xs text-gray-400">
                              {new Date(bid.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${index === 0 ? 'text-purple-400' : ''}`}>
                            {formatCurrency(bid.amount)}
                          </p>
                          {/* Select Winner Button */}
                          {canSelectWinner && (
                            <Button
                              size="sm"
                              onClick={() => handleSelectWinner(bid.bidder.id)}
                              loading={selecting && selectedWinner === bid.bidder.id}
                              className="mt-2"
                            >
                              Select Winner
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Bid Info Card */}
              <div className="glass-card rounded-2xl p-6 sticky top-24">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Current Bid</span>
                    <span className="text-2xl font-bold text-purple-400">{formatCurrency(vibe.currentBid)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Min Increment</span>
                    <span className="font-medium">{formatCurrency(vibe.minIncrement)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">{hasEnded ? 'Ended' : 'Ends in'}</span>
                    <CountdownTimer endAt={vibe.endAt} />
                  </div>
                </div>

                <div className="border-t border-dark-700 my-6" />

                {/* Creator Actions */}
                {isCreator && (
                  <div className="space-y-3 mb-4">
                    <p className="text-sm text-purple-400 font-medium">This is your vibe</p>
                    
                    {canEndEarly && (
                      <Button
                        variant="secondary"
                        className="w-full"
                        onClick={handleEndAuction}
                        loading={ending}
                      >
                        End Auction Early
                      </Button>
                    )}

                    {canSelectWinner && (
                      <p className="text-sm text-yellow-400">
                        ⬆️ Select a winner from the bid history above
                      </p>
                    )}

                    {vibe.winnerUserId && !isPaid && (
                      <p className="text-sm text-yellow-400">
                        ⏳ Waiting for winner to pay...
                      </p>
                    )}

                    {isPaid && (
                      <p className="text-sm text-green-400">
                        ✅ Payment received! Contact info shared.
                      </p>
                    )}
                  </div>
                )}

                {/* Winner Actions */}
                {isWinner && (
                  <div className="space-y-3 mb-4">
                    <p className="text-sm text-green-400 font-medium">🎉 You won this auction!</p>
                    
                    {canPay && (
                      <Button className="w-full" onClick={handlePay}>
                        Pay {formatCurrency(vibe.currentBid)}
                      </Button>
                    )}

                    {isPaid && (
                      <p className="text-sm text-green-400">
                        ✅ Payment complete! Contact info is shown above.
                      </p>
                    )}
                  </div>
                )}

                {/* Bidder Actions */}
                {!isCreator && !isWinner && isActive && !hasEnded && (
                  <>
                    <div className="mb-4">
                      <label className="block text-sm text-gray-400 mb-2">Your Bid</label>
                      <input
                        type="number"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        min={vibe.currentBid + vibe.minIncrement}
                        step={vibe.minIncrement}
                        className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <Button
                      className="w-full"
                      onClick={handleBid}
                      loading={bidding}
                      disabled={!session}
                    >
                      {session ? 'Place Bid' : 'Login to Bid'}
                    </Button>
                  </>
                )}

                {/* Status Messages */}
                {!isCreator && !isWinner && hasEnded && !vibe.winnerUserId && (
                  <p className="text-sm text-yellow-400 text-center">
                    Auction ended. Waiting for creator to select winner.
                  </p>
                )}

                {!isCreator && !isWinner && vibe.winnerUserId && (
                  <p className="text-sm text-gray-400 text-center">
                    This auction has a winner.
                  </p>
                )}

                {/* Tips */}
                <div className="mt-6 p-4 bg-dark-800 rounded-xl">
                  <h4 className="font-medium mb-2">💡 Tips</h4>
                  <ul className="text-sm text-gray-400 space-y-1">
                    <li>• Higher bids get noticed first</li>
                    <li>• Payment unlocks contact info</li>
                    <li>• 24 hours to pay after winning</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
