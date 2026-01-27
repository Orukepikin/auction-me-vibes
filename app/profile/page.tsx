'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'
import { formatCurrency } from '@/lib/utils'

interface UserProfile {
  id: string
  name: string | null
  username: string | null
  email: string | null
  image: string | null
  bio: string | null
  phone: string | null
  instagram: string | null
  twitter: string | null
  location: string | null
  walletBalance: number
  payoutBankName: string | null
  payoutAccountNumber: string | null
  payoutAccountName: string | null
}

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { addToast } = useToast()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editMode, setEditMode] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    bio: '',
    phone: '',
    instagram: '',
    twitter: '',
    location: '',
    payoutBankName: '',
    payoutAccountNumber: '',
    payoutAccountName: '',
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/profile')
    } else if (status === 'authenticated') {
      fetchProfile()
    }
  }, [status])

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/me')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setProfile(data)
      setFormData({
        name: data.name || '',
        username: data.username || '',
        bio: data.bio || '',
        phone: data.phone || '',
        instagram: data.instagram || '',
        twitter: data.twitter || '',
        location: data.location || '',
        payoutBankName: data.payoutBankName || '',
        payoutAccountNumber: data.payoutAccountNumber || '',
        payoutAccountName: data.payoutAccountName || '',
      })
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setProfile((prev) => (prev ? { ...prev, ...data } : prev))
      setEditMode(false)
      addToast('Profile updated! ✨', 'success')
    } catch (error: any) {
      addToast(error.message || 'Failed to update profile', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-dark-950">
        <Navbar />
        <div className="pt-24 pb-12 max-w-4xl mx-auto px-4">
          <div className="h-48 skeleton rounded-2xl mb-6" />
          <div className="h-96 skeleton rounded-2xl" />
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-dark-950">
        <Navbar />
        <div className="pt-32 pb-12 max-w-4xl mx-auto px-4 text-center">
          <span className="text-6xl block mb-4">😵</span>
          <p className="text-gray-400 mb-6">Failed to load profile</p>
          <Button onClick={fetchProfile}>Retry</Button>
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Profile header */}
          <div className="glass-card rounded-3xl p-8 mb-8">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-cyan-500 p-1">
                  <div className="w-full h-full rounded-xl bg-dark-900 flex items-center justify-center text-4xl font-bold">
                    {profile.name?.[0] || profile.email?.[0] || '?'}
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-sm">
                  ✓
                </div>
              </div>

              {/* Info */}
              <div className="text-center sm:text-left flex-1">
                <h1 className="text-3xl font-bold">{profile.name || 'Anonymous'}</h1>
                {profile.username && (
                  <p className="text-gray-400 text-lg">@{profile.username}</p>
                )}
                {profile.bio && (
                  <p className="text-gray-500 mt-2 max-w-md">{profile.bio}</p>
                )}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-4">
                  {profile.location && (
                    <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-dark-700 text-gray-400 flex items-center gap-1">
                      📍 {profile.location}
                    </span>
                  )}
                  <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    Creator
                  </span>
                  <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    Bidder
                  </span>
                </div>
              </div>

              {/* Wallet */}
              <div className="text-center p-6 bg-dark-800 rounded-2xl min-w-[160px]">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Wallet Balance</p>
                <p className="text-2xl font-bold gradient-text-gold">
                  {formatCurrency(profile.walletBalance)}
                </p>
              </div>
            </div>
          </div>

          {/* Profile form */}
          <div className="glass-card rounded-3xl p-8 mb-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-bold">Profile Details</h2>
                <p className="text-sm text-gray-500 mt-1">Update your personal information</p>
              </div>
              {!editMode ? (
                <Button variant="secondary" onClick={() => setEditMode(true)}>
                  Edit Profile
                </Button>
              ) : (
                <div className="flex gap-3">
                  <Button variant="ghost" onClick={() => { setEditMode(false); fetchProfile() }}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} loading={saving}>
                    Save Changes
                  </Button>
                </div>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <Input
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={!editMode}
                placeholder="Your name"
              />
              <Input
                label="Username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                disabled={!editMode}
                placeholder="@username"
              />
              <div className="sm:col-span-2">
                <Textarea
                  label="Bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  disabled={!editMode}
                  rows={3}
                  placeholder="Tell people about yourself..."
                />
              </div>
              <Input
                label="Phone (with country code)"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                disabled={!editMode}
                placeholder="+234..."
              />
              <Input
                label="Location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                disabled={!editMode}
                placeholder="Lagos, Nigeria"
              />
              <Input
                label="Instagram"
                name="instagram"
                value={formData.instagram}
                onChange={handleChange}
                disabled={!editMode}
                placeholder="@username"
              />
              <Input
                label="Twitter / X"
                name="twitter"
                value={formData.twitter}
                onChange={handleChange}
                disabled={!editMode}
                placeholder="@username"
              />
            </div>
          </div>

          {/* Payout settings */}
          <div className="glass-card rounded-3xl p-8 mb-8">
            <div className="mb-8">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span>🏦</span> Payout Settings
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Add your bank details to receive earnings from your vibes
              </p>
            </div>

            {!profile.payoutBankName && !editMode && (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl mb-6">
                <p className="text-yellow-400 text-sm flex items-center gap-2">
                  <span>⚠️</span>
                  You haven&apos;t set up payout details yet. Click &quot;Edit Profile&quot; to add your bank info.
                </p>
              </div>
            )}

            <div className="grid sm:grid-cols-3 gap-6">
              <Input
                label="Bank Name"
                name="payoutBankName"
                value={formData.payoutBankName}
                onChange={handleChange}
                disabled={!editMode}
                placeholder="GTBank"
              />
              <Input
                label="Account Number"
                name="payoutAccountNumber"
                value={formData.payoutAccountNumber}
                onChange={handleChange}
                disabled={!editMode}
                placeholder="0123456789"
              />
              <Input
                label="Account Name"
                name="payoutAccountName"
                value={formData.payoutAccountName}
                onChange={handleChange}
                disabled={!editMode}
                placeholder="John Doe"
              />
            </div>
          </div>

          {/* Account actions */}
          <div className="glass-card rounded-3xl p-8">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span>⚙️</span> Account
            </h2>
            <div className="flex flex-wrap gap-4">
              <Button
                variant="secondary"
                onClick={() => signOut({ callbackUrl: '/' })}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
