'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Input, Textarea, Select } from '@/components/ui/input'
import { ImageUpload } from '@/components/image-upload'
import { useToast } from '@/components/ui/toast'
import { formatCurrency, getWeirdnessLabel, getWeirdnessColor } from '@/lib/utils'

const categories = [
  { value: '', label: 'Select a category' },
  { value: 'Chaos', label: '🌪️ Chaos' },
  { value: 'Professional', label: '💼 Professional' },
  { value: 'Wholesome', label: '💖 Wholesome' },
  { value: 'Music', label: '🎵 Music' },
  { value: 'Art', label: '🎨 Art' },
  { value: 'Comedy', label: '😂 Comedy' },
  { value: 'Other', label: '✨ Other' },
]

const durations = [
  { value: '1', label: '1 hour' },
  { value: '6', label: '6 hours' },
  { value: '12', label: '12 hours' },
  { value: '24', label: '24 hours' },
  { value: '48', label: '2 days' },
  { value: '72', label: '3 days' },
  { value: '168', label: '1 week' },
]

export default function CreateVibePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { addToast } = useToast()

  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    mediaUrl: '',
    weirdness: 5,
    startingBid: 1000,
    minIncrement: 100,
    durationHours: 24,
  })

  // Handle hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle auth redirect
  useEffect(() => {
    if (mounted && status === 'unauthenticated') {
      router.push('/login?callbackUrl=/create')
    }
  }, [mounted, status, router])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: ['startingBid', 'minIncrement', 'durationHours', 'weirdness'].includes(name)
        ? parseInt(value) || 0
        : value,
    }))
  }

  const handleImageChange = (url: string) => {
    setFormData((prev) => ({ ...prev, mediaUrl: url }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/vibes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create vibe')
      }

      addToast('Vibe created successfully! 🎉', 'success')
      router.push(`/vibe/${data.id}`)
    } catch (error: any) {
      addToast(error.message || 'Failed to create vibe', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Show loading while checking auth
  if (!mounted || status === 'loading') {
    return (
      <div className="min-h-screen bg-dark-950">
        <Navbar />
        <div className="pt-24 pb-12 max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <div className="h-12 w-64 skeleton rounded-lg mx-auto mb-3" />
            <div className="h-6 w-96 skeleton rounded-lg mx-auto" />
          </div>
          <div className="grid lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3 space-y-6">
              <div className="h-64 skeleton rounded-2xl" />
              <div className="h-96 skeleton rounded-2xl" />
            </div>
            <div className="lg:col-span-2">
              <div className="h-[500px] skeleton rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Don't render form if not authenticated
  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-dark-950">
        <Navbar />
        <div className="pt-32 pb-12 max-w-6xl mx-auto px-4 text-center">
          <span className="text-6xl block mb-4">🔒</span>
          <p className="text-gray-400 mb-6">Please sign in to create a vibe</p>
          <Link href="/login?callbackUrl=/create">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-950">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="blob blob-1 opacity-20" />
        <div className="blob blob-2 opacity-20" />
      </div>

      <Navbar />

      <main className="relative z-10 pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-4xl sm:text-5xl font-bold mb-3">
              Create a <span className="gradient-text">Vibe</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-xl mx-auto">
              Post your most unhinged service and let people bid on it
            </p>
          </div>

          <div className="grid lg:grid-cols-5 gap-8">
            {/* Form */}
            <div className="lg:col-span-3">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Image Upload */}
                <div className="glass-card rounded-2xl p-6">
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Cover Image (optional)
                  </label>
                  <ImageUpload
                    value={formData.mediaUrl}
                    onChange={handleImageChange}
                    disabled={loading}
                  />
                </div>

                {/* Basic Info */}
                <div className="glass-card rounded-2xl p-6 space-y-5">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <span>📝</span> Basic Info
                  </h2>

                  <Input
                    label="Title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="I will scream your ex's name into the void"
                    required
                    disabled={loading}
                  />

                  <Textarea
                    label="Description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe your vibe in detail. What will you do? What does the winner get?"
                    rows={5}
                    required
                    disabled={loading}
                  />

                  <Select
                    label="Category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    options={categories}
                    disabled={loading}
                  />

                  {/* Weirdness slider */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Weirdness Level:{' '}
                      <span className={`font-bold ${getWeirdnessColor(formData.weirdness)}`}>
                        {formData.weirdness}/10 - {getWeirdnessLabel(formData.weirdness)}
                      </span>
                    </label>
                    <input
                      type="range"
                      name="weirdness"
                      min="1"
                      max="10"
                      value={formData.weirdness}
                      onChange={handleChange}
                      disabled={loading}
                      className="w-full h-3 bg-dark-700 rounded-full appearance-none cursor-pointer accent-purple-500"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Mild</span>
                      <span>Absolute Chaos</span>
                    </div>
                  </div>
                </div>

                {/* Auction Settings */}
                <div className="glass-card rounded-2xl p-6 space-y-5">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <span>💰</span> Auction Settings
                  </h2>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <Input
                      label="Starting Bid (₦)"
                      name="startingBid"
                      type="number"
                      value={formData.startingBid}
                      onChange={handleChange}
                      min={100}
                      step={100}
                      required
                      disabled={loading}
                    />

                    <Input
                      label="Min Increment (₦)"
                      name="minIncrement"
                      type="number"
                      value={formData.minIncrement}
                      onChange={handleChange}
                      min={50}
                      step={50}
                      required
                      disabled={loading}
                    />
                  </div>

                  <Select
                    label="Duration"
                    name="durationHours"
                    value={formData.durationHours.toString()}
                    onChange={handleChange}
                    options={durations}
                    disabled={loading}
                  />
                </div>

                {/* Submit */}
                <div className="flex gap-4">
                  <Link href="/market" className="flex-1">
                    <Button type="button" variant="secondary" className="w-full" disabled={loading}>
                      Cancel
                    </Button>
                  </Link>
                  <Button type="submit" className="flex-1" loading={loading}>
                    Create Vibe
                  </Button>
                </div>
              </form>
            </div>

            {/* Live Preview */}
            <div className="lg:col-span-2">
              <div className="lg:sticky lg:top-24">
                <h3 className="text-sm text-gray-500 uppercase tracking-wider mb-4">
                  Live Preview
                </h3>
                <div className="glass-card rounded-2xl overflow-hidden">
                  {/* Image */}
                  <div className="relative h-48 bg-dark-800">
                    {formData.mediaUrl ? (
                      <img
                        src={formData.mediaUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-6xl opacity-30">🌀</span>
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <span className="px-3 py-1 rounded-lg text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30">
                        ACTIVE
                      </span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold bg-dark-900/80 ${getWeirdnessColor(formData.weirdness)}`}>
                        {formData.weirdness}/10
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    {formData.category && (
                      <span className="text-xs text-purple-400 font-semibold uppercase tracking-wider">
                        {formData.category}
                      </span>
                    )}
                    <h3 className="mt-1 text-lg font-bold text-white line-clamp-2">
                      {formData.title || 'Your vibe title'}
                    </h3>
                    <p className="mt-2 text-sm text-gray-400 line-clamp-2">
                      {formData.description || 'Your vibe description will appear here...'}
                    </p>

                    <div className="mt-4 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold">
                        {session?.user?.name?.[0] || '?'}
                      </div>
                      <span className="text-sm text-gray-400">
                        {session?.user?.name || 'You'}
                      </span>
                    </div>

                    <div className="mt-4 pt-4 border-t border-dark-600 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500">Starting bid</p>
                        <p className="text-xl font-bold gradient-text-gold">
                          {formatCurrency(formData.startingBid)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Duration</p>
                        <p className="text-sm font-medium">
                          {durations.find((d) => d.value === formData.durationHours.toString())?.label}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tips */}
                <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                  <h4 className="font-semibold text-purple-400 mb-2">💡 Tips</h4>
                  <ul className="space-y-1 text-sm text-gray-400">
                    <li>• Use a catchy, descriptive title</li>
                    <li>• Higher weirdness = more attention</li>
                    <li>• Add an image to stand out</li>
                    <li>• Be specific about what you&apos;ll deliver</li>
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
