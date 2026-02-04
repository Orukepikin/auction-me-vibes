'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { ImageUpload } from '@/components/image-upload'
import { useToast } from '@/components/ui/toast'

const CATEGORIES = [
  'Creative', 'Tech', 'Music', 'Art', 'Writing', 
  'Video', 'Advice', 'Chaos', 'Mystery', 'Other'
]

const DURATIONS = [
  { label: '1 hour', hours: 1 },
  { label: '6 hours', hours: 6 },
  { label: '12 hours', hours: 12 },
  { label: '1 day', hours: 24 },
  { label: '3 days', hours: 72 },
  { label: '7 days', hours: 168 },
]

export default function CreateVibePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { addToast } = useToast()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [mediaUrl, setMediaUrl] = useState('')
  const [weirdness, setWeirdness] = useState(5)
  const [startingBid, setStartingBid] = useState('1000')
  const [minIncrement, setMinIncrement] = useState('100')
  const [duration, setDuration] = useState(24)
  const [creating, setCreating] = useState(false)

  if (status === 'loading') {
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

  if (!session) {
    router.push('/login')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      addToast('Please enter a title', 'error')
      return
    }

    if (!description.trim()) {
      addToast('Please enter a description', 'error')
      return
    }

    if (parseInt(startingBid) < 100) {
      addToast('Starting bid must be at least ₦100', 'error')
      return
    }

    setCreating(true)

    try {
      const res = await fetch('/api/vibes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          category: category || null,
          mediaUrl: mediaUrl || null,
          weirdness,
          startingBid: parseInt(startingBid),
          minIncrement: parseInt(minIncrement),
          durationHours: duration,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        addToast(data.error || 'Failed to create vibe', 'error')
        return
      }

      addToast('Vibe created successfully! 🎉', 'success')
      router.push(`/vibe/${data.id}`)
    } catch (error) {
      addToast('Failed to create vibe', 'error')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-950">
      <Navbar />

      <main className="pt-24 pb-12">
        <div className="max-w-2xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">✨ Create a Vibe</h1>
          <p className="text-gray-400 mb-8">Auction off your unique service or talent</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Upload */}
            <div className="glass-card rounded-2xl p-6">
              <label className="block text-sm font-medium text-gray-300 mb-3">
                📷 Cover Image (optional)
              </label>
              <ImageUpload 
                onUpload={(url) => setMediaUrl(url)} 
                currentImage={mediaUrl}
              />
            </div>

            {/* Basic Info */}
            <div className="glass-card rounded-2xl p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., I'll write a song about your pet"
                  className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl focus:outline-none focus:border-purple-500"
                  maxLength={100}
                />
                <p className="text-xs text-gray-500 mt-1">{title.length}/100</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what you're offering in detail..."
                  rows={4}
                  className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl focus:outline-none focus:border-purple-500"
                  maxLength={1000}
                />
                <p className="text-xs text-gray-500 mt-1">{description.length}/1000</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(category === cat ? '' : cat)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        category === cat
                          ? 'bg-purple-500 text-white'
                          : 'bg-dark-800 text-gray-400 hover:bg-dark-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Weirdness Level */}
            <div className="glass-card rounded-2xl p-6">
              <label className="block text-sm font-medium text-gray-300 mb-4">
                🌀 Weirdness Level: {weirdness}/10
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={weirdness}
                onChange={(e) => setWeirdness(parseInt(e.target.value))}
                className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>Normal</span>
                <span>Kinda Weird</span>
                <span>Maximum Chaos</span>
              </div>
            </div>

            {/* Pricing */}
            <div className="glass-card rounded-2xl p-6 space-y-4">
              <h3 className="font-medium">💰 Pricing</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Starting Bid (₦)
                  </label>
                  <input
                    type="number"
                    value={startingBid}
                    onChange={(e) => setStartingBid(e.target.value)}
                    min="100"
                    step="100"
                    className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    Min Increment (₦)
                  </label>
                  <input
                    type="number"
                    value={minIncrement}
                    onChange={(e) => setMinIncrement(e.target.value)}
                    min="50"
                    step="50"
                    className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <p className="text-xs text-gray-500">
                Platform fee: 10% will be deducted from the final sale
              </p>
            </div>

            {/* Duration */}
            <div className="glass-card rounded-2xl p-6">
              <label className="block text-sm font-medium text-gray-300 mb-4">
                ⏱️ Auction Duration
              </label>
              <div className="grid grid-cols-3 gap-3">
                {DURATIONS.map((d) => (
                  <button
                    key={d.hours}
                    type="button"
                    onClick={() => setDuration(d.hours)}
                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      duration === d.hours
                        ? 'bg-purple-500 text-white'
                        : 'bg-dark-800 text-gray-400 hover:bg-dark-700'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full py-4 text-lg"
              loading={creating}
            >
              🚀 Launch Vibe
            </Button>

            <p className="text-center text-sm text-gray-500">
              By creating a vibe, you agree to deliver the service to the winning bidder
            </p>
          </form>
        </div>
      </main>
    </div>
  )
}
