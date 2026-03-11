/**
 * Application-level type definitions for the marketplace
 */

// User roles
export type UserRole = "buyer" | "vendor" | "super_admin";

// Listing status enum
export type ListingStatus = "DRAFT" | "ACTIVE" | "OUT_OF_STOCK" | "ARCHIVED";

// Order status enum
export type OrderStatus = "PENDING" | "CONFIRMED" | "CANCELLED";

// Profile type
export interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  reputation_score: number | null;
  role: UserRole;
  store_name: string | null;
  store_description: string | null;
  created_at: string;
  updated_at: string;
}

// Listing metadata (flexible JSONB structure)
export interface ListingMetadata {
  [key: string]: string | number | boolean | null;
}

// Listing (Product) type
export interface Listing {
  id: string;
  vendor_id: string;
  title: string;
  description: string | null;
  base_price: number;
  stock_quantity: number;
  image_url: string | null;
  metadata: ListingMetadata;
  status: ListingStatus;
  created_at: string;
  updated_at: string;
}

// Listing with vendor profile included
export interface ListingWithOwner extends Listing {
  owner: Profile;
}

// Order type
export interface Order {
  id: string;
  product_id: string | null;
  buyer_id: string;
  vendor_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  status: OrderStatus;
  shipping_address: Record<string, string>;
  created_at: string;
  updated_at: string;
}

// Order with related profiles
export interface OrderWithDetails extends Order {
  buyer: Profile;
  vendor: Profile;
  product: Listing | null;
}

// Form types for creating/updating
export interface CreateListingInput {
  title: string;
  description?: string;
  base_price: number;
  stock_quantity?: number;
  image_url?: string;
  metadata?: ListingMetadata;
  status?: ListingStatus;
}

export interface UpdateListingInput {
  title?: string;
  description?: string;
  base_price?: number;
  stock_quantity?: number;
  image_url?: string;
  metadata?: ListingMetadata;
  status?: ListingStatus;
}

export interface CreateOrderInput {
  product_id: string;
  quantity: number;
  shipping_address?: Record<string, string>;
}
