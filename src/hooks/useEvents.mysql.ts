// Hooks for Events - MySQL version
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, rpc } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Event {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  bannerUrl: string | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  eventType: 'spin_wheel' | 'reward_exchange';
  pointsType: 'fixed' | 'per_amount';
  pointsValue: number;
  pointsPerAmount: number;
  spinCost: number;
  createdAt: string;
  updatedAt: string;
  // Legacy mappings
  image_url?: string | null;
  banner_url?: string | null;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
  event_type?: 'spin_wheel' | 'reward_exchange';
  points_type?: 'fixed' | 'per_amount';
  points_value?: number;
  points_per_amount?: number;
  spin_cost?: number;
  created_at?: string;
  updated_at?: string;
}

export interface EventSpinPrize {
  id: string;
  eventId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  prizeType: 'voucher' | 'product' | 'game_account' | 'points' | 'nothing' | 'balance';
  prizeReferenceId: string | null;
  prizeValue: number;
  winRate: number;
  quantityTotal: number;
  quantityRemaining: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Legacy mappings
  event_id?: string;
  image_url?: string | null;
  prize_type?: string;
  prize_reference_id?: string | null;
  prize_value?: number;
  win_rate?: number;
  quantity_total?: number;
  quantity_remaining?: number;
  sort_order?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UserEventPoints {
  id: string;
  userId: string;
  eventId: string;
  totalEarned: number;
  totalSpent: number;
  currentBalance: number;
  createdAt: string;
  updatedAt: string;
  // Legacy mappings
  user_id?: string;
  event_id?: string;
  total_earned?: number;
  total_spent?: number;
  current_balance?: number;
  created_at?: string;
  updated_at?: string;
}

export interface EventSpinHistory {
  id: string;
  userId: string;
  eventId: string;
  prizeId: string | null;
  pointsSpent: number;
  prizeType: string;
  prizeName: string;
  prizeData: Record<string, unknown> | null;
  claimed: boolean;
  claimedAt: string | null;
  customFields: Record<string, unknown> | null;
  orderId: string | null;
  createdAt: string;
  // Legacy mappings
  user_id?: string;
  event_id?: string;
  prize_id?: string | null;
  points_spent?: number;
  prize_type?: string;
  prize_name?: string;
  prize_data?: Record<string, unknown> | null;
  claimed_at?: string | null;
  custom_fields?: Record<string, unknown> | null;
  order_id?: string | null;
  created_at?: string;
}

// Map event to legacy format
const mapEventToLegacy = (e: any): Event => ({
  ...e,
  image_url: e.imageUrl,
  banner_url: e.bannerUrl,
  start_date: e.startDate,
  end_date: e.endDate,
  is_active: e.isActive,
  event_type: e.eventType,
  points_type: e.pointsType,
  points_value: e.pointsValue,
  points_per_amount: e.pointsPerAmount,
  spin_cost: e.spinCost,
  created_at: e.createdAt,
  updated_at: e.updatedAt,
});

// Map prize to legacy format
const mapPrizeToLegacy = (p: any): EventSpinPrize => ({
  ...p,
  event_id: p.eventId,
  image_url: p.imageUrl,
  prize_type: p.prizeType,
  prize_reference_id: p.prizeReferenceId,
  prize_value: p.prizeValue,
  win_rate: p.winRate,
  quantity_total: p.quantityTotal,
  quantity_remaining: p.quantityRemaining,
  sort_order: p.sortOrder,
  is_active: p.isActive,
  created_at: p.createdAt,
  updated_at: p.updatedAt,
});

// Map user points to legacy format
const mapPointsToLegacy = (p: any): UserEventPoints => ({
  ...p,
  user_id: p.userId,
  event_id: p.eventId,
  total_earned: p.totalEarned,
  total_spent: p.totalSpent,
  current_balance: p.currentBalance,
  created_at: p.createdAt,
  updated_at: p.updatedAt,
});

// Map spin history to legacy format
const mapHistoryToLegacy = (h: any): EventSpinHistory => ({
  ...h,
  user_id: h.userId,
  event_id: h.eventId,
  prize_id: h.prizeId,
  points_spent: h.pointsSpent,
  prize_type: h.prizeType,
  prize_name: h.prizeName,
  prize_data: h.prizeData,
  claimed_at: h.claimedAt,
  custom_fields: h.customFields,
  order_id: h.orderId,
  created_at: h.createdAt,
});

// Get active event (for users)
export const useActiveEvent = () => {
  return useQuery({
    queryKey: ['active-event'],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await db
        .from<any>('events')
        .select('*')
        .eq('isActive', true)
        .lte('startDate', now)
        .gte('endDate', now)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data ? mapEventToLegacy(data) : null;
    },
  });
};

// Get all events (for admin)
export const useAllEvents = () => {
  return useQuery({
    queryKey: ['all-events'],
    queryFn: async () => {
      const { data, error } = await db
        .from<any>('events')
        .select('*')
        .order('createdAt', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(mapEventToLegacy);
    },
  });
};

// Get event by ID
export const useEvent = (eventId: string | undefined) => {
  return useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      if (!eventId) return null;
      
      const { data, error } = await db
        .from<any>('events')
        .select('*')
        .eq('id', eventId)
        .single();
      
      if (error) throw error;
      return mapEventToLegacy(data);
    },
    enabled: !!eventId,
  });
};

