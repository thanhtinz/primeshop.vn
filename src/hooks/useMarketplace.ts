import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Seller {
  id: string;
  user_id: string;
  shop_name: string;
  shop_slug: string;
  shop_description: string | null;
  shop_avatar_url: string | null;
  shop_banner_url: string | null;
  phone: string | null;
  facebook_url: string | null;
  zalo_url: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  shop_type: 'game_account' | 'design';
  total_sales: number;
  total_revenue: number;
  rating_average: number;
  rating_count: number;
  trust_score: number;
  balance: number;
  admin_notes: string | null;
  is_verified: boolean;
  is_partner: boolean;
  verification_requested_at: string | null;
  verified_at: string | null;
  verified_by: string | null;
  availability_status: string | null;
  availability_reason: string | null;
  availability_until: string | null;
  // Design shop pricing settings
  design_rush_delivery_fee: number;
  design_extra_revision_price: number;
  design_commercial_license_price: number;
  design_exclusive_license_price: number;
  created_at: string;
  updated_at: string;
}

export interface SellerProduct {
  id: string;
  seller_id: string;
  title: string;
  description: string | null;
  category: string;
  game_type: string | null;
  price: number;
  original_price: number | null;
  images: string[];
  account_data: string | null;
  status: 'available' | 'pending_review' | 'sold' | 'hidden' | 'rejected';
  is_featured: boolean;
  view_count: number;
  account_info: Record<string, any> | null;
  sold_at: string | null;
  buyer_id: string | null;
  order_id: string | null;
  created_at: string;
  updated_at: string;
  seller?: Seller;
}

export interface SellerReview {
  id: string;
  seller_id: string;
  reviewer_id: string;
  reviewer_name: string | null;
  reviewer_avatar: string | null;
  product_id: string | null;
  rating: number;
  comment: string | null;
  seller_reply: string | null;
  seller_reply_at: string | null;
  created_at: string;
}

export interface SellerOrder {
  id: string;
  order_number: string;
  product_id: string;
  seller_id: string;
  buyer_id: string;
  buyer_email: string;
  amount: number;
  platform_fee: number;
  seller_amount: number;
  status: 'pending' | 'paid' | 'delivered' | 'completed' | 'disputed' | 'refunded' | 'cancelled';
  delivery_content: string | null;
  notes: string | null;
  escrow_release_at: string | null;
  dispute_status: 'none' | 'open' | 'resolved_buyer' | 'resolved_seller' | 'auto_released';
  dispute_reason: string | null;
  dispute_opened_at: string | null;
  released_at: string | null;
  created_at: string;
  updated_at: string;
  product?: SellerProduct;
  seller?: Seller;
}

export interface OrderDispute {
  id: string;
  order_id: string;
  sender_id: string;
  sender_type: 'buyer' | 'seller' | 'admin';
  message: string;
  attachments: string[];
  created_at: string;
}

export interface WithdrawalRequest {
  id: string;
  seller_id: string;
  amount: number;
  bank_name: string;
  bank_account: string;
  bank_holder: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  admin_notes: string | null;
  processed_at: string | null;
  processed_by: string | null;
  created_at: string;
  seller?: Seller;
}

export interface MarketplaceCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
}

// Hook to get current user's seller profile
export const useCurrentSeller = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['current-seller', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('sellers')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data as Seller | null;
    },
    enabled: !!user
  });
};

// Hook to get seller by slug
export const useSellerBySlug = (slug: string | undefined) => {
  return useQuery({
    queryKey: ['seller', slug],
    queryFn: async () => {
      if (!slug) return null;
      
      const { data, error } = await supabase
        .from('sellers')
        .select('*')
        .eq('shop_slug', slug)
        .eq('status', 'approved')
        .single();
      
      if (error) throw error;
      return data as Seller;
    },
    enabled: !!slug
  });
};

// Hook to get all approved sellers
export const useApprovedSellers = () => {
  return useQuery({
    queryKey: ['approved-sellers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sellers')
        .select('*')
        .eq('status', 'approved')
        .order('total_sales', { ascending: false });
      
      if (error) throw error;
      return data as Seller[];
    }
  });
};

// Hook to register as seller
export const useRegisterSeller = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (data: {
      shop_name: string;
      shop_slug: string;
      shop_description?: string;
      shop_type?: 'game_account' | 'design';
      phone?: string;
      facebook_url?: string;
      zalo_url?: string;
    }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { data: seller, error } = await supabase
        .from('sellers')
        .insert({
          user_id: user.id,
          ...data
        })
        .select()
        .single();
      
      if (error) throw error;
      return seller as Seller;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-seller'] });
    }
  });
};

