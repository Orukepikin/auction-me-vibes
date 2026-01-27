import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const createVibeSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100, 'Title too long'),
  description: z.string().min(20, 'Description must be at least 20 characters').max(2000, 'Description too long'),
  category: z.string().optional(),
  mediaUrl: z.string().url().optional().or(z.literal('')),
  weirdness: z.number().min(1).max(10).default(5),
  startingBid: z.number().min(100, 'Starting bid must be at least ₦100'),
  minIncrement: z.number().min(50, 'Minimum increment must be at least ₦50').default(100),
  durationHours: z.number().min(1).max(168).default(24),
})

export const bidSchema = z.object({
  amount: z.number().min(1, 'Bid amount is required'),
})

export const profileSchema = z.object({
  name: z.string().min(2).optional(),
  username: z.string().min(3).max(20).optional(),
  bio: z.string().max(500).optional(),
  phone: z.string().optional(),
  instagram: z.string().optional(),
  twitter: z.string().optional(),
  location: z.string().optional(),
  payoutBankName: z.string().optional(),
  payoutAccountNumber: z.string().optional(),
  payoutAccountName: z.string().optional(),
})

export const selectWinnerSchema = z.object({
  winnerId: z.string().uuid('Invalid winner ID'),
})

// Aliases for backward compatibility
export const updateProfileSchema = profileSchema
