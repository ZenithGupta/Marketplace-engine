"use client";

import { MainLayout } from "@/components/layout/MainLayout";
import { ListingCard } from "@/components/listings/ListingCard";
import { useActiveListings } from "@/hooks/useListings";
import { marketplaceConfig } from "@/config/marketplace.config";
import { Button } from "@/components/ui/button";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function ListingsPage() {
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const { data, isLoading } = useActiveListings(page);

    const totalPages = data ? Math.ceil(data.count / marketplaceConfig.LISTINGS_PER_PAGE) : 1;

    // Filter listings by search term (client-side for MVP)
    const filteredListings = data?.listings.filter((listing) =>
        listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.description?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    return (
        <MainLayout>
            <div className="container py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">
                            Browse {marketplaceConfig.ITEM_LABEL_PLURAL}
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            {data?.count || 0} {marketplaceConfig.ITEM_LABEL_PLURAL.toLowerCase()} available
                        </p>
                    </div>

                    {/* Search */}
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={`Search ${marketplaceConfig.ITEM_LABEL_PLURAL.toLowerCase()}...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                {/* Loading State */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-24">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : filteredListings.length > 0 ? (
                    <>
                        {/* Listings Grid */}
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredListings.map((listing) => (
                                <ListingCard key={listing.id} listing={listing} showOwner />
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 mt-8">
                                <Button
                                    variant="outline"
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                >
                                    Previous
                                </Button>
                                <span className="px-4 text-sm text-muted-foreground">
                                    Page {page} of {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                >
                                    Next
                                </Button>
                            </div>
                        )}
                    </>
                ) : (
                    /* Empty State */
                    <div className="text-center py-24 bg-muted/30 rounded-xl border border-border/50">
                        <div className="text-6xl mb-4">📦</div>
                        <h3 className="text-xl font-semibold mb-2">
                            {searchTerm ? "No matching items" : `No ${marketplaceConfig.ITEM_LABEL_PLURAL.toLowerCase()} yet`}
                        </h3>
                        <p className="text-muted-foreground">
                            {searchTerm
                                ? "Try adjusting your search terms"
                                : "Be the first to list something on the marketplace"
                            }
                        </p>
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
