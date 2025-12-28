// Hooks for Account Handover - MySQL version
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, rpc, auth } from '@/lib/api-client';
import { toast } from 'sonner';

export interface AccountHandover {
  id: string;
  orderId: string;
  sellerId: string;
  buyerId: string;
  accountId: string | null;
  accountPassword: string | null;
  emailAccount: string | null;
  emailPassword: string | null;
  recoveryInfo: string | null;
  additionalInfo: Record<string, unknown>;
  isLocked: boolean;
  lockedAt: string | null;
  buyerConfirmedReceived: boolean;
  receivedAt: string | null;
  checklistData: {
    changed_password: boolean;
    changed_email: boolean;
    added_2fa: boolean;
    verified_info: boolean;
  };
  status: 'pending' | 'delivered' | 'received' | 'completed' | 'disputed';
  createdAt: string;
  updatedAt: string;
  order?: {
    id: string;
    orderNumber: string;
    amount: number;
    product?: {
      title: string;
      images: string[];
    };
  };
  // Legacy mappings
  order_id?: string;
  seller_id?: string;
  buyer_id?: string;
  account_id?: string | null;
  account_password?: string | null;
  email_account?: string | null;
  email_password?: string | null;
  recovery_info?: string | null;
  additional_info?: Record<string, unknown>;
  is_locked?: boolean;
  locked_at?: string | null;
  buyer_confirmed_received?: boolean;
  received_at?: string | null;
  checklist_data?: any;
  created_at?: string;
  updated_at?: string;
}

export interface HandoverAuditLog {
  id: string;
  handoverId: string;
  action: string;
  actorId: string;
  actorType: 'seller' | 'buyer' | 'system' | 'admin';
  oldData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
  createdAt: string;
  // Legacy mappings
  handover_id?: string;
  actor_id?: string;
  actor_type?: 'seller' | 'buyer' | 'system' | 'admin';
  old_data?: Record<string, unknown> | null;
  new_data?: Record<string, unknown> | null;
  created_at?: string;
}

const mapHandoverToLegacy = (h: any): AccountHandover => ({
  ...h,
  order_id: h.orderId,
  seller_id: h.sellerId,
  buyer_id: h.buyerId,
  account_id: h.accountId,
  account_password: h.accountPassword,
  email_account: h.emailAccount,
  email_password: h.emailPassword,
  recovery_info: h.recoveryInfo,
  additional_info: h.additionalInfo,
  is_locked: h.isLocked,
  locked_at: h.lockedAt,
  buyer_confirmed_received: h.buyerConfirmedReceived,
  received_at: h.receivedAt,
  checklist_data: h.checklistData,
  created_at: h.createdAt,
  updated_at: h.updatedAt,
  order: h.order ? {
    ...h.order,
    order_number: h.order.orderNumber,
  } : undefined,
});

export const useSellerHandovers = (sellerId?: string) => {
  return useQuery({
    queryKey: ['seller-handovers', sellerId],
    queryFn: async () => {
      if (!sellerId) return [];

      const { data, error } = await db
        .from<any>('account_handovers')
        .select('*, order:seller_orders(id, orderNumber, amount, product:seller_products(title, images))')
        .eq('sellerId', sellerId)
        .order('createdAt', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapHandoverToLegacy) as AccountHandover[];
    },
    enabled: !!sellerId,
  });
};

export const useBuyerHandovers = () => {
  return useQuery({
    queryKey: ['buyer-handovers'],
    queryFn: async () => {
      const { data: sessionData } = await auth.getSession();
      if (!sessionData?.user) return [];

      const { data, error } = await db
        .from<any>('account_handovers')
        .select('*, order:seller_orders(id, orderNumber, amount, product:seller_products(title, images))')
        .eq('buyerId', sessionData.user.id)
        .order('createdAt', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapHandoverToLegacy) as AccountHandover[];
    },
  });
};

