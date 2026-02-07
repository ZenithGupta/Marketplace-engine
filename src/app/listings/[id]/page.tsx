"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { MainLayout } from "@/components/layout/MainLayout";
import { useListing, useUpdateListing } from "@/hooks/useListings";
import { useListingBids, useCreateBid, useAcceptBid, useRejectBid } from "@/hooks/useBids";
import { useAuth } from "@/contexts/AuthContext";
import { marketplaceConfig, formatPrice, getBidLabel } from "@/config/marketplace.config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
    Loader2,
    ArrowLeft,
    User,
    Calendar,
    Gavel,
    Check,
    X,
    MessageSquare
} from "lucide-react";
import type { ListingStatus, BidStatus } from "@/types/database";

const statusConfig: Record<ListingStatus, { label: string; className: string }> = {
    DRAFT: { label: "Draft", className: "bg-muted text-muted-foreground" },
    ACTIVE: { label: "Active", className: "bg-success text-success-foreground" },
    NEGOTIATING: { label: "Negotiating", className: "bg-warning text-warning-foreground" },
    SOLD: { label: "Sold", className: "bg-primary text-primary-foreground" },
    ARCHIVED: { label: "Archived", className: "bg-muted text-muted-foreground" },
};

const bidStatusConfig: Record<BidStatus, { label: string; className: string }> = {
    OPEN: { label: "Open", className: "bg-warning text-warning-foreground" },
    ACCEPTED: { label: "Accepted", className: "bg-success text-success-foreground" },
    REJECTED: { label: "Rejected", className: "bg-destructive text-destructive-foreground" },
};

