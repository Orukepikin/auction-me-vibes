'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const stats = [
  { value: 2400, suffix: '+', label: 'Active Vibes' },
  { value: 48, suffix: 'M+', label: 'Total Traded', prefix: '₦' },
  { value: 12000, suffix: '+', label: 'Creators' },
  { value: 98, suffix: '%', label: 'Satisfaction' },
]

function AnimatedCounter({ value, suffix = '', prefix = '' }: { value: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const duration = 2000
    const steps = 60
    const increment = value / steps
    let current = 0

    const timer = setInterval(() => {
      current += increment
      if (current >= value) {
        setCount(value)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [value])

  return (
    <span className="gradient-text-gold">
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  )
}

const features = [
  {
    icon: '📝',
    title: 'Post Your Vibe',
    desc: 'Create a listing for any ridiculous service you can offer. The weirder, the better.',
  },
  {
    icon: '🔥',
    title: 'Bidders Go Wild',
    desc: 'Watch as people compete to win your vibe. Set your starting price and minimum increment.',
  },
  {
    icon: '🏆',
    title: 'Select Winner',
    desc: "When the auction ends, pick your winner from the top bidders. It's your call.",
  },
  {
    icon: '💰',
    title: 'Get Paid, Unlock',
    desc: "Winner pays, you get your earnings. Both parties unlock each other's contact details.",
  },
]

const testimonials = [
  {
    quote: "I made ₦50K writing breakup poems for strangers. This app is unhinged in the best way.",
    name: 'Chioma A.',
    role: 'Chaos Poet',
    avatar: '🎭',
  },
  {
    quote: "Someone paid me to narrate their morning routine like David Attenborough. Best Tuesday ever.",
    name: 'Emeka O.',
    role: 'Voice Actor',
    avatar: '🎙️',
  },
  {
    quote: "I auctioned off a custom lullaby about someone's failed crypto investments. It sold for ₦25K.",
    name: 'Adaeze N.',
    role: 'Musical Menace',
    avatar: '🎵',
  },
]

export default function HomePage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="min-h-screen bg-dark-950 overflow-hidden">
      {/* Noise overlay */}
      <div className="noise-overlay" />

      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-3 group">
          <span className="text-4xl group-hover:scale-110 transition-transform duration-300">🌀</span>
          <span className="text-2xl font-bold gradient-text">Auction Me Vibes</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost" className="hidden sm:inline-flex">Sign in</Button>
          </Link>
          <Link href="/login">
            <Button className="glow-purple">Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-32 text-center">
        <div 
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-sm mb-10 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          <span className="status-dot active" />
          <span>Live auctions happening now</span>
        </div>

        <h1 
          className={`text-5xl sm:text-6xl lg:text-8xl font-extrabold leading-[1.1] mb-8 transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          <span className="gradient-text">Sell chaos.</span>
          <br />
          <span className="text-white">Bid on vibes.</span>
        </h1>

        <p 
          className={`text-xl sm:text-2xl text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          Post ridiculous services. Bid on madness. Pay the creator.
          <span className="text-purple-400 font-medium"> Touch grass.</span>
        </p>

        <div 
          className={`flex flex-col sm:flex-row items-center justify-center gap-5 transition-all duration-700 delay-300 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          <Link href="/market">
            <Button size="lg" className="min-w-[200px] text-lg glow-purple">
              Explore Market
              <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
            </Button>
          </Link>
          <Link href="/create">
            <Button variant="secondary" size="lg" className="min-w-[200px] text-lg">
              Create a Vibe
              <span className="ml-2">✨</span>
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div 
          className={`mt-24 grid grid-cols-2 sm:grid-cols-4 gap-8 max-w-4xl mx-auto transition-all duration-700 delay-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
        >
          {stats.map((stat, i) => (
            <div key={stat.label} className="text-center group">
              <p className="text-4xl sm:text-5xl font-bold mb-2">
                {mounted && <AnimatedCounter value={stat.value} suffix={stat.suffix} prefix={stat.prefix} />}
              </p>
              <p className="text-sm text-gray-500 group-hover:text-gray-400 transition-colors">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 py-32 bg-gradient-to-b from-transparent via-dark-900/50 to-transparent">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              How it <span className="gradient-text">works</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-xl mx-auto">
              Four steps to monetize your chaos or acquire someone else&apos;s
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((item, i) => (
              <div
                key={item.title}
                className="glass-card glass-card-hover rounded-2xl p-8 text-center group"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <span className="text-5xl mb-6 block group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300">
                  {item.icon}
                </span>
                <span className="text-xs text-purple-400 font-mono tracking-wider">0{i + 1}</span>
                <h3 className="text-xl font-semibold mt-2 mb-3">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured vibes placeholder */}
      <section className="relative z-10 py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-4xl font-bold">
                <span className="gradient-text">Hot</span> Vibes
              </h2>
              <p className="text-gray-400 mt-2 text-lg">Ending soon — don&apos;t miss out</p>
            </div>
            <Link href="/market">
              <Button variant="ghost" size="lg">
                View all
                <span className="ml-2">→</span>
              </Button>
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <Link href="/market" key={i}>
                <div className="glass-card glass-card-hover rounded-2xl p-8 h-72 flex flex-col items-center justify-center text-gray-500 group cursor-pointer">
                  <span className="text-6xl block mb-4 group-hover:scale-110 transition-transform float">🌀</span>
                  <p className="text-lg font-medium">Explore the market</p>
                  <p className="text-sm text-gray-600 mt-1">Sign in to see live vibes</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 py-32 bg-gradient-to-b from-transparent via-dark-900/50 to-transparent">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl sm:text-5xl font-bold text-center mb-20">
            What <span className="gradient-text">creators</span> say
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((item, i) => (
              <div 
                key={i} 
                className="glass-card glass-card-hover rounded-2xl p-8"
              >
                <div className="text-5xl mb-6">{item.avatar}</div>
                <p className="text-gray-300 text-lg italic mb-6 leading-relaxed">
                  &ldquo;{item.quote}&rdquo;
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-lg font-bold">
                    {item.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-gray-500">{item.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-32">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="glass-card rounded-3xl p-12 sm:p-16 breathing-border">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              Ready to <span className="gradient-text">sell your chaos</span>?
            </h2>
            <p className="text-xl text-gray-400 mb-10 max-w-xl mx-auto">
              Join thousands of creators monetizing their most unhinged ideas.
            </p>
            <Link href="/login">
              <Button size="lg" className="min-w-[240px] text-lg glow-purple">
                Start Now — It&apos;s Free
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-dark-700 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌀</span>
            <span className="font-semibold gradient-text">Auction Me Vibes</span>
          </div>
          <p className="text-sm text-gray-500">
            © 2025 Auction Me Vibes. All chaos reserved.
          </p>
          <div className="flex items-center gap-8">
            <Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
              Terms
            </Link>
            <Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
              Support
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
