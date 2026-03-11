"use client";

import { useVendorOrders } from "@/hooks/useOrders";
import { useMyListings } from "@/hooks/useListings";
import { marketplaceConfig, formatPrice } from "@/config/marketplace.config";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Package, ShoppingCart, DollarSign, TrendingUp, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function VendorDashboardPage() {
  const { data: listingsData, isLoading: listingsLoading } = useMyListings();
  const { data: ordersData, isLoading: ordersLoading } = useVendorOrders(1);

  if (listingsLoading || ordersLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const listings = listingsData || [];
  const orders = ordersData?.orders || [];

  // Calculate statistics
  const activeProducts = listings.filter(l => l.status === "ACTIVE").length;
  const outOfStockProducts = listings.filter(l => l.status === "OUT_OF_STOCK").length;
  
  const pendingOrders = orders.filter(o => o.status === "PENDING").length;
  const completedOrders = orders.filter(o => o.status === "CONFIRMED").length;

  const totalRevenue = orders
    .filter(o => o.status === "CONFIRMED")
    .reduce((sum, order) => sum + order.total_price, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back! Here's what's happening in your store today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              From {completedOrders} completed {marketplaceConfig.ORDER_LABEL_PLURAL.toLowerCase()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Requires your attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Products</CardTitle>
            <Package className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProducts}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently listed for sale
            </p>
          </CardContent>
        </Card>

        <Card className={outOfStockProducts > 0 ? "border-destructive/50" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <AlertCircle className={`h-4 w-4 ${outOfStockProducts > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${outOfStockProducts > 0 ? 'text-destructive' : ''}`}>
              {outOfStockProducts}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Products needing restock
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity / Next Steps */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>
              You have {pendingOrders} order(s) waiting to be confirmed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="mx-auto h-8 w-8 mb-3 opacity-20" />
                <p>No orders yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.slice(0, 5).map(order => (
                  <div key={order.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                    <div>
                      <p className="font-medium">{order.product?.title || 'Unknown Product'}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.quantity}x • Buyer: {order.buyer?.username || 'Anonymous'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatPrice(order.total_price)}</p>
                      <span className={`inline-flex items-center px-2 py-0.5 mt-1 rounded text-xs font-medium ${
                        order.status === 'PENDING' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' :
                        order.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' :
                        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
                
                {orders.length > 5 && (
                  <Button variant="outline" className="w-full mt-4" asChild>
                    <Link href="/vendor/orders">View All Orders</Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Manage your store</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full justify-start gap-2" asChild>
              <Link href="/vendor/products/new">
                <Package className="h-4 w-4" />
                Add New Product
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2" asChild>
              <Link href="/vendor/products">
                <TrendingUp className="h-4 w-4" />
                Manage Inventory
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2" asChild>
              <Link href="/vendor/orders">
                <ShoppingCart className="h-4 w-4" />
                View All Orders
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
