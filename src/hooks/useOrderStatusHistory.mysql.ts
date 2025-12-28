// MySQL version - useOrderStatusHistory
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface OrderStatusHistory {
  id: string;
  order_id: string;
  old_status: string;
  new_status: string;
  changed_by: string;
  changed_at: string;
  note?: string;
}

// Legacy snake_case mapping
function mapOrderStatusHistory(data: any): OrderStatusHistory {
  if (!data) return data;
  return {
    id: data.id,
    order_id: data.orderId || data.order_id,
    old_status: data.oldStatus || data.old_status,
    new_status: data.newStatus || data.new_status,
    changed_by: data.changedBy || data.changed_by,
    changed_at: data.changedAt || data.changed_at,
    note: data.note,
  };
}

export function useOrderStatusHistory(orderId: string) {
  return useQuery({
    queryKey: ['order-status-history', orderId],
    queryFn: async () => {
      const { data, error } = await apiClient.from('order_status_history')
        .select('*')
        .eq('order_id', orderId)
        .order('changed_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(mapOrderStatusHistory);
    },
    enabled: !!orderId,
  });
}
