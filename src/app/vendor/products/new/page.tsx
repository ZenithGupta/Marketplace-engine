"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateListing } from "@/hooks/useListings";
import { marketplaceConfig, formatPrice } from "@/config/marketplace.config";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Plus, X, ArrowLeft, Eye, UploadCloud, Image as ImageIcon } from "lucide-react";
import type { ListingMetadata, ListingStatus } from "@/types/database";

interface MetadataField {
  key: string;
  value: string;
}

export default function CreateProductPage() {
  const router = useRouter();
  const createListing = useCreateListing();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [stockQuantity, setStockQuantity] = useState("1");
  const [metadataFields, setMetadataFields] = useState<MetadataField[]>([]);
  const [status, setStatus] = useState<ListingStatus>("ACTIVE");
  
  // Image upload state
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>("");

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!e.target.files || e.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload to 'product-images' bucket
      const { error: uploadError, data } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      if (data) {
        const { data: publicUrlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);
          
        setImageUrl(publicUrlData.publicUrl);
        toast.success("Image uploaded successfully");
      }
    } catch (error: any) {
      // If bucket doesn't exist, we fallback to letting them know
      toast.error(error.message || "Error uploading image. Is the 'product-images' bucket created?");
      console.error(error);
    } finally {
      setUploading(false);
    }
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

    const stock = parseInt(stockQuantity, 10);
    if (isNaN(stock) || stock < 0) {
      toast.error("Stock quantity must be a non-negative number");
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
      await createListing.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        base_price: price,
        stock_quantity: stock,
        image_url: imageUrl || undefined,
        metadata,
        status,
      });

      toast.success(
        status === "ACTIVE"
          ? `${marketplaceConfig.ITEM_LABEL} published successfully!`
          : `${marketplaceConfig.ITEM_LABEL} saved as draft`
      );
      router.push(`/vendor/products`);
    } catch (error: any) {
      toast.error(error.message || "Failed to create listing. Please try again.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Add New {marketplaceConfig.ITEM_LABEL}</h1>
          <p className="text-muted-foreground">
            List a new product in your store
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Product Details</CardTitle>
            <CardDescription>
              Basic information about what you are selling
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Product Title *</Label>
              <Input
                id="title"
                placeholder={`Name of your product`}
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

            <div className="grid sm:grid-cols-2 gap-6">
              {/* Price */}
              <div className="space-y-2">
                <Label htmlFor="price">Price *</Label>
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
              </div>

              {/* Stock */}
              <div className="space-y-2">
                <Label htmlFor="stock">Stock Quantity *</Label>
                <Input
                  id="stock"
                  type="number"
                  placeholder="1"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  min="0"
                  step="1"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Product Image */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Product Image</CardTitle>
            <CardDescription>
              Add a high-quality image of your product
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {imageUrl ? (
                <div className="relative rounded-lg overflow-hidden border bg-muted aspect-video max-w-sm">
                  <img src={imageUrl} alt="Uploaded product" className="object-cover w-full h-full" />
                  <Button 
                    type="button" 
                    variant="destructive" 
                    size="icon" 
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={() => setImageUrl("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-12 text-center hover:bg-muted/50 transition-colors">
                  <ImageIcon className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                  <div className="space-y-2">
                    <Label htmlFor="image-upload" className="cursor-pointer">
                      <div className="bg-primary text-primary-foreground px-4 py-2 rounded-md inline-flex items-center gap-2 hover:bg-primary/90">
                        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                        {uploading ? "Uploading..." : "Upload Image"}
                      </div>
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={handleImageUpload}
                        disabled={uploading}
                      />
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG or WEBP up to 5MB. 
                      <br/>* Make sure Supabase storage bucket 'product-images' is public *
                    </p>
                  </div>
                </div>
              )}
              
              <div className="space-y-2 pt-4">
                <Label htmlFor="image-url">Or paste image URL directly</Label>
                <Input
                  id="image-url"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Custom Metadata */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Custom Details</CardTitle>
            <CardDescription>
              Add any additional specifications (e.g., Brand, Color, Weight)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {metadataFields.map((field, index) => (
              <div key={index} className="flex gap-3">
                <Input
                  placeholder="e.g. Brand"
                  value={field.key}
                  onChange={(e) => updateMetadataField(index, "key", e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="e.g. Apple"
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
              Add Specification
            </Button>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
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
            disabled={createListing.isPending || uploading}
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
            disabled={createListing.isPending || uploading}
          >
            {createListing.isPending && status === "ACTIVE" && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Publish {marketplaceConfig.ITEM_LABEL}
          </Button>
        </div>
      </form>
    </div>
  );
}
