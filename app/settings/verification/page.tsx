'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/toast'

interface VerificationStatus {
  email: string | null
  emailVerified: boolean
  phone: string | null
  phoneVerified: boolean
  idDocumentUrl: string | null
  isVerified: boolean
  verificationLevel: string
  verifiedAt: string | null
  totalSales: number
  averageRating: number
  totalReviews: number
  requirements: {
    BASIC: { needed: string[]; met: boolean }
    VERIFIED: { needed: string[]; met: boolean }
    TRUSTED: { needed: string[]; met: boolean }
  }
}

export default function VerificationPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { addToast } = useToast()

  const [verification, setVerification] = useState<VerificationStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [phone, setPhone] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchVerification()
    }
  }, [status])

  const fetchVerification = async () => {
    try {
      const res = await fetch('/api/verification')
      if (res.ok) {
        const data = await res.json()
        setVerification(data)
        setPhone(data.phone || '')
      }
    } catch (error) {
      addToast('Failed to load verification status', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyPhone = async () => {
    if (!phone) {
      addToast('Please enter a phone number', 'error')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })

      if (res.ok) {
        addToast('Phone verified successfully!', 'success')
        fetchVerification()
      } else {
        const data = await res.json()
        addToast(data.error || 'Verification failed', 'error')
      }
    } catch (error) {
      addToast('Verification failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'TRUSTED': return 'text-yellow-400 bg-yellow-500/20'
      case 'VERIFIED': return 'text-green-400 bg-green-500/20'
      case 'BASIC': return 'text-blue-400 bg-blue-500/20'
      default: return 'text-gray-400 bg-gray-500/20'
    }
  }

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'TRUSTED': return '⭐'
      case 'VERIFIED': return '✓✓'
      case 'BASIC': return '✓'
      default: return '○'
    }
  }

  if (status === 'loading' || loading) {
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

  return (
    <div className="min-h-screen bg-dark-950">
      <Navbar />

      <main className="pt-24 pb-12">
        <div className="max-w-2xl mx-auto px-4">
          <h1 className="text-2xl font-bold mb-2">Verification Center</h1>
          <p className="text-gray-400 mb-8">Build trust with buyers by verifying your identity</p>

          {/* Current Level */}
          <div className="glass-card rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-gray-400">Current Level</p>
                <p className={`text-2xl font-bold ${getLevelColor(verification?.verificationLevel || 'NONE')}`}>
                  {getLevelIcon(verification?.verificationLevel || 'NONE')} {verification?.verificationLevel || 'NONE'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Trust Score</p>
                <p className="text-2xl font-bold text-purple-400">
                  {verification?.averageRating.toFixed(1) || '0.0'} ★
                </p>
                <p className="text-xs text-gray-500">{verification?.totalReviews || 0} reviews</p>
              </div>
            </div>

            {/* Level Progress */}
            <div className="flex items-center gap-2 mb-2">
              <div className={`flex-1 h-2 rounded-full ${verification?.verificationLevel !== 'NONE' ? 'bg-blue-500' : 'bg-dark-700'}`} />
              <div className={`flex-1 h-2 rounded-full ${verification?.verificationLevel === 'VERIFIED' || verification?.verificationLevel === 'TRUSTED' ? 'bg-green-500' : 'bg-dark-700'}`} />
              <div className={`flex-1 h-2 rounded-full ${verification?.verificationLevel === 'TRUSTED' ? 'bg-yellow-500' : 'bg-dark-700'}`} />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Basic</span>
              <span>Verified</span>
              <span>Trusted</span>
            </div>
          </div>

          {/* Verification Steps */}
          <div className="space-y-4">
            {/* Email */}
            <div className="glass-card rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                    verification?.emailVerified ? 'bg-green-500/20' : 'bg-dark-700'
                  }`}>
                    📧
                  </div>
                  <div>
                    <p className="font-medium">Email Verification</p>
                    <p className="text-sm text-gray-400">{verification?.email || 'Not set'}</p>
                  </div>
                </div>
                {verification?.emailVerified ? (
                  <span className="text-green-400 text-sm font-medium">✓ Verified</span>
                ) : (
                  <Button size="sm" variant="secondary">Verify</Button>
                )}
              </div>
            </div>

            {/* Phone */}
            <div className="glass-card rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                    verification?.phoneVerified ? 'bg-green-500/20' : 'bg-dark-700'
                  }`}>
                    📱
                  </div>
                  <div>
                    <p className="font-medium">Phone Verification</p>
                    <p className="text-sm text-gray-400">
                      {verification?.phoneVerified ? verification.phone : 'Add your phone number'}
                    </p>
                  </div>
                </div>
                {verification?.phoneVerified && (
                  <span className="text-green-400 text-sm font-medium">✓ Verified</span>
                )}
              </div>
              {!verification?.phoneVerified && (
                <div className="flex gap-3">
                  <Input
                    type="tel"
                    placeholder="+234 800 000 0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <Button onClick={handleVerifyPhone} loading={saving}>
                    Verify
                  </Button>
                </div>
              )}
            </div>

            {/* ID Document */}
            <div className="glass-card rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                    verification?.idDocumentUrl ? 'bg-green-500/20' : 'bg-dark-700'
                  }`}>
                    🪪
                  </div>
                  <div>
                    <p className="font-medium">ID Document</p>
                    <p className="text-sm text-gray-400">Government-issued ID</p>
                  </div>
                </div>
                {verification?.idDocumentUrl ? (
                  <span className="text-green-400 text-sm font-medium">✓ Uploaded</span>
                ) : (
                  <Button size="sm" variant="secondary">Upload</Button>
                )}
              </div>
            </div>

            {/* Sales Milestone */}
            <div className="glass-card rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                    (verification?.totalSales || 0) >= 3 ? 'bg-green-500/20' : 'bg-dark-700'
                  }`}>
                    🏆
                  </div>
                  <div>
                    <p className="font-medium">Complete 3+ Sales</p>
                    <p className="text-sm text-gray-400">{verification?.totalSales || 0} / 3 completed</p>
                  </div>
                </div>
                {(verification?.totalSales || 0) >= 3 ? (
                  <span className="text-green-400 text-sm font-medium">✓ Achieved</span>
                ) : (
                  <span className="text-gray-500 text-sm">{3 - (verification?.totalSales || 0)} more needed</span>
                )}
              </div>
            </div>

            {/* Rating */}
            <div className="glass-card rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                    (verification?.averageRating || 0) >= 4.0 ? 'bg-green-500/20' : 'bg-dark-700'
                  }`}>
                    ⭐
                  </div>
                  <div>
                    <p className="font-medium">Maintain 4.0+ Rating</p>
                    <p className="text-sm text-gray-400">Current: {verification?.averageRating.toFixed(1) || '0.0'}</p>
                  </div>
                </div>
                {(verification?.averageRating || 0) >= 4.0 ? (
                  <span className="text-green-400 text-sm font-medium">✓ Achieved</span>
                ) : (
                  <span className="text-gray-500 text-sm">Keep up the good work!</span>
                )}
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="glass-card rounded-2xl p-6 mt-8">
            <h3 className="font-bold mb-4">Benefits of Verification</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-center gap-3">
                <span className="text-green-400">✓</span>
                <span>Verified badge on your profile and listings</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-green-400">✓</span>
                <span>Higher visibility in search results</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-green-400">✓</span>
                <span>Increased buyer trust and conversions</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-green-400">✓</span>
                <span>Priority customer support</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}
