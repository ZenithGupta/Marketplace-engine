import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice, marketplaceConfig } from "@/config/marketplace.config";
import type { Listing, ListingWithOwner, ListingStatus } from "@/types/database";
import { User } from "lucide-react";

interface ListingCardProps {
  listing: Listing | ListingWithOwner;
  showOwner?: boolean;
  bidCount?: number;
}

const statusConfig: Record<ListingStatus, { label: string; className: string }> = {
  DRAFT: { label: "Draft", className: "bg-muted text-muted-foreground" },
  ACTIVE: { label: "Active", className: "bg-success text-success-foreground" },
  NEGOTIATING: { label: "Negotiating", className: "bg-warning text-warning-foreground" },
  SOLD: { label: "Sold", className: "bg-primary text-primary-foreground" },
  ARCHIVED: { label: "Archived", className: "bg-muted text-muted-foreground" },
};

export function ListingCard({ listing, showOwner = false, bidCount }: ListingCardProps) {
  const owner = "owner" in listing ? listing.owner : null;
  const status = statusConfig[listing.status];

  // Get first few metadata entries for preview
  const metadataEntries = Object.entries(listing.metadata || {}).slice(0, 3);

  return (
    <Link href={`/listings/${listing.id}`}>
      <Card className="group overflow-hidden hover-lift border-border/50 hover:border-primary/30 transition-all duration-300">
        {/* Image/Placeholder */}
        <CardHeader className="p-0">
          <div className="h-48 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 flex items-center justify-center relative overflow-hidden">
            <div className="text-6xl opacity-20">📦</div>

            {/* Status Badge */}
            <Badge className={`absolute top-3 right-3 ${status.className}`}>
              {status.label}
            </Badge>

            {/* Bid Count (if provided) */}
            {bidCount !== undefined && bidCount > 0 && (
              <Badge variant="secondary" className="absolute top-3 left-3">
                {bidCount} {bidCount === 1 ? marketplaceConfig.BID_LABEL : marketplaceConfig.BID_LABEL_PLURAL}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4 space-y-3">
          {/* Title & Price */}
          <div className="space-y-1">
            <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
              {listing.title}
            </h3>
            <p className="text-2xl font-bold text-gradient">
              {formatPrice(Number(listing.base_price))}
            </p>
          </div>

          {/* Description */}
          {listing.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {listing.description}
            </p>
          )}

          {/* Metadata Preview */}
          {metadataEntries.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {metadataEntries.map(([key, value]) => (
                <Badge key={key} variant="outline" className="text-xs font-normal">
                  {key}: {String(value)}
                </Badge>
              ))}
              {Object.keys(listing.metadata || {}).length > 3 && (
                <Badge variant="outline" className="text-xs font-normal">
                  +{Object.keys(listing.metadata || {}).length - 3} more
                </Badge>
              )}
            </div>
          )}
        </CardContent>

        {/* Owner Footer */}
        {showOwner && owner && (
          <CardFooter className="px-4 py-3 border-t border-border/50 bg-muted/30">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-3 w-3 text-primary" />
              </div>
              <span>{owner.username || "Anonymous"}</span>
            </div>
          </CardFooter>
        )}
      </Card>
    </Link>
  );
}

