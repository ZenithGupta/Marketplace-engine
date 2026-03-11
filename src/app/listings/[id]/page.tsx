"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { MainLayout } from "@/components/layout/MainLayout";
import { useListing } from "@/hooks/useListings";
import { usePurchaseProduct } from "@/hooks/useOrders";
import { useAuth } from "@/contexts/AuthContext";
import { marketplaceConfig, formatPrice } from "@/config/marketplace.config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
    Loader2,
    ArrowLeft,
    Store,
    Calendar,
    ShoppingCart,
    MapPin,
    Package
} from "lucide-react";
import type { ListingStatus } from "@/types/database";

const statusConfig: Record<ListingStatus, { label: string; className: string }> = {
    DRAFT: { label: "Draft", className: "bg-muted text-muted-foreground" },
    ACTIVE: { label: "In Stock", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" },
    OUT_OF_STOCK: { label: "Out of Stock", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
    ARCHIVED: { label: "Archived", className: "bg-muted text-muted-foreground" },
};

export default function ProductDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const router = useRouter();
    const { user, isBuyer, isVendor } = useAuth();

    const { data: listing, isLoading } = useListing(id);
    const purchaseProduct = usePurchaseProduct();

    const [quantity, setQuantity] = useState(1);
    const [address, setAddress] = useState("");
    const [isBuying, setIsBuying] = useState(false);

    const isOwner = user && listing && user.id === listing.vendor_id;
    const canBuy = user && listing && !isOwner && listing.status === "ACTIVE" && listing.stock_quantity > 0;
    
    // Vendor looking at someone else's product shouldn't buy either, or maybe they can?
    // We'll let buyers buy. If vendor buys, it might be fine, but primarily buyers buy.
    const isOutofStock = listing?.status === "OUT_OF_STOCK" || (listing?.stock_quantity ?? 0) <= 0;

    const handleBuyNow = async () => {
        if (!user) {
            router.push("/auth");
            return;
        }

        if (quantity < 1 || quantity > (listing?.stock_quantity || 1)) {
            toast.error(`Please select a valid quantity (1-${listing?.stock_quantity})`);
            return;
        }

        if (!address.trim()) {
            toast.error("Please enter a shipping address");
            return;
        }

        try {
            setIsBuying(true);
            await purchaseProduct.mutateAsync({
                product_id: id,
                quantity,
                shipping_address: { address }
            });

            toast.success("Order placed successfully!");
            router.push("/dashboard");
        } catch (error: any) {
            toast.error(error.message || "Failed to place order");
        } finally {
            setIsBuying(false);
        }
    };

    if (isLoading) {
        return (
            <MainLayout>
                <div className="min-h-[60vh] flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </MainLayout>
        );
    }

    if (!listing) {
        return (
            <MainLayout>
                <div className="container py-16 text-center">
                    <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
                    <p className="text-muted-foreground mb-6">
                        This product may have been removed or doesn't exist.
                    </p>
                    <Button asChild>
                        <Link href="/">Browse Products</Link>
                    </Button>
                </div>
            </MainLayout>
        );
    }

    // Adjust status label if stock is 0 but status was ACTIVE
    const displayStatus = isOutofStock ? statusConfig["OUT_OF_STOCK"] : statusConfig[listing.status];
    const metadataEntries = Object.entries(listing.metadata || {});

    return (
        <MainLayout>
            <div className="container py-8">
                {/* Back Button */}
                <Button variant="ghost" className="mb-6" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Image/Placeholder */}
                        {listing.image_url ? (
                            <div className="aspect-video bg-muted rounded-xl overflow-hidden border border-border/50">
                                <img 
                                    src={listing.image_url} 
                                    alt={listing.title} 
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ) : (
                            <div className="aspect-video bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 rounded-xl flex items-center justify-center border border-border/50">
                                <Package className="h-24 w-24 text-primary/20" />
                            </div>
                        )}

                        {/* Title & Status */}
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold mb-2">{listing.title}</h1>
                                <div className="text-sm font-medium">Reputation: {listing.owner?.reputation_score || 0}</div>
                                <div className="flex flex-wrap items-center gap-4 text-muted-foreground text-sm">
                                    <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
                                        <Store className="h-4 w-4 text-primary" />
                                        <span className="font-medium text-foreground">
                                            {listing.owner?.store_name || listing.owner?.username || "Unknown Vendor"}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="h-4 w-4" />
                                        <span>Added {new Date(listing.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Package className="h-4 w-4" />
                                        <span>{listing.stock_quantity} in stock</span>
                                    </div>
                                </div>
                            </div>
                            <Badge variant="outline" className={displayStatus.className}>
                                {displayStatus.label}
                            </Badge>
                        </div>

                        {/* Description */}
                        {listing.description && (
                            <Card className="border-border/50 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-lg">Product Description</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                                        {listing.description}
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Metadata */}
                        {metadataEntries.length > 0 && (
                            <Card className="border-border/50 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-lg">Specifications</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        {metadataEntries.map(([key, value]) => (
                                            <div key={key} className="flex flex-col p-3 bg-muted/30 rounded-lg border border-border/50">
                                                <span className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{key}</span>
                                                <span className="font-medium">{String(value)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                        
                        {/* Vendor Info Details */}
                        {listing.owner?.store_description && (
                            <Card className="border-border/50 shadow-sm bg-muted/10">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Store className="h-5 w-5 text-primary" />
                                        About the Vendor
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground text-sm">
                                        {listing.owner.store_description}
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar / Buying Section */}
                    <div className="space-y-6">
                        <Card className="border-border/50 sticky top-24 shadow-md">
                            <CardContent className="p-6">
                                <div className="mb-6">
                                    <p className="text-sm text-muted-foreground mb-1">Price</p>
                                    <p className="text-4xl font-bold flex items-end gap-1">
                                        <span className="text-2xl text-muted-foreground">{marketplaceConfig.CURRENCY_SYMBOL}</span>
                                        {listing.base_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                </div>

                                {/* Owner Actions */}
                                {isOwner && (
                                    <div className="space-y-3">
                                        <Badge variant="outline" className="w-full justify-center py-1.5 bg-primary/10 text-primary border-primary/20">
                                            This is your product
                                        </Badge>
                                        <Button asChild className="w-full" variant="outline">
                                            <Link href={`/vendor/products/${listing.id}/edit`}>
                                                Edit Product
                                            </Link>
                                        </Button>
                                    </div>
                                )}

                                {/* Buy Options */}
                                {!isOwner && (
                                    <div className="space-y-4">
                                        {isOutofStock ? (
                                            <Button className="w-full" variant="secondary" disabled>
                                                Out of Stock
                                            </Button>
                                        ) : canBuy ? (
                                            <>
                                                <div className="space-y-3 pt-2 pb-4 border-y border-border">
                                                    <div className="flex items-center justify-between">
                                                        <Label htmlFor="quantity" className="text-muted-foreground">Quantity</Label>
                                                        <div className="flex items-center gap-2">
                                                            <Button 
                                                                type="button" 
                                                                variant="outline" 
                                                                size="icon" 
                                                                className="h-8 w-8"
                                                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                                                disabled={quantity <= 1}
                                                            >
                                                                -
                                                            </Button>
                                                            <span className="w-8 text-center font-medium">{quantity}</span>
                                                            <Button 
                                                                type="button" 
                                                                variant="outline" 
                                                                size="icon" 
                                                                className="h-8 w-8"
                                                                onClick={() => setQuantity(Math.min(listing.stock_quantity, quantity + 1))}
                                                                disabled={quantity >= listing.stock_quantity}
                                                            >
                                                                +
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="space-y-1.5 pt-2">
                                                        <Label htmlFor="address" className="text-muted-foreground flex items-center gap-1.5">
                                                            <MapPin className="h-3 w-3" /> Shipping Address
                                                        </Label>
                                                        <Input 
                                                            id="address" 
                                                            placeholder="Where should we send it?" 
                                                            value={address}
                                                            onChange={(e) => setAddress(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                
                                                <div className="flex justify-between items-center py-2 font-medium">
                                                    <span>Total</span>
                                                    <span className="text-lg flex items-center">
                                                        <span className="text-sm mr-0.5 mt-0.5 text-muted-foreground">{marketplaceConfig.CURRENCY_SYMBOL}</span>
                                                        {(listing.base_price * quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </span>
                                                </div>

                                                <Button 
                                                    onClick={handleBuyNow}
                                                    className="w-full bg-gradient-brand hover:opacity-90 text-white shadow-lg shadow-brand/20 transition-all active:scale-[0.98]"
                                                    size="lg"
                                                    disabled={isBuying}
                                                >
                                                    {isBuying ? (
                                                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</>
                                                    ) : (
                                                        <><ShoppingCart className="mr-2 h-5 w-5" /> Buy Now</>
                                                    )}
                                                </Button>
                                            </>
                                        ) : !user ? (
                                            <div className="text-center pt-2">
                                                <p className="text-sm text-muted-foreground mb-3">
                                                    Sign in to purchase products
                                                </p>
                                                <Button asChild className="w-full">
                                                    <Link href="/auth">Sign In</Link>
                                                </Button>
                                            </div>
                                        ) : null}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
