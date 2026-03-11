/**
 * MARKETPLACE CONFIGURATION
 * 
 * Centralized config for the marketplace terminology and features.
 */

export const marketplaceConfig = {
  // =============================================
  // BRANDING
  // =============================================
  
  APP_NAME: "Marketplace",
  TAGLINE: "Shop Smart, Shop Confident",
  DESCRIPTION: "A modern marketplace for discovering and buying quality products from trusted vendors",
  
  // =============================================
  // TERMINOLOGY
  // =============================================
  
  ITEM_LABEL: "Product",
  ITEM_LABEL_PLURAL: "Products",
  
  SELLER_LABEL: "Vendor",
  SELLER_LABEL_PLURAL: "Vendors",
  
  BUYER_LABEL: "Buyer",
  BUYER_LABEL_PLURAL: "Buyers",
  
  VENDOR_LABEL: "Vendor",
  VENDOR_LABEL_PLURAL: "Vendors",
  
  ORDER_LABEL: "Order",
  ORDER_LABEL_PLURAL: "Orders",
  
  // =============================================
  // CURRENCY & PRICING
  // =============================================
  
  CURRENCY_SYMBOL: "$",
  CURRENCY_CODE: "USD",
  PRICE_DECIMALS: 2,
  
  // =============================================
  // FEATURE FLAGS
  // =============================================
  
  ENABLE_BIDDING: false,
  ENABLE_BUY_NOW: true,
  ENABLE_SHIPPING: false,
  ENABLE_REVIEWS: false,
  ENABLE_NOTIFICATIONS: false,
  ENABLE_IMAGE_UPLOAD: true,
  
  // =============================================
  // LISTING SETTINGS
  // =============================================
  
  MIN_PRICE: 0.01,
  MAX_PRICE: null as number | null,
  MAX_METADATA_FIELDS: 20,
  DEFAULT_STOCK: 1,
  MAX_STOCK: 99999,
  
  // =============================================
  // UI SETTINGS
  // =============================================
  
  LISTINGS_PER_PAGE: 12,
  ORDERS_PER_PAGE: 10,
  DEFAULT_DARK_MODE: true,
} as const;

export type MarketplaceConfig = typeof marketplaceConfig;

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

export const getOrderLabel = (count: number = 1): string => {
  return count === 1 
    ? marketplaceConfig.ORDER_LABEL 
    : marketplaceConfig.ORDER_LABEL_PLURAL;
};
