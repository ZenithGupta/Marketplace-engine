"use client";

import Link from "next/link";
import { MainLayout } from "@/components/layout/MainLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ListingCard } from "@/components/listings/ListingCard";
import { useMyListings } from "@/hooks/useListings";
import { useMyBids } from "@/hooks/useBids";
import { useProfile } from "@/hooks/useProfile";
import { marketplaceConfig, formatPrice, getBidLabel } from "@/config/marketplace.config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Loader2,
    Plus,
    Package,
    Gavel,
    TrendingUp,
    ArrowRight
} from "lucide-react";
import type { BidStatus } from "@/types/database";

const bidStatusConfig: Record<BidStatus, { label: string; className: string }> = {
    OPEN: { label: "Pending", className: "bg-warning text-warning-foreground" },
    ACCEPTED: { label: "Accepted", className: "bg-success text-success-foreground" },
    REJECTED: { label: "Rejected", className: "bg-destructive text-destructive-foreground" },
};

function DashboardContent() {
    const { data: profile, isLoading: profileLoading } = useProfile();
    const { data: listings, isLoading: listingsLoading } = useMyListings();
    const { data: bids, isLoading: bidsLoading } = useMyBids();

    const isLoading = profileLoading || listingsLoading || bidsLoading;

    if (isLoading) {
        return (
            <MainLayout>
                <div className="min-h-[60vh] flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </MainLayout>
        );
    }

    const activeListings = listings?.filter((l) => l.status === "ACTIVE") || [];
    const soldListings = listings?.filter((l) => l.status === "SOLD") || [];
    const openBids = bids?.filter((b) => b.status === "OPEN") || [];
    const acceptedBids = bids?.filter((b) => b.status === "ACCEPTED") || [];

    return (
        <MainLayout>
            <div className="container py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Dashboard</h1>
                        <p className="text-muted-foreground mt-1">
                            Welcome back, {profile?.username || "there"}!
                        </p>
                    </div>
                    <Button asChild className="bg-gradient-primary hover:opacity-90">
                        <Link href="/listings/new">
                            <Plus className="mr-2 h-4 w-4" />
                            Create {marketplaceConfig.ITEM_LABEL}
                        </Link>
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <Card className="border-border/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Active Listings
                            </CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{activeListings.length}</div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Items Sold
                            </CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{soldListings.length}</div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Open {getBidLabel(openBids.length)}
                            </CardTitle>
                            <Gavel className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{openBids.length}</div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/50">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Won {getBidLabel(acceptedBids.length)}
                            </CardTitle>
                            <Gavel className="h-4 w-4 text-success" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-success">{acceptedBids.length}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* My Listings Section */}
                {(listings?.length || 0) > 0 && (
                    <section className="mb-12">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold">My Listings</h2>
                            <span className="text-sm text-muted-foreground">
                                {listings?.length} total
                            </span>
                        </div>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {listings?.slice(0, 4).map((listing) => (
                                <ListingCard key={listing.id} listing={listing} />
                            ))}
                        </div>
                        {(listings?.length || 0) > 4 && (
                            <div className="text-center mt-6">
                                <Button variant="outline" asChild>
                                    <Link href="/dashboard/listings">
                                        View All Listings
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </section>
                )}

                {/* My Bids Section */}
                {(bids?.length || 0) > 0 && (
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold">My {getBidLabel(bids?.length || 0)}</h2>
                            <span className="text-sm text-muted-foreground">
                                {bids?.length} total
                            </span>
                        </div>
                        <div className="space-y-3">
                            {bids?.slice(0, 5).map((bid) => (
                                <Card key={bid.id} className="border-border/50">
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                <Gavel className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-medium">{formatPrice(Number(bid.amount))}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Placed {new Date(bid.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Badge className={bidStatusConfig[bid.status].className}>
                                                {bidStatusConfig[bid.status].label}
                                            </Badge>
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/listings/${bid.listing_id}`}>View</Link>
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </section>
                )}

                {/* Empty State */}
                {!listings?.length && !bids?.length && (
                    <div className="text-center py-16 bg-muted/30 rounded-xl border border-border/50">
                        <div className="text-6xl mb-4">🚀</div>
                        <h3 className="text-xl font-semibold mb-2">Ready to get started?</h3>
                        <p className="text-muted-foreground mb-6">
                            Create your first listing or browse the marketplace
                        </p>
                        <div className="flex items-center justify-center gap-4">
                            <Button asChild className="bg-gradient-primary hover:opacity-90">
                                <Link href="/listings/new">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create Listing
                                </Link>
                            </Button>
                            <Button variant="outline" asChild>
                                <Link href="/listings">Browse Marketplace</Link>
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}

export default function DashboardPage() {
    return (
        <ProtectedRoute>
            <DashboardContent />
        </ProtectedRoute>
    );
}
