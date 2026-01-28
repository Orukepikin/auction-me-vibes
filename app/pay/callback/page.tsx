'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'

export default function PayCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const reference = searchParams?.get('reference')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [vibeId, setVibeId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    
    if (!reference) {
      setStatus('error')
      setMessage('No payment reference found')
      return
    }

    verifyPayment()
  }, [reference, mounted])

  const verifyPayment = async () => {
    try {
      // First, get the payment details to find the vibeId
      const paymentRes = await fetch(`/api/payments/${reference}`)
      if (!paymentRes.ok) {
        throw new Error('Payment not found')
      }
      const payment = await paymentRes.json()
      setVibeId(payment.vibeId)

      // Then verify the payment
      const verifyRes = await fetch(`/api/vibes/${payment.vibeId}/pay/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference }),
      })

      const result = await verifyRes.json()

      if (verifyRes.ok && result.status === 'success') {
        setStatus('success')
        setMessage('Payment successful! You can now contact the creator.')
      } else {
        setStatus('error')
        setMessage(result.error || 'Payment verification failed')
      }
    } catch (error) {
      setStatus('error')
      setMessage('Failed to verify payment')
    }
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-950">
      <Navbar />
      
      <main className="pt-32 pb-12">
        <div className="max-w-md mx-auto px-4 text-center">
          {status === 'loading' && (
            <>
              <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
              <h1 className="text-2xl font-bold mb-2">Verifying Payment</h1>
              <p className="text-gray-400">Please wait while we confirm your payment...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <span className="text-7xl block mb-6">🎉</span>
              <h1 className="text-2xl font-bold text-green-400 mb-2">Payment Successful!</h1>
              <p className="text-gray-400 mb-8">{message}</p>
              {vibeId ? (
                <Link href={`/vibe/${vibeId}`}>
                  <Button size="lg">View Vibe & Contact Creator</Button>
                </Link>
              ) : (
                <Link href="/dashboard">
                  <Button size="lg">Go to Dashboard</Button>
                </Link>
              )}
            </>
          )}

          {status === 'error' && (
            <>
              <span className="text-7xl block mb-6">😕</span>
              <h1 className="text-2xl font-bold text-red-400 mb-2">Payment Failed</h1>
              <p className="text-gray-400 mb-8">{message}</p>
              <div className="flex gap-4 justify-center">
                <Link href="/dashboard">
                  <Button variant="secondary">Go to Dashboard</Button>
                </Link>
                {vibeId && (
                  <Link href={`/vibe/${vibeId}`}>
                    <Button>Try Again</Button>
                  </Link>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