// Hook to update seller profile
export const useUpdateSeller = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Seller> & { id: string }) => {
      const { data: seller, error } = await supabase
        .from('sellers')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return seller as Seller;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-seller'] });
      queryClient.invalidateQueries({ queryKey: ['seller'] });
    }
  });
};

// Hook to delete seller (admin only)
export const useDeleteSeller = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      // Delete related data in order (child tables first)
      await supabase.from('seller_reviews').delete().eq('seller_id', id);
      await supabase.from('seller_orders').delete().eq('seller_id', id);
      await supabase.from('seller_vouchers').delete().eq('seller_id', id);
      await supabase.from('seller_flash_sales').delete().eq('seller_id', id);
      await supabase.from('seller_api_keys').delete().eq('seller_id', id);
      await supabase.from('seller_webhooks').delete().eq('seller_id', id);
      await supabase.from('seller_buyer_blacklist').delete().eq('seller_id', id);
      await supabase.from('seller_product_combos').delete().eq('seller_id', id);
      await supabase.from('product_boosts').delete().eq('seller_id', id);
      await supabase.from('auctions').delete().eq('seller_id', id);
      await supabase.from('account_handovers').delete().eq('seller_id', id);
      await supabase.from('bulk_import_jobs').delete().eq('seller_id', id);
      await supabase.from('design_services').delete().eq('seller_id', id);
      await supabase.from('seller_products').delete().eq('seller_id', id);
      
      // Finally delete the seller
      const { error } = await supabase
        .from('sellers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-sellers'] });
      queryClient.invalidateQueries({ queryKey: ['approved-sellers'] });
    }
  });
};

// Hook to get seller products
export const useSellerProducts = (sellerId?: string) => {
  return useQuery({
    queryKey: ['seller-products', sellerId],
    queryFn: async () => {
      let query = supabase
        .from('seller_products')
        .select('*, seller:sellers(*)')
        .eq('status', 'available')
        .order('created_at', { ascending: false });
      
      if (sellerId) {
        query = query.eq('seller_id', sellerId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as (SellerProduct & { seller: Seller })[];
    }
  });
};

// Hook to get my products (as seller)
export const useMySellerProducts = () => {
  const { data: seller } = useCurrentSeller();
  
  return useQuery({
    queryKey: ['my-seller-products', seller?.id],
    queryFn: async () => {
      if (!seller) return [];
      
      const { data, error } = await supabase
        .from('seller_products')
        .select('*')
        .eq('seller_id', seller.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as SellerProduct[];
    },
    enabled: !!seller
  });
};

// Hook to create seller product
export const useCreateSellerProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Omit<SellerProduct, 'id' | 'created_at' | 'updated_at' | 'view_count' | 'sold_at' | 'buyer_id' | 'order_id'>) => {
      const { data: product, error } = await supabase
        .from('seller_products')
        .insert(data)
        .select()
        .single();
      
      if (error) throw error;
      return product as SellerProduct;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
      queryClient.invalidateQueries({ queryKey: ['my-seller-products'] });
    }
  });
};

// Hook to update seller product
export const useUpdateSellerProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<SellerProduct> & { id: string }) => {
      const { data: product, error } = await supabase
        .from('seller_products')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return product as SellerProduct;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
      queryClient.invalidateQueries({ queryKey: ['my-seller-products'] });
    }
  });
};

// Hook to delete seller product
export const useDeleteSellerProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      // First delete related orders
      const { error: ordersError } = await supabase
        .from('seller_orders')
        .delete()
        .eq('product_id', id);
      
      if (ordersError) throw ordersError;
      
      // Then delete related reviews
      const { error: reviewsError } = await supabase
        .from('seller_reviews')
        .delete()
        .eq('product_id', id);
      
      if (reviewsError) throw reviewsError;
      
      // Finally delete the product
      const { error } = await supabase
        .from('seller_products')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
      queryClient.invalidateQueries({ queryKey: ['my-seller-products'] });
      queryClient.invalidateQueries({ queryKey: ['seller-orders'] });
      queryClient.invalidateQueries({ queryKey: ['seller-reviews'] });
    }
  });
};

