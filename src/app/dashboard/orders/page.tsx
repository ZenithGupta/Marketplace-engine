"use client";

import Link from "next/link";
import { MainLayout } from "@/components/layout/MainLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useBuyerOrders } from "@/hooks/useOrders";
import { formatPrice } from "@/config/marketplace.config";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Package, ArrowLeft, ShoppingBag } from "lucide-react";

export default function BuyerOrdersPage() {
  const { data: ordersData, isLoading } = useBuyerOrders(1); // Get first page

  if (isLoading) {
    return (
      <MainLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  const orders = ordersData?.orders || [];

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="container py-8 max-w-4xl">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Order History</h1>
              <p className="text-muted-foreground mt-1">
                View all your past and pending purchases
              </p>
            </div>
          </div>

          {orders.length === 0 ? (
            <Card className="border-dashed bg-muted/30">
              <CardContent className="flex flex-col items-center justify-center h-64 text-center py-6">
                <ShoppingBag className="h-16 w-16 text-muted-foreground/40 mb-4" />
                <h3 className="text-xl font-medium mb-2">No orders found</h3>
                <p className="text-muted-foreground mb-6">
                  You haven't made any purchases yet.
                </p>
                <Button asChild>
                  <Link href="/">Browse Products</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id} className="overflow-hidden border-border/50 shadow-sm transition-colors hover:border-primary/20">
                  <div className="bg-muted px-4 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b">
                     <div className="text-sm font-medium">
                        Order #{order.id.split('-').pop()}
                     </div>
                     <div className="text-sm text-muted-foreground">
                        Placed on {new Date(order.created_at).toLocaleDateString()}
                     </div>
                  </div>
                  <CardContent className="p-4 sm:p-6 grid gap-6 md:grid-cols-[1fr_auto]">
                    <div className="flex gap-4 items-start">
                      {order.product?.image_url ? (
                        <div className="h-20 w-20 shrink-0 bg-muted rounded border border-border/50 overflow-hidden">
                          <img src={order.product.image_url} alt="" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="h-20 w-20 shrink-0 bg-muted flex items-center justify-center rounded border border-border/50">
                          <Package className="h-6 w-6 text-muted-foreground/50" />
                        </div>
                      )}
                      
                      <div>
                        <Link href={`/listings/${order.product_id}`} className="hover:underline">
                          <h3 className="font-bold text-lg mb-1">{order.product?.title || 'Unknown Product'}</h3>
                        </Link>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Sold by: <span className="font-medium text-foreground">{order.vendor?.store_name || order.vendor?.username || 'Unknown Vendor'}</span></p>
                          <p>Quantity: <span className="font-medium text-foreground">{order.quantity}</span></p>
                          <p>Unit Price: <span className="font-medium text-foreground">{formatPrice(order.unit_price)}</span></p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col justify-between items-start md:items-end gap-2 sm:gap-4 border-t md:border-t-0 pt-4 md:pt-0">
                      <div className="text-left md:text-right w-full">
                        <p className="text-sm text-muted-foreground mb-1">Total</p>
                        <p className="text-2xl font-bold text-gradient">{formatPrice(order.total_price)}</p>
                      </div>

                      <div className="w-full md:w-auto">
                        <span className={`inline-flex px-3 py-1 w-full justify-center md:w-auto md:justify-end rounded-md text-xs font-semibold uppercase tracking-wider ${
                          order.status === 'PENDING' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' :
                          order.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
