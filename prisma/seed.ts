import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'
import { v4 as uuid } from 'uuid'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create password hashes
  const creatorPassword = await hash('creator123', 12)
  const bidderPassword = await hash('bidder123', 12)

  // Create test users
  const creator = await prisma.user.upsert({
    where: { email: 'creator@example.com' },
    update: {},
    create: {
      id: uuid(),
      name: 'Vibe Creator',
      email: 'creator@example.com',
      passwordHash: creatorPassword,
      bio: 'I create the most chaotic vibes on the internet.',
      phone: '+2348012345678',
      instagram: '@vibecreator',
      twitter: '@vibecreator',
      location: 'Lagos, Nigeria',
    },
  })

  const bidder = await prisma.user.upsert({
    where: { email: 'bidder@example.com' },
    update: {},
    create: {
      id: uuid(),
      name: 'Eager Bidder',
      email: 'bidder@example.com',
      passwordHash: bidderPassword,
      bio: 'I bid on everything weird.',
      phone: '+2348087654321',
      location: 'Abuja, Nigeria',
    },
  })

  console.log('✅ Created users:', { creator: creator.email, bidder: bidder.email })

  // Create sample vibes
  const vibes = [
    {
      title: 'I will scream your ex\'s name into the void',
      description: 'For 30 minutes, I will go to a remote location and scream your ex\'s name into the endless void. Video proof provided. Therapeutic for you, terrifying for local wildlife.',
      category: 'Chaos',
      weirdness: 9,
      startingBid: 5000,
      minIncrement: 500,
      durationHours: 48,
    },
    {
      title: 'Professional PowerPoint about why you\'re amazing',
      description: 'I will create a detailed, corporate-style presentation (minimum 20 slides) explaining to your boss, parents, or significant other why you are objectively the best person alive.',
      category: 'Professional',
      weirdness: 6,
      startingBid: 3000,
      minIncrement: 300,
      durationHours: 24,
    },
    {
      title: 'Sing happy birthday in 5 different accents',
      description: 'I will record myself singing happy birthday to your loved one in British, Australian, Nigerian, American Southern, and Scottish accents. Costumes included.',
      category: 'Music',
      weirdness: 5,
      startingBid: 2000,
      minIncrement: 200,
      durationHours: 72,
    },
    {
      title: 'Draw your pet as a Renaissance painting',
      description: 'Send me a photo of your pet and I will transform them into a majestic Renaissance-style portrait, complete with regal clothing and dramatic lighting.',
      category: 'Art',
      weirdness: 4,
      startingBid: 8000,
      minIncrement: 1000,
      durationHours: 168,
    },
    {
      title: 'Write a formal complaint letter to your houseplant',
      description: 'Is your plant not growing? Dropping leaves? I will write a sternly-worded, legally-formatted complaint letter to your plant demanding better performance.',
      category: 'Comedy',
      weirdness: 8,
      startingBid: 1500,
      minIncrement: 150,
      durationHours: 24,
    },
  ]

  for (const vibeData of vibes) {
    const endAt = new Date(Date.now() + vibeData.durationHours * 60 * 60 * 1000)
    
    await prisma.vibe.create({
      data: {
        id: uuid(),
        title: vibeData.title,
        description: vibeData.description,
        category: vibeData.category,
        weirdness: vibeData.weirdness,
        startingBid: vibeData.startingBid,
        minIncrement: vibeData.minIncrement,
        currentBid: vibeData.startingBid,
        status: 'ACTIVE',
        endAt,
        creatorId: creator.id,
      },
    })
  }

  console.log('✅ Created', vibes.length, 'sample vibes')
  console.log('🎉 Seeding complete!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })