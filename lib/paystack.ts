const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!
const PAYSTACK_BASE_URL = 'https://api.paystack.co'

export interface PaystackInitResponse {
  status: boolean
  message: string
  data: {
    authorization_url: string
    access_code: string
    reference: string
  }
}

export interface PaystackVerifyResponse {
  status: boolean
  message: string
  data: {
    id: number
    status: 'success' | 'failed' | 'abandoned'
    reference: string
    amount: number
    currency: string
    channel: string
    paid_at: string
    customer: {
      email: string
    }
  }
}

export async function initializeTransaction({
  email,
  amount, // in kobo (smallest currency unit)
  reference,
  callbackUrl,
  metadata,
}: {
  email: string
  amount: number
  reference: string
  callbackUrl: string
  metadata?: Record<string, any>
}): Promise<PaystackInitResponse> {
  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      amount, // Paystack expects amount in kobo
      reference,
      callback_url: callbackUrl,
      metadata,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to initialize payment')
  }

  return response.json()
}

export async function verifyTransaction(reference: string): Promise<PaystackVerifyResponse> {
  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${reference}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to verify payment')
  }

  return response.json()
}

export function calculateFees(amount: number, feePercent: number = 10) {
  const feeAmount = Math.floor(amount * (feePercent / 100))
  const netAmount = amount - feeAmount
  return { feeAmount, netAmount }
}
