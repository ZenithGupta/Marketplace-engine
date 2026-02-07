"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/MainLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useCreateListing } from "@/hooks/useListings";
import { marketplaceConfig, formatPrice } from "@/config/marketplace.config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Plus, X, ArrowLeft, Eye } from "lucide-react";
import type { ListingMetadata, ListingStatus } from "@/types/database";

interface MetadataField {
    key: string;
    value: string;
}

function CreateListingContent() {
    const router = useRouter();
    const createListing = useCreateListing();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [basePrice, setBasePrice] = useState("");
    const [metadataFields, setMetadataFields] = useState<MetadataField[]>([]);
    const [status, setStatus] = useState<ListingStatus>("ACTIVE");

    const addMetadataField = () => {
        if (metadataFields.length >= marketplaceConfig.MAX_METADATA_FIELDS) {
            toast.error(`Maximum ${marketplaceConfig.MAX_METADATA_FIELDS} custom fields allowed`);
            return;
        }
        setMetadataFields([...metadataFields, { key: "", value: "" }]);
    };

    const updateMetadataField = (index: number, field: "key" | "value", value: string) => {
        const updated = [...metadataFields];
        updated[index][field] = value;
        setMetadataFields(updated);
    };

    const removeMetadataField = (index: number) => {
        setMetadataFields(metadataFields.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!title.trim()) {
            toast.error("Title is required");
            return;
        }

        const price = parseFloat(basePrice);
        if (isNaN(price) || price < marketplaceConfig.MIN_PRICE) {
            toast.error(`Minimum price is ${formatPrice(marketplaceConfig.MIN_PRICE)}`);
            return;
        }

        // Build metadata object
        const metadata: ListingMetadata = {};
        for (const field of metadataFields) {
            if (field.key.trim()) {
                metadata[field.key.trim()] = field.value.trim();
            }
        }

        try {
            const listing = await createListing.mutateAsync({
                title: title.trim(),
                description: description.trim() || undefined,
                base_price: price,
                metadata,
                status,
            });

            toast.success(
                status === "ACTIVE"
                    ? `${marketplaceConfig.ITEM_LABEL} published successfully!`
                    : `${marketplaceConfig.ITEM_LABEL} saved as draft`
            );
            router.push(`/listings/${listing.id}`);
        } catch (error) {
            toast.error("Failed to create listing. Please try again.");
        }
    };

    return (
        <MainLayout>
            <div className="container max-w-2xl py-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Create {marketplaceConfig.ITEM_LABEL}</h1>
                        <p className="text-muted-foreground">
                            Fill in the details to list your {marketplaceConfig.ITEM_LABEL.toLowerCase()}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <Card className="border-border/50">
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                            <CardDescription>
                                Describe your {marketplaceConfig.ITEM_LABEL.toLowerCase()} clearly to attract {marketplaceConfig.BUYER_LABEL_PLURAL.toLowerCase()}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Title */}
                            <div className="space-y-2">
                                <Label htmlFor="title">Title *</Label>
                                <Input
                                    id="title"
                                    placeholder={`What are you selling?`}
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                />
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Describe your item in detail..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={4}
                                />
                            </div>

                            {/* Price */}
                            <div className="space-y-2">
                                <Label htmlFor="price">Starting Price *</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                        {marketplaceConfig.CURRENCY_SYMBOL}
                                    </span>
                                    <Input
                                        id="price"
                                        type="number"
                                        placeholder="0.00"
                                        value={basePrice}
                                        onChange={(e) => setBasePrice(e.target.value)}
                                        className="pl-8"
                                        step="0.01"
                                        min={marketplaceConfig.MIN_PRICE}
                                        required
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {marketplaceConfig.BUYER_LABEL_PLURAL} will place {marketplaceConfig.BID_LABEL_PLURAL.toLowerCase()} starting from this price
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Custom Metadata */}
                    <Card className="mt-6 border-border/50">
                        <CardHeader>
                            <CardTitle>Custom Fields</CardTitle>
                            <CardDescription>
                                Add any additional details about your {marketplaceConfig.ITEM_LABEL.toLowerCase()} (e.g., condition, year, size)
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {metadataFields.map((field, index) => (
                                <div key={index} className="flex gap-3">
                                    <Input
                                        placeholder="Field name"
                                        value={field.key}
                                        onChange={(e) => updateMetadataField(index, "key", e.target.value)}
                                        className="flex-1"
                                    />
                                    <Input
                                        placeholder="Value"
                                        value={field.value}
                                        onChange={(e) => updateMetadataField(index, "value", e.target.value)}
                                        className="flex-1"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeMetadataField(index)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}

                            <Button
                                type="button"
                                variant="outline"
                                onClick={addMetadataField}
                                className="w-full"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Custom Field
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex gap-3 mt-8">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                                setStatus("DRAFT");
                                // Trigger form submission
                                const form = document.querySelector("form");
                                form?.requestSubmit();
                            }}
                            disabled={createListing.isPending}
                        >
                            {createListing.isPending && status === "DRAFT" && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            <Eye className="mr-2 h-4 w-4" />
                            Save as Draft
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 bg-gradient-primary hover:opacity-90"
                            onClick={() => setStatus("ACTIVE")}
                            disabled={createListing.isPending}
                        >
                            {createListing.isPending && status === "ACTIVE" && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Publish {marketplaceConfig.ITEM_LABEL}
                        </Button>
                    </div>
                </form>
            </div>
        </MainLayout>
    );
}

export default function CreateListingPage() {
    return (
        <ProtectedRoute>
            <CreateListingContent />
        </ProtectedRoute>
    );
}
