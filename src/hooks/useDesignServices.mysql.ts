// Hooks for Design Services - MySQL version
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, rpc } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

// Use shared Category from categories table with style = 'design'
export interface DesignCategory {
  id: string;
  name: string;
  nameEn: string | null;
  slug: string;
  description: string | null;
  descriptionEn: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  style: string;
  createdAt: string;
  updatedAt: string;
  // Legacy mappings
  name_en?: string | null;
  description_en?: string | null;
  image_url?: string | null;
  sort_order?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DesignService {
  id: string;
  sellerId: string;
  categoryId: string;
  name: string;
  description: string | null;
  price: number;
  deliveryDays: number;
  revisionCount: number;
  deliveryFormats: string[];
  portfolioImages: string[] | null;
  isActive: boolean;
  totalOrders: number;
  completedOrders: number;
  onTimeRate: number;
  averageRating: number;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
  seller?: any;
  category?: DesignCategory;
  // Legacy mappings
  seller_id?: string;
  category_id?: string;
  delivery_days?: number;
  revision_count?: number;
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
  orderNumber: string;
  serviceId: string;
  sellerId: string;
  buyerId: string;
  amount: number;
  platformFeeRate: number;
  platformFee: number;
  sellerAmount: number;
  status: string;
  escrowStatus: string;
  escrowReleaseAt: string | null;
  deadline: string | null;
  completedAt: string | null;
  disputedAt: string | null;
  disputeReason: string | null;
  disputeResolvedAt: string | null;
  disputeResolution: string | null;
  buyerConfirmed: boolean;
  sellerConfirmed: boolean;
  requirementText: string | null;
  requirementColors: string | null;
  requirementStyle: string | null;
  requirementSize: string | null;
  requirementPurpose: string | null;
  requirementNotes: string | null;
  referenceFiles: string[] | null;
  finalFiles: string[] | null;
  deliveryNotes: string | null;
  revisionUsed: number;
  createdAt: string;
  updatedAt: string;
  service?: any;
  seller?: any;
  buyer?: any;
  // Legacy mappings
  order_number?: string;
  service_id?: string;
  seller_id?: string;
  buyer_id?: string;
  platform_fee_rate?: number;
  platform_fee?: number;
  seller_amount?: number;
  escrow_status?: string;
  escrow_release_at?: string | null;
  completed_at?: string | null;
  disputed_at?: string | null;
  dispute_reason?: string | null;
  dispute_resolved_at?: string | null;
  dispute_resolution?: string | null;
  buyer_confirmed?: boolean;
  seller_confirmed?: boolean;
  requirement_text?: string | null;
  requirement_colors?: string | null;
  requirement_style?: string | null;
  requirement_size?: string | null;
  requirement_purpose?: string | null;
  requirement_notes?: string | null;
  reference_files?: string[] | null;
  final_files?: string[] | null;
  delivery_notes?: string | null;
  revision_used?: number;
  created_at?: string;
  updated_at?: string;
}

export interface DesignTicket {
  id: string;
  ticketNumber: string;
  orderId: string;
  status: string;
  revisionRequested: number;
  adminInvolved: boolean;
  adminId: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  order?: DesignOrder;
  // Legacy mappings
  ticket_number?: string;
  order_id?: string;
  revision_requested?: number;
  admin_involved?: boolean;
  admin_id?: string | null;
  closed_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DesignTicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderType: string;
  message: string;
  attachments: any;
  isDelivery: boolean;
  isRevisionRequest: boolean;
  createdAt: string;
  sender?: any;
  // Legacy mappings
  ticket_id?: string;
  sender_id?: string;
  sender_type?: string;
  is_delivery?: boolean;
  is_revision_request?: boolean;
  created_at?: string;
}

// Mappers
const mapCategoryToLegacy = (c: any): DesignCategory => ({
  ...c,
  name_en: c.nameEn,
  description_en: c.descriptionEn,
  image_url: c.imageUrl,
  sort_order: c.sortOrder,
  is_active: c.isActive,
  created_at: c.createdAt,
  updated_at: c.updatedAt,
});

const mapServiceToLegacy = (s: any): DesignService => ({
  ...s,
  seller_id: s.sellerId,
  category_id: s.categoryId,
  delivery_days: s.deliveryDays,
  revision_count: s.revisionCount,
  delivery_formats: s.deliveryFormats,
  portfolio_images: s.portfolioImages,
  is_active: s.isActive,
  total_orders: s.totalOrders,
  completed_orders: s.completedOrders,
  on_time_rate: s.onTimeRate,
  average_rating: s.averageRating,
  rating_count: s.ratingCount,
  created_at: s.createdAt,
  updated_at: s.updatedAt,
  category: s.category ? mapCategoryToLegacy(s.category) : undefined,
});

const mapOrderToLegacy = (o: any): DesignOrder => ({
  ...o,
  order_number: o.orderNumber,
  service_id: o.serviceId,
  seller_id: o.sellerId,
  buyer_id: o.buyerId,
  platform_fee_rate: o.platformFeeRate,
  platform_fee: o.platformFee,
  seller_amount: o.sellerAmount,
  escrow_status: o.escrowStatus,
  escrow_release_at: o.escrowReleaseAt,
  completed_at: o.completedAt,
  disputed_at: o.disputedAt,
  dispute_reason: o.disputeReason,
  dispute_resolved_at: o.disputeResolvedAt,
  dispute_resolution: o.disputeResolution,
  buyer_confirmed: o.buyerConfirmed,
  seller_confirmed: o.sellerConfirmed,
  requirement_text: o.requirementText,
  requirement_colors: o.requirementColors,
  requirement_style: o.requirementStyle,
  requirement_size: o.requirementSize,
  requirement_purpose: o.requirementPurpose,
  requirement_notes: o.requirementNotes,
  reference_files: o.referenceFiles,
  final_files: o.finalFiles,
  delivery_notes: o.deliveryNotes,
  revision_used: o.revisionUsed,
  created_at: o.createdAt,
  updated_at: o.updatedAt,
});

const mapTicketToLegacy = (t: any): DesignTicket => ({
  ...t,
  ticket_number: t.ticketNumber,
  order_id: t.orderId,
  revision_requested: t.revisionRequested,
  admin_involved: t.adminInvolved,
  admin_id: t.adminId,
  closed_at: t.closedAt,
  created_at: t.createdAt,
  updated_at: t.updatedAt,
});

const mapMessageToLegacy = (m: any): DesignTicketMessage => ({
  ...m,
  ticket_id: m.ticketId,
  sender_id: m.senderId,
  sender_type: m.senderType,
  is_delivery: m.isDelivery,
  is_revision_request: m.isRevisionRequest,
  created_at: m.createdAt,
});

// Categories - use shared categories table with style = 'design'
export const useDesignCategories = () => {
  return useQuery({
    queryKey: ['design-categories'],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('categories')
        .select('*')
        .eq('style', 'design')
        .eq('isActive', true)
        .order('sortOrder');

      if (error) throw error;
      return (data || []).map(mapCategoryToLegacy) as DesignCategory[];
    },
  });
};

