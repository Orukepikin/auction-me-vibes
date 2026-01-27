'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { formatCurrency, formatTimeLeft, getWeirdnessLabel, getWeirdnessColor } from '@/lib/utils'

interface VibeCardProps {
  vibe: {
    id: string
    title: string
    description: string
    category?: string | null
    mediaUrl?: string | null
    weirdness: number
    currentBid: number
    endAt: string
    status: string
    creator: {
      name?: string | null
      username?: string | null
      image?: string | null
    }
    _count: {
      bids: number
    }
  }
  featured?: boolean
  index?: number
}

export function VibeCard({ vibe, featured = false, index = 0 }: VibeCardProps) {
  const [imageError, setImageError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const timeLeft = formatTimeLeft(vibe.endAt)
  const isEnded = vibe.status !== 'ACTIVE'
  const isUrgent = !isEnded && timeLeft.includes('m') && !timeLeft.includes('h') && !timeLeft.includes('d')

  return (
    <Link href={`/vibe/${vibe.id}`}>
      <div
        className={`glass-card rounded-2xl overflow-hidden group cursor-pointer transition-all duration-500 ${
          featured ? 'breathing-border' : ''
        }`}
        style={{ 
          animationDelay: `${index * 0.1}s`,
          transform: isHovered ? 'translateY(-12px) scale(1.02)' : 'translateY(0) scale(1)',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image */}
        <div className="relative h-52 bg-dark-800 overflow-hidden">
          {vibe.mediaUrl && !imageError ? (
            <>
              <Image
                src={vibe.mediaUrl}
                alt={vibe.title}
                fill
                className={`object-cover transition-transform duration-700 ${isHovered ? 'scale-110' : 'scale-100'}`}
                onError={() => setImageError(true)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dark-900/90 via-transparent to-transparent" />
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-dark-800 to-dark-900">
              <span className={`text-7xl transition-transform duration-500 ${isHovered ? 'scale-125 rotate-12' : ''}`}>
                🌀
              </span>
            </div>
          )}

          {/* Status badge */}
          <div className="absolute top-4 left-4">
            <span
              className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 backdrop-blur-md ${
                isEnded
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  : 'bg-green-500/20 text-green-400 border border-green-500/30'
              }`}
            >
              {!isEnded && <span className="status-dot active" />}
              {vibe.status}
            </span>
          </div>

          {/* Weirdness badge */}
          <div className="absolute top-4 right-4">
            <span
              className={`px-3 py-1.5 rounded-full text-xs font-bold bg-dark-900/90 backdrop-blur-md border border-white/10 ${getWeirdnessColor(vibe.weirdness)}`}
            >
              {vibe.weirdness}/10 {getWeirdnessLabel(vibe.weirdness)}
            </span>
          </div>

          {/* Time left overlay */}
          {!isEnded && (
            <div className="absolute bottom-4 right-4">
              <span className={`px-3 py-1.5 rounded-full text-xs font-bold bg-dark-900/90 backdrop-blur-md border border-white/10 ${isUrgent ? 'countdown-urgent' : 'text-white'}`}>
                ⏱ {timeLeft}
              </span>
            </div>
          )}

          {/* Bids count */}
          <div className="absolute bottom-4 left-4">
            <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 backdrop-blur-md">
              🔥 {vibe._count.bids} bids
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          {/* Category */}
          {vibe.category && (
            <span className="text-xs text-purple-400 font-semibold uppercase tracking-wider">
              {vibe.category}
            </span>
          )}

          {/* Title */}
          <h3 className="mt-2 text-lg font-bold text-white line-clamp-2 leading-snug group-hover:text-purple-300 transition-colors">
            {vibe.title}
          </h3>

          {/* Creator */}
          <div className="mt-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold ring-2 ring-dark-700">
              {vibe.creator.name?.[0] || vibe.creator.username?.[0] || '?'}
            </div>
            <span className="text-sm text-gray-400 truncate">
              {vibe.creator.name || vibe.creator.username || 'Anonymous'}
            </span>
          </div>

          {/* Stats */}
          <div className="mt-5 pt-5 border-t border-dark-600/50 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Current Bid</p>
              <p className="text-xl font-bold gradient-text-gold">
                {formatCurrency(vibe.currentBid)}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
              isHovered ? 'bg-purple-500 scale-110' : 'bg-dark-700'
            }`}>
              <span className={`text-lg transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`}>
                →
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

export function VibeCardSkeleton() {
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="h-52 skeleton" />
      <div className="p-5 space-y-4">
        <div className="h-3 w-16 skeleton rounded-full" />
        <div className="space-y-2">
          <div className="h-5 w-full skeleton rounded" />
          <div className="h-5 w-3/4 skeleton rounded" />
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 skeleton rounded-full" />
          <div className="h-3 w-24 skeleton rounded" />
        </div>
        <div className="pt-5 border-t border-dark-600/50 flex justify-between items-center">
          <div>
            <div className="h-2 w-16 skeleton rounded mb-2" />
            <div className="h-6 w-24 skeleton rounded" />
          </div>
          <div className="w-12 h-12 skeleton rounded-full" />
        </div>
      </div>
    </div>
  )
}
