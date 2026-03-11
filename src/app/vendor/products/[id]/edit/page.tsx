"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useListing, useUpdateListing } from "@/hooks/useListings";
import { marketplaceConfig, formatPrice } from "@/config/marketplace.config";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Plus, X, ArrowLeft, UploadCloud, Image as ImageIcon } from "lucide-react";
import type { ListingMetadata, ListingStatus } from "@/types/database";

interface MetadataField {
  key: string;
  value: string;
}

export default function EditProductPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: listing, isLoading } = useListing(params.id);
  const updateListing = useUpdateListing();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [stockQuantity, setStockQuantity] = useState("1");
  const [metadataFields, setMetadataFields] = useState<MetadataField[]>([]);
  const [status, setStatus] = useState<ListingStatus>("ACTIVE");
  
  // Image upload state
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>("");

  useEffect(() => {
    if (listing) {
      setTitle(listing.title);
      setDescription(listing.description || "");
      setBasePrice(listing.base_price.toString());
      setStockQuantity(listing.stock_quantity.toString());
      setStatus(listing.status);
      setImageUrl(listing.image_url || "");

      const fields: MetadataField[] = [];
      const { ...customMetadata } = listing.metadata || {};
      for (const [key, value] of Object.entries(customMetadata)) {
        fields.push({ key, value: String(value) });
      }
      setMetadataFields(fields);
    }
  }, [listing]);

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="text-center p-12">
        <h2 className="text-xl font-bold">Product not found</h2>
        <Button className="mt-4" onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

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
      toast.error(error.message || "Error uploading image. Is the 'product-images' bucket created?");
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

    const metadata: ListingMetadata = {};
    for (const field of metadataFields) {
      if (field.key.trim()) {
        metadata[field.key.trim()] = field.value.trim();
      }
    }

    try {
      await updateListing.mutateAsync({
        id: params.id,
        updates: {
          title: title.trim(),
          description: description.trim() || undefined,
          base_price: price,
          stock_quantity: stock,
          image_url: imageUrl || undefined,
          metadata,
          status,
        }
      });

      toast.success("Product updated successfully");
      router.push(`/vendor/products`);
    } catch (error: any) {
      toast.error(error.message || "Failed to update product. Please try again.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Product</h1>
          <p className="text-muted-foreground">
            Update your product details
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Product Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Product Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="price">Price *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {marketplaceConfig.CURRENCY_SYMBOL}
                  </span>
                  <Input
                    id="price"
                    type="number"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    className="pl-8"
                    step="0.01"
                    min={marketplaceConfig.MIN_PRICE}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock">Stock Quantity *</Label>
                <Input
                  id="stock"
                  type="number"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  min="0"
                  step="1"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Product Status</Label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as ListingStatus)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="ACTIVE">Active</option>
                <option value="DRAFT">Draft (Hidden)</option>
                <option value="OUT_OF_STOCK">Out of Stock</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Product Image</CardTitle>
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

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>Custom Details</CardTitle>
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

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={updateListing.isPending || uploading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-gradient-primary hover:opacity-90 min-w-[120px]"
            disabled={updateListing.isPending || uploading}
          >
            {updateListing.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