export default function ListingDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const router = useRouter();
    const { user } = useAuth();

    const { data: listing, isLoading } = useListing(id);
    const { data: bids, isLoading: bidsLoading } = useListingBids(id);
    const createBid = useCreateBid();
    const acceptBid = useAcceptBid();
    const rejectBid = useRejectBid();
    const updateListing = useUpdateListing();

    const [bidAmount, setBidAmount] = useState("");
    const [bidMessage, setBidMessage] = useState("");
    const [bidDialogOpen, setBidDialogOpen] = useState(false);

    const isOwner = user && listing && user.id === listing.current_owner_id;
    const canBid = user && listing && !isOwner && ["ACTIVE", "NEGOTIATING"].includes(listing.status);
    const openBids = bids?.filter((b) => b.status === "OPEN") || [];

    const handlePlaceBid = async () => {
        const amount = parseFloat(bidAmount);
        if (isNaN(amount) || amount <= 0) {
            toast.error("Please enter a valid amount");
            return;
        }

        try {
            await createBid.mutateAsync({
                listing_id: id!,
                amount,
                message_to_seller: bidMessage || undefined,
            });
            toast.success(`${marketplaceConfig.BID_LABEL} placed successfully!`);
            setBidDialogOpen(false);
            setBidAmount("");
            setBidMessage("");
        } catch (error: any) {
            toast.error(error.message || "Failed to place bid");
        }
    };

    const handleAcceptBid = async (bidId: string) => {
        try {
            await acceptBid.mutateAsync(bidId);
            toast.success(`${marketplaceConfig.BID_LABEL} accepted! Ownership has been transferred.`);
        } catch (error: any) {
            toast.error(error.message || "Failed to accept bid");
        }
    };

    const handleRejectBid = async (bidId: string) => {
        try {
            await rejectBid.mutateAsync(bidId);
            toast.success(`${marketplaceConfig.BID_LABEL} rejected`);
        } catch (error: any) {
            toast.error(error.message || "Failed to reject bid");
        }
    };

    const handlePublish = async () => {
        if (!listing) return;
        try {
            await updateListing.mutateAsync({
                id: listing.id,
                updates: { status: "ACTIVE" },
            });
            toast.success(`${marketplaceConfig.ITEM_LABEL} published!`);
        } catch (error) {
            toast.error("Failed to publish");
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
                    <h1 className="text-2xl font-bold mb-4">Listing Not Found</h1>
                    <p className="text-muted-foreground mb-6">
                        This listing may have been removed or doesn't exist.
                    </p>
                    <Button asChild>
                        <Link href="/listings">Browse Listings</Link>
                    </Button>
                </div>
            </MainLayout>
        );
    }

    const status = statusConfig[listing.status];
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
                        <div className="aspect-video bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 rounded-xl flex items-center justify-center">
                            <div className="text-8xl opacity-20">📦</div>
                        </div>

                        {/* Title & Status */}
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold mb-2">{listing.title}</h1>
                                <div className="flex items-center gap-3 text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <User className="h-4 w-4" />
                                        <span>{listing.owner?.username || "Anonymous"}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4" />
                                        <span>{new Date(listing.created_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                            <Badge className={status.className}>{status.label}</Badge>
                        </div>

                        {/* Description */}
                        {listing.description && (
                            <Card className="border-border/50">
                                <CardHeader>
                                    <CardTitle className="text-lg">Description</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="whitespace-pre-wrap">{listing.description}</p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Metadata */}
                        {metadataEntries.length > 0 && (
                            <Card className="border-border/50">
                                <CardHeader>
                                    <CardTitle className="text-lg">Details</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        {metadataEntries.map(([key, value]) => (
                                            <div key={key} className="flex justify-between p-3 bg-muted/50 rounded-lg">
                                                <span className="font-medium">{key}</span>
                                                <span className="text-muted-foreground">{String(value)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Bids Section (Owner View) */}
                        {isOwner && (
                            <Card className="border-border/50">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Gavel className="h-5 w-5" />
                                        {getBidLabel(bids?.length || 0)} ({bids?.length || 0})
                                    </CardTitle>
                                    <CardDescription>
                                        Review and manage incoming {getBidLabel(bids?.length || 0).toLowerCase()}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {bidsLoading ? (
                                        <div className="flex justify-center py-8">
                                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                        </div>
                                    ) : bids?.length ? (
                                        <div className="space-y-4">
                                            {bids.map((bid) => (
                                                <div
                                                    key={bid.id}
                                                    className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                            <User className="h-5 w-5 text-primary" />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-lg">
                                                                {formatPrice(Number(bid.amount))}
                                                            </p>
                                                            <p className="text-sm text-muted-foreground">
                                                                by {bid.bidder?.username || "Anonymous"} • {new Date(bid.created_at).toLocaleDateString()}
                                                            </p>
                                                            {bid.message_to_seller && (
                                                                <p className="text-sm mt-1 flex items-start gap-1">
                                                                    <MessageSquare className="h-4 w-4 shrink-0 mt-0.5" />
                                                                    {bid.message_to_seller}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Badge className={bidStatusConfig[bid.status].className}>
                                                            {bidStatusConfig[bid.status].label}
                                                        </Badge>
                                                        {bid.status === "OPEN" && listing.status !== "SOLD" && (
                                                            <div className="flex gap-1">
                                                                <AlertDialog>
                                                                    <AlertDialogTrigger asChild>
                                                                        <Button size="sm" variant="outline" className="text-success border-success">
                                                                            <Check className="h-4 w-4" />
                                                                        </Button>
                                                                    </AlertDialogTrigger>
                                                                    <AlertDialogContent>
                                                                        <AlertDialogHeader>
                                                                            <AlertDialogTitle>Accept this {marketplaceConfig.BID_LABEL.toLowerCase()}?</AlertDialogTitle>
                                                                            <AlertDialogDescription>
                                                                                This will transfer ownership of "{listing.title}" to {bid.bidder?.username || "the bidder"} for {formatPrice(Number(bid.amount))}. All other bids will be rejected. This action cannot be undone.
                                                                            </AlertDialogDescription>
                                                                        </AlertDialogHeader>
                                                                        <AlertDialogFooter>
                                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                            <AlertDialogAction
                                                                                onClick={() => handleAcceptBid(bid.id)}
                                                                                className="bg-success hover:bg-success/90"
                                                                            >
                                                                                Accept {marketplaceConfig.BID_LABEL}
                                                                            </AlertDialogAction>
                                                                        </AlertDialogFooter>
                                                                    </AlertDialogContent>
                                                                </AlertDialog>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="text-destructive border-destructive"
                                                                    onClick={() => handleRejectBid(bid.id)}
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-center py-8 text-muted-foreground">
                                            No {getBidLabel(0).toLowerCase()} yet
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Price Card */}
                        <Card className="border-border/50 sticky top-24">
                            <CardContent className="p-6">
                                <div className="text-center mb-6">
                                    <p className="text-sm text-muted-foreground mb-1">Starting Price</p>
                                    <p className="text-4xl font-bold text-gradient">
                                        {formatPrice(Number(listing.base_price))}
                                    </p>
                                </div>

                                {/* Owner Actions */}
                                {isOwner && listing.status === "DRAFT" && (
                                    <Button
                                        onClick={handlePublish}
                                        className="w-full bg-gradient-primary hover:opacity-90"
                                        disabled={updateListing.isPending}
                                    >
                                        {updateListing.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Publish {marketplaceConfig.ITEM_LABEL}
                                    </Button>
                                )}

                                {/* Bid Button */}
                                {canBid && (
                                    <Dialog open={bidDialogOpen} onOpenChange={setBidDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button className="w-full bg-gradient-primary hover:opacity-90">
                                                <Gavel className="mr-2 h-4 w-4" />
                                                Place {marketplaceConfig.BID_LABEL}
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Place {marketplaceConfig.BID_LABEL}</DialogTitle>
                                                <DialogDescription>
                                                    Submit your offer for "{listing.title}"
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4 py-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="bid-amount">Your {marketplaceConfig.BID_LABEL}</Label>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                                            {marketplaceConfig.CURRENCY_SYMBOL}
                                                        </span>
                                                        <Input
                                                            id="bid-amount"
                                                            type="number"
                                                            placeholder="0.00"
                                                            value={bidAmount}
                                                            onChange={(e) => setBidAmount(e.target.value)}
                                                            className="pl-8"
                                                            step="0.01"
                                                            min="0.01"
                                                        />
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">
                                                        Asking price: {formatPrice(Number(listing.base_price))}
                                                    </p>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="bid-message">Message (optional)</Label>
                                                    <Textarea
                                                        id="bid-message"
                                                        placeholder={`Message to ${marketplaceConfig.SELLER_LABEL.toLowerCase()}...`}
                                                        value={bidMessage}
                                                        onChange={(e) => setBidMessage(e.target.value)}
                                                        rows={3}
                                                    />
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button variant="outline" onClick={() => setBidDialogOpen(false)}>
                                                    Cancel
                                                </Button>
                                                <Button
                                                    onClick={handlePlaceBid}
                                                    className="bg-gradient-primary hover:opacity-90"
                                                    disabled={createBid.isPending}
                                                >
                                                    {createBid.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                    Submit {marketplaceConfig.BID_LABEL}
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                )}

                                {/* Login prompt */}
                                {!user && listing.status === "ACTIVE" && (
                                    <div className="text-center">
                                        <p className="text-sm text-muted-foreground mb-3">
                                            Sign in to place {marketplaceConfig.BID_LABEL_PLURAL.toLowerCase()}
                                        </p>
                                        <Button asChild className="w-full">
                                            <Link href="/auth">Sign In</Link>
                                        </Button>
                                    </div>
                                )}

                                {/* Sold notice */}
                                {listing.status === "SOLD" && (
                                    <div className="text-center py-4 px-3 bg-primary/10 rounded-lg">
                                        <p className="font-medium text-primary">This item has been sold</p>
                                    </div>
                                )}

                                {/* Open bids count */}
                                {openBids.length > 0 && !isOwner && (
                                    <div className="mt-4 text-center text-sm text-muted-foreground">
                                        {openBids.length} open {getBidLabel(openBids.length).toLowerCase()}
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
