'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'

interface Vibe {
  id: string
  title: string
  description: string
  category: string | null
  mediaUrl: string | null
  weirdness: number
  currentBid: number
  status: string
  endAt: string
  creator: {
    id: string
    name: string
    image: string | null
    isVerified?: boolean
  }
  _count: { bids: number }
}

const CATEGORIES = [
  { value: '', label: 'All Categories', icon: '🌀' },
  { value: 'Creative', label: 'Creative', icon: '🎨' },
  { value: 'Tech', label: 'Tech', icon: '💻' },
  { value: 'Music', label: 'Music', icon: '🎵' },
  { value: 'Art', label: 'Art', icon: '🖼️' },
  { value: 'Writing', label: 'Writing', icon: '✍️' },
  { value: 'Video', label: 'Video', icon: '🎬' },
  { value: 'Advice', label: 'Advice', icon: '💡' },
  { value: 'Chaos', label: 'Chaos', icon: '🔥' },
  { value: 'Mystery', label: 'Mystery', icon: '🔮' },
  { value: 'Other', label: 'Other', icon: '✨' },
]

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'ending', label: 'Ending Soon' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
  { value: 'popular', label: 'Most Bids' },
]

function TimeLeft({ endAt }: { endAt: string }) {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    const calc = () => {
      const diff = new Date(endAt).getTime() - Date.now()
      if (diff <= 0) { setTimeLeft('Ended'); return }
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      if (d > 0) setTimeLeft(`${d}d ${h}h`)
      else if (h > 0) setTimeLeft(`${h}h ${m}m`)
      else setTimeLeft(`${m}m`)
    }
    calc()
    const t = setInterval(calc, 60000)
    return () => clearInterval(t)
  }, [endAt])

  const isEnding = new Date(endAt).getTime() - Date.now() < 3600000 // Less than 1 hour

  return (
    <span className={`text-sm ${isEnding ? 'text-red-400' : 'text-gray-400'}`}>
      {timeLeft}
    </span>
  )
}

function VibeCard({ vibe }: { vibe: Vibe }) {
  return (
    <Link href={`/vibe/${vibe.id}`}>
      <div className="glass-card rounded-2xl overflow-hidden hover:scale-[1.02] transition-all duration-300 cursor-pointer group">
        {/* Image */}
        <div className="aspect-video bg-dark-800 relative overflow-hidden">
          {vibe.mediaUrl ? (
            <img src={vibe.mediaUrl} alt={vibe.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
              🌀
            </div>
          )}
          
          {/* Status Badge */}
          <div className="absolute top-3 left-3">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              vibe.status === 'ACTIVE' ? 'bg-green-500/80 text-white' : 'bg-gray-500/80 text-white'
            }`}>
              {vibe.status === 'ACTIVE' ? '🔴 Live' : vibe.status}
            </span>
          </div>

          {/* Category Badge */}
          {vibe.category && (
            <div className="absolute top-3 right-3">
              <span className="px-2 py-1 bg-dark-900/80 rounded-full text-xs">
                {CATEGORIES.find(c => c.value === vibe.category)?.icon} {vibe.category}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-lg mb-1 truncate group-hover:text-purple-400 transition-colors">
            {vibe.title}
          </h3>
          <p className="text-gray-400 text-sm line-clamp-2 mb-3">
            {vibe.description}
          </p>

          {/* Creator */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold">
              {vibe.creator.name?.[0] || '?'}
            </div>
            <span className="text-sm text-gray-400 truncate">{vibe.creator.name}</span>
            {vibe.creator.isVerified && <span className="text-green-400 text-xs">✓</span>}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between pt-3 border-t border-dark-700">
            <div>
              <p className="text-xs text-gray-500">Current Bid</p>
              <p className="font-bold text-purple-400">{formatCurrency(vibe.currentBid)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">{vibe._count.bids} bids</p>
              <TimeLeft endAt={vibe.endAt} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function MarketPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [vibes, setVibes] = useState<Vibe[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [category, setCategory] = useState(searchParams.get('category') || '')
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest')
  const [showFilters, setShowFilters] = useState(false)

  const fetchVibes = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('q', search)
      if (category) params.set('category', category)
      if (sort) params.set('sort', sort)

      const res = await fetch(`/api/vibes?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setVibes(data)
      }
    } catch (error) {
      console.error('Failed to fetch vibes')
    } finally {
      setLoading(false)
    }
  }, [search, category, sort])

  useEffect(() => {
    fetchVibes()
  }, [fetchVibes])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateURL()
  }

  const updateURL = () => {
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (category) params.set('category', category)
    if (sort) params.set('sort', sort)
    router.push(`/market?${params.toString()}`)
  }

  const clearFilters = () => {
    setSearch('')
    setCategory('')
    setSort('newest')
    router.push('/market')
  }

  const activeFiltersCount = [search, category, sort !== 'newest'].filter(Boolean).length

  return (
    <div className="min-h-screen bg-dark-950">
      <Navbar />

      <main className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold">🏪 Vibe Market</h1>
              <p className="text-gray-400">Discover unique services and weird talents</p>
            </div>
            <Link href="/create">
              <Button>✨ Create Vibe</Button>
            </Link>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search vibes..."
                  className="w-full px-5 py-4 pl-12 bg-dark-800 border border-dark-600 rounded-xl focus:outline-none focus:border-purple-500 text-lg"
                />
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  🔍
                </span>
              </div>
              <Button type="submit" className="px-8">
                Search
              </Button>
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 rounded-xl border transition-colors ${
                  showFilters || activeFiltersCount > 0
                    ? 'bg-purple-500/20 border-purple-500 text-purple-400'
                    : 'bg-dark-800 border-dark-600 text-gray-400 hover:border-purple-500'
                }`}
              >
                ⚙️ Filters
                {activeFiltersCount > 0 && (
                  <span className="ml-2 bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>
          </form>

          {/* Filters Panel */}
          {showFilters && (
            <div className="glass-card rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">Filters</h3>
                {activeFiltersCount > 0 && (
                  <button onClick={clearFilters} className="text-sm text-purple-400 hover:underline">
                    Clear all
                  </button>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Sort */}
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Sort By</label>
                  <select
                    value={sort}
                    onChange={(e) => { setSort(e.target.value); }}
                    className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl focus:outline-none focus:border-purple-500"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Apply Button */}
                <div className="flex items-end">
                  <Button onClick={updateURL} className="w-full">
                    Apply Filters
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => { setCategory(cat.value); setTimeout(fetchVibes, 0); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                  category === cat.value
                    ? 'bg-purple-500 text-white'
                    : 'bg-dark-800 text-gray-400 hover:bg-dark-700 hover:text-white'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-gray-400">
              {loading ? 'Loading...' : `${vibes.length} vibes found`}
              {search && <span className="text-purple-400"> for "{search}"</span>}
              {category && <span className="text-purple-400"> in {category}</span>}
            </p>
          </div>

          {/* Vibes Grid */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : vibes.length === 0 ? (
            <div className="text-center py-20">
              <span className="text-6xl mb-4 block">🔍</span>
              <h3 className="text-xl font-bold mb-2">No vibes found</h3>
              <p className="text-gray-400 mb-6">
                {search || category ? 'Try different search terms or filters' : 'Be the first to create a vibe!'}
              </p>
              <div className="flex gap-3 justify-center">
                {(search || category) && (
                  <Button variant="secondary" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                )}
                <Link href="/create">
                  <Button>Create a Vibe</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {vibes.map((vibe) => (
                <VibeCard key={vibe.id} vibe={vibe} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
