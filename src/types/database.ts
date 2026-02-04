/**
 * Application-level type definitions for the marketplace
 * These extend/simplify the auto-generated Supabase types
 */

// Listing status enum
export type ListingStatus = "DRAFT" | "ACTIVE" | "NEGOTIATING" | "SOLD" | "ARCHIVED";

// Bid status enum
export type BidStatus = "OPEN" | "ACCEPTED" | "REJECTED";

// Profile type
export interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  reputation_score: number;
  created_at: string;
  updated_at: string;
}

// Listing metadata (flexible JSONB structure)
export interface ListingMetadata {
  [key: string]: string | number | boolean | null;
}

// Listing type
export interface Listing {
  id: string;
  current_owner_id: string;
  title: string;
  description: string | null;
  base_price: number;
  metadata: ListingMetadata;
  status: ListingStatus;
  created_at: string;
  updated_at: string;
}

// Listing with owner profile included
export interface ListingWithOwner extends Listing {
  owner: Profile;
}

// Bid type
export interface Bid {
  id: string;
  listing_id: string;
  bidder_id: string;
  amount: number;
  message_to_seller: string | null;
  status: BidStatus;
  created_at: string;
  updated_at: string;
}

// Bid with bidder profile included
export interface BidWithBidder extends Bid {
  bidder: Profile;
}

// Ownership history record
export interface OwnershipHistory {
  id: number;
  listing_id: string | null;
  previous_owner_id: string | null;
  new_owner_id: string | null;
  transfer_price: number;
  transferred_at: string;
}

// Form types for creating/updating
export interface CreateListingInput {
  title: string;
  description?: string;
  base_price: number;
  metadata?: ListingMetadata;
  status?: ListingStatus;
}

export interface UpdateListingInput {
  title?: string;
  description?: string;
  base_price?: number;
  metadata?: ListingMetadata;
  status?: ListingStatus;
}

export interface CreateBidInput {
  listing_id: string;
  amount: number;
  message_to_seller?: string;
}
