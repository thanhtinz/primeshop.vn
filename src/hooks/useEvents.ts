import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Event {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  banner_url: string | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
  event_type: 'spin_wheel' | 'reward_exchange';
  points_type: 'fixed' | 'per_amount';
  points_value: number;
  points_per_amount: number;
  spin_cost: number;
  created_at: string;
  updated_at: string;
}

export interface EventSpinPrize {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  prize_type: 'voucher' | 'product' | 'game_account' | 'points' | 'nothing' | 'balance';
  prize_reference_id: string | null;
  prize_value: number;
  win_rate: number;
  quantity_total: number;
  quantity_remaining: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserEventPoints {
  id: string;
  user_id: string;
  event_id: string;
  total_earned: number;
  total_spent: number;
  current_balance: number;
  created_at: string;
  updated_at: string;
}

export interface EventSpinHistory {
  id: string;
  user_id: string;
  event_id: string;
  prize_id: string | null;
  points_spent: number;
  prize_type: string;
  prize_name: string;
  prize_data: Record<string, unknown> | null;
  claimed: boolean;
  claimed_at: string | null;
  custom_fields: Record<string, unknown> | null;
  order_id: string | null;
  created_at: string;
}

// Get active event (for users)
export const useActiveEvent = () => {
  return useQuery({
    queryKey: ['active-event'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_active', true)
        .lte('start_date', new Date().toISOString())
        .gte('end_date', new Date().toISOString())
        .maybeSingle();
      
      if (error) throw error;
      return data as Event | null;
    },
  });
};

// Get all events (for admin)
export const useAllEvents = () => {
  return useQuery({
    queryKey: ['all-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Event[];
    },
  });
};

// Get event by ID
export const useEvent = (eventId: string) => {
  return useQuery({
    queryKey: ['event', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();
      
      if (error) throw error;
      return data as Event;
    },
    enabled: !!eventId,
  });
};

// Create event
export const useCreateEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (event: Omit<Event, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('events')
        .insert([event])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-events'] });
      queryClient.invalidateQueries({ queryKey: ['active-event'] });
    },
  });
};

// Update event
export const useUpdateEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Event> & { id: string }) => {
      const { data, error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-events'] });
      queryClient.invalidateQueries({ queryKey: ['active-event'] });
      queryClient.invalidateQueries({ queryKey: ['event'] });
    },
  });
};

// Delete event
export const useDeleteEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-events'] });
      queryClient.invalidateQueries({ queryKey: ['active-event'] });
    },
  });
};

// Get spin prizes for an event
export const useEventSpinPrizes = (eventId: string) => {
  return useQuery({
    queryKey: ['event-spin-prizes', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_spin_prizes')
        .select('*')
        .eq('event_id', eventId)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data as EventSpinPrize[];
    },
    enabled: !!eventId,
  });
};

// Create spin prize
export const useCreateSpinPrize = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (prize: Omit<EventSpinPrize, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('event_spin_prizes')
        .insert([prize])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['event-spin-prizes', variables.event_id] });
    },
  });
};

// Update spin prize
export const useUpdateSpinPrize = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<EventSpinPrize> & { id: string }) => {
      const { data, error } = await supabase
        .from('event_spin_prizes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-spin-prizes'] });
    },
  });
};

// Delete spin prize
export const useDeleteSpinPrize = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('event_spin_prizes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-spin-prizes'] });
    },
  });
};

// Get user points for an event
export const useUserEventPoints = (eventId: string, userId: string | undefined) => {
  return useQuery({
    queryKey: ['user-event-points', eventId, userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_event_points')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', userId!)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data as UserEventPoints | null;
    },
    enabled: !!eventId && !!userId,
  });
};

// Get user spin history
export const useUserSpinHistory = (eventId: string, userId: string | undefined) => {
  return useQuery({
    queryKey: ['user-spin-history', eventId, userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_spin_history')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', userId!)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as EventSpinHistory[];
    },
    enabled: !!eventId && !!userId,
  });
};

// Spin wheel
export const useSpinWheel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (eventId: string) => {
      const { data, error } = await supabase.rpc('spin_event_wheel', {
        p_event_id: eventId,
      });
      if (error) throw error;
      return data[0] as {
        success: boolean;
        message: string;
        spin_id: string | null;
        prize_type: string | null;
        prize_name: string | null;
        prize_data: Record<string, unknown> | null;
      };
    },
    onSuccess: (_, eventId) => {
      queryClient.invalidateQueries({ queryKey: ['user-event-points'] });
      queryClient.invalidateQueries({ queryKey: ['user-spin-history', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event-spin-prizes', eventId] });
    },
  });
};

