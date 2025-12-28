import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Use shared Category from categories table with style = 'design'
export interface DesignCategory {
  id: string;
  name: string;
  name_en: string | null;
  slug: string;
  description: string | null;
  description_en: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  style: string;
  created_at: string;
  updated_at: string;
}

export interface DesignService {
  id: string;
  seller_id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  delivery_days: number;
  revision_count: number;
  delivery_formats: string[];
  portfolio_images: string[] | null;
  is_active: boolean;
  total_orders: number;
  completed_orders: number;
  on_time_rate: number;
  average_rating: number;
  rating_count: number;
  // Pricing is now at shop level (sellers table), not per-service
  created_at: string;
  updated_at: string;
  seller?: {
    id: string;
    shop_name: string;
    shop_slug: string;
    shop_avatar_url: string | null;
    trust_score: number;
    rating_average: number;
    user_id?: string;
    is_verified?: boolean;
    is_partner?: boolean;
    // Shop-level pricing settings
    design_rush_delivery_fee?: number;
    design_extra_revision_price?: number;
    design_commercial_license_price?: number;
    design_exclusive_license_price?: number;
  };
  category?: DesignCategory;
  license_prices?: DesignServiceLicensePrice[];
}

export interface DesignServiceLicensePrice {
  id: string;
  service_id: string;
  license_type_id: string;
  price: number;
  is_enabled: boolean;
}

export interface DesignOrderService {
  id: string;
  name: string;
  price?: number;
  delivery_days?: number;
  revision_count?: number;
  seller_id?: string;
  category_id?: string;
  description?: string | null;
  delivery_formats?: string[];
  portfolio_images?: string[] | null;
  is_active?: boolean;
  total_orders?: number;
  completed_orders?: number;
  on_time_rate?: number;
  average_rating?: number;
  rating_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface DesignOrder {
  id: string;
  order_number: string;
  service_id: string;
  seller_id: string;
  buyer_id: string;
  amount: number;
  platform_fee_rate: number;
  platform_fee: number;
  seller_amount: number;
  status: string;
  escrow_status: string;
  escrow_release_at: string | null;
  deadline: string | null;
  completed_at: string | null;
  disputed_at: string | null;
  dispute_reason: string | null;
  dispute_resolved_at: string | null;
  dispute_resolution: string | null;
  buyer_confirmed: boolean;
  seller_confirmed: boolean;
  requirement_text: string | null;
  requirement_colors: string | null;
  requirement_style: string | null;
  requirement_size: string | null;
  requirement_purpose: string | null;
  requirement_notes: string | null;
  reference_files: string[] | null;
  final_files: string[] | null;
  delivery_notes: string | null;
  revision_used: number;
  created_at: string;
  updated_at: string;
  // New fields from advanced features
  accept_deadline?: string | null;
  draft_deadline?: string | null;
  final_deadline?: string | null;
  late_count?: number;
  late_penalty_applied?: boolean;
  is_milestone_order?: boolean;
  current_milestone?: string;
  auto_matched?: boolean;
  match_score?: number | null;
  license_type_id?: string | null;
  license_price_multiplier?: number;
  requires_nda?: boolean;
  no_portfolio_use?: boolean;
  nda_fee?: number;
  base_revisions?: number;
  extra_revisions_purchased?: number;
  revisions_used?: number;
  revision_price?: number;
  template_id?: string | null;
  form_data?: any;
  service?: DesignOrderService;
  seller?: {
    id: string;
    shop_name: string;
    shop_slug: string;
    shop_avatar_url: string | null;
    user_id?: string;
  };
  buyer?: {
    id: string;
    full_name: string;
    username: string;
    avatar_url: string | null;
  };
}

export interface DesignTicket {
  id: string;
  ticket_number: string;
  order_id: string;
  status: string;
  revision_requested: number;
  admin_involved: boolean;
  admin_id: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  order?: DesignOrder;
}

export interface DesignTicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_type: string;
  message: string;
  attachments: any;
  is_delivery: boolean;
  is_revision_request: boolean;
  created_at: string;
  sender?: {
    id: string;
    full_name: string;
    username: string;
    avatar_url: string | null;
  };
}

