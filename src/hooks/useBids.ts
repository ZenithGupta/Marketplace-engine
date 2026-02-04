import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Bid, BidWithBidder, CreateBidInput, BidStatus } from "@/types/database";

// Fetch bids for a specific listing (seller view)
export function useListingBids(listingId: string | undefined) {
  return useQuery({
    queryKey: ["bids", "listing", listingId],
    queryFn: async (): Promise<BidWithBidder[]> => {
      if (!listingId) return [];

      const { data, error } = await supabase
        .from("bids")
        .select(`
          *,
          bidder:profiles!bids_bidder_id_fkey(*)
        `)
        .eq("listing_id", listingId)
        .order("amount", { ascending: false });

      if (error) throw error;
      
      return (data || []).map(item => ({
        ...item,
        status: item.status as BidStatus,
        bidder: item.bidder as BidWithBidder["bidder"],
      }));
    },
    enabled: !!listingId,
  });
}

// Fetch user's own bids
export function useMyBids() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["bids", "my", user?.id],
    queryFn: async (): Promise<Bid[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("bids")
        .select("*")
        .eq("bidder_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      return (data || []).map(item => ({
        ...item,
        status: item.status as BidStatus,
      }));
    },
    enabled: !!user,
  });
}

// Create bid mutation
export function useCreateBid() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateBidInput): Promise<Bid> => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("bids")
        .insert({
          listing_id: input.listing_id,
          bidder_id: user.id,
          amount: input.amount,
          message_to_seller: input.message_to_seller || null,
        })
        .select()
        .single();

      if (error) throw error;
      
      return {
        ...data,
        status: data.status as BidStatus,
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["bids"] });
      queryClient.invalidateQueries({ queryKey: ["listing", data.listing_id] });
    },
  });
}

// Accept bid mutation (atomic transfer)
export function useAcceptBid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bidId: string): Promise<boolean> => {
      const { data, error } = await supabase.rpc("accept_bid", {
        p_bid_id: bidId,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bids"] });
      queryClient.invalidateQueries({ queryKey: ["listings"] });
    },
  });
}

// Reject bid mutation
export function useRejectBid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bidId: string): Promise<boolean> => {
      const { data, error } = await supabase.rpc("reject_bid", {
        p_bid_id: bidId,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bids"] });
    },
  });
}

// Count open bids for a listing
export function useOpenBidCount(listingId: string | undefined) {
  return useQuery({
    queryKey: ["bids", "count", listingId],
    queryFn: async (): Promise<number> => {
      if (!listingId) return 0;

      const { count, error } = await supabase
        .from("bids")
        .select("*", { count: "exact", head: true })
        .eq("listing_id", listingId)
        .eq("status", "OPEN");

      if (error) throw error;
      return count || 0;
    },
    enabled: !!listingId,
  });
}
