"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { ListingCard } from "@/components/listings/ListingCard";
import { useActiveListings } from "@/hooks/useListings";
import { marketplaceConfig } from "@/config/marketplace.config";
import { ArrowRight, Sparkles, Shield, Zap, Loader2 } from "lucide-react";

export default function Home() {
    const { user } = useAuth();
    const { data: listingsData, isLoading } = useActiveListings(1);

    return (
        <MainLayout>
            {/* Hero Section */}
            <section className="relative overflow-hidden">
                {/* Background decorations */}
                <div className="absolute inset-0 -z-10">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
                </div>

                <div className="container py-24 md:py-32">
                    <div className="max-w-3xl mx-auto text-center space-y-8">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm">
                            <Sparkles className="h-4 w-4 text-primary" />
                            <span className="text-foreground">The modern way to trade</span>
                        </div>

                        {/* Headline */}
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
                            <span className="text-gradient">{marketplaceConfig.TAGLINE}</span>
                        </h1>

                        {/* Subheadline */}
                        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                            {marketplaceConfig.APP_NAME} is the trusted platform for buying and selling {marketplaceConfig.ITEM_LABEL_PLURAL.toLowerCase()}.
                            Purchase instantly from verified {marketplaceConfig.VENDOR_LABEL_PLURAL.toLowerCase()},
                            and complete transactions securely.
                        </p>

                        {/* CTAs */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            {user ? (
                                <>
                                    <Button
                                        asChild
                                        size="lg"
                                        className="bg-gradient-brand hover:opacity-90 shadow-glow"
                                    >
                                        <Link href="/vendor">
                                            Open {marketplaceConfig.VENDOR_LABEL} Store
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                    <Button asChild variant="outline" size="lg">
                                        <Link href="/listings">Browse {marketplaceConfig.ITEM_LABEL_PLURAL}</Link>
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button
                                        asChild
                                        size="lg"
                                        className="bg-gradient-brand hover:opacity-90 shadow-glow"
                                    >
                                        <Link href="/auth?mode=signup">
                                            Get Started Free
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                    <Button asChild variant="outline" size="lg">
                                        <Link href="/listings">Browse {marketplaceConfig.ITEM_LABEL_PLURAL}</Link>
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-16 bg-muted/30">
                <div className="container">
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="text-center space-y-4 p-6">
                            <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-brand flex items-center justify-center">
                                <Zap className="h-6 w-6 text-white" />
                            </div>
                            <h3 className="text-xl font-semibold">Lightning Fast</h3>
                            <p className="text-muted-foreground">
                                List your {marketplaceConfig.ITEM_LABEL_PLURAL.toLowerCase()} in seconds.
                                Our streamlined process gets you to market instantly.
                            </p>
                        </div>

                        <div className="text-center space-y-4 p-6">
                            <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-accent flex items-center justify-center">
                                <Shield className="h-6 w-6 text-white" />
                            </div>
                            <h3 className="text-xl font-semibold">Secure Transactions</h3>
                            <p className="text-muted-foreground">
                                Every purchase is secure.
                                Full tracking and order status updates for peace of mind.
                            </p>
                        </div>

                        <div className="text-center space-y-4 p-6">
                            <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-warm flex items-center justify-center">
                                <Sparkles className="h-6 w-6 text-white" />
                            </div>
                            <h3 className="text-xl font-semibold">{marketplaceConfig.VENDOR_LABEL} Success</h3>
                            <p className="text-muted-foreground">
                                Professional tools to manage inventory, track orders, and interact directly
                                with loyal customers. You're always in control of your store.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Featured Listings Section */}
            <section className="py-16">
                <div className="container">
                    <div className="flex items-center justify-between gap-4 flex-wrap mb-8">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold">
                                Featured {marketplaceConfig.ITEM_LABEL_PLURAL}
                            </h2>
                            <p className="text-muted-foreground mt-1">
                                Discover what's available on the marketplace
                            </p>
                        </div>
                        <Button asChild variant="outline">
                            <Link href="/listings">
                                View All
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : listingsData?.listings.length ? (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {listingsData.listings.slice(0, 4).map((listing) => (
                                <ListingCard key={listing.id} listing={listing} showVendor />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-muted/30 rounded-xl border border-border/50">
                            <p className="text-muted-foreground mb-4">
                                No {marketplaceConfig.ITEM_LABEL_PLURAL.toLowerCase()} listed yet
                            </p>
                            {user ? (
                                <Button asChild className="bg-gradient-primary hover:opacity-90">
                                    <Link href="/listings/new">Be the first to list</Link>
                                </Button>
                            ) : (
                                <Button asChild className="bg-gradient-primary hover:opacity-90">
                                    <Link href="/auth?mode=signup">Sign up to list</Link>
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 bg-gradient-primary">
                <div className="container text-center space-y-6">
                    <h2 className="text-3xl md:text-4xl font-bold text-white">
                        Ready to Start Trading?
                    </h2>
                    <p className="text-white/80 max-w-xl mx-auto">
                        Join thousands of {marketplaceConfig.BUYER_LABEL_PLURAL.toLowerCase()} and {marketplaceConfig.SELLER_LABEL_PLURAL.toLowerCase()}
                        who trust {marketplaceConfig.APP_NAME} for their transactions.
                    </p>
                    {!user && (
                        <Button
                            asChild
                            size="lg"
                            variant="secondary"
                            className="bg-white text-primary hover:bg-white/90"
                        >
                            <Link href="/auth?mode=signup">
                                Create Free Account
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    )}
                </div>
            </section>
        </MainLayout>
    );
}
