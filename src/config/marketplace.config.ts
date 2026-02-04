/**
 * MARKETPLACE CONFIGURATION
 * 
 * This centralized config controls the white-label terminology and features
 * of the marketplace. Change these values to customize for your specific use case.
 * 
 * Examples:
 * - NFT marketplace: ITEM_LABEL = "NFT", SELLER_LABEL = "Creator"
 * - Car marketplace: ITEM_LABEL = "Vehicle", SELLER_LABEL = "Dealer"
 * - Service marketplace: ITEM_LABEL = "Service", SELLER_LABEL = "Provider"
 */

export const marketplaceConfig = {
  // =============================================
  // BRANDING
  // =============================================
  
  /** The name of your marketplace */
  APP_NAME: "Marketplace",
  
  /** Tagline shown on landing page */
  TAGLINE: "Buy, Sell, and Trade with Confidence",
  
  /** Short description */
  DESCRIPTION: "A modern marketplace for buying and selling assets",
  
  // =============================================
  // TERMINOLOGY (White-label customization)
  // =============================================
  
  /** What items are called (singular) */
  ITEM_LABEL: "Item",
  
  /** What items are called (plural) */
  ITEM_LABEL_PLURAL: "Items",
  
  /** What sellers are called */
  SELLER_LABEL: "Seller",
  
  /** What sellers are called (plural) */
  SELLER_LABEL_PLURAL: "Sellers",
  
  /** What buyers are called */
  BUYER_LABEL: "Buyer",
  
  /** What buyers are called (plural) */
  BUYER_LABEL_PLURAL: "Buyers",
  
  /** What bids are called */
  BID_LABEL: "Offer",
  
  /** What bids are called (plural) */
  BID_LABEL_PLURAL: "Offers",
  
  // =============================================
  // CURRENCY & PRICING
  // =============================================
  
  /** Currency symbol for prices */
  CURRENCY_SYMBOL: "$",
  
  /** Currency code (for formatting) */
  CURRENCY_CODE: "USD",
  
  /** Number of decimal places for prices */
  PRICE_DECIMALS: 2,
  
  // =============================================
  // FEATURE FLAGS
  // =============================================
  
  /** Enable bidding system */
  ENABLE_BIDDING: true,
  
  /** Enable direct "Buy Now" purchases (future) */
  ENABLE_BUY_NOW: false,
  
  /** Enable shipping module (future) */
  ENABLE_SHIPPING: false,
  
  /** Enable ratings/reviews (future) */
  ENABLE_REVIEWS: false,
  
  /** Enable real-time notifications (future) */
  ENABLE_NOTIFICATIONS: false,
  
  // =============================================
  // LISTING SETTINGS
  // =============================================
  
  /** Minimum price for listings */
  MIN_PRICE: 0.01,
  
  /** Maximum price for listings (null = no limit) */
  MAX_PRICE: null as number | null,
  
  /** Maximum number of metadata fields per listing */
  MAX_METADATA_FIELDS: 20,
  
  // =============================================
  // UI SETTINGS
  // =============================================
  
  /** Number of listings per page */
  LISTINGS_PER_PAGE: 12,
  
  /** Number of bids shown per page */
  BIDS_PER_PAGE: 10,
  
  /** Default dark mode setting */
  DEFAULT_DARK_MODE: true,
} as const;

// Type exports for type safety
export type MarketplaceConfig = typeof marketplaceConfig;

// Helper functions for formatted display
export const formatPrice = (price: number): string => {
  return `${marketplaceConfig.CURRENCY_SYMBOL}${price.toFixed(marketplaceConfig.PRICE_DECIMALS)}`;
};

export const getItemLabel = (count: number = 1): string => {
  return count === 1 
    ? marketplaceConfig.ITEM_LABEL 
    : marketplaceConfig.ITEM_LABEL_PLURAL;
};

export const getSellerLabel = (count: number = 1): string => {
  return count === 1 
    ? marketplaceConfig.SELLER_LABEL 
    : marketplaceConfig.SELLER_LABEL_PLURAL;
};

export const getBidLabel = (count: number = 1): string => {
  return count === 1 
    ? marketplaceConfig.BID_LABEL 
    : marketplaceConfig.BID_LABEL_PLURAL;
};
