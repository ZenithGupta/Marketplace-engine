"use client";

import { useVendorOrders, useUpdateOrderStatus } from "@/hooks/useOrders";
import { formatPrice } from "@/config/marketplace.config";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ShoppingCart, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { OrderStatus } from "@/types/database";

export default function VendorOrdersPage() {
  const { data: ordersData, isLoading } = useVendorOrders(1);
  const updateOrder = useUpdateOrderStatus();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const orders = ordersData?.orders || [];

  const handleUpdateStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await updateOrder.mutateAsync({ id: orderId, status });
      toast.success(`Order marked as ${status}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to update order status");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Incoming Orders</h1>
          <p className="text-muted-foreground mt-1">
            Manage purchases from buyers.
          </p>
        </div>
      </div>

      {orders.length === 0 ? (
        <Card className="border-dashed bg-muted/50">
          <CardContent className="flex flex-col items-center justify-center h-64 text-center">
            <ShoppingCart className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-1">No orders yet</h3>
            <p className="text-muted-foreground mb-4">
              When buyers purchase your products, they will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {orders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <div className="bg-muted px-4 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b">
                <div className="text-sm">
                  <span className="font-semibold mr-2">Order ID:</span> 
                  <span className="text-muted-foreground font-mono">{order.id.split('-').pop()}</span>
                </div>
                <div className="text-sm">
                  {new Date(order.created_at).toLocaleString()}
                </div>
              </div>
              <CardContent className="p-4 sm:p-6 grid gap-6 md:grid-cols-[1fr_200px]">
                <div className="flex gap-4 items-start">
                  {order.product?.image_url ? (
                    <img src={order.product.image_url} className="w-20 h-20 object-cover rounded bg-muted shrink-0" alt="" />
                  ) : (
                    <div className="w-20 h-20 bg-muted rounded flex items-center justify-center shrink-0">
                      <span className="text-xs text-muted-foreground">No image</span>
                    </div>
                  )}
                  
                  <div>
                    <h3 className="font-bold text-lg mb-1">{order.product?.title || 'Unknown Product'}</h3>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Buyer: <span className="font-medium text-foreground">{order.buyer?.username || 'Anonymous'}</span></p>
                      <p>Quantity: <span className="font-medium text-foreground">{order.quantity}</span></p>
                      <p>Unit Price: <span className="font-medium text-foreground">{formatPrice(order.unit_price)}</span></p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-between items-start md:items-end gap-4 border-t md:border-t-0 md:border-l pt-4 md:pt-0 md:pl-6">
                  <div className="text-left md:text-right w-full">
                    <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
                    <p className="text-2xl font-bold text-primary">{formatPrice(order.total_price)}</p>
                    
                    <span className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      order.status === 'PENDING' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' :
                      order.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {order.status}
                    </span>
                  </div>

                  {order.status === 'PENDING' && (
                    <div className="flex gap-2 w-full md:w-auto">
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="flex-1 md:flex-none gap-2"
                        onClick={() => handleUpdateStatus(order.id, 'CONFIRMED')}
                        disabled={updateOrder.isPending}
                      >
                        <CheckCircle className="h-4 w-4" /> Confirm
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        className="flex-1 md:flex-none gap-2"
                        onClick={() => handleUpdateStatus(order.id, 'CANCELLED')}
                        disabled={updateOrder.isPending}
                      >
                        <XCircle className="h-4 w-4" /> Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
