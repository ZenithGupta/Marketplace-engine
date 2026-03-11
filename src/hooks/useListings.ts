import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Listing, ListingWithOwner, CreateListingInput, UpdateListingInput, ListingStatus, ListingMetadata } from "@/types/database";
import { marketplaceConfig } from "@/config/marketplace.config";

// Fetch all active listings
export function useActiveListings(page: number = 1) {
  return useQuery({
    queryKey: ["listings", "active", page],
    queryFn: async (): Promise<{ listings: ListingWithOwner[]; count: number }> => {
      const from = (page - 1) * marketplaceConfig.LISTINGS_PER_PAGE;
      const to = from + marketplaceConfig.LISTINGS_PER_PAGE - 1;

      const { data, error, count } = await supabase
        .from("listings")
        .select(`
          *,
          owner:profiles(*)
        `, { count: "exact" })
        .eq("status", "ACTIVE")
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      
      return {
        listings: (data || []).map(item => ({
          ...item,
          metadata: (item.metadata || {}) as ListingMetadata,
          status: item.status as ListingStatus,
          owner: item.owner as ListingWithOwner["owner"],
        })),
        count: count || 0,
      };
    },
  });
}

// Fetch single listing
export function useListing(id: string | undefined) {
  return useQuery({
    queryKey: ["listing", id],
    queryFn: async (): Promise<ListingWithOwner | null> => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("listings")
        .select(`
          *,
          owner:profiles(*)
        `)
        .eq("id", id)
        .single();

      if (error) {
        if (error.code === "PGRST116") return null;
        throw error;
      }

      return {
        ...data,
        metadata: (data.metadata || {}) as ListingMetadata,
        status: data.status as ListingStatus,
        owner: data.owner as ListingWithOwner["owner"],
      };
    },
    enabled: !!id,
  });
}

// Fetch user's own listings
export function useMyListings() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["listings", "my", user?.id],
    queryFn: async (): Promise<Listing[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("vendor_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      return (data || []).map(item => ({
        ...item,
        metadata: (item.metadata || {}) as ListingMetadata,
        status: item.status as ListingStatus,
      }));
    },
    enabled: !!user,
  });
}

// Create listing mutation
export function useCreateListing() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateListingInput): Promise<Listing> => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("listings")
        .insert({
          vendor_id: user.id,
          title: input.title,
          description: input.description || null,
          base_price: input.base_price,
          stock_quantity: input.stock_quantity ?? marketplaceConfig.DEFAULT_STOCK,
          image_url: input.image_url || null,
          metadata: input.metadata || {},
          status: input.status || "DRAFT",
        })
        .select()
        .single();

      if (error) throw error;
      
      return {
        ...data,
        metadata: (data.metadata || {}) as ListingMetadata,
        status: data.status as ListingStatus,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
    },
  });
}

// Update listing mutation
export function useUpdateListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateListingInput }): Promise<Listing> => {
      const { data, error } = await supabase
        .from("listings")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      
      return {
        ...data,
        metadata: (data.metadata || {}) as ListingMetadata,
        status: data.status as ListingStatus,
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["listing", data.id] });
    },
  });
}

// Delete listing mutation
export function useDeleteListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase
        .from("listings")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
    },
  });
}
