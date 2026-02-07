# Marketplace Engine

A modern, full-stack marketplace application built with **Next.js 14**, **Supabase**, and **Tailwind CSS**. Features a clean, responsive UI with dark mode support and a robust bidding system.

## Features

- 🛍️ **Listings Management** - Create, edit, and manage marketplace listings
- 💰 **Bidding System** - Make offers on listings with real-time updates  
- 🔐 **Authentication** - Secure email-based auth via Supabase
- 🌙 **Dark Mode** - System-aware theme with manual toggle
- 📱 **Responsive Design** - Works great on mobile and desktop
- ⚡ **Type-Safe** - Full TypeScript with strict mode

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| [Next.js 14](https://nextjs.org/) | React framework with App Router |
| [Supabase](https://supabase.com/) | Database, Auth, and Real-time |
| [Tailwind CSS](https://tailwindcss.com/) | Utility-first styling |
| [shadcn/ui](https://ui.shadcn.com/) | UI component library |
| [TanStack Query](https://tanstack.com/query) | Server state management |
| [Zod](https://zod.dev/) | Schema validation |

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm
- Supabase project (free tier works)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ZenithGupta/Marketplace-engine.git
   cd Marketplace-engine
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Database Setup

Apply the Supabase migrations from the `supabase/migrations` folder to set up:
- Users/Profiles table
- Listings table
- Bids table
- Row Level Security policies

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication page
│   ├── dashboard/         # User dashboard
│   └── listings/          # Listing pages
├── components/            # React components
│   ├── auth/             # Auth-related components
│   ├── layout/           # Layout components
│   ├── listings/         # Listing components
│   └── ui/               # shadcn/ui components
├── config/               # App configuration
├── contexts/             # React contexts (Auth, Theme)
├── hooks/                # Custom React hooks
├── integrations/         # Third-party integrations
├── lib/                  # Utility functions
└── types/                # TypeScript type definitions
```

## Configuration

The marketplace is **white-label ready**. Customize branding and terminology in:

`src/config/marketplace.config.ts`

```typescript
export const marketplaceConfig = {
  APP_NAME: "Your Marketplace",
  ITEM_LABEL: "Product",        // or "NFT", "Vehicle", etc.
  SELLER_LABEL: "Vendor",       // or "Creator", "Dealer", etc.
  BID_LABEL: "Offer",
  CURRENCY_SYMBOL: "$",
  // ...more options
};
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repo to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy!

### Other Platforms

Build the production bundle:
```bash
npm run build
npm start
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Your Supabase anon/public key |

> ⚠️ **Never commit `.env` or `.env.local` files!** They contain secrets.

## License

MIT License - feel free to use this for your own projects!

---

Built with ❤️ using Next.js and Supabase