// Services
export const useDesignServices = (categoryId?: string) => {
  return useQuery({
    queryKey: ['design-services', categoryId],
    queryFn: async () => {
      let query = db
        .from<any>('design_services')
        .select('*, seller:sellers(*), category:categories(*)')
        .eq('isActive', true)
        .order('createdAt', { ascending: false });

      if (categoryId) {
        query = query.eq('categoryId', categoryId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(mapServiceToLegacy) as DesignService[];
    },
  });
};

export const useDesignService = (serviceId: string | undefined) => {
  return useQuery({
    queryKey: ['design-service', serviceId],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('design_services')
        .select('*, seller:sellers(*), category:categories(*)')
        .eq('id', serviceId)
        .single();

      if (error) throw error;
      return mapServiceToLegacy(data) as DesignService;
    },
    enabled: !!serviceId,
  });
};

// Seller's services
export const useSellerDesignServices = (sellerId: string | undefined) => {
  return useQuery({
    queryKey: ['seller-design-services', sellerId],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('design_services')
        .select('*, seller:sellers(*), category:categories(*)')
        .eq('sellerId', sellerId)
        .order('createdAt', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapServiceToLegacy) as DesignService[];
    },
    enabled: !!sellerId,
  });
};

export const useCreateDesignService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (service: any) => {
      const { data, error } = await db
        .from('design_services')
        .insert({
          sellerId: service.seller_id,
          categoryId: service.category_id,
          name: service.name,
          description: service.description,
          price: service.price,
          deliveryDays: service.delivery_days,
          revisionCount: service.revision_count,
          deliveryFormats: service.delivery_formats,
          portfolioImages: service.portfolio_images,
          isActive: service.is_active ?? true,
        })
        .select()
        .single();

      if (error) throw error;
      return mapServiceToLegacy(data);
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
    mutationFn: async ({ id, ...updates }: any) => {
      const mappedUpdates: any = {};
      if (updates.category_id) mappedUpdates.categoryId = updates.category_id;
      if (updates.name) mappedUpdates.name = updates.name;
      if (updates.description !== undefined) mappedUpdates.description = updates.description;
      if (updates.price !== undefined) mappedUpdates.price = updates.price;
      if (updates.delivery_days !== undefined) mappedUpdates.deliveryDays = updates.delivery_days;
      if (updates.revision_count !== undefined) mappedUpdates.revisionCount = updates.revision_count;
      if (updates.delivery_formats) mappedUpdates.deliveryFormats = updates.delivery_formats;
      if (updates.portfolio_images) mappedUpdates.portfolioImages = updates.portfolio_images;
      if (updates.is_active !== undefined) mappedUpdates.isActive = updates.is_active;

      const { data, error } = await db
        .from('design_services')
        .update(mappedUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapServiceToLegacy(data);
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
      const { error } = await db
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
      const { data, error } = await db
        .from<any>('design_orders')
        .select('*, service:design_services(id, name, price, deliveryDays, revisionCount), seller:sellers(id, shopName, shopSlug, shopAvatarUrl)')
        .eq('buyerId', user!.id)
        .order('createdAt', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapOrderToLegacy) as DesignOrder[];
    },
    enabled: !!user,
  });
};

