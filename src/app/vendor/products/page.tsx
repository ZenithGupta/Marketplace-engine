"use client";

import { useState } from "react";
import Link from "next/link";
import { useMyListings, useDeleteListing } from "@/hooks/useListings";
import { marketplaceConfig, formatPrice } from "@/config/marketplace.config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Package, Plus, Search, Edit, Trash2, Image as ImageIcon } from "lucide-react";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";

export default function VendorProductsPage() {
  const { data: listings, isLoading } = useMyListings();
  const deleteListing = useDeleteListing();
  const [searchQuery, setSearchQuery] = useState("");

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const products = (listings || []).filter(product => 
    product.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Products</h1>
          <p className="text-muted-foreground mt-1">
            Manage your store inventory and listings.
          </p>
        </div>
        <Button asChild>
          <Link href="/vendor/products/new" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search products..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {products.length === 0 ? (
        <Card className="border-dashed bg-muted/50">
          <CardContent className="flex flex-col items-center justify-center h-64 text-center">
            <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-1">No products found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? "Try a different search term." : "Start selling by adding your first product."}
            </p>
            {!searchQuery && (
              <Button asChild>
                <Link href="/vendor/products/new">Add Your First Product</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden flex flex-col">
              {product.image_url ? (
                <div className="aspect-video w-full overflow-hidden bg-muted">
                  <img 
                    src={product.image_url} 
                    alt={product.title} 
                    className="w-full h-full object-cover transition-transform hover:scale-105"
                  />
                </div>
              ) : (
                <div className="aspect-video w-full bg-muted flex flex-col items-center justify-center text-muted-foreground">
                  <ImageIcon className="h-8 w-8 mb-2 opacity-50" />
                  <span className="text-xs">No image provided</span>
                </div>
              )}
              
              <CardHeader className="pb-2 flex-none">
                <div className="flex justify-between items-start gap-4">
                  <CardTitle className="line-clamp-1">{product.title}</CardTitle>
                  <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    product.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' :
                    product.status === 'OUT_OF_STOCK' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                    'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400'
                  }`}>
                    {product.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="text-lg font-bold">{formatPrice(product.base_price)}</div>
              </CardHeader>
              
              <CardContent className="pb-4 flex-1">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {product.description || "No description provided."}
                </p>
                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <Package className="h-4 w-4" />
                  <span>Stock: {product.stock_quantity}</span>
                </div>
              </CardContent>

              <CardFooter className="pt-0 gap-2 flex-none border-t border-border/50 bg-muted/20 p-4">
                <Button variant="outline" className="flex-1" asChild>
                  <Link href={`/vendor/products/${product.id}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Link>
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="icon" className="text-destructive hover:bg-destructive hover:text-destructive-foreground">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Product</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{product.title}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => deleteListing.mutate(product.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {deleteListing.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
