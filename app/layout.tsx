import type { Metadata } from 'next'
import { Providers } from './providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'Auction Me Vibes | Sell Chaos. Bid on Madness.',
  description: 'The marketplace for ridiculous services. Post vibes, bid on chaos, unlock creators.',
  keywords: ['auction', 'marketplace', 'vibes', 'services', 'chaos'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-dark-950 text-white antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
