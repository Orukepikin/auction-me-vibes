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
  bidder: { id: string; name: string; image: string | null }
}

interface Review {
  id: string
  rating: number
  comment: string | null
  createdAt: string
  reviewer: { id: string; name: string; image: string | null }
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
  deliveredAt: string | null
  completedAt: string | null
  creatorId: string
  winnerUserId: string | null
  creator: {
    id: string
    name: string
    image: string | null
    bio: string | null
    isVerified?: boolean
    verificationLevel?: string
    averageRating?: number
    totalReviews?: number
    phone?: string
    email?: string
    instagram?: string
    twitter?: string
  }
  winner?: { id: string; name: string }
  bids: Bid[]
  reviews?: Review[]
}

function CountdownTimer({ endAt }: { endAt: string }) {
  const [timeLeft, setTimeLeft] = useState('')
  const [isEnded, setIsEnded] = useState(false)

  useEffect(() => {
    const calc = () => {
      const diff = new Date(endAt).getTime() - Date.now()
      if (diff <= 0) { setIsEnded(true); setTimeLeft('Ended'); return }
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft(d > 0 ? `${d}d ${h}h ${m}m` : h > 0 ? `${h}h ${m}m ${s}s` : m > 0 ? `${m}m ${s}s` : `${s}s`)
    }
    calc()
    const t = setInterval(calc, 1000)
    return () => clearInterval(t)
  }, [endAt])

  return <div className={`text-2xl font-bold ${isEnded ? 'text-red-400' : 'text-green-400'}`}>{timeLeft}</div>
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(s => <span key={s} className={s <= rating ? 'text-yellow-400' : 'text-gray-600'}>★</span>)}
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
  const [paying, setPaying] = useState(false)
  const [delivering, setDelivering] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [startingChat, setStartingChat] = useState(false)
  const [selectedWinner, setSelectedWinner] = useState<string | null>(null)
  
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewing, setReviewing] = useState(false)

  useEffect(() => { fetchVibe() }, [params.id])

  const fetchVibe = async () => {
    try {
      const res = await fetch(`/api/vibes/${params.id}`)
      if (!res.ok) throw new Error('Not found')
      const data = await res.json()
      setVibe(data)
      setBidAmount(String(data.currentBid + data.minIncrement))
    } catch { addToast('Failed to load vibe', 'error') }
    finally { setLoading(false) }
  }

  const handleBid = async () => {
    if (!session) { router.push('/login'); return }
    setBidding(true)
    try {
      const res = await fetch(`/api/vibes/${params.id}/bid`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseInt(bidAmount) }),
      })
      const data = await res.json()
      if (!res.ok) addToast(data.error || 'Failed', 'error')
      else { addToast('Bid placed! 🎉', 'success'); fetchVibe() }
    } catch { addToast('Failed to bid', 'error') }
    finally { setBidding(false) }
  }

  const handleEndAuction = async () => {
    if (!confirm('End auction early?')) return
    setEnding(true)
    try {
      const res = await fetch(`/api/vibes/${params.id}/end`, { method: 'POST' })
      if (!res.ok) { const d = await res.json(); addToast(d.error || 'Failed', 'error') }
      else { addToast('Auction ended!', 'success'); fetchVibe() }
    } catch { addToast('Failed', 'error') }
    finally { setEnding(false) }
  }

  const handleSelectWinner = async (winnerId: string) => {
    if (!confirm('Select this winner?')) return
    setSelecting(true); setSelectedWinner(winnerId)
    try {
      const res = await fetch(`/api/vibes/${params.id}/select-winner`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winnerId }),
      })
      if (!res.ok) { const d = await res.json(); addToast(d.error || 'Failed', 'error') }
      else { addToast('Winner selected!', 'success'); fetchVibe() }
    } catch { addToast('Failed', 'error') }
    finally { setSelecting(false); setSelectedWinner(null) }
  }

  const handlePay = async () => {
    setPaying(true)
    try {
      const res = await fetch(`/api/vibes/${params.id}/pay/init`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) { addToast(data.error || 'Payment failed', 'error'); return }
      // Redirect to Paystack
      window.location.href = data.authorization_url
    } catch { addToast('Payment failed', 'error') }
    finally { setPaying(false) }
  }

  const handleStartConversation = async () => {
    setStartingChat(true)
    try {
      const res = await fetch(`/api/vibes/${params.id}/conversation`, { method: 'POST' })
      if (res.ok) router.push('/messages')
      else { const d = await res.json(); addToast(d.error || 'Failed', 'error') }
    } catch { addToast('Failed', 'error') }
    finally { setStartingChat(false) }
  }

  const handleMarkDelivered = async () => {
    if (!confirm('Mark as delivered?')) return
    setDelivering(true)
    try {
      const res = await fetch(`/api/vibes/${params.id}/deliver`, { method: 'POST' })
      if (!res.ok) { const d = await res.json(); addToast(d.error || 'Failed', 'error') }
      else { addToast('Marked delivered!', 'success'); fetchVibe() }
    } catch { addToast('Failed', 'error') }
    finally { setDelivering(false) }
  }

  const handleConfirmComplete = async () => {
    if (!confirm('Confirm received? This releases payment.')) return
    setCompleting(true)
    try {
      const res = await fetch(`/api/vibes/${params.id}/complete`, { method: 'POST' })
      if (!res.ok) { const d = await res.json(); addToast(d.error || 'Failed', 'error') }
      else { addToast('Completed! Leave a review.', 'success'); setShowReviewForm(true); fetchVibe() }
    } catch { addToast('Failed', 'error') }
    finally { setCompleting(false) }
  }

  const handleSubmitReview = async () => {
    setReviewing(true)
    try {
      const res = await fetch(`/api/vibes/${params.id}/review`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: reviewRating, comment: reviewComment }),
      })
      if (!res.ok) { const d = await res.json(); addToast(d.error || 'Failed', 'error') }
      else { addToast('Review submitted!', 'success'); setShowReviewForm(false); fetchVibe() }
    } catch { addToast('Failed', 'error') }
    finally { setReviewing(false) }
  }

  if (loading) return (
    <div className="min-h-screen bg-dark-950"><Navbar />
      <main className="pt-24 pb-12"><div className="max-w-6xl mx-auto px-4 flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div></main>
    </div>
  )

  if (!vibe) return (
    <div className="min-h-screen bg-dark-950"><Navbar />
      <main className="pt-24 pb-12"><div className="max-w-6xl mx-auto px-4 text-center py-20">
        <h1 className="text-2xl font-bold mb-4">Vibe not found</h1>
        <Link href="/market"><Button>Back to Market</Button></Link>
      </div></main>
    </div>
  )

  const isCreator = session?.user?.id === vibe.creatorId
  const isWinner = session?.user?.id === vibe.winnerUserId
  const isActive = vibe.status === 'ACTIVE'
  const isEnded = vibe.status === 'ENDED'
  const isPaid = vibe.status === 'PAID'
  const isCompleted = vibe.status === 'COMPLETED'
  const hasEnded = new Date() > new Date(vibe.endAt)
  
  const canEndEarly = isCreator && isActive && vibe.bids.length > 0
  const canSelectWinner = isCreator && (isEnded || (isActive && hasEnded)) && !vibe.winnerUserId && vibe.bids.length > 0
  const canPay = isWinner && isEnded && vibe.winnerUserId && vibe.status !== 'PAID' && vibe.status !== 'COMPLETED'
  const canMessage = (isCreator || isWinner) && vibe.winnerUserId && (isPaid || isCompleted)
  const canMarkDelivered = isCreator && isPaid && !vibe.deliveredAt
  const canConfirmComplete = isWinner && vibe.deliveredAt && !isCompleted
  const canReview = (isCreator || isWinner) && isCompleted
  const alreadyReviewed = vibe.reviews?.some(r => r.reviewer.id === session?.user?.id)

  return (
    <div className="min-h-screen bg-dark-950"><Navbar />
      <main className="pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-4">
          <Link href="/market" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6">← Back to Market</Link>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Vibe Card */}
              <div className="glass-card rounded-2xl overflow-hidden">
                {vibe.mediaUrl && <div className="aspect-video bg-dark-800"><img src={vibe.mediaUrl} alt={vibe.title} className="w-full h-full object-cover" /></div>}
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <h1 className="text-2xl font-bold">{vibe.title}</h1>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      isActive ? 'bg-green-500/20 text-green-400' :
                      isEnded ? 'bg-yellow-500/20 text-yellow-400' :
                      isPaid ? 'bg-blue-500/20 text-blue-400' :
                      isCompleted ? 'bg-green-500/20 text-green-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>{vibe.status}</span>
                  </div>
                  <p className="text-gray-400 whitespace-pre-wrap">{vibe.description}</p>
                  {vibe.category && <div className="mt-4"><span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm">{vibe.category}</span></div>}
                  <div className="mt-6">
                    <div className="flex justify-between text-sm mb-2"><span className="text-gray-400">Weirdness</span><span className="text-purple-400">{vibe.weirdness}/10</span></div>
                    <div className="h-2 bg-dark-700 rounded-full"><div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" style={{ width: `${vibe.weirdness * 10}%` }} /></div>
                  </div>
                </div>
              </div>

              {/* Creator */}
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-sm font-medium text-gray-400 mb-4">CREATOR</h3>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xl font-bold">{vibe.creator.name?.[0] || '?'}</div>
                  <div>
                    <p className="font-semibold">{vibe.creator.name}</p>
                    {vibe.creator.bio && <p className="text-sm text-gray-400">{vibe.creator.bio}</p>}
                    {vibe.creator.averageRating !== undefined && (
                      <div className="flex items-center gap-2 mt-1">
                        <StarRating rating={Math.round(vibe.creator.averageRating || 0)} />
                        <span className="text-sm text-gray-400">({vibe.creator.totalReviews || 0})</span>
                      </div>
                    )}
                  </div>
                </div>
                {isWinner && isCompleted && (vibe.creator.phone || vibe.creator.email) && (
                  <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                    <h4 className="text-green-400 font-medium mb-2">📞 Contact Info</h4>
                    {vibe.creator.email && <p className="text-sm">Email: {vibe.creator.email}</p>}
                    {vibe.creator.phone && <p className="text-sm">Phone: {vibe.creator.phone}</p>}
                    {vibe.creator.instagram && <p className="text-sm">Instagram: {vibe.creator.instagram}</p>}
                    {vibe.creator.twitter && <p className="text-sm">Twitter: {vibe.creator.twitter}</p>}
                  </div>
                )}
              </div>

              {/* Bids */}
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-sm font-medium text-gray-400 mb-4">BID HISTORY ({vibe.bids.length})</h3>
                {vibe.bids.length === 0 ? <p className="text-gray-500">No bids yet</p> : (
                  <div className="space-y-3">
                    {vibe.bids.map((bid, i) => (
                      <div key={bid.id} className={`flex items-center justify-between p-3 rounded-xl ${
                        vibe.winnerUserId === bid.bidder.id ? 'bg-green-500/10 border border-green-500/20' :
                        i === 0 ? 'bg-purple-500/10 border border-purple-500/20' : 'bg-dark-800'
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold">{bid.bidder.name?.[0]}</div>
                          <div>
                            <p className="font-medium">{bid.bidder.name} {vibe.winnerUserId === bid.bidder.id && <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full ml-2">WINNER</span>}</p>
                            <p className="text-xs text-gray-400">{new Date(bid.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${i === 0 ? 'text-purple-400' : ''}`}>{formatCurrency(bid.amount)}</p>
                          {canSelectWinner && <Button size="sm" onClick={() => handleSelectWinner(bid.bidder.id)} loading={selecting && selectedWinner === bid.bidder.id} className="mt-2">Select</Button>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Reviews */}
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-sm font-medium text-gray-400 mb-4">⭐ REVIEWS</h3>
                {(showReviewForm || (canReview && !alreadyReviewed)) && (
                  <div className="mb-6 p-4 bg-dark-800 rounded-xl">
                    <h4 className="font-medium mb-3">Leave a Review</h4>
                    <div className="mb-3">
                      <div className="flex gap-2 text-2xl">
                        {[1,2,3,4,5].map(s => <button key={s} onClick={() => setReviewRating(s)} className={s <= reviewRating ? 'text-yellow-400' : 'text-gray-600'}>★</button>)}
                      </div>
                    </div>
                    <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)} rows={3} className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-xl mb-3" placeholder="Your review..." />
                    <Button onClick={handleSubmitReview} loading={reviewing}>Submit</Button>
                  </div>
                )}
                {vibe.reviews && vibe.reviews.length > 0 ? (
                  <div className="space-y-4">
                    {vibe.reviews.map(r => (
                      <div key={r.id} className="p-4 bg-dark-800 rounded-xl">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold">{r.reviewer.name?.[0]}</div>
                          <div><p className="font-medium">{r.reviewer.name}</p><StarRating rating={r.rating} /></div>
                        </div>
                        {r.comment && <p className="text-gray-400 text-sm">{r.comment}</p>}
                      </div>
                    ))}
                  </div>
                ) : <p className="text-gray-500">No reviews yet</p>}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="glass-card rounded-2xl p-6 sticky top-24">
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between"><span className="text-gray-400">Current Bid</span><span className="text-2xl font-bold text-purple-400">{formatCurrency(vibe.currentBid)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-400">Min Increment</span><span>{formatCurrency(vibe.minIncrement)}</span></div>
                  <div className="flex justify-between items-center"><span className="text-gray-400">{hasEnded ? 'Status' : 'Ends in'}</span><CountdownTimer endAt={vibe.endAt} /></div>
                </div>

                <div className="border-t border-dark-700 my-6" />

                <div className="space-y-3">
                  {/* Creator Actions */}
                  {isCreator && <>
                    <p className="text-sm text-purple-400 font-medium">👑 Your vibe</p>
                    {canEndEarly && <Button variant="secondary" className="w-full" onClick={handleEndAuction} loading={ending}>End Early</Button>}
                    {canSelectWinner && <p className="text-sm text-yellow-400">⬆️ Select winner above</p>}
                    {canMessage && <Button className="w-full" onClick={handleStartConversation} loading={startingChat}>💬 Message Winner</Button>}
                    {canMarkDelivered && <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handleMarkDelivered} loading={delivering}>✓ Mark Delivered</Button>}
                    {vibe.deliveredAt && !isCompleted && <p className="text-sm text-yellow-400">⏳ Waiting for confirmation...</p>}
                    {isCompleted && <p className="text-sm text-green-400">✅ Completed!</p>}
                  </>}

                  {/* Winner Actions */}
                  {isWinner && <>
                    <p className="text-sm text-green-400 font-medium">🎉 You won!</p>
                    {canPay && <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handlePay} loading={paying}>💳 Pay {formatCurrency(vibe.currentBid)}</Button>}
                    {canMessage && <Button variant="secondary" className="w-full" onClick={handleStartConversation} loading={startingChat}>💬 Message Creator</Button>}
                    {canConfirmComplete && <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handleConfirmComplete} loading={completing}>✓ Confirm Received</Button>}
                    {isPaid && !vibe.deliveredAt && <p className="text-sm text-yellow-400">⏳ Waiting for delivery...</p>}
                    {isCompleted && <p className="text-sm text-green-400">✅ Completed!</p>}
                  </>}

                  {/* Bidding */}
                  {!isCreator && !isWinner && isActive && !hasEnded && <>
                    <div className="mb-4">
                      <label className="block text-sm text-gray-400 mb-2">Your Bid</label>
                      <input type="number" value={bidAmount} onChange={e => setBidAmount(e.target.value)} min={vibe.currentBid + vibe.minIncrement} className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl" />
                    </div>
                    <Button className="w-full" onClick={handleBid} loading={bidding} disabled={!session}>{session ? 'Place Bid' : 'Login to Bid'}</Button>
                  </>}

                  {!isCreator && !isWinner && hasEnded && !vibe.winnerUserId && <p className="text-sm text-yellow-400 text-center">Waiting for winner selection...</p>}
                </div>

                <div className="mt-6 p-4 bg-dark-800 rounded-xl">
                  <h4 className="font-medium mb-2">💡 How it works</h4>
                  <ol className="text-sm text-gray-400 space-y-1">
                    <li>1. Winner pays securely</li>
                    <li>2. Creator delivers service</li>
                    <li>3. Winner confirms receipt</li>
                    <li>4. Payment released to creator</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
