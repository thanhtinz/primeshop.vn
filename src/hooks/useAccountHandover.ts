import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AccountHandover {
  id: string;
  order_id: string;
  seller_id: string;
  buyer_id: string;
  account_id: string | null;
  account_password: string | null;
  email_account: string | null;
  email_password: string | null;
  recovery_info: string | null;
  additional_info: Record<string, unknown>;
  is_locked: boolean;
  locked_at: string | null;
  buyer_confirmed_received: boolean;
  received_at: string | null;
  checklist_data: {
    changed_password: boolean;
    changed_email: boolean;
    added_2fa: boolean;
    verified_info: boolean;
  };
  status: 'pending' | 'delivered' | 'received' | 'completed' | 'disputed';
  created_at: string;
  updated_at: string;
  order?: {
    id: string;
    order_number: string;
    amount: number;
    product?: {
      title: string;
      images: string[];
    };
  };
}

export interface HandoverAuditLog {
  id: string;
  handover_id: string;
  action: string;
  actor_id: string;
  actor_type: 'seller' | 'buyer' | 'system' | 'admin';
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  created_at: string;
}

export const useSellerHandovers = (sellerId?: string) => {
  return useQuery({
    queryKey: ['seller-handovers', sellerId],
    queryFn: async () => {
      if (!sellerId) return [];

      const { data, error } = await supabase
        .from('account_handovers')
        .select(`
          *,
          order:seller_orders(
            id,
            order_number,
            amount,
            product:seller_products(title, images)
          )
        `)
        .eq('seller_id', sellerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AccountHandover[];
    },
    enabled: !!sellerId,
  });
};

export const useBuyerHandovers = () => {
  return useQuery({
    queryKey: ['buyer-handovers'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('account_handovers')
        .select(`
          *,
          order:seller_orders(
            id,
            order_number,
            amount,
            product:seller_products(title, images)
          )
        `)
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AccountHandover[];
    },
  });
};

export const useHandoverById = (handoverId?: string) => {
  return useQuery({
    queryKey: ['handover', handoverId],
    queryFn: async () => {
      if (!handoverId) return null;

      const { data, error } = await supabase
        .from('account_handovers')
        .select(`
          *,
          order:seller_orders(
            id,
            order_number,
            amount,
            product:seller_products(title, images)
          )
        `)
        .eq('id', handoverId)
        .single();

      if (error) throw error;
      return data as AccountHandover;
    },
    enabled: !!handoverId,
  });
};

export const useHandoverAuditLogs = (handoverId?: string) => {
  return useQuery({
    queryKey: ['handover-audit-logs', handoverId],
    queryFn: async () => {
      if (!handoverId) return [];

      const { data, error } = await supabase
        .from('handover_audit_logs')
        .select('*')
        .eq('handover_id', handoverId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as HandoverAuditLog[];
    },
    enabled: !!handoverId,
  });
};

export const useCreateHandover = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      order_id: string;
      seller_id: string;
      buyer_id: string;
      account_id: string;
      account_password: string;
      email_account?: string;
      email_password?: string;
      recovery_info?: string;
    }) => {
      const { data: handover, error } = await supabase
        .from('account_handovers')
        .insert({
          order_id: data.order_id,
          seller_id: data.seller_id,
          buyer_id: data.buyer_id,
          account_id: data.account_id,
          account_password: data.account_password,
          email_account: data.email_account,
          email_password: data.email_password,
          recovery_info: data.recovery_info,
        })
        .select()
        .single();

      if (error) throw error;

      // Log the action
      await supabase.rpc('log_handover_action', {
        p_handover_id: handover.id,
        p_action: 'created',
        p_new_data: { order_id: data.order_id },
      });

      return handover;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-handovers'] });
      queryClient.invalidateQueries({ queryKey: ['seller-orders'] });
      toast.success('Đã gửi thông tin tài khoản cho người mua');
    },
    onError: () => {
      toast.error('Không thể gửi thông tin tài khoản');
    },
  });
};

export const useUpdateHandover = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ handoverId, data }: {
      handoverId: string;
      data: { account_id?: string; account_password?: string; email_account?: string; email_password?: string; recovery_info?: string };
    }) => {
      const { data: handover, error } = await supabase
        .from('account_handovers')
        .update(data)
        .eq('id', handoverId)
        .select()
        .single();

      if (error) throw error;

      // Log the action
      await supabase.rpc('log_handover_action', {
        p_handover_id: handoverId,
        p_action: 'updated',
        p_new_data: {},
      });

      return handover;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-handovers'] });
      queryClient.invalidateQueries({ queryKey: ['buyer-handovers'] });
      queryClient.invalidateQueries({ queryKey: ['handover'] });
      toast.success('Đã cập nhật thông tin bàn giao');
    },
    onError: () => {
      toast.error('Không thể cập nhật thông tin');
    },
  });
};

export const useConfirmReceived = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (handoverId: string) => {
      const { data: handover, error } = await supabase
        .from('account_handovers')
        .update({
          buyer_confirmed_received: true,
          received_at: new Date().toISOString(),
          status: 'received',
        })
        .eq('id', handoverId)
        .select()
        .single();

      if (error) throw error;

      // Log the action
      await supabase.rpc('log_handover_action', {
        p_handover_id: handoverId,
        p_action: 'buyer_confirmed',
      });

      return handover;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyer-handovers'] });
      queryClient.invalidateQueries({ queryKey: ['handover'] });
      toast.success('Đã xác nhận nhận tài khoản');
    },
    onError: () => {
      toast.error('Không thể xác nhận');
    },
  });
};

export const useUpdateChecklist = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ handoverId, checklist }: {
      handoverId: string;
      checklist: { changed_password?: boolean; changed_email?: boolean; added_2fa?: boolean; verified_info?: boolean };
    }) => {
      const { data: current } = await supabase
        .from('account_handovers')
        .select('checklist_data')
        .eq('id', handoverId)
        .single();

      const currentChecklist = current?.checklist_data as Record<string, boolean> || {};
      const newChecklist = { ...currentChecklist, ...checklist };

      const { data: handover, error } = await supabase
        .from('account_handovers')
        .update({ checklist_data: newChecklist })
        .eq('id', handoverId)
        .select()
        .single();

      if (error) throw error;

      // Check if all items are completed, then lock
      if (Object.values(newChecklist).every(v => v === true)) {
        await supabase
          .from('account_handovers')
          .update({
            is_locked: true,
            locked_at: new Date().toISOString(),
            status: 'completed',
          })
          .eq('id', handoverId);

        await supabase.rpc('log_handover_action', {
          p_handover_id: handoverId,
          p_action: 'locked_completed',
        });
      }

      return handover;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buyer-handovers'] });
      queryClient.invalidateQueries({ queryKey: ['handover'] });
    },
    onError: () => {
      toast.error('Không thể cập nhật checklist');
    },
  });
};