export const useSellerDesignOrders = (sellerId: string | undefined) => {
  return useQuery({
    queryKey: ['seller-design-orders', sellerId],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('design_orders')
        .select('*, service:design_services(id, name, price, deliveryDays, revisionCount)')
        .eq('sellerId', sellerId)
        .order('createdAt', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapOrderToLegacy) as DesignOrder[];
    },
    enabled: !!sellerId,
  });
};

export const useDesignOrder = (orderId: string | undefined) => {
  return useQuery({
    queryKey: ['design-order', orderId],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('design_orders')
        .select('*, service:design_services(*), seller:sellers(*)')
        .eq('id', orderId)
        .single();

      if (error) return null;
      return mapOrderToLegacy(data) as DesignOrder;
    },
    enabled: !!orderId,
  });
};

export const useCreateDesignOrder = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (orderData: any) => {
      if (!user) throw new Error('Vui lòng đăng nhập');

      // Check if user is the seller of this service
      const { data: seller } = await db
        .from<any>('sellers')
        .select('userId')
        .eq('id', orderData.seller_id)
        .single();

      if (seller?.userId === user.id) {
        throw new Error('Bạn không thể đặt dịch vụ của chính mình');
      }

      // Use RPC function for safe transaction
      const result = await rpc('create_design_order_with_escrow', {
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

      if (!result.success) {
        throw new Error(result.error || 'Không thể tạo đơn hàng');
      }

      return { id: result.order_id, order_number: result.order_number };
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
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await db
        .from('design_orders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapOrderToLegacy(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['design-order', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['buyer-design-orders'] });
      queryClient.invalidateQueries({ queryKey: ['seller-design-orders'] });
    },
  });
};

export const useCancelDesignOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: string; reason?: string }) => {
      const result = await rpc('cancel_design_order', {
        p_order_id: orderId,
        p_reason: reason || null,
      });

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

export const useReleaseDesignEscrow = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      const result = await rpc('release_design_escrow_to_seller', {
        p_order_id: orderId,
      });

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

export const useConfirmDesignOrderCompletion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, confirmType }: { orderId: string; confirmType: 'buyer' | 'seller' }) => {
      const result = await rpc('confirm_design_order_completion', {
        p_order_id: orderId,
        p_confirm_type: confirmType,
      });

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
      const { data, error } = await db
        .from<any>('design_tickets')
        .select('*')
        .eq('orderId', orderId)
        .single();

      if (error) return null;
      return mapTicketToLegacy(data) as DesignTicket;
    },
    enabled: !!orderId,
  });
};

