// Hooks for Marketplace - MySQL version
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, rpc, storage } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Seller {
  id: string;
  userId: string;
  shopName: string;
  shopSlug: string;
  shopDescription: string | null;
  shopAvatarUrl: string | null;
  shopBannerUrl: string | null;
  phone: string | null;
  facebookUrl: string | null;
  zaloUrl: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  shopType: 'game_account' | 'design';
  totalSales: number;
  totalRevenue: number;
  ratingAverage: number;
  ratingCount: number;
  trustScore: number;
  balance: number;
  adminNotes: string | null;
  isVerified: boolean;
  isPartner: boolean;
  createdAt: string;
  updatedAt: string;
  // Legacy mappings
  user_id?: string;
  shop_name?: string;
  shop_slug?: string;
  shop_description?: string | null;
  shop_avatar_url?: string | null;
  shop_banner_url?: string | null;
  facebook_url?: string | null;
  zalo_url?: string | null;
  shop_type?: 'game_account' | 'design';
  total_sales?: number;
  total_revenue?: number;
  rating_average?: number;
  rating_count?: number;
  trust_score?: number;
  admin_notes?: string | null;
  is_verified?: boolean;
  is_partner?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SellerProduct {
  id: string;
  sellerId: string;
  title: string;
  description: string | null;
  category: string;
  gameType: string | null;
  price: number;
  originalPrice: number | null;
  images: string[];
  accountData: string | null;
  status: 'available' | 'pending_review' | 'sold' | 'hidden' | 'rejected';
  isFeatured: boolean;
  viewCount: number;
  accountInfo: Record<string, any> | null;
  soldAt: string | null;
  buyerId: string | null;
  orderId: string | null;
  createdAt: string;
  updatedAt: string;
  seller?: Seller;
  // Legacy mappings
  seller_id?: string;
  game_type?: string | null;
  original_price?: number | null;
  account_data?: string | null;
  is_featured?: boolean;
  view_count?: number;
  account_info?: Record<string, any> | null;
  sold_at?: string | null;
  buyer_id?: string | null;
  order_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SellerReview {
  id: string;
  sellerId: string;
  reviewerId: string;
  reviewerName: string | null;
  reviewerAvatar: string | null;
  productId: string | null;
  rating: number;
  comment: string | null;
  sellerReply: string | null;
  sellerReplyAt: string | null;
  createdAt: string;
  // Legacy mappings
  seller_id?: string;
  reviewer_id?: string;
  reviewer_name?: string | null;
  reviewer_avatar?: string | null;
  product_id?: string | null;
  seller_reply?: string | null;
  seller_reply_at?: string | null;
  created_at?: string;
}

export interface SellerOrder {
  id: string;
  orderNumber: string;
  productId: string;
  sellerId: string;
  buyerId: string;
  buyerEmail: string;
  amount: number;
  platformFee: number;
  sellerAmount: number;
  status: 'pending' | 'paid' | 'delivered' | 'completed' | 'disputed' | 'refunded' | 'cancelled';
  deliveryContent: string | null;
  notes: string | null;
  escrowReleaseAt: string | null;
  disputeStatus: 'none' | 'open' | 'resolved_buyer' | 'resolved_seller' | 'auto_released';
  disputeReason: string | null;
  disputeOpenedAt: string | null;
  releasedAt: string | null;
  createdAt: string;
  updatedAt: string;
  product?: SellerProduct;
  seller?: Seller;
  // Legacy mappings
  order_number?: string;
  product_id?: string;
  seller_id?: string;
  buyer_id?: string;
  buyer_email?: string;
  platform_fee?: number;
  seller_amount?: number;
  delivery_content?: string | null;
  escrow_release_at?: string | null;
  dispute_status?: string;
  dispute_reason?: string | null;
  dispute_opened_at?: string | null;
  released_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface WithdrawalRequest {
  id: string;
  sellerId: string;
  amount: number;
  bankName: string;
  bankAccount: string;
  bankHolder: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  adminNotes: string | null;
  processedAt: string | null;
  processedBy: string | null;
  createdAt: string;
  seller?: Seller;
  // Legacy mappings
  seller_id?: string;
  bank_name?: string;
  bank_account?: string;
  bank_holder?: string;
  admin_notes?: string | null;
  processed_at?: string | null;
  processed_by?: string | null;
  created_at?: string;
}

// Map seller to legacy format
const mapSellerToLegacy = (s: any): Seller => ({
  ...s,
  user_id: s.userId,
  shop_name: s.shopName,
  shop_slug: s.shopSlug,
  shop_description: s.shopDescription,
  shop_avatar_url: s.shopAvatarUrl,
  shop_banner_url: s.shopBannerUrl,
  facebook_url: s.facebookUrl,
  zalo_url: s.zaloUrl,
  shop_type: s.shopType,
  total_sales: s.totalSales,
  total_revenue: s.totalRevenue,
  rating_average: s.ratingAverage,
  rating_count: s.ratingCount,
  trust_score: s.trustScore,
  admin_notes: s.adminNotes,
  is_verified: s.isVerified,
  is_partner: s.isPartner,
  created_at: s.createdAt,
  updated_at: s.updatedAt,
});

// Map product to legacy format
const mapProductToLegacy = (p: any): SellerProduct => ({
  ...p,
  seller_id: p.sellerId,
  game_type: p.gameType,
  original_price: p.originalPrice,
  account_data: p.accountData,
  is_featured: p.isFeatured,
  view_count: p.viewCount,
  account_info: p.accountInfo,
  sold_at: p.soldAt,
  buyer_id: p.buyerId,
  order_id: p.orderId,
  created_at: p.createdAt,
  updated_at: p.updatedAt,
  seller: p.seller ? mapSellerToLegacy(p.seller) : undefined,
});

// Map order to legacy format
const mapOrderToLegacy = (o: any): SellerOrder => ({
  ...o,
  order_number: o.orderNumber,
  product_id: o.productId,
  seller_id: o.sellerId,
  buyer_id: o.buyerId,
  buyer_email: o.buyerEmail,
  platform_fee: o.platformFee,
  seller_amount: o.sellerAmount,
  delivery_content: o.deliveryContent,
  escrow_release_at: o.escrowReleaseAt,
  dispute_status: o.disputeStatus,
  dispute_reason: o.disputeReason,
  dispute_opened_at: o.disputeOpenedAt,
  released_at: o.releasedAt,
  created_at: o.createdAt,
  updated_at: o.updatedAt,
  product: o.product ? mapProductToLegacy(o.product) : undefined,
  seller: o.seller ? mapSellerToLegacy(o.seller) : undefined,
});

// Map review to legacy format
const mapReviewToLegacy = (r: any): SellerReview => ({
  ...r,
  seller_id: r.sellerId,
  reviewer_id: r.reviewerId,
  reviewer_name: r.reviewerName,
  reviewer_avatar: r.reviewerAvatar,
  product_id: r.productId,
  seller_reply: r.sellerReply,
  seller_reply_at: r.sellerReplyAt,
  created_at: r.createdAt,
});

// Hook to get current user's seller profile
export const useCurrentSeller = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['current-seller', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await db
        .from<any>('sellers')
        .select('*')
        .eq('userId', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data ? mapSellerToLegacy(data) : null;
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
      
      const { data, error } = await db
        .from<any>('sellers')
        .select('*')
        .eq('shopSlug', slug)
        .eq('status', 'approved')
        .single();
      
      if (error) throw error;
      return mapSellerToLegacy(data);
    },
    enabled: !!slug
  });
};

// Hook to get all approved sellers
export const useApprovedSellers = () => {
  return useQuery({
    queryKey: ['approved-sellers'],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('sellers')
        .select('*')
        .eq('status', 'approved')
        .order('totalSales', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(mapSellerToLegacy);
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
      
      const { data: seller, error } = await db
        .from<any>('sellers')
        .insert({
          userId: user.id,
          shopName: data.shop_name,
          shopSlug: data.shop_slug,
          shopDescription: data.shop_description,
          shopType: data.shop_type || 'game_account',
          phone: data.phone,
          facebookUrl: data.facebook_url,
          zaloUrl: data.zalo_url,
          status: 'pending',
        })
        .select('*')
        .single();
      
      if (error) throw error;
      return mapSellerToLegacy(seller);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-seller'] });
      toast.success('Đã đăng ký shop thành công');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

// Hook to update seller profile
export const useUpdateSeller = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Seller> & { id: string }) => {
      const updateData: any = {};
      
      if (data.shopName || data.shop_name) updateData.shopName = data.shopName || data.shop_name;
      if (data.shopDescription !== undefined || data.shop_description !== undefined) {
        updateData.shopDescription = data.shopDescription ?? data.shop_description;
      }
      if (data.shopAvatarUrl || data.shop_avatar_url) {
        updateData.shopAvatarUrl = data.shopAvatarUrl || data.shop_avatar_url;
      }
      if (data.shopBannerUrl || data.shop_banner_url) {
        updateData.shopBannerUrl = data.shopBannerUrl || data.shop_banner_url;
      }
      if (data.phone !== undefined) updateData.phone = data.phone;
      if (data.facebookUrl !== undefined || data.facebook_url !== undefined) {
        updateData.facebookUrl = data.facebookUrl ?? data.facebook_url;
      }
      if (data.zaloUrl !== undefined || data.zalo_url !== undefined) {
        updateData.zaloUrl = data.zaloUrl ?? data.zalo_url;
      }
      if (data.status !== undefined) updateData.status = data.status;
      
      const { data: seller, error } = await db
        .from<any>('sellers')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single();
      
      if (error) throw error;
      return mapSellerToLegacy(seller);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-seller'] });
      queryClient.invalidateQueries({ queryKey: ['seller'] });
      toast.success('Đã cập nhật shop');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

// Hook to get seller products
export const useSellerProducts = (sellerId?: string) => {
  return useQuery({
    queryKey: ['seller-products', sellerId],
    queryFn: async () => {
      let url = '/db/query/seller_products?status=available&_order=createdAt.desc';
      if (sellerId) {
        url += `&sellerId=${sellerId}`;
      }
      
      const { data, error } = await db
        .from<any>('seller_products')
        .select('*')
        .eq('status', 'available')
        .order('createdAt', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(mapProductToLegacy);
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
      
      const { data, error } = await db
        .from<any>('seller_products')
        .select('*')
        .eq('sellerId', seller.id)
        .order('createdAt', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(mapProductToLegacy);
    },
    enabled: !!seller
  });
};

// Hook to create seller product
export const useCreateSellerProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      seller_id: string;
      title: string;
      description?: string;
      category: string;
      game_type?: string;
      price: number;
      original_price?: number;
      images?: string[];
      account_data?: string;
      status?: string;
      is_featured?: boolean;
      account_info?: Record<string, any>;
    }) => {
      const { data: product, error } = await db
        .from<any>('seller_products')
        .insert({
          sellerId: data.seller_id,
          title: data.title,
          description: data.description,
          category: data.category,
          gameType: data.game_type,
          price: data.price,
          originalPrice: data.original_price,
          images: data.images || [],
          accountData: data.account_data,
          status: data.status || 'available',
          isFeatured: data.is_featured || false,
          accountInfo: data.account_info,
        })
        .select('*')
        .single();
      
      if (error) throw error;
      return mapProductToLegacy(product);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
      queryClient.invalidateQueries({ queryKey: ['my-seller-products'] });
      toast.success('Đã thêm sản phẩm');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

// Hook to update seller product
export const useUpdateSellerProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<SellerProduct> & { id: string }) => {
      const updateData: any = {};
      
      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.price !== undefined) updateData.price = data.price;
      if (data.originalPrice !== undefined || data.original_price !== undefined) {
        updateData.originalPrice = data.originalPrice ?? data.original_price;
      }
      if (data.images !== undefined) updateData.images = data.images;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.isFeatured !== undefined || data.is_featured !== undefined) {
        updateData.isFeatured = data.isFeatured ?? data.is_featured;
      }
      if (data.accountData !== undefined || data.account_data !== undefined) {
        updateData.accountData = data.accountData ?? data.account_data;
      }
      if (data.accountInfo !== undefined || data.account_info !== undefined) {
        updateData.accountInfo = data.accountInfo ?? data.account_info;
      }
      
      const { data: product, error } = await db
        .from<any>('seller_products')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single();
      
      if (error) throw error;
      return mapProductToLegacy(product);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
      queryClient.invalidateQueries({ queryKey: ['my-seller-products'] });
      toast.success('Đã cập nhật sản phẩm');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

// Hook to delete seller product
export const useDeleteSellerProduct = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('seller_products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
      queryClient.invalidateQueries({ queryKey: ['my-seller-products'] });
      toast.success('Đã xóa sản phẩm');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

// Hook to get seller reviews
export const useSellerReviews = (sellerId?: string) => {
  return useQuery({
    queryKey: ['seller-reviews', sellerId],
    queryFn: async () => {
      if (!sellerId) return [];
      
      const { data, error } = await db
        .from<any>('seller_reviews')
        .select('*')
        .eq('sellerId', sellerId)
        .order('createdAt', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(mapReviewToLegacy);
    },
    enabled: !!sellerId
  });
};

// Hook to create seller review
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
    }) => {
      if (!user) throw new Error('Vui lòng đăng nhập để đánh giá');
      
      const { data: review, error } = await db
        .from<any>('seller_reviews')
        .insert({
          sellerId: data.seller_id,
          productId: data.product_id,
          reviewerId: user.id,
          reviewerName: data.reviewer_name,
          reviewerAvatar: data.reviewer_avatar,
          rating: data.rating,
          comment: data.comment,
        })
        .select('*')
        .single();
      
      if (error) throw error;
      return mapReviewToLegacy(review);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['seller-reviews', variables.seller_id] });
      queryClient.invalidateQueries({ queryKey: ['seller'] });
      toast.success('Đã gửi đánh giá');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

// Hook to get my purchases
export const useMyPurchases = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['my-purchases', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await db
        .from<any>('seller_orders')
        .select('*')
        .eq('buyerId', user.id)
        .order('createdAt', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(mapOrderToLegacy);
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
      
      const { data, error } = await db
        .from<any>('seller_orders')
        .select('*')
        .eq('sellerId', seller.id)
        .order('createdAt', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(mapOrderToLegacy);
    },
    enabled: !!seller
  });
};

// Hook to purchase from seller
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
      
      const { data, error } = await rpc.invoke<{ 
        success: boolean; 
        error?: string; 
        order_id?: string; 
        order_number?: string;
        delivery_content?: string;
      }>('create_seller_order_with_escrow', {
        product_id: product.id,
        seller_id: product.sellerId || product.seller_id,
        amount: product.price,
        platform_fee_percent: platformFeePercent,
        voucher_code: voucherCode || null,
        discount_amount: discountAmount
      });
      
      if (error) throw error;
      
      if (!data?.success) {
        throw new Error(data?.error || 'Không thể tạo đơn hàng');
      }
      
      return { 
        id: data.order_id, 
        order_number: data.order_number,
        delivery_content: data.delivery_content 
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-purchases'] });
      queryClient.invalidateQueries({ queryKey: ['seller-products'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      toast.success('Đã mua hàng thành công');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

// Hook to request withdrawal
export const useRequestWithdrawal = () => {
  const queryClient = useQueryClient();
  const { data: seller } = useCurrentSeller();
  
  return useMutation({
    mutationFn: async (data: {
      amount: number;
      bank_name: string;
      bank_account: string;
      bank_holder: string;
    }) => {
      if (!seller) throw new Error('Not a seller');
      
      const { data: withdrawal, error } = await db
        .from('withdrawal_requests')
        .insert({
          sellerId: seller.id,
          amount: data.amount,
          bankName: data.bank_name,
          bankAccount: data.bank_account,
          bankHolder: data.bank_holder,
          status: 'pending',
        })
        .select('*')
        .single();
      
      if (error) throw error;
      return withdrawal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['withdrawal-requests'] });
      queryClient.invalidateQueries({ queryKey: ['current-seller'] });
      toast.success('Đã gửi yêu cầu rút tiền');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

// Hook to get withdrawal requests
export const useWithdrawalRequests = () => {
  const { data: seller } = useCurrentSeller();
  
  return useQuery({
    queryKey: ['withdrawal-requests', seller?.id],
    queryFn: async () => {
      if (!seller) return [];
      
      const { data, error } = await db
        .from<any>('withdrawal_requests')
        .select('*')
        .eq('sellerId', seller.id)
        .order('createdAt', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map((r: any) => ({
        ...r,
        seller_id: r.sellerId,
        bank_name: r.bankName,
        bank_account: r.bankAccount,
        bank_holder: r.bankHolder,
        admin_notes: r.adminNotes,
        processed_at: r.processedAt,
        processed_by: r.processedBy,
        created_at: r.createdAt,
      }));
    },
    enabled: !!seller
  });
};

// Hook to get marketplace categories
export const useMarketplaceCategories = () => {
  return useQuery({
    queryKey: ['marketplace-categories'],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('marketplace_categories')
        .select('*')
        .eq('isActive', true)
        .order('sortOrder', { ascending: true });
      
      if (error) throw error;
      
      return (data || []).map((c: any) => ({
        ...c,
        image_url: c.imageUrl,
        is_active: c.isActive,
        sort_order: c.sortOrder,
      }));
    }
  });
};