// Hook to get recent seller transactions (public view)
export const useSellerRecentTransactions = (sellerId?: string) => {
  return useQuery({
    queryKey: ['seller-recent-transactions', sellerId],
    queryFn: async () => {
      if (!sellerId) return [];
      
      const { data, error } = await supabase
        .from('seller_orders')
        .select('id, order_number, amount, status, created_at, buyer_email')
        .eq('seller_id', sellerId)
        .in('status', ['completed', 'delivered'])
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    enabled: !!sellerId
  });
};

export const useSellerReviews = (sellerId?: string) => {
  return useQuery({
    queryKey: ['seller-reviews', sellerId],
    queryFn: async () => {
      if (!sellerId) return [];
      
      const { data, error } = await supabase
        .from('seller_reviews')
        .select('*')
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as SellerReview[];
    },
    enabled: !!sellerId
  });
};

// Hook to create seller review - requires completed purchase
export const useCreateSellerReview = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (data: { 
      seller_id: string;
      product_id?: string;
      rating: number;
      comment?: string;
      reviewer_name?: string;
      reviewer_avatar?: string;
      images?: string[];
    }) => {
      if (!user) throw new Error('Vui lòng đăng nhập để đánh giá');
      
      // Check if user is the seller (cannot review own shop)
      const { data: seller } = await supabase
        .from('sellers')
        .select('user_id')
        .eq('id', data.seller_id)
        .single();
      
      if (seller?.user_id === user.id) {
        throw new Error('Bạn không thể đánh giá shop của chính mình');
      }
      
      // Verify user has completed a purchase from this seller
      const { data: purchases, error: purchaseError } = await supabase
        .from('seller_orders')
        .select('id')
        .eq('buyer_id', user.id)
        .eq('seller_id', data.seller_id)
        .eq('status', 'completed')
        .limit(1);
      
      if (purchaseError) throw purchaseError;
      if (!purchases || purchases.length === 0) {
        throw new Error('Bạn cần mua hàng từ shop này trước khi đánh giá');
      }
      
      // Check if user already reviewed this seller
      const { data: existingReview } = await supabase
        .from('seller_reviews')
        .select('id')
        .eq('reviewer_id', user.id)
        .eq('seller_id', data.seller_id)
        .maybeSingle();
      
      if (existingReview) {
        throw new Error('Bạn đã đánh giá shop này rồi');
      }
      
      const { data: review, error } = await supabase
        .from('seller_reviews')
        .insert({
          seller_id: data.seller_id,
          product_id: data.product_id,
          rating: data.rating,
          comment: data.comment,
          reviewer_name: data.reviewer_name,
          reviewer_avatar: data.reviewer_avatar,
          reviewer_id: user.id,
          images: data.images || []
        } as any)
        .select()
        .single();
      
      if (error) throw error;
      return review as SellerReview;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['seller-reviews', variables.seller_id] });
      queryClient.invalidateQueries({ queryKey: ['seller'] });
      queryClient.invalidateQueries({ queryKey: ['sellers'] });
    }
  });
};

// Hook to check if user can review a seller
export const useCanReviewSeller = (sellerId: string | undefined) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['can-review-seller', sellerId, user?.id],
    queryFn: async () => {
      if (!user || !sellerId) return { canReview: false, reason: 'not_logged_in' };
      
      // Check if user is the seller (cannot review own shop)
      const { data: seller } = await supabase
        .from('sellers')
        .select('user_id')
        .eq('id', sellerId)
        .single();
      
      if (seller?.user_id === user.id) {
        return { canReview: false, reason: 'own_shop' };
      }
      
      // Check for completed purchase
      const { data: purchases } = await supabase
        .from('seller_orders')
        .select('id')
        .eq('buyer_id', user.id)
        .eq('seller_id', sellerId)
        .eq('status', 'completed')
        .limit(1);
      
      if (!purchases || purchases.length === 0) {
        return { canReview: false, reason: 'no_purchase' };
      }
      
      // Check if already reviewed
      const { data: existingReview } = await supabase
        .from('seller_reviews')
        .select('id')
        .eq('reviewer_id', user.id)
        .eq('seller_id', sellerId)
        .maybeSingle();
      
      if (existingReview) {
        return { canReview: false, reason: 'already_reviewed' };
      }
      
      return { canReview: true, reason: null };
    },
    enabled: !!sellerId && !!user
  });
};

// Hook to get seller orders (as buyer)
export const useMyPurchases = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['my-purchases', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('seller_orders')
        .select('*, product:seller_products(*), seller:sellers(*)')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as (SellerOrder & { product: SellerProduct; seller: Seller })[];
    },
    enabled: !!user
  });
};