export const useHandoverById = (handoverId?: string) => {
  return useQuery({
    queryKey: ['handover', handoverId],
    queryFn: async () => {
      if (!handoverId) return null;

      const { data, error } = await db
        .from<any>('account_handovers')
        .select('*, order:seller_orders(id, orderNumber, amount, product:seller_products(title, images))')
        .eq('id', handoverId)
        .single();

      if (error) throw error;
      return mapHandoverToLegacy(data) as AccountHandover;
    },
    enabled: !!handoverId,
  });
};

export const useHandoverAuditLogs = (handoverId?: string) => {
  return useQuery({
    queryKey: ['handover-audit-logs', handoverId],
    queryFn: async () => {
      if (!handoverId) return [];

      const { data, error } = await db
        .from<any>('handover_audit_logs')
        .select('*')
        .eq('handoverId', handoverId)
        .order('createdAt', { ascending: false });

      if (error) throw error;
      return (data || []).map((l: any) => ({
        ...l,
        handover_id: l.handoverId,
        actor_id: l.actorId,
        actor_type: l.actorType,
        old_data: l.oldData,
        new_data: l.newData,
        created_at: l.createdAt,
      })) as HandoverAuditLog[];
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
      const { data: handover, error } = await db
        .from('account_handovers')
        .insert({
          orderId: data.order_id,
          sellerId: data.seller_id,
          buyerId: data.buyer_id,
          accountId: data.account_id,
          accountPassword: data.account_password,
          emailAccount: data.email_account,
          emailPassword: data.email_password,
          recoveryInfo: data.recovery_info,
        })
        .select()
        .single();

      if (error) throw error;

      // Log the action
      await rpc('log_handover_action', {
        p_handover_id: handover.id,
        p_action: 'created',
        p_new_data: { order_id: data.order_id },
      });

      return mapHandoverToLegacy(handover);
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
      const updates: any = {};
      if (data.account_id) updates.accountId = data.account_id;
      if (data.account_password) updates.accountPassword = data.account_password;
      if (data.email_account) updates.emailAccount = data.email_account;
      if (data.email_password) updates.emailPassword = data.email_password;
      if (data.recovery_info) updates.recoveryInfo = data.recovery_info;

      const { data: handover, error } = await db
        .from('account_handovers')
        .update(updates)
        .eq('id', handoverId)
        .select()
        .single();

      if (error) throw error;

      await rpc('log_handover_action', {
        p_handover_id: handoverId,
        p_action: 'updated',
        p_new_data: {},
      });

      return mapHandoverToLegacy(handover);
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
      const { data: handover, error } = await db
        .from('account_handovers')
        .update({
          buyerConfirmedReceived: true,
          receivedAt: new Date().toISOString(),
          status: 'received',
        })
        .eq('id', handoverId)
        .select()
        .single();

      if (error) throw error;

      await rpc('log_handover_action', {
        p_handover_id: handoverId,
        p_action: 'buyer_confirmed',
      });

      return mapHandoverToLegacy(handover);
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
      const { data: current } = await db
        .from<any>('account_handovers')
        .select('checklistData')
        .eq('id', handoverId)
        .single();

      const currentChecklist = current?.checklistData as Record<string, boolean> || {};
      const newChecklist = { ...currentChecklist, ...checklist };

      const { data: handover, error } = await db
        .from('account_handovers')
        .update({ checklistData: newChecklist })
        .eq('id', handoverId)
        .select()
        .single();

      if (error) throw error;

      // Check if all items are completed, then lock
      if (Object.values(newChecklist).every(v => v === true)) {
        await db
          .from('account_handovers')
          .update({
            isLocked: true,
            lockedAt: new Date().toISOString(),
            status: 'completed',
          })
          .eq('id', handoverId);

        await rpc('log_handover_action', {
          p_handover_id: handoverId,
          p_action: 'locked_completed',
        });
      }

      return mapHandoverToLegacy(handover);
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
