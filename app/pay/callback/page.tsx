'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function PaymentCallbackPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const reference = searchParams.get('reference')
  const vibeId = searchParams.get('vibeId')

  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (reference && vibeId) {
      verifyPayment()
    } else {
      setStatus('failed')
      setMessage('Invalid payment reference')
    }
  }, [reference, vibeId])

  const verifyPayment = async () => {
    try {
      const res = await fetch(`/api/vibes/${vibeId}/pay/verify?reference=${reference}`)
      const data = await res.json()

      if (res.ok && data.status === 'success') {
        setStatus('success')
        setMessage('Payment verified successfully!')
      } else {
        setStatus('failed')
        setMessage(data.message || data.error || 'Payment verification failed')
      }
    } catch (error) {
      setStatus('failed')
      setMessage('Failed to verify payment')
    }
  }

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="glass-card rounded-2xl p-8 text-center">
          {status === 'verifying' && (
            <>
              <div className="w-16 h-16 mx-auto mb-6 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <h1 className="text-2xl font-bold mb-2">Verifying Payment</h1>
              <p className="text-gray-400">Please wait while we confirm your payment...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-16 h-16 mx-auto mb-6 bg-green-500/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold mb-2 text-green-400">Payment Successful!</h1>
              <p className="text-gray-400 mb-6">{message}</p>
              <p className="text-sm text-gray-500 mb-6">
                The creator&apos;s contact details have been unlocked. You can now reach out to them directly.
              </p>
              <div className="space-y-3">
                <Link href={`/vibe/${vibeId}`}>
                  <Button className="w-full">View Vibe & Contacts</Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="ghost" className="w-full">Go to Dashboard</Button>
                </Link>
              </div>
            </>
          )}

          {status === 'failed' && (
            <>
              <div className="w-16 h-16 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold mb-2 text-red-400">Payment Failed</h1>
              <p className="text-gray-400 mb-6">{message}</p>
              <div className="space-y-3">
                {vibeId && (
                  <Link href={`/vibe/${vibeId}`}>
                    <Button className="w-full">Try Again</Button>
                  </Link>
                )}
                <Link href="/dashboard">
                  <Button variant="ghost" className="w-full">Go to Dashboard</Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
