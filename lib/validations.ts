import { z } from 'zod'

// User schemas
export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/).optional(),
  bio: z.string().max(500).optional(),
  phone: z.string().optional(),
  instagram: z.string().optional(),
  twitter: z.string().optional(),
  location: z.string().optional(),
  payoutBankName: z.string().optional(),
  payoutAccountNumber: z.string().optional(),
  payoutAccountName: z.string().optional(),
})

// Vibe schemas
export const createVibeSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100),
  description: z.string().min(20, 'Description must be at least 20 characters').max(2000),
  category: z.string().optional(),
  mediaUrl: z.string().url().optional().or(z.literal('')),
  weirdness: z.number().int().min(1).max(10).default(5),
  startingBid: z.number().int().min(100, 'Starting bid must be at least ₦100'),
  minIncrement: z.number().int().min(50).default(100),
  durationHours: z.number().int().min(1).max(168).default(24), // 1 hour to 7 days
})

export const placeBidSchema = z.object({
  amount: z.number().int().min(1, 'Bid amount required'),
})

export const selectWinnerSchema = z.object({
  winnerId: z.string().uuid('Invalid winner ID'),
})

// Payment schemas
export const initPaymentSchema = z.object({
  vibeId: z.string().uuid(),
})

// Types
export type RegisterInput = z.infer<typeof registerSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type CreateVibeInput = z.infer<typeof createVibeSchema>
export type PlaceBidInput = z.infer<typeof placeBidSchema>
export type SelectWinnerInput = z.infer<typeof selectWinnerSchema>
