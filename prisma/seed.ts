import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'
import { v4 as uuid } from 'uuid'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  const creatorPassword = await hash('creator123', 12)
  const bidderPassword = await hash('bidder123', 12)

  const creator = await prisma.user.upsert({
    where: { email: 'creator@example.com' },
    update: {},
    create: {
      id: uuid(),
      name: 'Vibe Creator',
      username: 'vibecreator',
      email: 'creator@example.com',
      passwordHash: creatorPassword,
      bio: 'I create the most chaotic vibes on the internet.',
      phone: '+2348012345678',
      instagram: '@vibecreator',
      twitter: '@vibecreator',
      location: 'Lagos, Nigeria',
      payoutBankName: 'GTBank',
      payoutAccountNumber: '0123456789',
      payoutAccountName: 'Vibe Creator',
    },
  })

  const bidder = await prisma.user.upsert({
    where: { email: 'bidder@example.com' },
    update: {},
    create: {
      id: uuid(),
      name: 'Chaos Bidder',
      username: 'chaosbidder',
      email: 'bidder@example.com',
      passwordHash: bidderPassword,
      bio: 'I bid on anything weird enough.',
      phone: '+2348087654321',
      instagram: '@chaosbidder',
      twitter: '@chaosbidder',
      location: 'Abuja, Nigeria',
      walletBalance: 50000,
    },
  })

  console.log('✅ Created users:', creator.username, bidder.username)

  const now = new Date()
  const hourFromNow = new Date(now.getTime() + 60 * 60 * 1000)
  const dayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  const vibes = await Promise.all([
    prisma.vibe.create({
      data: {
        id: uuid(),
        title: 'I will scream your ex\'s name into the void for 1 hour',
        description: 'Therapeutic chaos. I will go to a remote location and scream whatever name you give me into the empty void of nature. Video proof provided. Catharsis guaranteed.',
        category: 'Chaos',
        weirdness: 9,
        startingBid: 5000,
        minIncrement: 500,
        currentBid: 7500,
        endAt: hourFromNow,
        status: 'ACTIVE',
        creatorId: creator.id,
        mediaUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800',
      },
    }),
    prisma.vibe.create({
      data: {
        id: uuid(),
        title: 'Professional PowerPoint about why you deserve a raise',
        description: 'I will create a devastatingly convincing 20-slide presentation arguing why your boss should give you that raise. Includes charts, memes, and a tearjerking finale.',
        category: 'Professional',
        weirdness: 6,
        startingBid: 10000,
        minIncrement: 1000,
        currentBid: 10000,
        endAt: dayFromNow,
        status: 'ACTIVE',
        creatorId: creator.id,
        mediaUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800',
      },
    }),
    prisma.vibe.create({
      data: {
        id: uuid(),
        title: 'I will write a love letter to your houseplant',
        description: 'Your fiddle leaf fig deserves to feel appreciated. I will write a heartfelt, poetic love letter addressed to your plant, suitable for framing.',
        category: 'Wholesome',
        weirdness: 7,
        startingBid: 3000,
        minIncrement: 300,
        currentBid: 3000,
        endAt: weekFromNow,
        status: 'ACTIVE',
        creatorId: creator.id,
        mediaUrl: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=800',
      },
    }),
    prisma.vibe.create({
      data: {
        id: uuid(),
        title: 'Custom lullaby about your cryptocurrency losses',
        description: 'A soothing, professionally recorded lullaby detailing your specific crypto investment mistakes. Perfect for crying yourself to sleep.',
        category: 'Music',
        weirdness: 8,
        startingBid: 8000,
        minIncrement: 500,
        currentBid: 15000,
        endAt: yesterday,
        status: 'ENDED',
        creatorId: creator.id,
        mediaUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800',
      },
    }),
  ])

  console.log('✅ Created vibes:', vibes.length)

  const vibe1 = vibes[0]
  await prisma.bid.createMany({
    data: [
      { id: uuid(), vibeId: vibe1.id, bidderId: bidder.id, amount: 5500, createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000) },
      { id: uuid(), vibeId: vibe1.id, bidderId: bidder.id, amount: 6500, createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000) },
      { id: uuid(), vibeId: vibe1.id, bidderId: bidder.id, amount: 7500, createdAt: new Date(now.getTime() - 30 * 60 * 1000) },
    ],
  })

  const vibe4 = vibes[3]
  await prisma.bid.createMany({
    data: [
      { id: uuid(), vibeId: vibe4.id, bidderId: bidder.id, amount: 10000, createdAt: new Date(yesterday.getTime() - 5 * 60 * 60 * 1000) },
      { id: uuid(), vibeId: vibe4.id, bidderId: bidder.id, amount: 12000, createdAt: new Date(yesterday.getTime() - 3 * 60 * 60 * 1000) },
      { id: uuid(), vibeId: vibe4.id, bidderId: bidder.id, amount: 15000, createdAt: new Date(yesterday.getTime() - 1 * 60 * 60 * 1000) },
    ],
  })

  console.log('✅ Created bids')
  console.log('')
  console.log('🎉 Seed complete!')
  console.log('')
  console.log('Test accounts:')
  console.log('  Creator: creator@example.com / creator123')
  console.log('  Bidder:  bidder@example.com / bidder123')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
