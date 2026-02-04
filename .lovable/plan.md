

# Base Marketplace Engine - MVP Implementation Plan

## Overview
A modular, multi-vendor marketplace platform where sellers list abstract assets, buyers place bids, and sellers manually select winners for atomic ownership transfers. Built to be white-labeled for any future use case (NFTs, cars, services, etc.).

---

## Design Direction
**Bold & Modern** - Strong colors, gradients, clean typography inspired by Vercel/Raycast aesthetic. Dark mode support included.

---

## Phase 1: Foundation

### 1.1 Authentication System
- Email/password signup and login with Supabase Auth
- Google OAuth integration (optional second step)
- Protected routes for authenticated users
- Session persistence and automatic redirects

### 1.2 White-Label Configuration
A centralized `marketplace.config.ts` file controlling:
- `APP_NAME` - The marketplace name
- `ITEM_LABEL` - What items are called ("Product", "Asset", "Service")
- `SELLER_LABEL` - What sellers are called ("Vendor", "Creator")
- `CURRENCY_SYMBOL` - For displaying prices
- `ENABLE_BIDDING` - Toggle bidding vs direct purchase (future)

---

## Phase 2: Database & Core Tables

### Users/Profiles Table
- Linked to Supabase Auth
- Name, avatar, and `reputation_score` field (for future use)

### Listings Table
- `current_owner_id` → linked to user
- Title, description, base_price
- **`metadata` (JSONB)** → flexible custom fields for any item type
- Status enum: `DRAFT` | `ACTIVE` | `NEGOTIATING` | `SOLD` | `ARCHIVED`

### Bids Table
- `listing_id` → the item being bid on
- `bidder_id` → who placed the bid
- Amount, optional message to seller
- Status enum: `OPEN` | `ACCEPTED` | `REJECTED`

### Ownership History Table (Audit Log)
- Records every ownership transfer
- Previous owner, new owner, transfer price, timestamp
- Immutable ledger of provenance

---

## Phase 3: Core User Flows

### 3.1 Seller Flow: Create a Listing
- Form with title, description, base price
- Dynamic metadata fields (key-value pairs) for custom item attributes
- Save as DRAFT or publish as ACTIVE
- View and manage own listings

### 3.2 Buyer Flow: Browse & Bid
- Browse active listings with search/filter
- View listing details including metadata attributes
- Place a bid with amount and optional message
- Track "My Active Bids" in dashboard

### 3.3 Seller Flow: Accept a Bid (Atomic Transfer)
When seller clicks "Accept Offer":
1. ✅ Mark selected bid as `ACCEPTED`
2. ✅ Mark all other bids as `REJECTED`
3. ✅ Create ownership history record
4. ✅ Transfer `current_owner_id` to buyer
5. ✅ Set listing status to `SOLD`

This will be implemented as a **Supabase database function** for atomicity.

---

## Phase 4: Dashboard & UI

### Unified Dashboard
Single dashboard view that adapts based on user activity:
- **My Listings** section (if user has listed items)
- **My Bids** section (if user has placed bids)
- Quick stats: Active listings, pending bids, completed sales

### Listing Card Component
- Displays title, price, status badge
- Dynamically renders JSONB metadata fields
- Shows bid count for sellers

### Bid Management Table (Seller View)
- Table of all bids on a listing
- Bidder info, amount, message preview
- "Accept" and "Reject" action buttons
- Confirmation dialogs for actions

---

## Pages to Build

| Page | Description |
|------|-------------|
| `/` | Landing page with featured listings |
| `/auth` | Login/signup forms |
| `/dashboard` | Unified user dashboard |
| `/listings` | Browse all active listings |
| `/listings/new` | Create new listing form |
| `/listings/[id]` | Listing detail + bid placement |
| `/listings/[id]/bids` | Seller's bid management view |

---

## What's Deferred (Future Phases)
- ❌ Payment processing (Stripe integration)
- ❌ Shipping module configuration
- ❌ Real-time notifications
- ❌ Advanced search & filtering
- ❌ Reputation/rating system logic
- ❌ Analytics & reporting

---

## Deliverables
✅ Fully functional marketplace core  
✅ Clean, configurable architecture  
✅ Secure authentication with RLS policies  
✅ Atomic ownership transfer logic  
✅ Bold, modern UI with dark mode  
✅ Ready for white-labeling to any use case