export const useDesignTicketMessages = (ticketId: string | undefined) => {
  return useQuery({
    queryKey: ['design-ticket-messages', ticketId],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('design_ticket_messages')
        .select('*')
        .eq('ticketId', ticketId)
        .order('createdAt', { ascending: true });

      if (error) throw error;
      return (data || []).map(mapMessageToLegacy) as DesignTicketMessage[];
    },
    enabled: !!ticketId,
  });
};

export const useSendDesignTicketMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (message: any) => {
      const { data, error } = await db
        .from('design_ticket_messages')
        .insert({
          ticketId: message.ticket_id,
          senderId: message.sender_id,
          senderType: message.sender_type,
          message: message.message,
          attachments: message.attachments,
          isDelivery: message.is_delivery,
          isRevisionRequest: message.is_revision_request,
        })
        .select()
        .single();

      if (error) throw error;
      return mapMessageToLegacy(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['design-ticket-messages', variables.ticket_id] });
    },
  });
};

export const useUpdateDesignTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { data, error } = await db
        .from('design_tickets')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapTicketToLegacy(data);
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
      const { data, error } = await db
        .from<any>('design_service_reviews')
        .select('*')
        .eq('serviceId', serviceId)
        .order('createdAt', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!serviceId,
  });
};

export const useCreateDesignReview = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (review: any) => {
      const { data, error } = await db
        .from('design_service_reviews')
        .insert({
          orderId: review.order_id,
          serviceId: review.service_id,
          sellerId: review.seller_id,
          buyerId: user!.id,
          rating: review.rating,
          comment: review.comment,
          onTime: review.on_time,
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
      const { data, error } = await db
        .from<any>('design_managers')
        .select('*')
        .order('createdAt', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
};

export const useIsDesignManager = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['is-design-manager', user?.id],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('design_managers')
        .select('*')
        .eq('userId', user!.id)
        .eq('isActive', true)
        .single();

      if (error) return null;
      return data || null;
    },
    enabled: !!user,
  });
};

export const useAddDesignManager = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (manager: any) => {
      const { data, error } = await db
        .from('design_managers')
        .insert({
          userId: manager.user_id,
          fullName: manager.full_name,
          permissions: manager.permissions,
          addedBy: user!.id,
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
      const { error } = await db
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
      const { data, error } = await db
        .from<any>('design_orders')
        .select('*, service:design_services(id, name), seller:sellers(id, shopName, shopSlug, shopAvatarUrl)')
        .order('createdAt', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapOrderToLegacy) as DesignOrder[];
    },
  });
};

// Admin: All design categories
export const useAllDesignCategories = () => {
  return useQuery({
    queryKey: ['all-design-categories'],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('design_categories')
        .select('*')
        .order('sortOrder');

      if (error) throw error;
      return (data || []).map(mapCategoryToLegacy) as DesignCategory[];
    },
  });
};

export const useCreateDesignCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (category: any) => {
      const { data, error } = await db
        .from('design_categories')
        .insert({
          name: category.name,
          nameEn: category.name_en,
          slug: category.slug,
          description: category.description,
          descriptionEn: category.description_en,
          imageUrl: category.image_url,
          sortOrder: category.sort_order || 0,
          isActive: category.is_active ?? true,
          style: category.style || 'design',
        })
        .select()
        .single();

      if (error) throw error;
      return mapCategoryToLegacy(data);
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
    mutationFn: async ({ id, ...updates }: any) => {
      const mappedUpdates: any = {};
      if (updates.name) mappedUpdates.name = updates.name;
      if (updates.name_en !== undefined) mappedUpdates.nameEn = updates.name_en;
      if (updates.slug) mappedUpdates.slug = updates.slug;
      if (updates.description !== undefined) mappedUpdates.description = updates.description;
      if (updates.description_en !== undefined) mappedUpdates.descriptionEn = updates.description_en;
      if (updates.image_url !== undefined) mappedUpdates.imageUrl = updates.image_url;
      if (updates.sort_order !== undefined) mappedUpdates.sortOrder = updates.sort_order;
      if (updates.is_active !== undefined) mappedUpdates.isActive = updates.is_active;

      const { data, error } = await db
        .from('design_categories')
        .update(mappedUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return mapCategoryToLegacy(data);
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
      const { error } = await db
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
