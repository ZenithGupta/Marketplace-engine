import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Order, OrderWithDetails, CreateOrderInput, OrderStatus } from "@/types/database";
import { marketplaceConfig } from "@/config/marketplace.config";

// Fetch vendor's incoming orders
export function useVendorOrders(page: number = 1) {
  const { user, isVendor } = useAuth();

  return useQuery({
    queryKey: ["orders", "vendor", user?.id, page],
    queryFn: async (): Promise<{ orders: OrderWithDetails[]; count: number }> => {
      if (!user || !isVendor) return { orders: [], count: 0 };

      const from = (page - 1) * marketplaceConfig.ORDERS_PER_PAGE;
      const to = from + marketplaceConfig.ORDERS_PER_PAGE - 1;

      const { data, error, count } = await supabase
        .from("orders")
        .select(`
          *,
          buyer:profiles!orders_buyer_id_fkey(*),
          vendor:profiles!orders_vendor_id_fkey(*),
          product:listings(*)
        `, { count: "exact" })
        .eq("vendor_id", user.id)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      
      return {
        orders: (data || []) as OrderWithDetails[],
        count: count || 0,
      };
    },
    enabled: !!user && isVendor,
  });
}

// Fetch buyer's outgoing orders
export function useBuyerOrders(page: number = 1) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["orders", "buyer", user?.id, page],
    queryFn: async (): Promise<{ orders: OrderWithDetails[]; count: number }> => {
      if (!user) return { orders: [], count: 0 };

      const from = (page - 1) * marketplaceConfig.ORDERS_PER_PAGE;
      const to = from + marketplaceConfig.ORDERS_PER_PAGE - 1;

      const { data, error, count } = await supabase
        .from("orders")
        .select(`
          *,
          buyer:profiles!orders_buyer_id_fkey(*),
          vendor:profiles!orders_vendor_id_fkey(*),
          product:listings(*)
        `, { count: "exact" })
        .eq("buyer_id", user.id)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      
      return {
        orders: (data || []) as OrderWithDetails[],
        count: count || 0,
      };
    },
    enabled: !!user,
  });
}

// Create an order (purchase a product)
export function usePurchaseProduct() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateOrderInput): Promise<{ order_id: string }> => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .rpc("purchase_product", {
          p_product_id: input.product_id,
          p_quantity: input.quantity,
          p_shipping_address: input.shipping_address || {},
        });

      if (error) throw error;
      
      return { order_id: data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["listing"] });
    },
  });
}

// Update order status (Vendor action)
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }): Promise<Order> => {
      const { data, error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      
      return data as Order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}
