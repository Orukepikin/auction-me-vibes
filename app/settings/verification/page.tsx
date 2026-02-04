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
  totalSales: number
  averageRating: number
  totalReviews: number
}

export default function VerificationPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { addToast } = useToast()

  const [verification, setVerification] = useState<VerificationStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [phone, setPhone] = useState('')
  const [verifyingEmail, setVerifyingEmail] = useState(false)
  const [verifyingPhone, setVerifyingPhone] = useState(false)
  const [showPhoneInput, setShowPhoneInput] = useState(false)
  const [showEmailCode, setShowEmailCode] = useState(false)
  const [showPhoneCode, setShowPhoneCode] = useState(false)
  const [emailCode, setEmailCode] = useState('')
  const [phoneCode, setPhoneCode] = useState('')

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

  const handleSendEmailCode = async () => {
    setVerifyingEmail(true)
    try {
      const res = await fetch('/api/verification/email/send', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        addToast('Verification code sent to your email!', 'success')
        setShowEmailCode(true)
      } else {
        addToast(data.error || 'Failed to send code', 'error')
      }
    } catch (error) {
      addToast('Failed to send verification code', 'error')
    } finally {
      setVerifyingEmail(false)
    }
  }

  const handleVerifyEmail = async () => {
    if (!emailCode || emailCode.length !== 6) {
      addToast('Please enter a 6-digit code', 'error')
      return
    }
    setVerifyingEmail(true)
    try {
      const res = await fetch('/api/verification/email/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: emailCode }),
      })
      const data = await res.json()
      if (res.ok) {
        addToast('Email verified successfully! ✓', 'success')
        setShowEmailCode(false)
        setEmailCode('')
        fetchVerification()
      } else {
        addToast(data.error || 'Invalid code', 'error')
      }
    } catch (error) {
      addToast('Verification failed', 'error')
    } finally {
      setVerifyingEmail(false)
    }
  }

  const handleSendPhoneCode = async () => {
    if (!phone || phone.length < 10) {
      addToast('Please enter a valid phone number', 'error')
      return
    }
    setVerifyingPhone(true)
    try {
      const res = await fetch('/api/verification/phone/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const data = await res.json()
      if (res.ok) {
        addToast('Verification code sent to your phone!', 'success')
        setShowPhoneInput(false)
        setShowPhoneCode(true)
      } else {
        addToast(data.error || 'Failed to send code', 'error')
      }
    } catch (error) {
      addToast('Failed to send verification code', 'error')
    } finally {
      setVerifyingPhone(false)
    }
  }

  const handleVerifyPhone = async () => {
    if (!phoneCode || phoneCode.length !== 6) {
      addToast('Please enter a 6-digit code', 'error')
      return
    }
    setVerifyingPhone(true)
    try {
      const res = await fetch('/api/verification/phone/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: phoneCode, phone }),
      })
      const data = await res.json()
      if (res.ok) {
        addToast('Phone verified successfully! ✓', 'success')
        setShowPhoneCode(false)
        setPhoneCode('')
        fetchVerification()
      } else {
        addToast(data.error || 'Invalid code', 'error')
      }
    } catch (error) {
      addToast('Verification failed', 'error')
    } finally {
      setVerifyingPhone(false)
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'TRUSTED': return 'text-yellow-400'
      case 'VERIFIED': return 'text-green-400'
      case 'BASIC': return 'text-blue-400'
      default: return 'text-gray-400'
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
          <h1 className="text-2xl font-bold mb-2">✅ Verification Center</h1>
          <p className="text-gray-400 mb-8">Build trust with buyers by verifying your identity</p>

          {/* Current Level */}
          <div className="glass-card rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Current Level</p>
                <p className={`text-2xl font-bold ${getLevelColor(verification?.verificationLevel || 'NONE')}`}>
                  {verification?.verificationLevel || 'NONE'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Rating</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {(verification?.averageRating || 0).toFixed(1)} ⭐
                </p>
                <p className="text-xs text-gray-500">{verification?.totalReviews || 0} reviews</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-6">
              <div className="flex gap-2 mb-2">
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
          </div>

          {/* Verification Steps */}
          <div className="space-y-4">
            {/* Email Verification */}
            <div className="glass-card rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${verification?.emailVerified ? 'bg-green-500/20' : 'bg-dark-700'}`}>
                    📧
                  </div>
                  <div>
                    <p className="font-medium">Email Verification</p>
                    <p className="text-sm text-gray-400">{verification?.email || 'Not set'}</p>
                  </div>
                </div>
                {verification?.emailVerified ? (
                  <span className="text-green-400 font-medium flex items-center gap-1">✓ Verified</span>
                ) : showEmailCode ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={emailCode}
                      onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="6-digit code"
                      className="w-28 px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-center"
                      maxLength={6}
                    />
                    <Button onClick={handleVerifyEmail} loading={verifyingEmail} size="sm">Confirm</Button>
                  </div>
                ) : (
                  <Button onClick={handleSendEmailCode} loading={verifyingEmail}>Send Code</Button>
                )}
              </div>
              {showEmailCode && (
                <p className="text-sm text-gray-400 mt-3">
                  Enter the 6-digit code sent to {verification?.email}
                  <button onClick={handleSendEmailCode} className="text-purple-400 ml-2 hover:underline">Resend</button>
                </p>
              )}
            </div>

            {/* Phone Verification */}
            <div className="glass-card rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${verification?.phoneVerified ? 'bg-green-500/20' : 'bg-dark-700'}`}>
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
                  <span className="text-green-400 font-medium flex items-center gap-1">✓ Verified</span>
                )}
              </div>

              {!verification?.phoneVerified && (
                <>
                  {showPhoneCode ? (
                    <div className="flex gap-2 mt-3">
                      <input
                        type="text"
                        value={phoneCode}
                        onChange={(e) => setPhoneCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="6-digit code"
                        className="flex-1 px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl text-center"
                        maxLength={6}
                      />
                      <Button onClick={handleVerifyPhone} loading={verifyingPhone}>Confirm</Button>
                    </div>
                  ) : showPhoneInput ? (
                    <div className="flex gap-2 mt-3">
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+234 800 000 0000"
                        className="flex-1 px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl"
                      />
                      <Button onClick={handleSendPhoneCode} loading={verifyingPhone}>Send Code</Button>
                    </div>
                  ) : (
                    <Button onClick={() => setShowPhoneInput(true)} className="w-full mt-2">
                      Add Phone Number
                    </Button>
                  )}
                  {showPhoneCode && (
                    <p className="text-sm text-gray-400 mt-2">
                      Enter the code sent to {phone}
                      <button onClick={handleSendPhoneCode} className="text-purple-400 ml-2 hover:underline">Resend</button>
                    </p>
                  )}
                </>
              )}
            </div>

            {/* ID Document */}
            <div className="glass-card rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${verification?.idDocumentUrl ? 'bg-green-500/20' : 'bg-dark-700'}`}>
                    🪪
                  </div>
                  <div>
                    <p className="font-medium">ID Document</p>
                    <p className="text-sm text-gray-400">Government-issued ID</p>
                  </div>
                </div>
                {verification?.idDocumentUrl ? (
                  <span className="text-green-400 font-medium">✓ Uploaded</span>
                ) : (
                  <Button variant="secondary" onClick={() => addToast('ID upload coming soon!', 'info')}>Upload</Button>
                )}
              </div>
            </div>

            {/* Sales Milestone */}
            <div className="glass-card rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${(verification?.totalSales || 0) >= 3 ? 'bg-green-500/20' : 'bg-dark-700'}`}>
                    🏆
                  </div>
                  <div>
                    <p className="font-medium">Complete 3+ Sales</p>
                    <p className="text-sm text-gray-400">{verification?.totalSales || 0} / 3 completed</p>
                  </div>
                </div>
                {(verification?.totalSales || 0) >= 3 ? (
                  <span className="text-green-400 font-medium">✓ Achieved</span>
                ) : (
                  <span className="text-gray-500 text-sm">{3 - (verification?.totalSales || 0)} more needed</span>
                )}
              </div>
            </div>

            {/* Rating */}
            <div className="glass-card rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${(verification?.averageRating || 0) >= 4.0 ? 'bg-green-500/20' : 'bg-dark-700'}`}>
                    ⭐
                  </div>
                  <div>
                    <p className="font-medium">Maintain 4.0+ Rating</p>
                    <p className="text-sm text-gray-400">Current: {(verification?.averageRating || 0).toFixed(1)}</p>
                  </div>
                </div>
                {(verification?.averageRating || 0) >= 4.0 ? (
                  <span className="text-green-400 font-medium">✓ Achieved</span>
                ) : (
                  <span className="text-gray-500 text-sm">Keep up the good work!</span>
                )}
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="glass-card rounded-2xl p-6 mt-8">
            <h3 className="font-bold mb-4">🎁 Benefits of Verification</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-center gap-3"><span className="text-green-400">✓</span>Verified badge on your profile</li>
              <li className="flex items-center gap-3"><span className="text-green-400">✓</span>Higher visibility in search</li>
              <li className="flex items-center gap-3"><span className="text-green-400">✓</span>Increased buyer trust</li>
              <li className="flex items-center gap-3"><span className="text-green-400">✓</span>Priority support</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}