// Hook to get seller orders (as seller)
export const useMySellerOrders = () => {
  const { data: seller } = useCurrentSeller();
  
  return useQuery({
    queryKey: ['my-seller-orders', seller?.id],
    queryFn: async () => {
      if (!seller) return [];
      
      const { data, error } = await supabase
        .from('seller_orders')
        .select('*, product:seller_products(*)')
        .eq('seller_id', seller.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as (SellerOrder & { product: SellerProduct })[];
    },
    enabled: !!seller
  });
};

// Hook to create seller order (purchase) - using atomic RPC
export const usePurchaseFromSeller = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ 
      product, 
      platformFeePercent = 5,
      voucherCode,
      discountAmount = 0
    }: { 
      product: SellerProduct; 
      platformFeePercent?: number;
      voucherCode?: string;
      discountAmount?: number;
    }) => {
      if (!user) throw new Error('Not authenticated');
      
      // Use atomic RPC function for safe transaction
      const { data, error } = await supabase.rpc('create_seller_order_with_escrow', {
        p_product_id: product.id,
        p_seller_id: product.seller_id,
        p_amount: product.price,
        p_platform_fee_percent: platformFeePercent,
        p_voucher_code: voucherCode || null,
        p_discount_amount: discountAmount
      });
      
      if (error) throw error;
      
      const result = data as { 
        success: boolean; 
        error?: string; 
        order_id?: string; 
        order_number?: string;
        delivery_content?: string;
      };
      
      if (!result.success) {
        throw new Error(result.error || 'Không thể tạo đơn hàng');
      }
      
      return { 
        id: result.order_id, 
        order_number: result.order_number,
        delivery_content: result.delivery_content 
      } as SellerOrder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-purchases'] });
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['user-balance'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    }
  });
};

// Hook to release seller order escrow manually
export const useReleaseSellerOrderEscrow = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (orderId: string) => {
      const { data, error } = await supabase.rpc('release_seller_order_escrow', {
        p_order_id: orderId
      });
      
      if (error) throw error;
      
      const result = data as { success: boolean; error?: string; amount?: number };
      if (!result.success) {
        throw new Error(result.error || 'Không thể release escrow');
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-orders'] });
      queryClient.invalidateQueries({ queryKey: ['my-purchases'] });
    }
  });
};

// Hook to refund seller order
export const useRefundSellerOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: string; reason?: string }) => {
      const { data, error } = await supabase.rpc('refund_seller_order_to_buyer', {
        p_order_id: orderId,
        p_reason: reason || null
      });
      
      if (error) throw error;
      
      const result = data as { success: boolean; error?: string; amount?: number };
      if (!result.success) {
        throw new Error(result.error || 'Không thể hoàn tiền');
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-orders'] });
      queryClient.invalidateQueries({ queryKey: ['my-purchases'] });
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    }
  });
};

// Hook to deliver order (as seller)
export const useDeliverOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ orderId, deliveryContent }: { orderId: string; deliveryContent: string }) => {
      const { data, error } = await supabase
        .from('seller_orders')
        .update({
          status: 'delivered',
          delivery_content: deliveryContent
        })
        .eq('id', orderId)
        .select()
        .single();
      
      if (error) throw error;
      return data as SellerOrder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-seller-orders'] });
      queryClient.invalidateQueries({ queryKey: ['my-purchases'] });
    }
  });
};

// Hook to refund order (as seller) - uses atomic RPC function
export const useRefundOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: string; reason: string }) => {
      // Use atomic RPC function for safe refund
      const { data, error } = await supabase.rpc('refund_seller_order_to_buyer', {
        p_order_id: orderId,
        p_reason: reason
      });
      
      if (error) throw error;
      
      const result = data as { success: boolean; error?: string; amount?: number };
      if (!result.success) {
        throw new Error(result.error || 'Không thể hoàn tiền');
      }
      
      return { id: orderId, amount: result.amount } as SellerOrder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-seller-orders'] });
      queryClient.invalidateQueries({ queryKey: ['my-purchases'] });
      queryClient.invalidateQueries({ queryKey: ['my-seller-products'] });
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    }
  });
};

