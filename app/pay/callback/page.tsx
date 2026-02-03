'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'

export default function PayCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [vibeId, setVibeId] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const reference = params.get('reference') || params.get('trxref')
    
    if (!reference) {
      setStatus('error')
      setMessage('No payment reference found')
      return
    }

    verifyPayment(reference)
  }, [])

  const verifyPayment = async (reference: string) => {
    try {
      // First get the payment details
      const paymentRes = await fetch(`/api/payments/${reference}`)
      
      if (!paymentRes.ok) {
        setStatus('error')
        setMessage('Payment not found')
        return
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
        setMessage('Payment successful! You can now message the creator.')
      } else {
        setStatus('error')
        setMessage(result.error || 'Payment verification failed')
      }
    } catch (error) {
      console.error('Verification error:', error)
      setStatus('error')
      setMessage('Failed to verify payment. Please contact support.')
    }
  }

  return (
    <div className="min-h-screen bg-dark-950">
      <Navbar />
      
      <main className="pt-32 pb-12">
        <div className="max-w-md mx-auto px-4 text-center">
          {status === 'loading' && (
            <div className="glass-card rounded-2xl p-8">
              <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
              <h1 className="text-2xl font-bold mb-2">Verifying Payment</h1>
              <p className="text-gray-400">Please wait while we confirm your payment...</p>
              <p className="text-sm text-gray-500 mt-4">Do not close this page</p>
            </div>
          )}

          {status === 'success' && (
            <div className="glass-card rounded-2xl p-8">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-5xl">✓</span>
              </div>
              <h1 className="text-2xl font-bold text-green-400 mb-2">Payment Successful!</h1>
              <p className="text-gray-400 mb-6">{message}</p>
              
              <div className="space-y-3">
                {vibeId && (
                  <Link href={`/vibe/${vibeId}`}>
                    <Button className="w-full">View Vibe & Message Creator</Button>
                  </Link>
                )}
                <Link href="/messages">
                  <Button variant="secondary" className="w-full">Go to Messages</Button>
                </Link>
              </div>

              <div className="mt-6 p-4 bg-dark-800 rounded-xl text-left">
                <h3 className="font-medium mb-2">What's Next?</h3>
                <ul className="text-sm text-gray-400 space-y-2">
                  <li>1. 💬 Message the creator to discuss details</li>
                  <li>2. ⏳ Wait for them to deliver the service</li>
                  <li>3. ✓ Confirm receipt to release payment</li>
                  <li>4. ⭐ Leave a review</li>
                </ul>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="glass-card rounded-2xl p-8">
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-5xl">✕</span>
              </div>
              <h1 className="text-2xl font-bold text-red-400 mb-2">Payment Failed</h1>
              <p className="text-gray-400 mb-6">{message}</p>
              
              <div className="space-y-3">
                {vibeId ? (
                  <Link href={`/vibe/${vibeId}`}>
                    <Button className="w-full">Try Again</Button>
                  </Link>
                ) : (
                  <Link href="/dashboard">
                    <Button className="w-full">Go to Dashboard</Button>
                  </Link>
                )}
                <Link href="/dashboard">
                  <Button variant="secondary" className="w-full">View My Bids</Button>
                </Link>
              </div>

              <p className="text-sm text-gray-500 mt-6">
                If you were charged but see this error, please contact support.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
