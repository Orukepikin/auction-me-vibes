export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatTimeLeft(endAt: Date | string): string {
  const end = new Date(endAt)
  const now = new Date()
  const diff = end.getTime() - now.getTime()

  if (diff <= 0) return 'Ended'

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

export function formatRelativeTime(date: Date | string): string {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()

  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export function getWeirdnessLabel(score: number): string {
  if (score <= 2) return 'Mild'
  if (score <= 4) return 'Quirky'
  if (score <= 6) return 'Wild'
  if (score <= 8) return 'Unhinged'
  return 'Absolute Chaos'
}

export function getWeirdnessColor(score: number): string {
  if (score <= 2) return 'text-green-400'
  if (score <= 4) return 'text-cyan-400'
  if (score <= 6) return 'text-yellow-400'
  if (score <= 8) return 'text-orange-400'
  return 'text-red-400'
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'ACTIVE':
      return 'bg-green-500/20 text-green-400 border-green-500/30'
    case 'ENDED':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    case 'PAID':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    case 'COMPLETED':
      return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    case 'CANCELLED':
      return 'bg-red-500/20 text-red-400 border-red-500/30'
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  }
}

export function generateReference(): string {
  return `AMV_${Date.now()}_${Math.random().toString(36).substring(2, 9).toUpperCase()}`
}

export const VibeStatus = {
  ACTIVE: 'ACTIVE',
  ENDED: 'ENDED',
  CANCELLED: 'CANCELLED',
  PAID: 'PAID',
  COMPLETED: 'COMPLETED',
} as const

export const PaymentStatus = {
  INITIATED: 'INITIATED',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
} as const