// Hook to complete order (as buyer) - uses atomic RPC to release escrow to seller
export const useCompleteOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (orderId: string) => {
      // Use atomic RPC function to release escrow
      const { data, error } = await supabase.rpc('release_seller_order_escrow', {
        p_order_id: orderId
      });
      
      if (error) throw error;
      
      const result = data as { success: boolean; error?: string; amount?: number };
      if (!result.success) {
        throw new Error(result.error || 'Không thể hoàn tất đơn hàng');
      }
      
      return { id: orderId, seller_amount: result.amount } as SellerOrder;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-seller-orders'] });
      queryClient.invalidateQueries({ queryKey: ['my-purchases'] });
      queryClient.invalidateQueries({ queryKey: ['current-seller'] });
      queryClient.invalidateQueries({ queryKey: ['seller-orders'] });
    }
  });
};

// Hook to open dispute
export const useOpenDispute = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: string; reason: string }) => {
      if (!user) throw new Error('Not authenticated');
      
      // Update order status
      const { error: orderError } = await supabase
        .from('seller_orders')
        .update({
          status: 'disputed',
          dispute_status: 'open',
          dispute_reason: reason,
          dispute_opened_at: new Date().toISOString()
        })
        .eq('id', orderId);
      
      if (orderError) throw orderError;
      
      // Create dispute message
      const { error: msgError } = await supabase
        .from('seller_order_disputes')
        .insert({
          order_id: orderId,
          sender_id: user.id,
          sender_type: 'buyer',
          message: reason
        });
      
      if (msgError) throw msgError;
      
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-purchases'] });
      queryClient.invalidateQueries({ queryKey: ['my-seller-orders'] });
      queryClient.invalidateQueries({ queryKey: ['order-disputes'] });
    }
  });
};

// Hook to get disputes for an order
export const useOrderDisputes = (orderId: string | undefined) => {
  return useQuery({
    queryKey: ['order-disputes', orderId],
    queryFn: async () => {
      if (!orderId) return [];
      
      const { data, error } = await supabase
        .from('seller_order_disputes')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as OrderDispute[];
    },
    enabled: !!orderId
  });
};

// Hook to send dispute message
export const useSendDisputeMessage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ orderId, message, senderType }: { 
      orderId: string; 
      message: string; 
      senderType: 'buyer' | 'seller' 
    }) => {
      if (!user) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('seller_order_disputes')
        .insert({
          order_id: orderId,
          sender_id: user.id,
          sender_type: senderType,
          message
        });
      
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-disputes'] });
    }
  });
};

// Hook to withdraw to user balance (instead of bank)
export const useWithdrawToBalance = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ sellerId, amount }: { sellerId: string; amount: number }) => {
      if (!user) throw new Error('Not authenticated');
      
      // Use atomic RPC function
      const { data, error } = await supabase.rpc('withdraw_seller_to_user_balance', {
        p_seller_id: sellerId,
        p_amount: amount
      });

      if (error) throw error;
      
      const result = data as { success: boolean; error?: string };
      if (!result.success) {
        throw new Error(result.error || 'Không thể rút tiền');
      }
      
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-seller'] });
      queryClient.invalidateQueries({ queryKey: ['my-withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['seller-transactions'] });
    }
  });
};


// Hook to get withdrawal requests
export const useMyWithdrawals = () => {
  const { data: seller } = useCurrentSeller();
  
  return useQuery({
    queryKey: ['my-withdrawals', seller?.id],
    queryFn: async () => {
      if (!seller) return [];
      
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('seller_id', seller.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as WithdrawalRequest[];
    },
    enabled: !!seller
  });
};

// Hook to create withdrawal request - uses atomic RPC
export const useCreateWithdrawal = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      seller_id: string;
      amount: number;
      type?: 'normal' | 'fast';
      bank_name?: string;
      bank_account?: string;
      bank_holder?: string;
    }) => {
      const { data: result, error } = await supabase.rpc('create_seller_withdrawal', {
        p_seller_id: data.seller_id,
        p_amount: data.amount,
        p_type: data.type || 'normal',
        p_bank_name: data.bank_name || null,
        p_account_number: data.bank_account || null,
        p_account_holder: data.bank_holder || null
      });
      
      if (error) throw error;
      
      const rpcResult = result as { success: boolean; error?: string; withdrawal_id?: string };
      if (!rpcResult.success) {
        throw new Error(rpcResult.error || 'Không thể tạo yêu cầu rút tiền');
      }
      
      return { id: rpcResult.withdrawal_id } as WithdrawalRequest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['current-seller'] });
    }
  });
};

// Hook to get marketplace categories
export const useMarketplaceCategories = () => {
  return useQuery({
    queryKey: ['marketplace-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketplace_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      
      if (error) throw error;
      return data as MarketplaceCategory[];
    }
  });
};

