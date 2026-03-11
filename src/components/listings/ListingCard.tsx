import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/config/marketplace.config";
import type { Listing, ListingWithOwner, ListingStatus } from "@/types/database";
import { Store, Package } from "lucide-react";

interface ListingCardProps {
  listing: Listing | ListingWithOwner;
  showVendor?: boolean;
}

const statusConfig: Record<ListingStatus, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "bg-muted text-muted-foreground" },
  ACTIVE: { label: "In Stock", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" },
  OUT_OF_STOCK: { label: "Out of Stock", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  ARCHIVED: { label: "Archived", className: "bg-muted text-muted-foreground" },
};

export function ListingCard({ listing, showVendor = true }: ListingCardProps) {
  const vendor = "owner" in listing ? listing.owner : null;
  const isOutofStock = listing.status === "OUT_OF_STOCK" || listing.stock_quantity <= 0;
  const status = isOutofStock ? statusConfig["OUT_OF_STOCK"] : statusConfig[listing.status];

  // Get first few metadata entries for preview
  const metadataEntries = Object.entries(listing.metadata || {}).slice(0, 3);

  return (
    <Link href={`/listings/${listing.id}`}>
      <Card className="group overflow-hidden hover-lift border-border/50 hover:border-primary/30 transition-all duration-300">
        <CardHeader className="p-0">
          <div className="h-48 bg-muted flex items-center justify-center relative overflow-hidden text-muted-foreground">
            {listing.image_url ? (
              <img 
                src={listing.image_url} 
                alt={listing.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <Package className="h-16 w-16 opacity-30" />
            )}

            <Badge className={`absolute top-3 right-3 ${status.className}`}>
              {status.label}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-3">
          <div className="space-y-1">
            <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
              {listing.title}
            </h3>
            <p className="text-2xl font-bold text-gradient">
              {formatPrice(Number(listing.base_price))}
            </p>
          </div>

          {listing.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {listing.description}
            </p>
          )}

          {metadataEntries.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {metadataEntries.map(([key, value]) => (
                <Badge key={key} variant="outline" className="text-xs font-normal">
                  {key}: {String(value)}
                </Badge>
              ))}
              {Object.keys(listing.metadata || {}).length > 3 && (
                <Badge variant="outline" className="text-xs font-normal">
                  +{Object.keys(listing.metadata || {}).length - 3}
                </Badge>
              )}
            </div>
          )}
        </CardContent>

        {showVendor && vendor && (
          <CardFooter className="px-4 py-3 border-t border-border/50 bg-muted/30">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-6 w-6 rounded flex items-center justify-center bg-primary/10">
                <Store className="h-3 w-3 text-primary" />
              </div>
              <span className="font-medium line-clamp-1">{vendor.store_name || vendor.username || "Vendor"}</span>
            </div>
          </CardFooter>
        )}
      </Card>
    </Link>
  );
}