// Create event
export const useCreateEvent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (event: Partial<Event>) => {
      const { data, error } = await db
        .from<any>('events')
        .insert({
          name: event.name,
          description: event.description,
          imageUrl: event.imageUrl || event.image_url,
          bannerUrl: event.bannerUrl || event.banner_url,
          startDate: event.startDate || event.start_date,
          endDate: event.endDate || event.end_date,
          isActive: event.isActive ?? event.is_active ?? true,
          eventType: event.eventType || event.event_type || 'spin_wheel',
          pointsType: event.pointsType || event.points_type || 'fixed',
          pointsValue: event.pointsValue ?? event.points_value ?? 0,
          pointsPerAmount: event.pointsPerAmount ?? event.points_per_amount ?? 0,
          spinCost: event.spinCost ?? event.spin_cost ?? 100,
        })
        .select('*')
        .single();
      
      if (error) throw error;
      return mapEventToLegacy(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-events'] });
      queryClient.invalidateQueries({ queryKey: ['active-event'] });
      toast.success('Đã tạo sự kiện');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

// Update event
export const useUpdateEvent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Event> & { id: string }) => {
      const updateData: any = {};
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.imageUrl !== undefined || updates.image_url !== undefined) {
        updateData.imageUrl = updates.imageUrl ?? updates.image_url;
      }
      if (updates.bannerUrl !== undefined || updates.banner_url !== undefined) {
        updateData.bannerUrl = updates.bannerUrl ?? updates.banner_url;
      }
      if (updates.startDate !== undefined || updates.start_date !== undefined) {
        updateData.startDate = updates.startDate ?? updates.start_date;
      }
      if (updates.endDate !== undefined || updates.end_date !== undefined) {
        updateData.endDate = updates.endDate ?? updates.end_date;
      }
      if (updates.isActive !== undefined || updates.is_active !== undefined) {
        updateData.isActive = updates.isActive ?? updates.is_active;
      }
      if (updates.spinCost !== undefined || updates.spin_cost !== undefined) {
        updateData.spinCost = updates.spinCost ?? updates.spin_cost;
      }
      
      const { data, error } = await db
        .from<any>('events')
        .update(updateData)
        .eq('id', id)
        .select('*')
        .single();
      
      if (error) throw error;
      return mapEventToLegacy(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-events'] });
      queryClient.invalidateQueries({ queryKey: ['active-event'] });
      queryClient.invalidateQueries({ queryKey: ['event'] });
      toast.success('Đã cập nhật sự kiện');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

// Delete event
export const useDeleteEvent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('events').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-events'] });
      queryClient.invalidateQueries({ queryKey: ['active-event'] });
      toast.success('Đã xóa sự kiện');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

// Get event prizes
export const useEventPrizes = (eventId: string | undefined) => {
  return useQuery({
    queryKey: ['event-prizes', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      
      const { data, error } = await db
        .from<any>('event_spin_prizes')
        .select('*')
        .eq('eventId', eventId)
        .order('sortOrder', { ascending: true });
      
      if (error) throw error;
      return (data || []).map(mapPrizeToLegacy);
    },
    enabled: !!eventId,
  });
};

// Get user event points
export const useUserEventPoints = (eventId: string | undefined) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-event-points', eventId, user?.id],
    queryFn: async () => {
      if (!eventId || !user?.id) return null;
      
      const { data, error } = await db
        .from<any>('user_event_points')
        .select('*')
        .eq('eventId', eventId)
        .eq('userId', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data ? mapPointsToLegacy(data) : null;
    },
    enabled: !!eventId && !!user?.id,
  });
};

// Get spin history
export const useSpinHistory = (eventId: string | undefined) => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['spin-history', eventId, user?.id],
    queryFn: async () => {
      if (!eventId || !user?.id) return [];
      
      const { data, error } = await db
        .from<any>('event_spin_history')
        .select('*')
        .eq('eventId', eventId)
        .eq('userId', user.id)
        .order('createdAt', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(mapHistoryToLegacy);
    },
    enabled: !!eventId && !!user?.id,
  });
};

// Spin the wheel
export const useSpinWheel = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (eventId: string) => {
      if (!user?.id) throw new Error('Vui lòng đăng nhập');
      
      const { data, error } = await rpc.invoke<{
        success: boolean;
        error?: string;
        prize_id?: string;
        prize_name?: string;
        prize_type?: string;
        prize_value?: number;
        prize_data?: Record<string, unknown>;
        remaining_points?: number;
      }>('spin_wheel', {
        event_id: eventId,
        user_id: user.id,
      });
      
      if (error) throw error;
      if (!data?.success) {
        throw new Error(data?.error || 'Quay thất bại');
      }
      
      return data;
    },
    onSuccess: (result, eventId) => {
      queryClient.invalidateQueries({ queryKey: ['user-event-points', eventId] });
      queryClient.invalidateQueries({ queryKey: ['spin-history', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event-prizes', eventId] });
      
      if (result.prize_type === 'nothing') {
        toast.info('Chúc bạn may mắn lần sau!');
      } else {
        toast.success(`Chúc mừng! Bạn đã trúng ${result.prize_name}`);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};

// Claim prize
export const useClaimPrize = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ spinHistoryId, customFields }: { 
      spinHistoryId: string; 
      customFields?: Record<string, unknown>;
    }) => {
      const { data, error } = await db
        .from<any>('event_spin_history')
        .update({
          claimed: true,
          claimedAt: new Date().toISOString(),
          customFields,
        })
        .eq('id', spinHistoryId)
        .select('*')
        .single();
      
      if (error) throw error;
      return mapHistoryToLegacy(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spin-history'] });
      toast.success('Đã nhận thưởng');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
};