// Categories - use shared categories table with style = 'design'
export const useDesignCategories = () => {
  return useQuery({
    queryKey: ['design-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('style', 'design')
        .eq('is_active', true)
        .order('sort_order');
      
      if (error) throw error;
      return data as DesignCategory[];
    },
  });
};

// Services
export const useDesignServices = (categoryId?: string) => {
  return useQuery({
    queryKey: ['design-services', categoryId],
    queryFn: async () => {
      let query = supabase
        .from('design_services')
        .select(`
          *,
          seller:sellers!design_services_seller_id_fkey(
            id, shop_name, shop_slug, shop_avatar_url, trust_score, rating_average,
            is_verified, is_partner,
            design_rush_delivery_fee, design_extra_revision_price, 
            design_commercial_license_price, design_exclusive_license_price
          ),
          category:categories!design_services_category_id_fkey(*)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as DesignService[];
    },
  });
};

export const useDesignService = (serviceId: string | undefined) => {
  return useQuery({
    queryKey: ['design-service', serviceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('design_services')
        .select(`
          *,
          seller:sellers!design_services_seller_id_fkey(
            id, shop_name, shop_slug, shop_avatar_url, trust_score, rating_average, user_id,
            is_verified, is_partner,
            design_rush_delivery_fee, design_extra_revision_price, 
            design_commercial_license_price, design_exclusive_license_price
          ),
          category:categories!design_services_category_id_fkey(*)
        `)
        .eq('id', serviceId)
        .single();
      
      if (error) throw error;
      return data as DesignService;
    },
    enabled: !!serviceId,
  });
};

// Seller's services
export const useSellerDesignServices = (sellerId: string | undefined) => {
  return useQuery({
    queryKey: ['seller-design-services', sellerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('design_services')
        .select(`
          *,
          seller:sellers!design_services_seller_id_fkey(
            id, shop_name, shop_slug, shop_avatar_url, trust_score, rating_average,
            design_rush_delivery_fee, design_extra_revision_price, 
            design_commercial_license_price, design_exclusive_license_price
          ),
          category:categories!design_services_category_id_fkey(*)
        `)
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as DesignService[];
    },
    enabled: !!sellerId,
  });
};

export const useCreateDesignService = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (service: Omit<DesignService, 'id' | 'created_at' | 'updated_at' | 'total_orders' | 'completed_orders' | 'on_time_rate' | 'average_rating' | 'rating_count' | 'seller' | 'category' | 'license_prices'>) => {
      const { data, error } = await supabase
        .from('design_services')
        .insert(service)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['design-services'] });
      queryClient.invalidateQueries({ queryKey: ['seller-design-services'] });
    },
  });
};

export const useUpdateDesignService = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Omit<DesignService, 'seller' | 'category' | 'license_prices'>> & { id: string }) => {
      const { data, error } = await supabase
        .from('design_services')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['design-services'] });
      queryClient.invalidateQueries({ queryKey: ['seller-design-services'] });
    },
  });
};

export const useDeleteDesignService = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('design_services')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['design-services'] });
      queryClient.invalidateQueries({ queryKey: ['seller-design-services'] });
    },
  });
};

// Orders
export const useBuyerDesignOrders = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['buyer-design-orders', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('design_orders')
        .select(`
          *,
          service:design_services!design_orders_service_id_fkey(id, name, price, delivery_days, revision_count),
          seller:sellers!design_orders_seller_id_fkey(id, shop_name, shop_slug, shop_avatar_url)
        `)
        .eq('buyer_id', user!.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as DesignOrder[];
    },
    enabled: !!user,
  });
};

export const useSellerDesignOrders = (sellerId: string | undefined) => {
  return useQuery({
    queryKey: ['seller-design-orders', sellerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('design_orders')
        .select(`
          *,
          service:design_services!design_orders_service_id_fkey(id, name, price, delivery_days, revision_count)
        `)
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as DesignOrder[];
    },
    enabled: !!sellerId,
  });
};

export const useDesignOrder = (orderId: string | undefined) => {
  return useQuery({
    queryKey: ['design-order', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('design_orders')
        .select(`
          *,
          service:design_services!design_orders_service_id_fkey(*),
          seller:sellers!design_orders_seller_id_fkey(
            id, shop_name, shop_slug, shop_avatar_url, user_id,
            design_rush_delivery_fee, design_extra_revision_price,
            design_commercial_license_price, design_exclusive_license_price
          )
        `)
        .eq('id', orderId)
        .maybeSingle();
      
      if (error) throw error;
      return data as DesignOrder | null;
    },
    enabled: !!orderId,
  });
};

export const useCreateDesignOrder = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (orderData: {
      service_id: string;
      seller_id: string;
      amount: number;
      platform_fee_rate: number;
      platform_fee: number;
      seller_amount: number;
      requirement_text?: string;
      requirement_colors?: string;
      requirement_style?: string;
      requirement_size?: string;
      requirement_purpose?: string;
      requirement_notes?: string;
      reference_files?: string[];
      voucher_code?: string | null;
      voucher_discount?: number;
      original_amount?: number;
      license_type_id?: string | null;
    }) => {
      if (!user) throw new Error('Vui lòng đăng nhập');
      
      // Check if user is the seller of this service
      const { data: seller } = await supabase
        .from('sellers')
        .select('user_id')
        .eq('id', orderData.seller_id)
        .single();
      
      if (seller?.user_id === user.id) {
        throw new Error('Bạn không thể đặt dịch vụ của chính mình');
      }
      
      // Use atomic RPC function for safe transaction
      const { data, error } = await supabase.rpc('create_design_order_with_escrow', {
        p_service_id: orderData.service_id,
        p_seller_id: orderData.seller_id,
        p_amount: orderData.amount,
        p_platform_fee_rate: orderData.platform_fee_rate,
        p_platform_fee: orderData.platform_fee,
        p_seller_amount: orderData.seller_amount,
        p_requirement_text: orderData.requirement_text || null,
        p_requirement_colors: orderData.requirement_colors || null,
        p_requirement_style: orderData.requirement_style || null,
        p_requirement_size: orderData.requirement_size || null,
        p_requirement_purpose: orderData.requirement_purpose || null,
        p_requirement_notes: orderData.requirement_notes || null,
        p_reference_files: orderData.reference_files || null,
        p_voucher_code: orderData.voucher_code || null,
        p_voucher_discount: orderData.voucher_discount || 0,
        p_original_amount: orderData.original_amount || null,
        p_license_type_id: orderData.license_type_id || null,
      });
      
      if (error) throw error;
      
      const result = data as { success: boolean; error?: string; order_id?: string; order_number?: string };
      
      if (!result.success) {
        throw new Error(result.error || 'Không thể tạo đơn hàng');
      }
      
      // Return order data for navigation
      return { 
        id: result.order_id, 
        order_number: result.order_number 
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyer-design-orders'] });
      queryClient.invalidateQueries({ queryKey: ['seller-design-orders'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
  });
};

export const useUpdateDesignOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DesignOrder> & { id: string }) => {
      const { data, error } = await supabase
        .from('design_orders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['design-order', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['buyer-design-orders'] });
      queryClient.invalidateQueries({ queryKey: ['seller-design-orders'] });
    },
  });
};

// Cancel order with proper refund
export const useCancelDesignOrder = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: string; reason?: string }) => {
      const { data, error } = await supabase.rpc('cancel_design_order', {
        p_order_id: orderId,
        p_reason: reason || null
      });
      
      if (error) throw error;
      
      const result = data as { success: boolean; error?: string; message?: string };
      if (!result.success) {
        throw new Error(result.error || 'Không thể hủy đơn hàng');
      }
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyer-design-orders'] });
      queryClient.invalidateQueries({ queryKey: ['seller-design-orders'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
  });
};

// Release escrow to seller manually (for edge cases)
export const useReleaseDesignEscrow = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (orderId: string) => {
      const { data, error } = await supabase.rpc('release_design_escrow_to_seller', {
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
      queryClient.invalidateQueries({ queryKey: ['seller-design-orders'] });
      queryClient.invalidateQueries({ queryKey: ['design-order'] });
    },
  });
};

// Confirm order completion (atomic - prevents race conditions)
export const useConfirmDesignOrderCompletion = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ orderId, confirmType }: { orderId: string; confirmType: 'buyer' | 'seller' }) => {
      const { data, error } = await supabase.rpc('confirm_design_order_completion', {
        p_order_id: orderId,
        p_confirm_type: confirmType
      });
      
      if (error) throw error;
      
      const result = data as { 
        success: boolean; 
        error?: string; 
        both_confirmed?: boolean;
        buyer_confirmed?: boolean;
        seller_confirmed?: boolean;
        already_confirmed?: boolean;
        status?: string;
        escrow_release_at?: string;
      };
      
      if (!result.success) {
        throw new Error(result.error || 'Không thể xác nhận đơn hàng');
      }
      
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['design-order', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['buyer-design-orders'] });
      queryClient.invalidateQueries({ queryKey: ['seller-design-orders'] });
      queryClient.invalidateQueries({ queryKey: ['design-ticket'] });
    },
  });
};

// Tickets
export const useDesignTicket = (orderId: string | undefined) => {
  return useQuery({
    queryKey: ['design-ticket', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('design_tickets')
        .select('*')
        .eq('order_id', orderId)
        .maybeSingle();
      
      if (error) throw error;
      return data as DesignTicket | null;
    },
    enabled: !!orderId,
  });
};

export const useDesignTicketMessages = (ticketId: string | undefined) => {
  return useQuery({
    queryKey: ['design-ticket-messages', ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('design_ticket_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data as DesignTicketMessage[];
    },
    enabled: !!ticketId,
  });
};

export const useSendDesignTicketMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (message: Omit<DesignTicketMessage, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('design_ticket_messages')
        .insert(message)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['design-ticket-messages', variables.ticket_id] });
    },
  });
};

export const useUpdateDesignTicket = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DesignTicket> & { id: string }) => {
      const { data, error } = await supabase
        .from('design_tickets')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['design-ticket'] });
    },
  });
};

// Reviews
export const useDesignServiceReviews = (serviceId: string | undefined) => {
  return useQuery({
    queryKey: ['design-service-reviews', serviceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('design_service_reviews')
        .select('*')
        .eq('service_id', serviceId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!serviceId,
  });
};

export const useCreateDesignReview = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (review: {
      order_id: string;
      service_id: string;
      seller_id: string;
      rating: number;
      comment?: string;
      on_time?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('design_service_reviews')
        .insert({
          ...review,
          buyer_id: user!.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['design-service-reviews', variables.service_id] });
      queryClient.invalidateQueries({ queryKey: ['design-services'] });
    },
  });
};

// Design Managers
export const useDesignManagers = () => {
  return useQuery({
    queryKey: ['design-managers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('design_managers')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
};

export const useIsDesignManager = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['is-design-manager', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('design_managers')
        .select('*')
        .eq('user_id', user!.id)
        .eq('is_active', true)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    },
    enabled: !!user,
  });
};

export const useAddDesignManager = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (manager: { user_id: string; full_name?: string; permissions?: any }) => {
      const { data, error } = await supabase
        .from('design_managers')
        .insert({
          ...manager,
          added_by: user!.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['design-managers'] });
    },
  });
};

export const useRemoveDesignManager = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('design_managers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['design-managers'] });
    },
  });
};

// Admin: All design orders
export const useAllDesignOrders = () => {
  return useQuery({
    queryKey: ['all-design-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('design_orders')
        .select(`
          *,
          service:design_services!design_orders_service_id_fkey(id, name),
          seller:sellers!design_orders_seller_id_fkey(id, shop_name, shop_slug, shop_avatar_url)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as unknown as DesignOrder[];
    },
  });
};

// Admin: All design categories
export const useAllDesignCategories = () => {
  return useQuery({
    queryKey: ['all-design-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('design_categories')
        .select('*')
        .order('sort_order');
      
      if (error) throw error;
      return data as DesignCategory[];
    },
  });
};

export const useCreateDesignCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (category: Omit<DesignCategory, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('design_categories')
        .insert(category)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['design-categories'] });
      queryClient.invalidateQueries({ queryKey: ['all-design-categories'] });
    },
  });
};

export const useUpdateDesignCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DesignCategory> & { id: string }) => {
      const { data, error } = await supabase
        .from('design_categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['design-categories'] });
      queryClient.invalidateQueries({ queryKey: ['all-design-categories'] });
    },
  });
};

export const useDeleteDesignCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('design_categories')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['design-categories'] });
      queryClient.invalidateQueries({ queryKey: ['all-design-categories'] });
    },
  });
};
