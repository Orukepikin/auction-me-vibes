# Auction Me Vibes 🌀

A marketplace where creators post ridiculous services ("vibes"), bidders bid, and winners pay to unlock contact details.

## Features

- **Authentication**: Google OAuth + Email/Password with NextAuth
- **Marketplace**: Browse, filter, and search active auctions
- **Bidding System**: Real-time bidding with rate limiting and validation
- **Payment Integration**: Paystack for Nigerian payments
- **Winner Selection**: Creator selects winner after auction ends
- **Contact Unlock**: Winner pays → both parties unlock contact details
- **Dashboard**: Track your auctions, bids, wins, and earnings
- **Profile Management**: Editable profiles with payout settings

## Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite with Prisma ORM
- **Auth**: NextAuth.js v4
- **Payments**: Paystack
- **Validation**: Zod

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd auction-me-vibes
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your values:
   ```env
   # Database
   DATABASE_URL="file:./dev.db"

   # NextAuth
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="generate-a-secure-secret-here"

   # Google OAuth
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"

   # Paystack
   PAYSTACK_SECRET_KEY="sk_test_your-key"
   PAYSTACK_PUBLIC_KEY="pk_test_your-key"

   # App
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   PLATFORM_FEE_PERCENT="10"
   ```

3. **Set up the database:**
   ```bash
   # Generate Prisma client
   npm run db:generate

   # Run migrations
   npm run db:push

   # Seed with test data
   npm run db:seed
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

## Environment Setup

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth Client ID
5. Application type: Web application
6. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://your-domain.com/api/auth/callback/google` (production)
7. Copy Client ID and Client Secret to `.env`

### Paystack

1. Sign up at [Paystack](https://paystack.com/)
2. Get your test keys from Settings → API Keys
3. Add to `.env`:
   - `PAYSTACK_SECRET_KEY` (starts with `sk_test_`)
   - `PAYSTACK_PUBLIC_KEY` (starts with `pk_test_`)

### NextAuth Secret

Generate a secure secret:
```bash
openssl rand -base64 32
```

## Test Accounts

After running the seed script:

| Role | Email | Password |
|------|-------|----------|
| Creator | creator@example.com | creator123 |
| Bidder | bidder@example.com | bidder123 |

## Project Structure

```
auction-me-vibes/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── [...nextauth]/route.ts
│   │   │   └── register/route.ts
│   │   ├── cron/tick/route.ts
│   │   ├── dashboard/route.ts
│   │   ├── market/route.ts
│   │   ├── me/route.ts
│   │   ├── profile/route.ts
│   │   └── vibes/
│   │       ├── route.ts
│   │       └── [id]/
│   │           ├── route.ts
│   │           ├── bid/route.ts
│   │           ├── select-winner/route.ts
│   │           └── pay/
│   │               ├── init/route.ts
│   │               └── verify/route.ts
│   ├── create/page.tsx
│   ├── dashboard/page.tsx
│   ├── login/page.tsx
│   ├── market/page.tsx
│   ├── pay/callback/page.tsx
│   ├── profile/page.tsx
│   ├── vibe/[id]/page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   └── providers.tsx
├── components/
│   ├── navbar.tsx
│   ├── vibe-card.tsx
│   └── ui/
│       ├── button.tsx
│       ├── input.tsx
│       └── toast.tsx
├── lib/
│   ├── auth.ts
│   ├── paystack.ts
│   ├── prisma.ts
│   ├── rate-limit.ts
│   ├── utils.ts
│   └── validations.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── types/
│   └── next-auth.d.ts
├── middleware.ts
└── ...config files
```

## API Routes

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/me` | Get current user | ✅ |
| GET | `/api/market` | List vibes (filterable) | ❌ |
| GET | `/api/dashboard` | User dashboard stats | ✅ |
| POST | `/api/profile` | Update profile | ✅ |
| POST | `/api/auth/register` | Register new user | ❌ |
| POST | `/api/vibes` | Create new vibe | ✅ |
| GET | `/api/vibes/[id]` | Get vibe details | ❌ |
| POST | `/api/vibes/[id]/bid` | Place bid | ✅ |
| POST | `/api/vibes/[id]/select-winner` | Select winner | ✅ (creator) |
| POST | `/api/vibes/[id]/pay/init` | Initialize payment | ✅ (winner) |
| GET | `/api/vibes/[id]/pay/verify` | Verify payment | ✅ (winner) |
| POST | `/api/cron/tick` | Process expired auctions | ❌ |

## Cron Jobs

For production, set up a cron job to hit `/api/cron/tick` every minute to:
- Mark expired auctions as ENDED
- Track overdue payments

Example with cron:
```bash
* * * * * curl -X POST https://your-domain.com/api/cron/tick
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

For SQLite, use a persistent volume or switch to PostgreSQL:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## Security Features

- Password hashing with bcryptjs
- Rate limiting on bidding endpoints
- Protected API routes with NextAuth middleware
- Paystack payment verification
- Contact info only revealed after payment

## Future Enhancements (Phase 2 & 3)

- [ ] Real-time bid updates with WebSockets
- [ ] Image upload to cloud storage
- [ ] Email notifications
- [ ] Stripe payment option
- [ ] Automated payouts via Paystack
- [ ] Admin dashboard
- [ ] Report/flag system
- [ ] Mobile app

## License

MIT

---

Built with 🌀 and chaos.