// Claim prize (for product/voucher/game_account types)
export const useClaimPrize = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ 
      spinId, 
      customFields 
    }: { 
      spinId: string; 
      customFields?: Record<string, unknown>;
    }) => {
      // Get spin history
      const { data: spin, error: spinError } = await supabase
        .from('event_spin_history')
        .select('*, event_spin_prizes(*)')
        .eq('id', spinId)
        .single();
      
      if (spinError) throw spinError;
      if (spin.claimed) throw new Error('Phần thưởng đã được nhận');

      const prize = spin.event_spin_prizes as EventSpinPrize;
      let orderId: string | null = null;

      // Handle different prize types
      if (prize.prize_type === 'voucher' && prize.prize_reference_id) {
        // Get voucher info - user receives voucher code
        const { data: voucher, error: voucherError } = await supabase
          .from('vouchers')
          .select('code')
          .eq('id', prize.prize_reference_id)
          .single();
        
        if (voucherError) throw voucherError;
        
        // Update spin as claimed with voucher info
        const existingPrizeData = (spin.prize_data || {}) as Record<string, unknown>;
        await supabase
          .from('event_spin_history')
          .update({ 
            claimed: true, 
            claimed_at: new Date().toISOString(),
            prize_data: { ...existingPrizeData, voucher_code: voucher.code }
          })
          .eq('id', spinId);

      } else if (prize.prize_type === 'product' && prize.prize_reference_id) {
        // Create free order for product
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('id', prize.prize_reference_id)
          .single();
        
        if (productError) throw productError;

        // Get user info
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Vui lòng đăng nhập');

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        // Generate order number
        const { data: orderNumber } = await supabase.rpc('generate_order_number');

        // Create order
        const productSnapshot = {
          product_id: product.id,
          product_name: product.name,
          product_image: product.image_url,
          style: product.style,
          custom_fields: customFields ? JSON.parse(JSON.stringify(customFields)) : null,
          is_event_reward: true,
          event_spin_id: spinId,
        };

        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert([{
            order_number: orderNumber,
            customer_email: profile?.email || user.email,
            customer_name: profile?.full_name,
            product_snapshot: productSnapshot,
            subtotal: 0,
            discount_amount: 0,
            total_amount: 0,
            status: 'PAID',
            notes: `Phần thưởng sự kiện: ${prize.name}`,
          }])
          .select()
          .single();

        if (orderError) throw orderError;
        orderId = order.id;

        // Update spin as claimed
        await supabase
          .from('event_spin_history')
          .update({ 
            claimed: true, 
            claimed_at: new Date().toISOString(),
            custom_fields: customFields ? JSON.parse(JSON.stringify(customFields)) : null,
            order_id: orderId
          })
          .eq('id', spinId);

      } else if (prize.prize_type === 'game_account' && prize.prize_reference_id) {
        // Claim random game account
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Vui lòng đăng nhập');

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        // Generate order number
        const { data: orderNumber } = await supabase.rpc('generate_order_number');

        // Create order first
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert([{
            order_number: orderNumber,
            customer_email: profile?.email || user.email,
            customer_name: profile?.full_name,
            product_snapshot: {
              product_id: prize.prize_reference_id,
              is_event_reward: true,
              event_spin_id: spinId,
            },
            subtotal: 0,
            discount_amount: 0,
            total_amount: 0,
            status: 'PAID',
            notes: `Phần thưởng sự kiện: ${prize.name}`,
          }])
          .select()
          .single();

        if (orderError) throw orderError;
        orderId = order.id;

        // Claim random account
        const { data: account, error: accountError } = await supabase.rpc('claim_random_account', {
          p_product_id: prize.prize_reference_id,
          p_order_id: orderId,
        });

        if (accountError) {
          // Rollback order if account claim fails
          await supabase.from('orders').delete().eq('id', orderId);
          throw accountError;
        }

        // Update order with delivery content
        await supabase
          .from('orders')
          .update({ 
            delivery_content: account[0].account_data,
            status: 'DELIVERED'
          })
          .eq('id', orderId);

        // Update spin as claimed
        await supabase
          .from('event_spin_history')
          .update({ 
            claimed: true, 
            claimed_at: new Date().toISOString(),
            order_id: orderId
          })
          .eq('id', spinId);
      }

      return { success: true, orderId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-spin-history'] });
    },
  });
};
