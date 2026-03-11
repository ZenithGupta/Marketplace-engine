"use client";

import Link from "next/link";
import { MainLayout } from "@/components/layout/MainLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { useBuyerOrders } from "@/hooks/useOrders";
import { useProfile } from "@/hooks/useProfile";
import { formatPrice } from "@/config/marketplace.config";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Loader2,
    Package,
    ShoppingCart,
    ShoppingBag,
    ArrowRight,
    Store
} from "lucide-react";

function DashboardContent() {
    const { user, isVendor } = useAuth();
    const { data: profile } = useProfile();
    const { data: ordersData, isLoading: ordersLoading } = useBuyerOrders(1);

    if (ordersLoading) {
        return (
            <MainLayout>
                <div className="min-h-[60vh] flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </MainLayout>
        );
    }

    const orders = ordersData?.orders || [];
    
    // Stats extraction
    const totalSpent = orders
        .filter(o => o.status === "CONFIRMED")
        .reduce((sum, order) => sum + order.total_price, 0);
        
    const pendingOrdersCount = orders.filter(o => o.status === "PENDING").length;

    return (
        <MainLayout>
            <div className="container py-8 max-w-5xl">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Buyer Dashboard</h1>
                        <p className="text-muted-foreground mt-1">
                            Welcome back, {profile?.username || user?.email || "there"}!
                        </p>
                    </div>
                    <div className="flex gap-3">
                        {isVendor && (
                            <Button asChild variant="outline" className="border-primary text-primary hover:bg-primary/10">
                                <Link href="/vendor">
                                    <Store className="mr-2 h-4 w-4" />
                                    Vendor Dashboard
                                </Link>
                            </Button>
                        )}
                        <Button asChild className="bg-gradient-primary hover:opacity-90">
                            <Link href="/">
                                <ShoppingBag className="mr-2 h-4 w-4" />
                                Continue Shopping
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid sm:grid-cols-3 gap-4 mb-8">
                    <Card className="border-border/50 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Orders
                            </CardTitle>
                            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{orders.length}</div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/50 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Pending Orders
                            </CardTitle>
                            <Package className="h-4 w-4 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{pendingOrdersCount}</div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/50 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total Spent
                            </CardTitle>
                            <span className="h-4 w-4 text-emerald-500 font-bold">$</span>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                {formatPrice(totalSpent)}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Orders Section */}
                <section>
                    <div className="flex items-center justify-between mb-4 mt-8">
                        <div>
                            <h2 className="text-xl font-semibold">Recent Purchases</h2>
                            <p className="text-sm text-muted-foreground">Your recent order history</p>
                        </div>
                        {orders.length > 3 && (
                            <Button variant="ghost" className="text-primary" asChild>
                                <Link href="/dashboard/orders">
                                    View All
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        )}
                    </div>

                    {orders.length === 0 ? (
                        <Card className="border-dashed bg-muted/30">
                            <CardContent className="flex flex-col items-center justify-center h-48 text-center py-6">
                                <ShoppingBag className="h-10 w-10 text-muted-foreground/40 mb-3" />
                                <h3 className="text-lg font-medium mb-1">No purchases yet</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Browse the marketplace to find products you love.
                                </p>
                                <Button asChild size="sm">
                                    <Link href="/">Browse Products</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {orders.slice(0, 5).map((order) => (
                                <Card key={order.id} className="border-border/50 hover:border-primary/20 transition-colors">
                                    <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                        <div className="flex items-center gap-4 w-full sm:w-auto">
                                            {order.product?.image_url ? (
                                                <div className="h-16 w-16 shrink-0 bg-muted rounded border border-border/50 overflow-hidden">
                                                    <img src={order.product.image_url} alt="" className="w-full h-full object-cover" />
                                                </div>
                                            ) : (
                                                <div className="h-16 w-16 shrink-0 bg-muted rounded border border-border/50 flex items-center justify-center">
                                                    <Package className="h-6 w-6 text-muted-foreground/50" />
                                                </div>
                                            )}
                                            
                                            <div>
                                                <h3 className="font-semibold text-lg line-clamp-1">
                                                    {order.product?.title || "Unknown Product"}
                                                </h3>
                                                <div className="text-sm text-muted-foreground">
                                                    <p>Qty: {order.quantity} • Placed on {new Date(order.created_at).toLocaleDateString()}</p>
                                                    <p className="mt-0.5">Seller: {order.vendor?.store_name || order.vendor?.username || "Unknown"}</p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0">
                                            <div className="font-bold text-lg">{formatPrice(order.total_price)}</div>
                                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium mt-1 ${
                                                order.status === 'PENDING' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' :
                                                order.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                                'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                            }`}>
                                                {order.status}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </MainLayout>
    );
}

export default function DashboardPage() {
    return (
        <ProtectedRoute>
            <DashboardContent />
        </ProtectedRoute>
    );
}
