'use client'

import { useState, useEffect } from 'react'
import { Navbar } from '@/components/navbar'
import { VibeCard, VibeCardSkeleton } from '@/components/vibe-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Vibe {
  id: string
  title: string
  description: string
  category: string | null
  mediaUrl: string | null
  weirdness: number
  currentBid: number
  endAt: string
  status: string
  creator: {
    id: string
    name: string | null
    username: string | null
    image: string | null
  }
  _count: {
    bids: number
  }
}

const categories = ['All', 'Chaos', 'Professional', 'Wholesome', 'Music', 'Art', 'Comedy', 'Other']

const sortOptions = [
  { value: 'endingSoon', label: 'Ending Soon' },
  { value: 'newest', label: 'Newest' },
  { value: 'highestBid', label: 'Highest Bid' },
  { value: 'mostBids', label: 'Most Bids' },
]

export default function MarketPage() {
  const [vibes, setVibes] = useState<Vibe[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [sortBy, setSortBy] = useState('endingSoon')
  const [weirdnessRange, setWeirdnessRange] = useState([1, 10])
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchVibes()
  }, [selectedCategory, sortBy])

  const fetchVibes = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        sort: sortBy,
        ...(selectedCategory !== 'All' && { category: selectedCategory }),
        minWeirdness: weirdnessRange[0].toString(),
        maxWeirdness: weirdnessRange[1].toString(),
      })

      const res = await fetch(`/api/market?${params}`)
      const data = await res.json()
      setVibes(data.vibes || [])
    } catch (error) {
      console.error('Failed to fetch vibes:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredVibes = vibes.filter(vibe => 
    searchQuery === '' || 
    vibe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vibe.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const activeCount = vibes.filter(v => v.status === 'ACTIVE').length
  const totalBids = vibes.reduce((sum, v) => sum + v._count.bids, 0)

  return (
    <div className="min-h-screen bg-dark-950">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="blob blob-1 opacity-30" />
        <div className="blob blob-2 opacity-30" />
      </div>

      <Navbar />

      <main className="relative z-10 pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="py-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <h1 className="text-4xl sm:text-5xl font-bold mb-3">
                  <span className="gradient-text">Vibe</span> Market
                </h1>
                <p className="text-gray-400 text-lg">
                  Browse active auctions and place your bids
                </p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">{activeCount}</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Active</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold gradient-text-gold">{totalBids}</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Total Bids</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="glass-card rounded-2xl p-6 mb-8">
            {/* Search */}
            <div className="mb-6">
              <Input
                placeholder="Search vibes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-md"
              />
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-2 mb-6">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    selectedCategory === cat
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25'
                      : 'bg-dark-700 text-gray-400 hover:bg-dark-600 hover:text-white border border-dark-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Sort & Weirdness */}
            <div className="flex flex-wrap items-center gap-6">
              {/* Sort */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 bg-dark-700 border border-dark-600 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
                >
                  {sortOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Weirdness slider */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">Weirdness:</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-green-400">Mild</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={weirdnessRange[0]}
                    onChange={(e) => setWeirdnessRange([parseInt(e.target.value), weirdnessRange[1]])}
                    className="w-20 accent-purple-500"
                  />
                  <span className="text-xs text-gray-400 font-mono">{weirdnessRange[0]}-{weirdnessRange[1]}</span>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={weirdnessRange[1]}
                    onChange={(e) => setWeirdnessRange([weirdnessRange[0], parseInt(e.target.value)])}
                    className="w-20 accent-purple-500"
                  />
                  <span className="text-xs text-red-400">Chaos</span>
                </div>
                <Button variant="ghost" size="sm" onClick={fetchVibes}>
                  Apply
                </Button>
              </div>
            </div>
          </div>

          {/* Results count */}
          <div className="mb-8 flex items-center justify-between">
            <p className="text-gray-400">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  Loading vibes...
                </span>
              ) : (
                <span><strong className="text-white">{filteredVibes.length}</strong> vibes found</span>
              )}
            </p>
          </div>

          {/* Vibes grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => <VibeCardSkeleton key={i} />)
            ) : filteredVibes.length > 0 ? (
              filteredVibes.map((vibe, i) => (
                <VibeCard key={vibe.id} vibe={vibe} featured={i === 0} index={i} />
              ))
            ) : (
              <div className="col-span-full">
                <div className="glass-card rounded-2xl p-16 text-center">
                  <span className="text-7xl block mb-6">🌀</span>
                  <h3 className="text-2xl font-bold mb-3">No vibes found</h3>
                  <p className="text-gray-500 mb-8 max-w-md mx-auto">
                    Try adjusting your filters or check back later for new auctions
                  </p>
                  <Button onClick={() => {
                    setSelectedCategory('All')
                    setWeirdnessRange([1, 10])
                    setSearchQuery('')
                  }}>
                    Reset Filters
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