// Admin hooks
export const useAllSellers = () => {
  return useQuery({
    queryKey: ['all-sellers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sellers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Seller[];
    }
  });
};

export const useAllWithdrawals = () => {
  return useQuery({
    queryKey: ['all-withdrawals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select('*, seller:sellers(*)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as (WithdrawalRequest & { seller: Seller })[];
    }
  });
};

export const useUpdateSellerStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status, admin_notes }: { id: string; status: string; admin_notes?: string }) => {
      const { data, error } = await supabase
        .from('sellers')
        .update({ status, admin_notes })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Seller;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-sellers'] });
    }
  });
};

// Hook to process withdrawal - uses atomic RPC
export const useProcessWithdrawal = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ id, status, admin_notes }: { id: string; status: 'completed' | 'rejected'; admin_notes?: string }) => {
      const { data, error } = await supabase.rpc('process_seller_withdrawal', {
        p_withdrawal_id: id,
        p_status: status,
        p_admin_id: user?.id,
        p_admin_notes: admin_notes || null
      });
      
      if (error) throw error;
      
      const result = data as { success: boolean; error?: string };
      if (!result.success) {
        throw new Error(result.error || 'Không thể xử lý yêu cầu');
      }
      
      return { id, status } as WithdrawalRequest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['all-sellers'] });
      queryClient.invalidateQueries({ queryKey: ['my-withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['current-seller'] });
    }
  });
};

// Hook to request verification
export const useRequestVerification = () => {
  const queryClient = useQueryClient();
  const { data: seller } = useCurrentSeller();
  
  return useMutation({
    mutationFn: async () => {
      if (!seller) throw new Error('Not a seller');
      
      const { error } = await supabase
        .from('sellers')
        .update({
          verification_requested_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', seller.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-seller'] });
    }
  });
};

// Hook to get verification requests (admin)
export const useVerificationRequests = () => {
  return useQuery({
    queryKey: ['verification-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sellers')
        .select('*')
        .not('verification_requested_at', 'is', null)
        .eq('is_verified', false)
        .order('verification_requested_at', { ascending: true });
      
      if (error) throw error;
      return data as Seller[];
    }
  });
};

// Hook to approve/reject verification (admin)
export const useProcessVerification = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ sellerId, approve }: { sellerId: string; approve: boolean }) => {
      const updateData = approve ? {
        is_verified: true,
        verified_at: new Date().toISOString(),
        verified_by: user?.id,
        updated_at: new Date().toISOString()
      } : {
        verification_requested_at: null,
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('sellers')
        .update(updateData)
        .eq('id', sellerId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['verification-requests'] });
      queryClient.invalidateQueries({ queryKey: ['all-sellers'] });
    }
  });
};

// Hook to get all seller orders for admin
export const useAllSellerOrders = () => {
  return useQuery({
    queryKey: ['admin-seller-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seller_orders')
        .select(`
          *,
          product:seller_products(id, title, image_url),
          seller:sellers(id, shop_name, shop_slug)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as (SellerOrder & { product: any; seller: Seller })[];
    }
  });
};

// Hook to get disputed seller orders for admin
export const useDisputedSellerOrders = () => {
  return useQuery({
    queryKey: ['admin-disputed-seller-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seller_orders')
        .select(`
          *,
          product:seller_products(id, title, image_url),
          seller:sellers(id, shop_name, shop_slug)
        `)
        .eq('status', 'disputed')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as (SellerOrder & { product: any; seller: Seller })[];
    }
  });
};

// Hook to resolve seller order dispute - uses atomic RPC
export const useResolveSellerOrderDispute = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ orderId, action, adminNotes }: { orderId: string; action: 'seller' | 'buyer'; adminNotes?: string }) => {
      const { data, error } = await supabase.rpc('resolve_seller_order_dispute', {
        p_order_id: orderId,
        p_action: action,
        p_admin_id: user?.id,
        p_admin_notes: adminNotes || null
      });
      
      if (error) throw error;
      
      const result = data as { success: boolean; error?: string };
      if (!result.success) {
        throw new Error(result.error || 'Không thể xử lý tranh chấp');
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-seller-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-disputed-seller-orders'] });
      queryClient.invalidateQueries({ queryKey: ['my-seller-orders'] });
      queryClient.invalidateQueries({ queryKey: ['my-purchases'] });
      queryClient.invalidateQueries({ queryKey: ['all-sellers'] });
    }
  });
};
